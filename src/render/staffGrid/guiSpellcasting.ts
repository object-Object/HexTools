import { Mat4, Vec2 } from "gl-matrix";
import _ from "lodash";

import { lerp, mod } from "../../utils/math";
import { BufferBuilder } from "../buffer";
import { enablePositionColorShader, loadPositionColorShader } from "../shaders";
import { HexAngle, HexCoord, HexDir, HexPattern } from "./hexMath";
import { coordToPx, pxToCoord } from "./hexUtils";
import {
  DEFAULT_READABILITY_OFFSET,
  drawPatternFromPoints,
  drawSpot,
  findDupIndices,
} from "./renderLib";

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/client/gui/GuiSpellcasting.kt
export class GuiSpellcasting {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  buf: BufferBuilder;

  private drawState: PatternDrawState = BETWEEN_PATTERNS;
  private usedSpots = new Set<string>();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("WebGL2 not supported :(");
    }

    gl.clearColor(0.6, 0.6, 0.6, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    this.canvas = canvas;
    this.gl = gl;
    this.program = loadPositionColorShader(gl);
    this.buf = new BufferBuilder(gl);
  }

  get width() {
    return this.canvas.clientWidth;
  }

  get height() {
    return this.canvas.clientHeight;
  }

  mouseClicked({ mouseX, mouseY }: MousePos) {
    const mx = _.clamp(mouseX, 0, this.width);
    const my = _.clamp(mouseY, 0, this.height);
    if (this.drawState.type === "betweenPatterns") {
      const coord = this.pxToCoord(new Vec2(mx, my));
      if (!this.usedSpots.has(HexCoord.toString(coord))) {
        this.drawState = { type: "justStarted", start: coord };
      }
    }
  }

  mouseDragged({ mouseX, mouseY }: MousePos) {
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
    // TODO
    this.drawState = BETWEEN_PATTERNS;
  }

  render({
    mouseX,
    mouseY,
  }: MousePos & {
    timestamp: DOMHighResTimeStamp;
  }) {
    const { gl, buf } = this;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    enablePositionColorShader({
      gl,
      program: this.program,
      width: this.width,
      height: this.height,
    });

    const mat = new Mat4();

    const mousePos = new Vec2(mouseX, mouseY);
    const mouseCoord = this.pxToCoord(mousePos);
    const radius = 3;
    for (const dotCoord of HexCoord.rangeAround(mouseCoord, radius)) {
      const dotPx = this.coordToPx(dotCoord);
      const delta = Vec2.clone(dotPx).sub(mousePos).mag;
      const scaledDist = _.clamp(
        1 - (delta - this.hexSize) / (radius * this.hexSize),
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

      points.push(mousePos);
      drawPatternFromPoints({
        buf,
        mat,
        points,
        dupIndices,
        drawLast: false,
        tail: [100 / 255, 200 / 255, 1, 1],
        head: [254 / 255, 203 / 255, 230 / 255, 1],
        flowIrregular: 0.1,
        readabilityOffset: DEFAULT_READABILITY_OFFSET,
        lastSegmentLenProportion: 1,
        seed: 0, // should be this.patterns.length
        isCtrlDown: false,
      });
    }
  }

  get hexSize() {
    return Math.sqrt((this.width * this.height) / 512);
  }

  get coordsOffset() {
    return new Vec2(this.width * 0.5, this.height * 0.5);
  }

  coordToPx(coord: HexCoord) {
    return coordToPx({ coord, size: this.hexSize, offset: this.coordsOffset });
  }

  pxToCoord(px: Vec2) {
    return pxToCoord({ px, size: this.hexSize, offset: this.coordsOffset });
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
