// Turns the raw data files into what the site shows. Pure function (no Next.js / server-only
// imports) so tests can use exactly the same entries as the page.
import { z } from "zod"
import {
  DepartmentSchema,
  OfficeSchema,
  PersonSchema,
  type Department,
  type DirectoryEntry,
  type Person,
  type Verification,
} from "./schema.ts"

export function verificationOf(p: Pick<Person, "lastVerified" | "sources">): Verification {
  if (p.lastVerified) return { kind: "timetable", date: p.lastVerified }
  if (p.sources.includes("website")) return { kind: "website" }
  return { kind: "old" }
}

const OFFICE_DEPT = { id: "offices", name: "Administrative Offices", short: "Office" }

export function buildDirectory(
  departmentsJson: unknown,
  facultyJson: unknown,
  officesJson: unknown,
): { entries: DirectoryEntry[]; departments: Department[] } {
  const departments = z.array(DepartmentSchema).parse(departmentsJson)
  const people = z.array(PersonSchema).parse(facultyJson)
  const offices = z.array(OfficeSchema).parse(officesJson)
  const deptById = new Map(departments.map((d) => [d.id, d]))

  const entries: DirectoryEntry[] = people.map((p) => {
    const d = deptById.get(p.department)
    return {
      id: p.id,
      name: p.name,
      title: p.title,
      designation: p.designation,
      roles: p.roles,
      department: d ? { id: d.id, name: d.name, short: d.short } : null,
      phones: p.phones,
      officialEmail: p.officialEmail,
      personalEmail: p.personalEmail,
      roleEmails: p.roleEmails,
      isOffice: p.isOffice,
      aliases: p.aliases,
      verified: verificationOf(p),
    }
  })

  // Offices from the website / role mailboxes. Skip ones without a label, and ones already
  // covered by an office entry in faculty.json (same phone or email).
  const known = new Set(entries.filter((e) => e.isOffice).flatMap((e) => [...e.phones, e.officialEmail]))
  for (const o of offices) {
    if (!o.name || [...o.phones, ...o.emails].some((x) => known.has(x))) continue
    entries.push({
      id: `office-${o.id}`,
      name: o.name,
      title: "",
      designation: o.contact,
      roles: [],
      department: OFFICE_DEPT,
      phones: o.phones,
      officialEmail: o.emails[0] ?? "",
      personalEmail: "",
      roleEmails: o.emails.slice(1),
      isOffice: true,
      aliases: [],
      verified: o.source === "website" ? { kind: "website" } : { kind: "emaillist" },
    })
  }
  return { entries, departments }
}
