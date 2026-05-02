import { Mat4, Vec2, type Vec2Like } from "gl-matrix";
import _ from "lodash";

import { lerp, mod } from "../../utils/math";
import { BufferBuilder } from "../buffer";
import {
  enablePositionColorShader,
  loadPositionColorShader,
  type PositionColorShader,
} from "../shaders";
import { HexAngle, HexCoord, HexDir, HexPattern } from "./hexMath";
import { coordToPx, pxToCoord } from "./hexUtils";
import {
  drawPatternFromPoints,
  drawSpot,
  findDupIndices,
  type DrawPatternFromPointsOptions,
} from "./renderLib";

export interface GuiSpellcastingSettings {
  guiScale: number;
  gridZoom: number;
  zappyVariance: number;
  ctrlTogglesOffStrokeOrder: boolean;
  dotsMode: "none" | "mouse" | "all";
  mouseDotsRadius: number;
}

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/client/gui/GuiSpellcasting.kt
export class GuiSpellcasting {
  gl: WebGL2RenderingContext;
  settings: GuiSpellcastingSettings;
  onPatternsChange?: (resolvedPatterns: ResolvedPattern[]) => unknown;

  private shader: PositionColorShader;
  private buf: BufferBuilder;

  private drawState: PatternDrawState = BETWEEN_PATTERNS;
  private usedSpots = new Set<string>();
  private patterns: ResolvedPattern[] = [];

  constructor({
    gl,
    settings,
    onPatternsChange,
    patterns,
  }: Pick<GuiSpellcasting, "gl" | "settings" | "onPatternsChange"> & {
    patterns: ResolvedPattern[];
  }) {
    this.gl = gl;
    this.settings = settings;
    this.onPatternsChange = onPatternsChange;
    this.setPatterns(patterns, false);

    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    this.shader = loadPositionColorShader(gl);
    this.buf = new BufferBuilder(gl);
  }

  get width() {
    return this.scaleValue(this.gl.canvas.width);
  }

  get height() {
    return this.scaleValue(this.gl.canvas.height);
  }

  scaleMousePos({ mouseX, mouseY }: MousePos): MousePos {
    return {
      mouseX: this.scaleValue(mouseX),
      mouseY: this.scaleValue(mouseY),
    };
  }

  scaleValue(value: number) {
    return value / this.settings.guiScale;
  }

  addPattern(resolvedPattern: ResolvedPattern) {
    const { pattern, origin } = resolvedPattern;
    this.patterns = [...this.patterns, resolvedPattern];
    for (const pos of pattern.positions(origin)) {
      this.usedSpots.add(HexCoord.toString(pos));
    }
    this.onPatternsChange?.(this.patterns);
  }

  setPatterns(resolvedPatterns: ResolvedPattern[], notify: boolean) {
    this.patterns = resolvedPatterns;
    this.usedSpots.clear();
    for (const { pattern, origin } of resolvedPatterns) {
      for (const pos of pattern.positions(origin)) {
        this.usedSpots.add(HexCoord.toString(pos));
      }
    }
    if (notify) {
      this.onPatternsChange?.(this.patterns);
    }
  }

  mouseClicked(mousePos: MousePos) {
    const { mouseX, mouseY } = this.scaleMousePos(mousePos);
    const mx = _.clamp(mouseX, 0, this.width);
    const my = _.clamp(mouseY, 0, this.height);
    if (this.drawState.type === "betweenPatterns") {
      const coord = this.pxToCoord(new Vec2(mx, my));
      if (!this.usedSpots.has(HexCoord.toString(coord))) {
        this.drawState = { type: "justStarted", start: coord };
      }
    }
  }

