export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(t: number, v0: number, v1: number) {
  return v0 + t * (v1 - v0);
}

export function mod(n: number, d: number) {
  return ((n % d) + d) % d;
}
