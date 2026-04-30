import { mod } from "../../utils/math";

export interface HexCoord {
  q: number;
  r: number;
}

export const HexCoord = {
  shiftedBy(coord: HexCoord, other: HexCoord | HexDir) {
    let otherCoord = other;
    if (typeof otherCoord === "number") {
      otherCoord = HexDir.asDelta(otherCoord);
    }
    return { q: coord.q + otherCoord.q, r: coord.r + otherCoord.r };
  },
  toString(coord: HexCoord) {
    return `${coord.q},${coord.r}`;
  },
  *rangeAround(center: HexCoord, radius: number): Generator<HexCoord> {
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
  },
};

export enum HexDir {
  NORTH_EAST,
  EAST,
  SOUTH_EAST,
  SOUTH_WEST,
  WEST,
  NORTH_WEST,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace HexDir {
  export function asDelta(dir: HexDir) {
    return dirToDelta[dir];
  }

  export function rotatedBy(dir: HexDir, angle: HexAngle): HexDir {
    return mod(dir + angle, 6);
  }
}

const dirToDelta: Record<HexDir, HexCoord> = {
  [HexDir.NORTH_EAST]: { q: 1, r: -1 },
  [HexDir.EAST]: { q: 1, r: 0 },
  [HexDir.SOUTH_EAST]: { q: 0, r: 1 },
  [HexDir.SOUTH_WEST]: { q: -1, r: 1 },
  [HexDir.WEST]: { q: -1, r: 0 },
  [HexDir.NORTH_WEST]: { q: 0, r: -1 },
};

export enum HexAngle {
  FORWARD,
  RIGHT,
  RIGHT_BACK,
  BACK,
  LEFT_BACK,
  LEFT,
}

export class HexPattern {
  constructor(
    public startDir: HexDir,
    public angles: HexAngle[] = [],
  ) {}

  tryAppendDir(newDir: HexDir): boolean {
    return false;
  }

  finalDir(): HexDir {
    return this.startDir;
  }

  *positions(): Generator<HexCoord> {
    yield { q: 0, r: 0 };
  }
}
