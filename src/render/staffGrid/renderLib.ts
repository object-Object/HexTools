import {
  Vec2,
  Vec3,
  type Mat4Like,
  type Vec2Like,
  type Vec3Like,
  type Vec4Like,
} from "gl-matrix";
import _ from "lodash";

import { lerp } from "../../utils/math";
import type { BufferBuilder } from "../buffer";
import { HexCoord } from "./hexMath";

// https://github.com/FallingColors/HexMod/blob/88f86d96f4e94473de10ca76b5d9ef34fca96c5a/Common/src/main/java/at/petrak/hexcasting/client/render/RenderLib.kt

export function drawLineSeq({
  buf,
  mat,
  points,
  width,
  z,
  tail,
  head,
  isCtrlDown,
}: {
  buf: BufferBuilder;
  mat: Mat4Like;
  points: Vec2Like[];
  width: number;
  z: number;
  tail: Vec4Like;
  head: Vec4Like;
  isCtrlDown: boolean;
}) {
  if (points.length <= 1) return;

  const [r1, g1, b1, a] = tail;
  const [r2, g2, b2] = isCtrlDown ? head : tail;

  const n = points.length;
  const joinAngles = new Float32Array(n);
  const joinOffsets = new Float32Array(n);
  for (let i = 2; i < n; i++) {
    const p0 = points[i - 2];
    const p2 = points[i];
    const p1 = points[i - 1];
    const prev = Vec2.clone(p1).sub(p0);
    const next = Vec2.clone(p2).sub(p1);
    const angle = Math.atan2(
      prev[0] * next[1] - prev[1] * next[0],
      prev[0] * next[0] + prev[1] * next[1],
    );
    joinAngles[i - 1] = angle;
    const clamp = Math.min(prev.mag, next.mag) / (width * 0.5);
    joinOffsets[i - 1] = _.clamp(
      Math.sin(angle) / (1 + Math.cos(angle)),
      -clamp,
      clamp,
    );
  }

  function vertex(color: Vec3Like, pos: Vec2Like) {
    buf.vertex(mat, pos[0], pos[1], z).color(color[0], color[1], color[2], a);
  }

  buf.begin(buf.gl.TRIANGLES);
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const tangent = Vec2.clone(p2)
      .sub(p1)
      .normalize()
      .scale(width * 0.5);
    const normal = new Vec2(-tangent.y, tangent.x);

    function color(time: number) {
      return new Vec3(
        lerp(time, r1, r2),
        lerp(time, g1, g2),
        lerp(time, b1, b2),
      );
    }

    const color1 = color(i / n);
    const color2 = color((i + 1) / n);
    const jlow = joinOffsets[i];
    const jhigh = joinOffsets[i + 1];

    const p1Down = Vec2.clone(p1)
      .add(Vec2.clone(tangent).scale(Math.max(0, jlow)))
      .add(normal);
    const p1Up = Vec2.clone(p1)
      .add(Vec2.clone(tangent).scale(Math.max(0, -jlow)))
      .sub(normal);
    const p2Down = Vec2.clone(p2)
      .sub(Vec2.clone(tangent).scale(Math.max(0, jhigh)))
      .add(normal);
    const p2Up = Vec2.clone(p2)
      .sub(Vec2.clone(tangent).scale(Math.max(0, -jhigh)))
      .sub(normal);

    vertex(color1, p1Down);
    vertex(color1, p1);
    vertex(color1, p1Up);

    vertex(color1, p1Down);
    vertex(color1, p1Up);
    vertex(color2, p2Up);

    vertex(color1, p1Down);
    vertex(color2, p2Up);
    vertex(color2, p2);

    vertex(color1, p1Down);
    vertex(color2, p2);
    vertex(color2, p2Down);

    if (i > 0) {
      const sangle = joinAngles[i];
      const angle = Math.abs(sangle);
      const rnormal = Vec2.clone(normal).negate();
      const joinSteps = Math.ceil((angle * 180) / (CAP_THETA * Math.PI));
      if (joinSteps < 1) {
        continue;
      }

      if (sangle < 0) {
        let prevVert = new Vec2(p1[0] - rnormal.x, p1[1] - rnormal.y);
        for (let j = 1; j <= joinSteps; j++) {
          const fan = rotate(rnormal, -sangle * (j / joinSteps));
          const fanShift = new Vec2(p1[0] - fan.x, p1[1] - fan.y);

          vertex(color1, p1);
          vertex(color1, prevVert);
          vertex(color1, fanShift);
          prevVert = fanShift;
        }
      } else {
        const startFan = rotate(normal, -sangle);
        let prevVert = new Vec2(p1[0] - startFan.x, p1[1] - startFan.y);
        for (let j = joinSteps - 1; j >= 0; j--) {
          const fan = rotate(normal, -sangle * (j / joinSteps));
          const fanShift = new Vec2(p1[0] - fan.x, p1[1] - fan.y);

          vertex(color1, p1);
          vertex(color1, prevVert);
          vertex(color1, fanShift);
          prevVert = fanShift;
        }
      }
    }
  }
  buf.end();

  function drawCaps(color: Vec3Like, point: Vec2Like, prev: Vec2Like) {
    const tangent = Vec2.clone(point)
      .sub(prev)
      .normalize()
      .scale(0.5 * width);
    const normal = new Vec2(-tangent.y, tangent.x);
    const joinSteps = Math.ceil(180 / CAP_THETA);
    buf.begin(buf.gl.TRIANGLE_FAN);
    vertex(color, point);
    for (let j = joinSteps; j >= 0; j--) {
      const fan = rotate(normal, -Math.PI * (j / joinSteps));
      buf
        .vertex(mat, point[0] + fan[0], point[1] + fan[1], z)
        .color(color[0], color[1], color[2], a);
    }
    buf.end();
  }
  drawCaps(new Vec3(r1, g1, b1), points[0], points[1]);
  drawCaps(new Vec3(r2, g2, b2), points[n - 1], points[n - 2]);
}

