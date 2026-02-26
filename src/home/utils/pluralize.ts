// src/home/utils/pluralize.ts
export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return n === 1 ? singular : plural;
}