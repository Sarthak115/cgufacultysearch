// Spelling-tolerant faculty search.
//
// Every word the user types must match something about the entry (name, other spellings of the
// name, department, post, designation, email, phone). Each word is scored by how well it matched:
//
//   exact word 100 · post (HOD/Dean/VC…) 90 · prefix 80 · sounds-like 70 · department 60 ·
//   sounds-like prefix 55 · typo 45 · single initial 25
//
// Results are ordered by total score, then seniority (VC > Pro-VC > Registrar > … > HOD >
// Professor …), then name.
import type { DirectoryEntry } from "../data/schema.ts"
import { ROLE_ALIASES, seniority, type RoleMatcher } from "./aliases.ts"
import { editDistance, normalize, tokenize, typoBudget } from "./normalize.ts"
import { skeleton } from "./phonetic.ts"

export interface DeptInfo {
  id: string
  name: string
  short: string
  aliases: string[]
}

interface Word {
  w: string
  sk: string
}

interface Indexed {
  entry: DirectoryEntry
  name: Word[]
  nameKey: string
  dept: Word[]
  roles: string[]
  roleWords: Word[]
  emails: string[]
  phones: string[]
  rank: number
}

export interface SearchIndex {
  items: Indexed[]
  deptPhrases: Map<string, Set<string>>
  vocab: string[]
}

interface Term {
  text: string
  role?: RoleMatcher
  depts?: Set<string>
}

const toWords = (ts: string[]): Word[] => [...new Set(ts)].map((w) => ({ w, sk: skeleton(w) }))

export function buildIndex(entries: DirectoryEntry[], departments: DeptInfo[]): SearchIndex {
  const deptPhrases = new Map<string, Set<string>>()
  for (const d of departments) {
    for (const p of [d.id, d.name, d.short, ...d.aliases].map(normalize)) {
      if (p.length < 2) continue
      if (!deptPhrases.has(p)) deptPhrases.set(p, new Set())
      deptPhrases.get(p)!.add(d.id)
    }
  }
  const vocab = new Set<string>()
  const items = entries.map((entry): Indexed => {
    const nameTokens = [entry.name, ...entry.aliases].flatMap(tokenize)
    const deptTokens = entry.department ? tokenize(`${entry.department.name} ${entry.department.short}`) : []
    nameTokens.forEach((t) => t.length > 2 && vocab.add(t))
    deptTokens.forEach((t) => t.length > 2 && vocab.add(t))
    const emails = [entry.officialEmail, entry.personalEmail, ...entry.roleEmails]
      .filter(Boolean)
      .map((e) => e.toLowerCase())
    return {
      entry,
      name: toWords(nameTokens),
      nameKey: tokenize(entry.name).join(" "),
      dept: toWords(deptTokens),
      roles: entry.roles.map(normalize),
      roleWords: toWords([...entry.roles, entry.designation].flatMap(tokenize)),
      emails,
      phones: entry.phones,
      rank: seniority(entry.roles, entry.designation),
    }
  })
  return { items, deptPhrases, vocab: [...vocab] }
}

/** Split the query into terms, recognising multi-word posts/departments ("vice chancellor", "computer science"). */
function parse(query: string, index: SearchIndex): Term[] {
  const raw = query.trim().toLowerCase()
  // A phone number, possibly typed with spaces or +91: "94372 76618", "+91 9437276618"
  if (/^[+\d\s-]{6,}$/.test(raw)) {
    const digits = raw.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "")
    return digits.length >= 4 ? [{ text: digits }] : []
  }
  // Emails keep their dots: "amiya.prusty@"
  const terms: Term[] = raw.split(/\s+/).filter((t) => t.includes("@")).map((t) => ({ text: t }))
  const toks = tokenize(raw.split(/\s+/).filter((t) => !t.includes("@")).join(" "))
  for (let i = 0; i < toks.length; ) {
    let found = false
    for (let len = Math.min(4, toks.length - i); len >= 1; len--) {
      const phrase = toks.slice(i, i + len).join(" ")
      const role = ROLE_ALIASES[phrase]
      const depts = index.deptPhrases.get(phrase)
      if (role || depts) {
        terms.push({ text: phrase, role, depts })
        i += len
        found = true
        break
      }
    }
    if (!found) terms.push({ text: toks[i++] })
  }
  return terms
}