  mouseDragged(mousePos: MousePos) {
    const { mouseX, mouseY } = this.scaleMousePos(mousePos);
    const mx = _.clamp(mouseX, 0, this.width);
    const my = _.clamp(mouseY, 0, this.height);

    let anchorCoord: HexCoord;
    switch (this.drawState.type) {
      case "betweenPatterns":
        return;
      case "justStarted":
        anchorCoord = this.drawState.start;
        break;
      case "drawing":
        anchorCoord = this.drawState.current;
        break;
    }

    const anchor = this.coordToPx(anchorCoord);
    const mouse = new Vec2(mx, my);
    const snapDist =
      this.hexSize * this.hexSize * 2 * _.clamp(GRID_SNAP_THRESHOLD, 0.5, 1.0);
    if (anchor.squaredDistance(mouse) >= snapDist) {
      const delta = mouse.sub(anchor);
      const angle = Math.atan2(delta.y, delta.x);
      const snappedAngle = mod(angle / (Math.PI * 2), 6);
      const newdir: HexDir = mod(Math.round(snappedAngle * 6) + 1, 6);
      const idealNextLoc = HexCoord.shiftedBy(anchorCoord, newdir);
      if (!this.usedSpots.has(HexCoord.toString(idealNextLoc))) {
        if (this.drawState.type === "justStarted") {
          const pat = new HexPattern(newdir);

          this.drawState = {
            type: "drawing",
            start: anchorCoord,
            current: idealNextLoc,
            wipPattern: pat,
          };
        } else {
          const lastDir = this.drawState.wipPattern.finalDir();
          if (newdir === HexDir.rotatedBy(lastDir, HexAngle.BACK)) {
            if (this.drawState.wipPattern.angles.length === 0) {
              this.drawState = {
                type: "justStarted",
                start: HexCoord.shiftedBy(this.drawState.current, newdir),
              };
            } else {
              this.drawState.current = HexCoord.shiftedBy(
                this.drawState.current,
                newdir,
              );
              this.drawState.wipPattern.angles.pop();
            }
          } else {
            if (this.drawState.wipPattern.tryAppendDir(newdir)) {
              this.drawState.current = idealNextLoc;
            }
          }
        }
      }
    }
  }

  mouseReleased() {
    switch (this.drawState.type) {
      case "betweenPatterns":
        break;
      case "justStarted":
        this.drawState = BETWEEN_PATTERNS;
        break;
      case "drawing": {
        const { start, wipPattern } = this.drawState;
        this.drawState = BETWEEN_PATTERNS;
        this.addPattern({ pattern: wipPattern, origin: start });
        break;
      }
    }
  }

  mouseCanceled() {
    this.drawState = BETWEEN_PATTERNS;
  }

