// Data contract for data/*.json. Used by the site (lib/data/index.ts) and by
// `npm run validate:data` (scripts/validate-data.ts), so keep this file plain TypeScript
// that Node can run directly (no enums / namespaces).
import { z } from "zod"

/** 10-digit Indian mobile, or a landline with STD code (e.g. 06746636555). Stored without +91. */
export const PHONE_RE = /^(?:[6-9]\d{9}|0\d{9,11})$/

const email = z.string().email()
const emailOrEmpty = z.union([z.literal(""), email])

export const DepartmentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  short: z.string().min(1),
  aliases: z.array(z.string()),
  office: z.boolean().optional(),
})

export const PersonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(3),
  title: z.string(),
  /** Academic rank only: "Assistant Professor", "Professor", ... (may be empty). */
  designation: z.string(),
  /** Posts held: "Dean, Pharmacy", "HOD, CSE", "Vice Chancellor". */
  roles: z.array(z.string()),
  /** Role mailboxes that go with those posts (deanpharmacy@...). */
  roleEmails: z.array(email),
  /** Department id from data/departments.json ("" = not known yet). Department only — no subjects/semesters. */
  department: z.string(),
  phones: z.array(z.string().regex(PHONE_RE, "phone must be 10 digits (or a landline with STD code)")),
  officialEmail: emailOrEmpty,
  otherEmails: z.array(email),
  personalEmail: emailOrEmpty,
  isOffice: z.boolean(),
  // --- internal (review / provenance), never sent to the browser ---
  sources: z.array(z.string()),
  inMasterList: z.boolean(),
  lastVerified: z.string(),
  flags: z.array(z.string()),
  aliases: z.array(z.string()),
})

export const OfficeSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  phones: z.array(z.string().regex(PHONE_RE)),
  emails: z.array(email),
  source: z.string(),
})

export type Department = z.infer<typeof DepartmentSchema>
export type Person = z.infer<typeof PersonSchema>
export type Office = z.infer<typeof OfficeSchema>

/** What the browser receives for each searchable entry (people and offices). */
export interface DirectoryEntry {
  id: string
  name: string
  title: string
  designation: string
  roles: string[]
  department: { id: string; name: string; short: string } | null
  phones: string[]
  officialEmail: string
  personalEmail: string
  roleEmails: string[]
  isOffice: boolean
  /** Other spellings seen in sources — used by search, not shown. */
  aliases: string[]
  /** Where the contact was last confirmed (shown as a small note — never subject/semester). */
  verified: Verification
}

export type Verification =
  | { kind: "timetable"; date: string } // seen in the current academic year's official timetables
  | { kind: "website" } // listed on cgu-odisha.ac.in
  | { kind: "emaillist" } // official university email list
  | { kind: "old" } // only in the earlier version of this site
