import { Mat4 } from "gl-matrix";

import positionColorFragment from "./position_color.fsh?raw";
import positionColorVertex from "./position_color.vsh?raw";

interface Shader<UniformsT extends string, AttribsT extends string> {
  program: WebGLProgram;
  uniforms: Record<UniformsT, WebGLUniformLocation>;
  attribs: Record<AttribsT, GLint>;
}

export interface PositionColorShader extends Shader<
  "ModelViewMat" | "ProjMat" | "ColorModulator",
  "Position" | "Color"
> {}

export function loadPositionColorShader(
  gl: WebGL2RenderingContext,
): PositionColorShader {
  const program = loadShaderProgram({
    gl,
    vertex: positionColorVertex,
    fragment: positionColorFragment,
  });
  return {
    program,
    uniforms: getUniformLocations(
      gl,
      program,
      "ModelViewMat",
      "ProjMat",
      "ColorModulator",
    ),
    attribs: getAttribLocations(gl, program, "Position", "Color"),
  };
}

export function enablePositionColorShader({
  gl,
  shader: { program, uniforms, attribs },
  width,
  height,
}: {
  gl: WebGL2RenderingContext;
  shader: PositionColorShader;
  width: number;
  height: number;
}) {
  gl.useProgram(program);

  gl.uniformMatrix4fv(uniforms.ModelViewMat, false, new Mat4());

  gl.uniformMatrix4fv(
    uniforms.ProjMat,
    false,
    Mat4.orthoNO(new Mat4(), 0, width, height, 0, -100, 100),
  );

  gl.uniform4f(uniforms.ColorModulator, 1, 1, 1, 1);

  const positionSize = 3;
  const positionBytes = positionSize * 4;
  const colorSize = 4;
  const colorBytes = colorSize * 1;
  const stride = positionBytes + colorBytes;

  gl.vertexAttribPointer(
    attribs.Position,
    positionSize,
    gl.FLOAT,
    false,
    stride,
    0,
  );
  gl.enableVertexAttribArray(attribs.Position);

  gl.vertexAttribPointer(
    attribs.Color,
    colorSize,
    gl.UNSIGNED_BYTE,
    true,
    stride,
    positionBytes,
  );
  gl.enableVertexAttribArray(attribs.Color);

  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function getAttribLocations<T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  ...names: T[]
): Record<T, GLint> {
  return Object.fromEntries(
    names.map((name) => [name, gl.getAttribLocation(program, name)]),
  ) as Record<T, GLint>;
}

function getUniformLocations<T extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  ...names: T[]
): Record<T, WebGLUniformLocation> {
  return Object.fromEntries(
    names.map((name) => [name, getUniformLocation(gl, program, name)]),
  ) as Record<T, WebGLUniformLocation>;
}

function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(
      `Failed to get uniform location: ${name} (${gl.getError()})`,
    );
  }
  return location;
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
