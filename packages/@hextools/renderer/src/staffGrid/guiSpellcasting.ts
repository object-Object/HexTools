import { Vec2, type Vec2Like } from "gl-matrix";

import { BufferBuilder } from "../buffer";
import { RGBAColor, type RGBColor } from "../colors";
import { clamp, lerp, mod } from "../math";
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
import type { ResolvedPattern, ResolvedPatternType } from "./resolvedPattern";

export interface GuiSpellcastingSettings {
  guiScale: number;
  gridZoom: number;
  enableZappyPoints: boolean;
  zappyVariance: number;
  ctrlTogglesOffStrokeOrder: boolean;
  dotsMode: "none" | "mouse" | "all";
  mouseDotsRadius: number;
  clickingTogglesDrawing: boolean;
  zappyOnShake: boolean;
  shakeAction: "none" | "undo" | "clear";
  enableEditingPatterns: boolean;
}

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/client/gui/GuiSpellcasting.kt
export class GuiSpellcasting {
  gl: WebGL2RenderingContext;
  settings: GuiSpellcastingSettings;
  patternType: ResolvedPatternType;
  onPatternsChange?: (resolvedPatterns: readonly ResolvedPattern[]) => unknown;

  private shader: PositionColorShader;
  private buf: BufferBuilder;

  private drawState: PatternDrawState = BETWEEN_PATTERNS;
  /** Map from stringified coord to index in this.patterns */
  private usedSpots = new Map<string, number>();
  private patterns: readonly ResolvedPattern[] = [];

  constructor({
    gl,
    settings,
    patternType,
    onPatternsChange,
    patterns,
  }: Pick<
    GuiSpellcasting,
    "gl" | "settings" | "patternType" | "onPatternsChange"
  > & {
    patterns: readonly ResolvedPattern[];
  }) {
    this.gl = gl;
    this.settings = settings;
    this.patternType = patternType;
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
    return Math.max(this.scaleValue(this.gl.canvas.width), 1);
  }

