import FacultySearch from "@/components/faculty-search"
import { getDirectory } from "@/lib/data"

// Data lives in data/faculty.json, data/offices.json and data/departments.json
// (rebuilt by scripts/timetables/merge.py, checked by `npm run validate:data`).
// It is loaded on the server at build time; only public fields reach the browser.
export default function Page() {
  const { entries, departments } = getDirectory()
  // Department short forms (CSE, ECE, TPO …) power the search; send only what it needs.
  const departmentList = departments.map(({ id, name, short, aliases }) => ({ id, name, short, aliases }))
  return <FacultySearch facultyData={entries} departmentList={departmentList} />
}
