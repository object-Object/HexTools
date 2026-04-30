export function lerp(t: number, v0: number, v1: number) {
  return v0 + t * (v1 - v0);
}
