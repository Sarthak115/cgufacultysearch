// Server-side loader for the directory. Parsing with zod (in buildDirectory) means a broken data
// file fails `next build` instead of shipping a broken page.
import "server-only"
import departmentsJson from "@/data/departments.json"
import facultyJson from "@/data/faculty.json"
import officesJson from "@/data/offices.json"
import { buildDirectory } from "./build.ts"

export function getDirectory() {
  return buildDirectory(departmentsJson, facultyJson, officesJson)
}
