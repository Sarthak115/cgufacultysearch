// Short forms students type for posts. Department short forms (CSE, ECE, EE, ME, HSS, TPO …)
// come from data/departments.json so there is one list to maintain.
import { normalize } from "./normalize.ts"

export type RoleMatcher = (role: string) => boolean

const is = (r: string) => (role: string) => role === r
const starts = (r: string) => (role: string) => role === r || role.startsWith(`${r} `)

/** normalized phrase -> which roles it means (roles are normalized too: "dean student welfare"). */
export const ROLE_ALIASES: Partial<Record<string, RoleMatcher>> = {
  hod: starts("hod"),
  "head of department": starts("hod"),
  head: starts("hod"),
  dean: starts("dean"),
  deans: starts("dean"),
  vc: is("vice chancellor"),
  "vice chancellor": is("vice chancellor"),
  "vice chancellors": is("vice chancellor"),
  provc: is("pro vice chancellor"),
  "pro vc": is("pro vice chancellor"),
  pvc: is("pro vice chancellor"),
  "pro vice chancellor": is("pro vice chancellor"),
  registrar: is("registrar"),
  coe: is("controller of examinations"),
  controller: is("controller of examinations"),
  "controller of examination": is("controller of examinations"),
  "controller of examinations": is("controller of examinations"),
  dsw: (r) => r.includes("student welfare"),
  "student welfare": (r) => r.includes("student welfare"),
  director: starts("director"),
}

/** Seniority used to order equally good matches (higher first). */
export function seniority(roles: string[], designation: string): number {
  const rs = roles.map(normalize)
  let s = 0
  // Posts are in steps of 100 so a post always outranks any designation bonus (max 10).
  for (const r of rs) {
    if (r === "vice chancellor") s = Math.max(s, 700)
    else if (r === "pro vice chancellor") s = Math.max(s, 600)
    else if (r === "registrar") s = Math.max(s, 500)
    else if (r === "controller of examinations") s = Math.max(s, 400)
    else if (r.startsWith("director")) s = Math.max(s, 350)
    else if (r.startsWith("dean")) s = Math.max(s, 300)
    else if (r.startsWith("hod")) s = Math.max(s, 200)
  }
  const d = normalize(designation)
  if (d === "professor" || d === "professor of practice") s += 10
  else if (d === "associate professor") s += 6
  else if (d === "assistant professor") s += 3
  return s
}
