// "Sounds-like" key for Odia / Indian names written in English.
// Same rules as skeleton() in scripts/timetables/merge.py — keep them in sync.
//
//   Mohapatra = Mahapatra = Mohapatro      Bisoi = Bisoy = Bisoyi
//   Satpathy = Satapathy                   Sukant = Sukanta
//   Debashis = Debasis                     Sahu = Sahoo
//
// How: merge spellings of the same sound (ph→f, th→t, sh→s, v/w→b, y→i …), then keep the first
// letter and drop the other vowels (that is where most spelling variation lives), then
// collapse doubled letters.
const RULES: [RegExp, string][] = [
  [/ph/g, "f"], [/th/g, "t"], [/dh/g, "d"], [/bh/g, "b"], [/kh/g, "k"], [/gh/g, "g"],
  [/chh/g, "c"], [/ch/g, "c"], [/jh/g, "j"], [/sh/g, "s"], [/w/g, "b"], [/v/g, "b"],
  [/z/g, "j"], [/q/g, "k"], [/x/g, "ks"], [/ck/g, "k"], [/y/g, "i"],
]

export function skeleton(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, "")
  if (!w) return ""
  for (const [re, to] of RULES) w = w.replace(re, to)
  const out = w[0] + w.slice(1).replace(/[aeiou]/g, "")
  return out.replace(/(.)\1+/g, "$1")
}
