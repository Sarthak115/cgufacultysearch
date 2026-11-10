import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { buildDirectory } from "./data/build.ts"
import { departmentCounts, groupAZ, initials, leadership, matchesRank, offices, sortForBrowse } from "./directory.ts"

const load = (f: string) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), "utf8"))
const { entries } = buildDirectory(load("departments.json"), load("faculty.json"), load("offices.json"))

describe("leadership", () => {
  const l = leadership(entries)
  it("VC first, then Pro-VC", () => {
    assert.equal(l.top[0].name, "Banshidhar Majhi")
    assert.equal(l.top[1].name, "Guda Sridevi")
  })
  it("deans and HODs are listed, without the top posts", () => {
    assert.ok(l.deans.length >= 10)
    assert.ok(l.deans.every((e) => e.roles.some((r) => r.startsWith("Dean"))))
    assert.ok(!l.deans.some((e) => l.top.includes(e)))
    assert.ok(l.hods.length >= 10)
    assert.ok(l.hods.every((e) => e.roles.some((r) => r.startsWith("HOD"))))
  })
  it("no offices in leadership", () => {
    assert.ok(![...l.top, ...l.deans, ...l.hods].some((e) => e.isOffice))
  })
})

describe("departments", () => {
  const d = departmentCounts(entries)
  it("counts people per academic department", () => {
    const cse = d.find((x) => x.id === "cse")
    assert.ok(cse && cse.count > 30)
    assert.ok(!d.some((x) => x.id === "offices" || x.id === "leadership"))
    assert.equal(d.reduce((s, x) => s + x.count, 0), entries.filter((e) => !e.isOffice && e.department && e.department.id !== "leadership").length)
  })
  it("sorted A–Z", () => {
    const names = d.map((x) => x.name)
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)))
  })
})

describe("filters & sorting", () => {
  it("rank filters", () => {
    const prusty = entries.find((e) => e.id === "amiya-kumar-prusty")!
    assert.ok(matchesRank(prusty, "leadership"))
    assert.ok(matchesRank(prusty, "professor"))
    assert.ok(!matchesRank(prusty, "assistant"))
    assert.ok(matchesRank(prusty, "all"))
  })
  it("department list puts post holders first", () => {
    const pharmacy = sortForBrowse(entries.filter((e) => e.department?.id === "pharmacy"))
    assert.equal(pharmacy[0].name, "Amiya Kumar Prusty")
  })
  it("A–Z groups", () => {
    const g = groupAZ(entries)
    assert.equal(g.reduce((s, [, xs]) => s + xs.length, 0), entries.length)
    assert.equal(g[0][0], "A")
    for (const [letter, xs] of g) assert.ok(xs.every((e) => e.name[0].toUpperCase() === letter || letter === "#"))
  })
  it("offices", () => assert.ok(offices(entries).every((e) => e.isOffice)))
  it("initials", () => {
    assert.equal(initials("Amiya Kumar Prusty"), "AP")
    assert.equal(initials("Sunita"), "S")
  })
})
