// npm run validate:data — checks data/*.json before it goes live.
// Runs directly with Node 24 (built-in TypeScript type stripping), no build step.
//
// Errors (exit 1): schema violations, duplicate ids / official emails, unknown department ids,
//                  entries with no way to contact them, a phone repeated inside one entry.
// Warnings:        missing department, phone shared by several people, entries flagged for review.
import { readFileSync } from "node:fs"
import { z } from "zod"
import { DepartmentSchema, OfficeSchema, PersonSchema } from "../lib/data/schema.ts"

const load = (p: string): unknown => JSON.parse(readFileSync(new URL(`../data/${p}`, import.meta.url), "utf8"))

const errors: string[] = []
const warnings: string[] = []

function parse<T>(file: string, schema: z.ZodType<T>): T[] {
  const res = z.array(schema).safeParse(load(file))
  if (res.success) return res.data
  for (const issue of res.error.issues.slice(0, 50)) {
    errors.push(`${file} [${issue.path.join(".")}]: ${issue.message}`)
  }
  return []
}

const departments = parse("departments.json", DepartmentSchema)
const people = parse("faculty.json", PersonSchema)
const offices = parse("offices.json", OfficeSchema)
const deptIds = new Set(departments.map((d) => d.id))

const dupes = (values: string[]) => {
  const seen = new Map<string, number>()
  for (const v of values) if (v) seen.set(v, (seen.get(v) ?? 0) + 1)
  return [...seen].filter(([, n]) => n > 1).map(([v]) => v)
}

for (const id of dupes(departments.map((d) => d.id))) errors.push(`duplicate department id: ${id}`)
for (const id of dupes(people.map((p) => p.id))) errors.push(`duplicate person id: ${id}`)
for (const e of dupes(people.map((p) => p.officialEmail))) errors.push(`official email used by several people: ${e}`)

const phoneOwners = new Map<string, string[]>()
for (const p of people) {
  if (p.department && !deptIds.has(p.department)) errors.push(`${p.id}: unknown department "${p.department}"`)
  if (!p.department) warnings.push(`${p.id}: no department`)
  if (!p.phones.length && !p.officialEmail && !p.personalEmail && !p.roleEmails.length)
    errors.push(`${p.id}: no phone or email`)
  for (const ph of dupes(p.phones)) errors.push(`${p.id}: phone ${ph} listed twice`)
  for (const ph of p.phones) phoneOwners.set(ph, [...(phoneOwners.get(ph) ?? []), p.id])
}
for (const [ph, ids] of phoneOwners) {
  if (ids.length > 1) warnings.push(`phone ${ph} shared by: ${ids.join(", ")}`)
}
for (const o of offices) if (!o.name) warnings.push(`office ${o.id}: no label (hidden on the site)`)

const flagged = people.filter((p) => p.flags.length).length
console.log(`departments: ${departments.length}, people: ${people.length}, offices: ${offices.length}`)
console.log(`${flagged} people have review flags (see data/review-report.md)`)
if (warnings.length) {
  console.log(`\n${warnings.length} warnings:`)
  for (const w of warnings.slice(0, 40)) console.log(`  ! ${w}`)
  if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`)
}
if (errors.length) {
  console.error(`\n${errors.length} errors:`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log("\n✓ data is valid")
