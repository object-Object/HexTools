import { mat4, vec2 } from "gl-matrix";
import _ from "lodash";

import { lerp } from "../../utils/math";
import { BufferBuilder } from "../buffer";
import { enablePositionColorShader, loadPositionColorShader } from "../shaders";
import { HexCoord } from "./hexMath";
import { coordToPx, pxToCoord } from "./hexUtils";
import { drawSpot } from "./renderLib";

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/client/gui/GuiSpellcasting.kt
export class GuiSpellcasting {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  buf: BufferBuilder;

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

  render({
    mouseX,
    mouseY,
  }: {
    mouseX: number;
    mouseY: number;
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

    const mat = mat4.create();

    const mousePos = vec2.fromValues(mouseX, mouseY);
    const mouseCoord = this.pxToCoord(mousePos);
    const radius = 3;
    for (const dotCoord of HexCoord.rangeAround(mouseCoord, radius)) {
      const dotPx = this.coordToPx(dotCoord);
      const delta = vec2.length(
        vec2.add(
          vec2.clone(dotPx),
          dotPx,
          vec2.negate(vec2.clone(mousePos), mousePos),
        ),
      );
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
  }

  get hexSize() {
    return Math.sqrt((this.width * this.height) / 512);
  }

  get coordsOffset() {
    return vec2.fromValues(this.width * 0.5, this.height * 0.5);
  }

  coordToPx(coord: HexCoord) {
    return coordToPx({ coord, size: this.hexSize, offset: this.coordsOffset });
  }

  pxToCoord(px: vec2) {
    return pxToCoord({ px, size: this.hexSize, offset: this.coordsOffset });
  }
}
