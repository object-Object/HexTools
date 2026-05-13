/** RGB color with values in [0, 1]. */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export namespace RGBColor {
  export function fromRGB(value: number): RGBColor {
    return {
      r: ((value >>> 16) & 0xff) / 0xff,
      g: ((value >>> 8) & 0xff) / 0xff,
      b: (value & 0xff) / 0xff,
    };
  }

  export function toCSS({ r, g, b }: RGBColor): string {
    return `rgb(${Math.floor(r * 255)} ${Math.floor(g * 255)} ${Math.floor(b * 255)})`;
  }
}

/** RGBA color with values in [0, 1]. */
export interface RGBAColor extends RGBColor {
  a: number;
}

export namespace RGBAColor {
  export function fromRGB(value: number): RGBAColor {
    return {
      ...RGBColor.fromRGB(value),
      a: 1,
    };
  }

  export function fromARGB(value: number): RGBAColor {
    return {
      ...RGBColor.fromRGB(value),
      a: ((value >>> 24) & 0xff) / 0xff,
    };
  }
}
