import { Vec2, type Vec2Like } from "gl-matrix";

import type { HexCoord } from "./hexMath";

// https://github.com/FallingColors/HexMod/blob/724c36bba6a97f97d16f95d16f7addb700e62443/Common/src/main/java/at/petrak/hexcasting/api/utils/HexUtils.kt#L86

export function coordToPx({
  coord,
  size,
  offset,
}: {
  coord: HexCoord;
  size: number;
  offset: Vec2Like;
}): Vec2 {
  return new Vec2(SQRT_3 * coord.q + (SQRT_3 / 2) * coord.r, 1.5 * coord.r)
    .scale(size)
    .add(offset);
}

export function pxToCoord({
  px,
  size,
  offset,
}: {
  px: Vec2Like;
  size: number;
  offset: Vec2Like;
}): HexCoord {
  const offsetted = Vec2.clone(px).sub(offset);
  let qf = ((SQRT_3 / 3) * offsetted[0] - 0.33333 * offsetted[1]) / size;
  let rf = (0.66666 * offsetted[1]) / size;

  const q = Math.round(qf);
  const r = Math.round(rf);
  qf -= q;
  rf -= r;
  return Math.abs(q) >= Math.abs(r)
    ? { q: q + Math.round(qf + 0.5 * rf), r }
    : { q, r: r + Math.round(rf + 0.5 * qf) };
}

const SQRT_3 = 1.7320508;
