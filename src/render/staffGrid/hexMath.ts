export interface HexCoord {
  q: number;
  r: number;
}

export const HexCoord = {
  rangeAround(coord: HexCoord, radius: number) {
    return ringIter(coord, radius);
  },
};

function* ringIter(center: HexCoord, radius: number): Generator<HexCoord> {
  let q = -radius;
  let r = Math.max(-radius, 0);

  while (r <= radius + Math.min(0, -q) || q < radius) {
    if (r > radius + Math.min(0, -q)) {
      q++;
      r = -radius + Math.max(0, -q);
    }
    const out = { q: center.q + q, r: center.r + r };
    r++;
    yield out;
  }
}
