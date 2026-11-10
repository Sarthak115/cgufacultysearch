import assert from "node:assert/strict"
import { describe, it } from "node:test"
import type { DirectoryEntry } from "./data/schema.ts"
import {
  formatPhone,
  gmailHref,
  isMobile,
  reportHref,
  shareText,
  telHref,
  toVCard,
  verifiedText,
  whatsappHref,
} from "./contact.ts"

const prusty: DirectoryEntry = {
  id: "amiya-kumar-prusty",
  name: "Amiya Kumar Prusty",
  title: "Dr.",
  designation: "Professor",
  roles: ["Dean, Pharmacy"],
  department: { id: "pharmacy", name: "Pharmacy", short: "Pharmacy" },
  phones: ["9437276618", "06746636555"],
  officialEmail: "amiya.prusty@cgu-odisha.ac.in",
  personalEmail: "",
  roleEmails: ["deanpharmacy@cgu-odisha.ac.in"],
  isOffice: false,
  aliases: [],
  verified: { kind: "timetable", date: "2026-11-10" },
}

describe("phones", () => {
  it("mobile vs landline", () => {
    assert.ok(isMobile("9437276618"))
    assert.ok(!isMobile("06746636555"))
  })
  it("formats for display", () => {
    assert.equal(formatPhone("9437276618"), "+91 94372 76618")
    assert.equal(formatPhone("06746636555"), "0674 6636555")
  })
  it("tel links", () => {
    assert.equal(telHref("9437276618"), "tel:+919437276618")
    assert.equal(telHref("06746636555"), "tel:06746636555")
  })
})

describe("links", () => {
  it("WhatsApp link with a polite prefilled message", () => {
    const u = new URL(whatsappHref("9437276618", prusty))
    assert.equal(u.origin + u.pathname, "https://wa.me/919437276618")
    assert.equal(u.searchParams.get("text"), "Hello Dr. Amiya Kumar Prusty, I am a student of C. V. Raman Global University. ")
  })
  it("Gmail compose link", () => {
    assert.equal(gmailHref("a.b@cgu-odisha.ac.in"), "https://mail.google.com/mail/?view=cm&fs=1&to=a.b%40cgu-odisha.ac.in")
  })
  it("report form is pre-filled with the name", () => {
    const u = new URL(reportHref(prusty))
    assert.equal(u.searchParams.get("entry.693888704"), "Correction / removal: Dr. Amiya Kumar Prusty (Pharmacy)")
    assert.equal(u.searchParams.get("usp"), "pp_url")
  })
})

describe("vCard", () => {
  const v = toVCard(prusty)
  it("is a valid vCard 3.0 with CRLF line endings", () => {
    assert.ok(v.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"))
    assert.ok(v.endsWith("END:VCARD\r\n"))
  })
  it("has name, organisation, job, phones and emails", () => {
    assert.match(v, /\r\nN:Prusty;Amiya Kumar;;Dr\.;\r\n/)
    assert.match(v, /\r\nFN:Dr\. Amiya Kumar Prusty\r\n/)
    assert.match(v, /\r\nORG:C\. V\. Raman Global University;Pharmacy\r\n/)
    assert.match(v, /\r\nTITLE:Dean\\, Pharmacy\\, Professor\r\n/) // commas escaped
    assert.match(v, /\r\nTEL;TYPE=CELL:\+919437276618\r\n/)
    assert.match(v, /\r\nTEL;TYPE=WORK:06746636555\r\n/)
    assert.match(v, /\r\nEMAIL;TYPE=WORK:amiya\.prusty@cgu-odisha\.ac\.in\r\n/)
    assert.match(v, /\r\nEMAIL;TYPE=WORK:deanpharmacy@cgu-odisha\.ac\.in\r\n/)
  })
})

describe("verified note", () => {
  it("timetable date as month + year", () => {
    assert.equal(verifiedText({ kind: "timetable", date: "2026-11-10" }), "Checked against official timetables · Nov 2026")
  })
  it("other sources", () => {
    assert.equal(verifiedText({ kind: "website" }), "Listed on the official CGU website")
    assert.match(verifiedText({ kind: "old" }), /not re-confirmed/)
  })
})

describe("share text", () => {
  it("lists name, post, department and contacts", () => {
    assert.equal(
      shareText(prusty),
      [
        "Dr. Amiya Kumar Prusty",
        "Dean, Pharmacy, Professor — Pharmacy",
        "📞 +91 94372 76618",
        "📞 0674 6636555",
        "✉️ amiya.prusty@cgu-odisha.ac.in",
        "✉️ deanpharmacy@cgu-odisha.ac.in",
      ].join("\n"),
    )
  })
  it("never includes a personal email", () => {
    assert.ok(!shareText({ ...prusty, personalEmail: "someone@gmail.com" }).includes("gmail"))
  })
})
