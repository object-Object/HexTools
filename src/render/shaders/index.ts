import { mat4 } from "gl-matrix";

import positionColorFragment from "./position_color.fsh?raw";
import positionColorVertex from "./position_color.vsh?raw";

// shh. don't tell Microsoft's lawyers. it's fine
export function loadPositionColorShader(gl: WebGL2RenderingContext) {
  return loadShaderProgram({
    gl,
    vertex: positionColorVertex,
    fragment: positionColorFragment,
  });
}

export function enablePositionColorShader({
  gl,
  program,
  width,
  height,
}: {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  width: number;
  height: number;
}) {
  gl.useProgram(program);

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "ModelViewMat"),
    false,
    mat4.create(),
  );

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "ProjMat"),
    false,
    mat4.ortho(mat4.create(), 0, width, height, 0, -100, 100),
  );

  gl.uniform4f(gl.getUniformLocation(program, "ColorModulator"), 1, 1, 1, 1);

  const positionSize = 3;
  const positionBytes = positionSize * 4;
  const colorSize = 4;
  const colorBytes = colorSize * 1;
  const stride = positionBytes + colorBytes;

  const position = gl.getAttribLocation(program, "Position");
  gl.vertexAttribPointer(position, positionSize, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(position);

  const color = gl.getAttribLocation(program, "Color");
  gl.vertexAttribPointer(
    color,
    colorSize,
    gl.UNSIGNED_BYTE,
    false,
    stride,
    positionBytes,
  );
  gl.enableVertexAttribArray(color);

  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function loadShaderProgram({
  gl,
  vertex,
  fragment,
}: {
  gl: WebGL2RenderingContext;
  vertex: string;
  fragment: string;
}) {
  const vertexShader = loadShader(gl, "vertex", vertex);
  const fragmentShader = loadShader(gl, "fragment", fragment);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `Failed to initialize shader program: ${gl.getProgramInfoLog(program)}`,
    );
  }

  return program;
}

function loadShader(
  gl: WebGL2RenderingContext,
  type: "vertex" | "fragment",
  source: string,
) {
  const shader = gl.createShader(
    type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER,
  );
  if (!shader) {
    throw new Error(`Failed to create ${type} shader`);
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Failed to compile ${type} shader: ${log}`);
  }

  return shader;
}
