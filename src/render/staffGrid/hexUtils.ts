import { Vec2 } from "gl-matrix";

import type { HexCoord } from "./hexMath";

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/api/utils/HexUtils.kt#L86

export function coordToPx({
  coord,
  size,
  offset,
}: {
  coord: HexCoord;
  size: number;
  offset: Vec2;
}): Vec2 {
  return new Vec2(sqrt3 * coord.q + (sqrt3 / 2) * coord.r, 1.5 * coord.r)
    .scale(size)
    .add(offset);
}

export function pxToCoord({
  px,
  size,
  offset,
}: {
  px: Vec2;
  size: number;
  offset: Vec2;
}): HexCoord {
  const offsetted = Vec2.clone(px).add(Vec2.clone(offset).negate());
  let qf = ((sqrt3 / 3) * offsetted[0] - 0.33333 * offsetted[1]) / size;
  let rf = (0.66666 * offsetted[1]) / size;

  const q = Math.round(qf);
  const r = Math.round(rf);
  qf -= q;
  rf -= r;
  return Math.abs(q) >= Math.abs(r)
    ? { q: q + Math.round(qf + 0.5 * rf), r }
    : { q, r: r + Math.round(rf + 0.5 * qf) };
}

const sqrt3 = 1.7320508;
