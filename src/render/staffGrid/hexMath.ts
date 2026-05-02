import type { Vec2, Vec2Like } from "gl-matrix";

import { mod } from "../../utils/math";
import { coordToPx } from "./hexUtils";

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

  // https://www.redblobgames.com/grids/hexagons/#conversions-offset (odd-r)
  axialToOffset(coord: HexCoord): HexCoord {
    const parity = coord.r & 1;
    return {
      q: coord.q + (coord.r - parity) / 2,
      r: coord.r,
    };
  },

  offsetToAxial(coord: HexCoord): HexCoord {
    const parity = coord.r & 1;
    return {
      q: coord.q - (coord.r - parity) / 2,
      r: coord.r,
    };
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

  export function angleFrom(dir: HexDir, other: HexDir): HexAngle {
    return mod(dir - other, 6);
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
    const linesSeen = new Set<string>();

    let cursor = { q: 0, r: 0 };
    let compass = this.startDir;
    for (const a of this.angles) {
      linesSeen.add(`${HexCoord.toString(cursor)},${compass}`);
      cursor = HexCoord.shiftedBy(cursor, compass);
      const back = HexDir.rotatedBy(compass, HexAngle.BACK);
      linesSeen.add(`${HexCoord.toString(cursor)},${back}`);
      compass = HexDir.rotatedBy(compass, a);
    }
    cursor = HexCoord.shiftedBy(cursor, compass);

    if (linesSeen.has(`${HexCoord.toString(cursor)},${newDir}`)) {
      return false;
    }
    const nextAngle = HexDir.angleFrom(newDir, compass);
    if (nextAngle === HexAngle.BACK) {
      return false;
    }

    this.angles.push(nextAngle);
    return true;
  }

  finalDir(): HexDir {
    return this.angles.reduce(HexDir.rotatedBy, this.startDir);
  }

  *positions(start: HexCoord = { q: 0, r: 0 }): Generator<HexCoord> {
    let cursor = start;
    let compass = this.startDir;
    yield cursor;
    for (const a of this.angles) {
      cursor = HexCoord.shiftedBy(cursor, compass);
      yield cursor;
      compass = HexDir.rotatedBy(compass, a);
    }
    yield HexCoord.shiftedBy(cursor, compass);
  }

  *toLines(size: number, offset: Vec2Like): Generator<Vec2> {
    for (const coord of this.positions()) {
      yield coordToPx({ coord, size, offset });
    }
  }
}
