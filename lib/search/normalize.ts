/** Words that are never part of the name being searched for. */
export const TITLES = new Set([
  "dr", "prof", "mr", "mrs", "ms", "miss", "sir", "madam", "maam", "mam",
  "capt", "er", "shri", "sri", "smt",
])

/** Lowercase, strip accents and punctuation: "Dr. K.P. Bauri" -> "dr k p bauri". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9@ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Normalized words without titles: "Prof. (Dr.) Ashwin Sahoo" -> ["ashwin", "sahoo"]. */
export function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t && !TITLES.has(t))
}

/** Damerau-Levenshtein distance, giving up early once it exceeds `max`. */
export function editDistance(a: string, b: string, max = 3): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1) // swapped letters
      }
      rowMin = Math.min(rowMin, d[i][j])
    }
    if (rowMin > max) return max + 1
  }
  return d[a.length][b.length]
}

/** Typos allowed for a word of this length: none for short words, 1 for 4-6 letters, 2 above. */
export function typoBudget(word: string): number {
  return word.length < 4 ? 0 : word.length < 7 ? 1 : 2
}