  get height() {
    return Math.max(this.scaleValue(this.gl.canvas.height), 1);
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
      this.usedSpots.set(HexCoord.toString(pos), this.patterns.length - 1);
    }
    this.onPatternsChange?.(this.patterns);
  }

  setPatterns(resolvedPatterns: readonly ResolvedPattern[], notify: boolean) {
    this.patterns = resolvedPatterns;
    this.usedSpots.clear();
    for (const [index, { pattern, origin }] of resolvedPatterns.entries()) {
      for (const pos of pattern.positions(origin)) {
        this.usedSpots.set(HexCoord.toString(pos), index);
      }
    }
    if (notify) {
      this.onPatternsChange?.(this.patterns);
    }
  }

  mouseClicked(rawMousePos: MousePos) {
    const mousePos = this.scaleMousePos(rawMousePos);
    if (this.settings.clickingTogglesDrawing) {
      if (this.drawState.type === "betweenPatterns") {
        this.drawStart(mousePos);
      } else {
        this.drawEnd();
      }
    } else {
      this.drawStart(mousePos);
    }
  }

  private drawStart({ mouseX, mouseY }: MousePos) {
    const mx = clamp(mouseX, 0, this.width);
    const my = clamp(mouseY, 0, this.height);
    if (this.drawState.type === "betweenPatterns") {
      const mouseCoord = this.pxToCoord(new Vec2(mx, my));
      const usedIndex = this.usedSpots.get(HexCoord.toString(mouseCoord));
      if (usedIndex === undefined) {
        this.drawState = {
          type: "justStarted",
          origin: mouseCoord,
          editedPattern: null,
        };
      } else if (this.settings.enableEditingPatterns) {
        const resolvedPattern = this.patterns[usedIndex];
        const { pattern, origin } = resolvedPattern;
        const editedPattern = { index: usedIndex, resolvedPattern };

        // Trim the pattern to the last position matching where the mouse clicked,
        // so if there are overlaps we take the longest possible section
        let lastIndex = null;
        let compass = pattern.startDir;
        let cursor = HexCoord.shiftedBy(origin, compass);
        for (const [index, a] of pattern.angles.entries()) {
          compass = HexDir.rotatedBy(compass, a);
          cursor = HexCoord.shiftedBy(cursor, compass);
          if (HexCoord.equals(cursor, mouseCoord)) {
            lastIndex = index;
          }
        }

        this.drawState =
          lastIndex !== null
            ? {
                type: "drawing",
                origin,
                current: mouseCoord,
                wipPattern: pattern.withAngles(
                  pattern.angles.slice(0, lastIndex + 1),
                ),
                editedPattern,
              }
            : {
                type: "justStarted",
                origin,
                editedPattern,
              };
      }
    }
  }

  mouseMoved(rawMousePos: MousePos) {
    const mousePos = this.scaleMousePos(rawMousePos);
    if (
      this.settings.clickingTogglesDrawing
      && this.drawState.type !== "betweenPatterns"
    ) {
      this.drawMove(mousePos);
    }
  }

  mouseDragged(rawMousePos: MousePos) {
    const mousePos = this.scaleMousePos(rawMousePos);
    if (!this.settings.clickingTogglesDrawing) {
      this.drawMove(mousePos);
    }
  }

  private drawMove({ mouseX, mouseY }: MousePos) {
    const mx = clamp(mouseX, 0, this.width);
    const my = clamp(mouseY, 0, this.height);

    let anchorCoord: HexCoord;
    switch (this.drawState.type) {
      case "betweenPatterns":
        return;
      case "justStarted":
        anchorCoord = this.drawState.origin;
        break;
      case "drawing":
        anchorCoord = this.drawState.current;
        break;
    }

    const anchor = this.coordToPx(anchorCoord);
    const mouse = new Vec2(mx, my);
    const snapDist =
      this.hexSize * this.hexSize * 2 * clamp(GRID_SNAP_THRESHOLD, 0.5, 1.0);
    if (anchor.squaredDistance(mouse) >= snapDist) {
      const delta = mouse.sub(anchor);
      const angle = Math.atan2(delta.y, delta.x);
      const snappedAngle = mod(angle / (Math.PI * 2), 6);
      const newdir: HexDir = mod(Math.round(snappedAngle * 6) + 1, 6);
      const idealNextLoc = HexCoord.shiftedBy(anchorCoord, newdir);
      if (!this.getPatternAt(idealNextLoc)) {
        if (this.drawState.type === "justStarted") {
          const pat = new HexPattern(newdir);

          this.drawState = {
            type: "drawing",
            origin: anchorCoord,
            current: idealNextLoc,
            wipPattern: pat,
            editedPattern: this.drawState.editedPattern,
          };
        } else {
          const lastDir = this.drawState.wipPattern.finalDir();
          if (newdir === HexDir.rotatedBy(lastDir, HexAngle.BACK)) {
            if (this.drawState.wipPattern.angles.length === 0) {
              this.drawState = {
                type: "justStarted",
                origin: HexCoord.shiftedBy(this.drawState.current, newdir),
                editedPattern: this.drawState.editedPattern,
              };
            } else {
              const { current, wipPattern } = this.drawState;
              this.drawState.current = HexCoord.shiftedBy(current, newdir);
              this.drawState.wipPattern = wipPattern.withAngles(
                wipPattern.angles.slice(0, -1),
              );
            }
          } else {
            const newWipPattern =
              this.drawState.wipPattern.tryAppendDir(newdir);
            if (newWipPattern) {
              this.drawState.wipPattern = newWipPattern;
              this.drawState.current = idealNextLoc;
            }
          }
        }
      }
    }
  }

  mouseReleased() {
    if (!this.settings.clickingTogglesDrawing) {
      this.drawEnd();
    }
  }

  private drawEnd() {
    switch (this.drawState.type) {
      case "betweenPatterns":
        break;
      case "justStarted":
        this.drawState = BETWEEN_PATTERNS;
        break;
      case "drawing": {
        const { origin, wipPattern, editedPattern } = this.drawState;
        this.drawState = BETWEEN_PATTERNS;
        if (editedPattern) {
          const {
            index,
            resolvedPattern: { type },
          } = editedPattern;
          this.setPatterns(
            [
              ...this.patterns.slice(0, index),
              { pattern: wipPattern, origin, type },
              ...this.patterns.slice(index + 1),
            ],
            true,
          );
        } else {
          this.addPattern({
            pattern: wipPattern,
            origin,
            type: this.patternType,
          });
        }
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
    zappyMultiplier = 1,
    ...mousePos
  }: MousePos & {
    isCtrlDown: boolean;
    timestamp: DOMHighResTimeStamp;
    zappyMultiplier?: number;
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
          if (!this.getPatternAt(dotCoord)) {
            const dotPx = this.coordToPx(dotCoord);
            const delta = Vec2.clone(dotPx).sub(mouseVec).mag;
            const scaledDist = clamp(
              1
                - (delta - this.hexSize)
                  / (settings.mouseDotsRadius * this.hexSize),
              0,
              1,
            );
            drawSpot({
              buf,
              mat: null,
              point: dotPx,
              radius: scaledDist * 2,
              r: lerp(scaledDist, MIN_DOT_COLOR.r, DOT_COLOR.r),
              g: lerp(scaledDist, MIN_DOT_COLOR.g, DOT_COLOR.g),
              b: lerp(scaledDist, MIN_DOT_COLOR.b, DOT_COLOR.b),
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
              mat: null,
              point: dotPx,
              radius: 1.25,
              ...DOT_COLOR,
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
      mat: null,
      hops: 10,
      variance: settings.enableZappyPoints
        ? settings.zappyVariance * zappyMultiplier
        : 0,
      speed: 0.1,
      readabilityOffset: 0.2,
      lastSegmentLenProportion: 1,
      timestamp,
      isCtrlDown: isCtrlDown !== settings.ctrlTogglesOffStrokeOrder,
    } satisfies Partial<DrawPatternFromPointsOptions>;

    const editingIndex =
      this.drawState.type !== "betweenPatterns"
        ? this.drawState.editedPattern?.index
        : undefined;
    for (const [i, { pattern, origin, type }] of this.patterns.entries()) {
      if (i !== editingIndex) {
        drawPatternFromPoints({
          points: [...pattern.toLines(this.hexSize, this.coordToPx(origin))],
          dupIndices: findDupIndices(pattern.positions()),
          drawLast: true,
          tail: { ...type.color, a: RESOLVED_PATTERN_ALPHA },
          head: { ...type.fadeColor, a: RESOLVED_PATTERN_ALPHA },
          flowIrregular: (type.success ? 0.2 : 0.9) * zappyMultiplier,
          seed: i,
          ...commonPatternOptions,
        });
      }
    }

    if (this.drawState.type !== "betweenPatterns") {
      const points: Vec2[] = [];
      let dupIndices = new Set<number>();

      if (this.drawState.type === "justStarted") {
        points.push(this.coordToPx(this.drawState.origin));
      } else {
        dupIndices = findDupIndices(this.drawState.wipPattern.positions());
        for (const pos of this.drawState.wipPattern.positions()) {
          const shiftedPos = HexCoord.shiftedBy(pos, this.drawState.origin);
          points.push(this.coordToPx(shiftedPos));
        }
      }

      points.push(mouseVec);
      drawPatternFromPoints({
        points,
        dupIndices,
        drawLast: false,
        tail: WIP_PATTERN_TAIL,
        head: WIP_PATTERN_HEAD,
        flowIrregular: 0.1 * zappyMultiplier,
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

  getPatternAt(coord: HexCoord): ResolvedPattern | null {
    const index = this.usedSpots.get(HexCoord.toString(coord));
    if (
      index === undefined
      || (this.drawState.type !== "betweenPatterns"
        && this.drawState.editedPattern?.index === index)
    ) {
      return null;
    }
    return this.patterns[index];
  }

  static getDefaultSettings({
    isTouchscreen,
  }: {
    isTouchscreen: boolean;
  }): GuiSpellcastingSettings {
    return {
      guiScale: 2,
      gridZoom: isTouchscreen ? 0.75 : 1,
      enableZappyPoints: true,
      zappyVariance: 2.5,
      ctrlTogglesOffStrokeOrder: false,
      dotsMode: isTouchscreen ? "all" : "mouse",
      mouseDotsRadius: 3,
      clickingTogglesDrawing: false,
      shakeAction: "none",
      zappyOnShake: false,
      enableEditingPatterns: true,
    };
  }
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
  origin: HexCoord;
  editedPattern: EditedPattern | null;
}

interface Drawing {
  type: "drawing";
  origin: HexCoord;
  current: HexCoord;
  wipPattern: HexPattern;
  editedPattern: EditedPattern | null;
}

interface EditedPattern {
  index: number;
  resolvedPattern: ResolvedPattern;
}

const BETWEEN_PATTERNS: BetweenPatterns = { type: "betweenPatterns" };

const GRID_SNAP_THRESHOLD = 0.5;

const DOT_COLOR: RGBColor = {
  r: 0.5,
  g: 1,
  b: 0.9,
};

const MIN_DOT_COLOR: RGBColor = {
  r: DOT_COLOR.r - 0.1,
  g: DOT_COLOR.g - 0.2,
  b: DOT_COLOR.b - 0.2,
};

const RESOLVED_PATTERN_ALPHA = 0xc8 / 0xff;

const WIP_PATTERN_TAIL = RGBAColor.fromRGB(0x64c8ff);
const WIP_PATTERN_HEAD = RGBAColor.fromRGB(0xfecbe6);
