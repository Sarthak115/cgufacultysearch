// npm test — runs with Node's built-in test runner on the real data in data/*.json.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { buildDirectory } from "../data/build.ts"
import { skeleton } from "./phonetic.ts"
import { buildIndex, search, suggest } from "./index.ts"

const load = (f: string) => JSON.parse(readFileSync(new URL(`../../data/${f}`, import.meta.url), "utf8"))
const { entries, departments } = buildDirectory(load("departments.json"), load("faculty.json"), load("offices.json"))
const index = buildIndex(entries, departments)
const names = (q: string) => search(q, index).map((e) => e.name)
const top = (q: string, n = 1) => names(q).slice(0, n)

describe("sounds-like key", () => {
  it("treats common Odia spelling variants as the same", () => {
    assert.equal(skeleton("Mohapatra"), skeleton("Mahapatra"))
    assert.equal(skeleton("Mohapatra"), skeleton("Mohapatro"))
    assert.equal(skeleton("Bisoi"), skeleton("Bisoyi"))
    assert.equal(skeleton("Bisoy"), skeleton("Bisoi"))
    assert.equal(skeleton("Satpathy"), skeleton("Satapathy"))
    assert.equal(skeleton("Debashis"), skeleton("Debasis"))
    assert.equal(skeleton("Sahu"), skeleton("Sahoo"))
  })
})

describe("names with different spellings", () => {
  it("mahapatra finds the Mohapatras", () => {
    const r = names("mahapatra")
    assert.ok(r.includes("Hiranmayee Mohapatra"))
    assert.ok(r.includes("Sweta Shikta Mahapatra"))
    assert.ok(r.length >= 10)
  })
  it("exact spelling (name or a recorded spelling of it) ranks before sounds-alike", () => {
    for (const q of ["mahapatra", "mohapatra"]) {
      const first = search(q, index)[0]
      assert.ok([first.name, ...first.aliases].some((n) => n.toLowerCase().includes(q)), `${q}: ${first.name}`)
    }
  })
  it("bisoi / bisoyi find Sukanta Kishore Bisoy", () => {
    assert.ok(names("bisoi").includes("Sukanta Kishore Bisoy"))
    assert.ok(names("bisoyi").includes("Sukanta Kishore Bisoy"))
  })
  it("satpathy finds Satapathy", () => assert.ok(names("satpathy").includes("Subhechha Satapathy")))
  it("sukant finds Sukanta", () => assert.deepEqual(top("sukant"), ["Sukanta Kishore Bisoy"]))
  it("typo: mohaptra", () => assert.ok(names("mohaptra").includes("Hiranmayee Mohapatra")))
  it("full name with the other spelling", () => {
    assert.deepEqual(top("kamal lochan mohanta"), ["Kamal Lochan Mahanta"])
  })
  it("initials + surname", () => assert.ok(top("k l mahanta", 3).includes("Kamal Lochan Mahanta")))
  it("titles are ignored", () => assert.deepEqual(top("Dr. Amiya Prusty"), ["Amiya Kumar Prusty"]))
  it("prusty only finds Prusty", () => assert.deepEqual(names("prusty"), ["Amiya Kumar Prusty"]))
})

describe("posts and departments", () => {
  it("cse = Computer Science & Engineering", () => {
    const r = search("cse", index)
    assert.ok(r.length > 30)
    assert.ok(r.every((e) => e.department?.id === "cse" || e.roles.some((x) => /cse/i.test(x))))
  })
  it("computer science (words) = cse", () => assert.equal(names("computer science").length, names("cse").length))
  it("vc is the Vice Chancellor, not the Pro-VC", () => assert.deepEqual(names("vc"), ["Banshidhar Majhi"]))
  it("pro vc", () => assert.deepEqual(names("pro vc"), ["Guda Sridevi"]))
  it("dsw finds the Dean of Student Welfare", () => assert.ok(top("dsw", 3).includes("Rudra Narayan Mohapatro")))
  it("hod cse only lists CSE heads", () => {
    const r = search("hod cse", index)
    assert.ok(r.length >= 1)
    assert.ok(r.every((e) => e.roles.some((x) => x === "HOD, CSE")))
  })
  it("dean pharmacy", () => assert.deepEqual(top("dean pharmacy"), ["Amiya Kumar Prusty"]))
  it("deans are listed, VC/Pro-VC not included", () => {
    const r = search("dean", index)
    assert.ok(r.length >= 10)
    assert.ok(r.every((e) => e.roles.some((x) => x.startsWith("Dean")) || /dean/i.test(e.name)))
  })
  it("coe", () => assert.deepEqual(top("coe"), ["Achyutananda Mohanty"]))
  it("me means Mechanical, not names starting with Me", () => {
    const r = search("me", index)
    assert.ok(r.length > 5)
    assert.ok(r.every((e) => e.department?.id === "me"))
  })
  it("seniority orders equal matches", () => {
    const r = search("pharmacy", index)
    assert.equal(r[0].name, "Amiya Kumar Prusty") // the Dean comes first
  })
})

describe("contact lookups", () => {
  it("phone number search", () => assert.deepEqual(top("9437276618"), ["Amiya Kumar Prusty"]))
  it("phone with +91 and spaces", () => assert.deepEqual(top("+91 94372 76618"), ["Amiya Kumar Prusty"]))
  it("partial phone", () => assert.ok(names("76618").includes("Amiya Kumar Prusty")))
  it("email search", () => assert.deepEqual(top("amiya.prusty@"), ["Amiya Kumar Prusty"]))
  it("offices", () => assert.ok(names("admission").length >= 1))
})

describe("did you mean", () => {
  it("small typos need no suggestion — they just match", () => {
    assert.deepEqual(top("banshidhrr majji"), ["Banshidhar Majhi"])
  })
  it("suggests a close spelling when nothing matches", () => {
    assert.equal(search("bansidhxrq majhi", index).length, 0)
    assert.equal(suggest("bansidhxrq majhi", index), "banshidhar majhi")
  })
  it("splits words typed together", () => {
    assert.equal(search("amiyakumar prusty", index).length, 0)
    assert.equal(suggest("amiyakumar prusty", index), "amiya kumar prusty")
  })
  it("no suggestion for nonsense", () => assert.equal(suggest("qqqqzzzz", index), null))
  it("no suggestion when the query already matches", () => assert.equal(suggest("prusty", index), null))
})
