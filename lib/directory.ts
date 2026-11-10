// Browse helpers for the home page and department lists. Pure functions (unit-tested).
import type { DirectoryEntry } from "./data/schema.ts"
import { seniority } from "./search/aliases.ts"

const TOP_ROLES = ["Vice Chancellor", "Pro Vice Chancellor", "Registrar", "Controller of Examinations"]

const byName = (a: DirectoryEntry, b: DirectoryEntry) => a.name.localeCompare(b.name)
const bySeniority = (a: DirectoryEntry, b: DirectoryEntry) =>
  seniority(b.roles, b.designation) - seniority(a.roles, a.designation) || byName(a, b)

export interface Leadership {
  /** VC, Pro-VC, Registrar, Controller of Examinations */
  top: DirectoryEntry[]
  deans: DirectoryEntry[]
  hods: DirectoryEntry[]
}

export function leadership(entries: DirectoryEntry[]): Leadership {
  const people = entries.filter((e) => !e.isOffice)
  const top = people.filter((e) => e.roles.some((r) => TOP_ROLES.includes(r))).sort(bySeniority)
  const inTop = new Set(top.map((e) => e.id))
  const firstRole = (e: DirectoryEntry, p: string) => e.roles.find((r) => r.startsWith(p)) ?? ""
  const deans = people
    .filter((e) => !inTop.has(e.id) && e.roles.some((r) => r.startsWith("Dean")))
    .sort((a, b) => firstRole(a, "Dean").localeCompare(firstRole(b, "Dean")) || byName(a, b))
  const hods = people
    .filter((e) => e.roles.some((r) => r.startsWith("HOD")))
    .sort((a, b) => firstRole(a, "HOD").localeCompare(firstRole(b, "HOD")) || byName(a, b))
  return { top, deans, hods }
}

export interface DeptCount {
  id: string
  name: string
  short: string
  count: number
}

/** Academic departments that have at least one person, A–Z. */
export function departmentCounts(entries: DirectoryEntry[]): DeptCount[] {
  const m = new Map<string, DeptCount>()
  for (const e of entries) {
    if (e.isOffice || !e.department || e.department.id === "leadership") continue
    const d = m.get(e.department.id) ?? { ...e.department, count: 0 }
    d.count++
    m.set(d.id, d)
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export const offices = (entries: DirectoryEntry[]) => entries.filter((e) => e.isOffice).sort(byName)

export type RankFilter = "all" | "leadership" | "professor" | "associate" | "assistant" | "other"

export const RANK_FILTERS: { id: RankFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "leadership", label: "Dean / HOD / Leadership" },
  { id: "professor", label: "Professors" },
  { id: "associate", label: "Associate Prof." },
  { id: "assistant", label: "Assistant Prof." },
  { id: "other", label: "Others" },
]

export function matchesRank(e: DirectoryEntry, f: RankFilter): boolean {
  switch (f) {
    case "all":
      return true
    case "leadership":
      return e.roles.length > 0
    case "professor":
      return e.designation === "Professor" || e.designation === "Professor of Practice"
    case "associate":
      return e.designation === "Associate Professor"
    case "assistant":
      return e.designation === "Assistant Professor"
    case "other":
      return !/professor/i.test(e.designation)
  }
}

/** Sort a department list: post holders first (Dean, HOD …), then by rank, then A–Z. */
export const sortForBrowse = (list: DirectoryEntry[]) => [...list].sort(bySeniority)

/** A–Z groups by first letter of the name. */
export function groupAZ(list: DirectoryEntry[]): [string, DirectoryEntry[]][] {
  const groups = new Map<string, DirectoryEntry[]>()
  for (const e of [...list].sort(byName)) {
    const letter = /^[a-z]/i.test(e.name) ? e.name[0].toUpperCase() : "#"
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(e)
  }
  return [...groups]
}

/** Initials for the avatar circle: "Amiya Kumar Prusty" -> "AP". */
export function initials(name: string): string {
  const w = name.split(/\s+/).filter((x) => /^[a-z]/i.test(x))
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase()
}
