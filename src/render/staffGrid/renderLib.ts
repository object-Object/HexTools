import { Mat4, Vec2 } from "gl-matrix";

import type { BufferBuilder } from "../buffer";

// https://github.com/FallingColors/HexMod/blob/88f86d96f4e94473de10ca76b5d9ef34fca96c5a/Common/src/main/java/at/petrak/hexcasting/client/render/RenderLib.kt

export function drawSpot({
  buf,
  mat,
  point,
  radius,
  r,
  g,
  b,
  a,
}: {
  buf: BufferBuilder;
  mat: Mat4;
  point: Vec2;
  radius: number;
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  buf.begin(buf.gl.TRIANGLE_FAN);

  buf.vertex(mat, point.x, point.y, 1).color(r, g, b, a);

  const fracOfCircle = 6;
  for (let i = 0; i <= fracOfCircle; i++) {
    const theta = (i / fracOfCircle) * Math.PI * 2;
    const rx = Math.cos(theta) * radius + point.x;
    const ry = Math.sin(theta) * radius + point.y;
    buf.vertex(mat, rx, ry, 1).color(r, g, b, a);
  }

  buf.end();
}