function rotate(vec: Vec2, theta: number): Vec2 {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return new Vec2(vec.x * cos - vec.y * sin, vec.y * cos + vec.x * sin);
}

export function drawPatternFromPoints({
  buf,
  mat,
  points,
  dupIndices,
  drawLast,
  tail,
  head,
  flowIrregular,
  readabilityOffset,
  lastSegmentLenProportion,
  seed,
  isCtrlDown,
}: {
  buf: BufferBuilder;
  mat: Mat4Like;
  points: Vec2Like[];
  dupIndices: Set<number>;
  drawLast: boolean;
  tail: Vec4Like;
  head: Vec4Like;
  flowIrregular: number;
  readabilityOffset: number;
  lastSegmentLenProportion: number;
  seed: number;
  isCtrlDown: boolean;
}) {
  // TODO
  const nodes = drawLast ? points : points.slice(0, -1);
  drawLineSeq({ buf, mat, points, width: 5, z: 0, tail, head, isCtrlDown });
  drawLineSeq({
    buf,
    mat,
    points,
    width: 2,
    z: 1,
    tail: screenCol(tail),
    head: screenCol(head),
    isCtrlDown,
  });
  for (const node of nodes) {
    drawSpot({
      buf,
      mat,
      point: node,
      radius: 2,
      r: dodge(head[0]),
      g: dodge(head[1]),
      b: dodge(head[2]),
      a: head[3],
    });
  }
}

export function findDupIndices(pts: Iterable<HexCoord>): Set<number> {
  const dedup = new Map<string, number>();
  const found = new Set<number>();
  let i = 0;
  for (const pt of pts) {
    const ptStr = HexCoord.toString(pt);
    const ix = dedup.get(ptStr);
    if (ix !== undefined) {
      found.add(i);
      found.add(ix);
    } else {
      dedup.set(ptStr, i);
    }
    i++;
  }
  return found;
}

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
  mat: Mat4Like;
  point: Vec2Like;
  radius: number;
  r: number;
  g: number;
  b: number;
  a: number;
}) {
  buf.begin(buf.gl.TRIANGLE_FAN);

  buf.vertex(mat, point[0], point[1], 1).color(r, g, b, a);

  const fracOfCircle = 6;
  for (let i = 0; i <= fracOfCircle; i++) {
    const theta = (i / fracOfCircle) * Math.PI * 2;
    const rx = Math.cos(theta) * radius + point[0];
    const ry = Math.sin(theta) * radius + point[1];
    buf.vertex(mat, rx, ry, 1).color(r, g, b, a);
  }

  buf.end();
}

function screenCol(col: Vec4Like): Vec4Like {
  const [r, g, b, a] = col;
  return [screen(r), screen(g), screen(b), a];
}

function screen(n: number) {
  return (n + 1) / 2;
}

function dodge(n: number) {
  return n * 0.9;
}

export const DEFAULT_READABILITY_OFFSET = 0.2;
const CAP_THETA = 180 / 10;
