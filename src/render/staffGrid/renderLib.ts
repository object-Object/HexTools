import { mat4, vec2 } from "gl-matrix";

import type { BufferBuilder } from "../buffer";

// https://github.com/FallingColors/HexMod/blob/88f86d96f4e94473de10ca76b5d9ef34fca96c5a/Common/src/main/java/at/petrak/hexcasting/client/render/RenderLib.kt

export function drawSpot({
  buf,
  mat,
  point: [x, y],
  radius,
  r,
  g,
  b,
  a,
}: {
  buf: BufferBuilder;
  mat: mat4;
  point: vec2;
  radius: number;
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  buf.start();

  buf.vertex(mat, x, y, 1).color(r, g, b, a);

  const fracOfCircle = 6;
  for (let i = 0; i <= fracOfCircle; i++) {
    const theta = (i / fracOfCircle) * Math.PI * 2;
    const rx = Math.cos(theta) * radius + x;
    const ry = Math.sin(theta) * radius + y;
    buf.vertex(mat, rx, ry, 1).color(r, g, b, a);
  }

  buf.end();
}
