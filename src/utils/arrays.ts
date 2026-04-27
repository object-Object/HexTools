export function replaceIndex<T>(
  values: T[],
  index: number,
  fn: (current: T) => T,
): T[] {
  return values.map((value, i) => (i === index ? fn(value) : value));
}

export function replaceIndexFlat<T>(
  values: T[],
  index: number,
  fn: (current: T) => T[],
): T[] {
  return values.flatMap((value, i) => (i === index ? fn(value) : [value]));
}

export function removeIndex<T>(values: T[], index: number): T[] {
  return values.filter((_, i) => i !== index);
}