function wordScore(q: string, words: Word[], exactOnly = false): number {
  const qs = skeleton(q)
  let best = 0
  for (const { w, sk } of words) {
    let s = 0
    if (w === q) s = 100
    else if (exactOnly) continue
    else if (q.length >= 2 && w.startsWith(q)) s = 80
    else if (q.length === 1 && w[0] === q) s = 25
    else if (q.length >= 3 && qs.length >= 2 && sk === qs) s = 70
    else if (q.length >= 4 && qs.length >= 3 && sk.startsWith(qs)) s = 55
    else {
      const budget = typoBudget(q)
      if (budget && editDistance(q, w, budget) <= budget) s = 45
    }
    if (s > best) best = s
  }
  return best
}

function termScore(t: Term, it: Indexed): number {
  const q = t.text
  if (/^\d{4,}$/.test(q)) return it.phones.some((p) => p.includes(q)) ? 100 : 0
  if (q.includes("@")) return it.emails.some((e) => e.startsWith(q)) ? 100 : 0

  let s = 0
  if (t.role && it.roles.some(t.role)) s = 90
  if (t.depts && it.entry.department && t.depts.has(it.entry.department.id)) s = Math.max(s, 60)
  if (q.includes(" ")) return s // multi-word post/department phrase: handled above
  // A short form like "me" (Mechanical) shouldn't also match every name starting with "me".
  const isAlias = Boolean(t.role || t.depts)
  s = Math.max(s, wordScore(q, it.name, isAlias))
  s = Math.max(s, Math.min(50, wordScore(q, it.dept, isAlias)))
  s = Math.max(s, Math.min(40, wordScore(q, it.roleWords, isAlias)))
  if (q.length >= 4 && it.emails.some((e) => e.startsWith(q))) s = Math.max(s, 60)
  return s
}

export interface Scored {
  entry: DirectoryEntry
  score: number
}

export function searchScored(query: string, index: SearchIndex): Scored[] {
  const terms = parse(query, index)
  if (!terms.length) return []
  const qKey = tokenize(query).join(" ")
  const out: (Scored & { rank: number })[] = []
  for (const it of index.items) {
    let total = 0
    let ok = true
    for (const t of terms) {
      const s = termScore(t, it)
      if (!s) {
        ok = false
        break
      }
      total += s
    }
    if (!ok) continue
    if (qKey === it.nameKey) total += 50 // typed the full name exactly
    out.push({ entry: it.entry, score: total, rank: it.rank })
  }
  out.sort((a, b) => b.score - a.score || b.rank - a.rank || a.entry.name.localeCompare(b.entry.name))
  return out.map(({ entry, score }) => ({ entry, score }))
}

export function search(query: string, index: SearchIndex): DirectoryEntry[] {
  return searchScored(query, index).map((s) => s.entry)
}

/** "Did you mean …?" — replace unknown words with the closest known name/department word. */
export function suggest(query: string, index: SearchIndex): string | null {
  const vocab = new Set(index.vocab)
  let changed = false
  const fixed = tokenize(query).map((t) => {
    if (ROLE_ALIASES[t] || index.deptPhrases.has(t) || vocab.has(t) || /\d|@/.test(t) || t.length < 3) return t
    // Words typed together: "amiyakumar" -> "amiya kumar"
    for (let i = 3; i <= t.length - 3; i++) {
      if (vocab.has(t.slice(0, i)) && vocab.has(t.slice(i))) {
        changed = true
        return `${t.slice(0, i)} ${t.slice(i)}`
      }
    }
    let best = t
    let bestD = Infinity
    for (const v of index.vocab) {
      if (Math.abs(v.length - t.length) > 3) continue
      const d = editDistance(t, v, 3)
      if (d < bestD || (d === bestD && skeleton(v) === skeleton(t))) {
        best = v
        bestD = d
      }
    }
    if (bestD <= Math.max(2, Math.floor(t.length / 3)) && best !== t) {
      changed = true
      return best
    }
    return t
  })
  if (!changed) return null
  const s = fixed.join(" ")
  return search(s, index).length ? s : null
}