  render({
    isCtrlDown,
    timestamp,
    ...mousePos
  }: MousePos & {
    isCtrlDown: boolean;
    timestamp: DOMHighResTimeStamp;
  }) {
    const { mouseX, mouseY } = this.scaleMousePos(mousePos);
    const { gl, buf, settings } = this;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    enablePositionColorShader({
      gl,
      shader: this.shader,
      width: this.width,
      height: this.height,
    });

    const mat = new Mat4();

    const mouseVec = new Vec2(mouseX, mouseY);
    const mouseCoord = this.pxToCoord(mouseVec);
    switch (settings.dotsMode) {
      case "none":
        break;

      case "mouse": {
        for (const dotCoord of HexCoord.rangeAround(
          mouseCoord,
          settings.mouseDotsRadius,
        )) {
          if (!this.usedSpots.has(HexCoord.toString(dotCoord))) {
            const dotPx = this.coordToPx(dotCoord);
            const delta = Vec2.clone(dotPx).sub(mouseVec).mag;
            const scaledDist = _.clamp(
              1
                - (delta - this.hexSize)
                  / (settings.mouseDotsRadius * this.hexSize),
              0,
              1,
            );
            drawSpot({
              buf,
              mat,
              point: dotPx,
              radius: scaledDist * 2,
              r: lerp(scaledDist, 0.4, 0.5),
              g: lerp(scaledDist, 0.8, 1),
              b: lerp(scaledDist, 0.7, 0.9),
              a: scaledDist,
            });
          }
        }
        break;
      }

      case "all": {
        const topLeft = this.pxToCoord([0, 0]);
        const topLeftOffset = HexCoord.axialToOffset(topLeft);
        const coord = { ...topLeftOffset };
        let dotPx = this.coordToPx(topLeft);
        while (dotPx.y < this.height) {
          while (dotPx.x < this.width) {
            drawSpot({
              buf,
              mat,
              point: dotPx,
              radius: 2,
              r: 0.5,
              g: 1,
              b: 0.9,
              a: 1,
            });
            coord.q++;
            dotPx = this.coordToPx(HexCoord.offsetToAxial(coord));
          }
          coord.r++;
          coord.q = topLeftOffset.q;
          dotPx = this.coordToPx(HexCoord.offsetToAxial(coord));
        }
        break;
      }
    }

    const commonPatternOptions = {
      buf,
      mat,
      hops: 10,
      variance: settings.zappyVariance,
      speed: 0.1,
      readabilityOffset: 0.2,
      lastSegmentLenProportion: 1,
      timestamp,
      isCtrlDown: isCtrlDown !== settings.ctrlTogglesOffStrokeOrder,
    } satisfies Partial<DrawPatternFromPointsOptions>;

    for (const [i, { pattern, origin }] of this.patterns.entries()) {
      drawPatternFromPoints({
        points: [...pattern.toLines(this.hexSize, this.coordToPx(origin))],
        dupIndices: findDupIndices(pattern.positions()),
        drawLast: true,
        tail: [115 / 255, 133 / 255, 222 / 255, 1],
        head: [254 / 255, 203 / 255, 230 / 255, 1],
        flowIrregular: 0.2,
        seed: i,
        ...commonPatternOptions,
      });
    }

    if (this.drawState.type !== "betweenPatterns") {
      const points: Vec2[] = [];
      let dupIndices = new Set<number>();

      if (this.drawState.type === "justStarted") {
        points.push(this.coordToPx(this.drawState.start));
      } else {
        dupIndices = findDupIndices(this.drawState.wipPattern.positions());
        for (const pos of this.drawState.wipPattern.positions()) {
          const shiftedPos = HexCoord.shiftedBy(pos, this.drawState.start);
          points.push(this.coordToPx(shiftedPos));
        }
      }

      points.push(mouseVec);
      drawPatternFromPoints({
        points,
        dupIndices,
        drawLast: false,
        tail: [100 / 255, 200 / 255, 1, 1],
        head: [254 / 255, 203 / 255, 230 / 255, 1],
        flowIrregular: 0.1,
        seed: this.patterns.length,
        ...commonPatternOptions,
      });
    }
  }

  get hexSize() {
    const baseScale = Math.sqrt((this.width * this.height) / 512);
    return baseScale / this.settings.gridZoom;
  }

  get coordsOffset() {
    return new Vec2(this.width * 0.5, this.height * 0.5);
  }

  coordToPx(coord: HexCoord) {
    return coordToPx({ coord, size: this.hexSize, offset: this.coordsOffset });
  }

  pxToCoord(px: Vec2Like) {
    return pxToCoord({ px, size: this.hexSize, offset: this.coordsOffset });
  }

  static getDefaultSettings({
    isTouchscreen,
  }: {
    isTouchscreen: boolean;
  }): GuiSpellcastingSettings {
    return {
      guiScale: 2,
      gridZoom: isTouchscreen ? 0.75 : 1,
      zappyVariance: 2.5,
      ctrlTogglesOffStrokeOrder: false,
      dotsMode: isTouchscreen ? "all" : "mouse",
      mouseDotsRadius: 3,
    };
  }
}

export interface ResolvedPattern {
  pattern: HexPattern;
  origin: HexCoord;
}

interface MousePos {
  mouseX: number;
  mouseY: number;
}

type PatternDrawState = BetweenPatterns | JustStarted | Drawing;

interface BetweenPatterns {
  type: "betweenPatterns";
}

interface JustStarted {
  type: "justStarted";
  start: HexCoord;
}

interface Drawing {
  type: "drawing";
  start: HexCoord;
  current: HexCoord;
  wipPattern: HexPattern;
}

const BETWEEN_PATTERNS: BetweenPatterns = { type: "betweenPatterns" };

const GRID_SNAP_THRESHOLD = 0.5;
