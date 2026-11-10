// Contact actions for a directory entry: call / WhatsApp / mail links, vCard, share text.
// Pure functions (no DOM) so they can be unit-tested; the browser-only bits live in
// components/contact-actions.tsx.
import { FEEDBACK_FORM, UNIVERSITY } from "./config.ts"
import type { DirectoryEntry, Verification } from "./data/schema.ts"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Small "where does this come from" note shown on each card. */
export function verifiedText(v: Verification): string {
  switch (v.kind) {
    case "timetable": {
      const [y, m] = v.date.split("-").map(Number)
      return `Checked against official timetables · ${MONTHS[m - 1] ?? ""} ${y}`.trim()
    }
    case "website":
      return "Listed on the official CGU website"
    case "emaillist":
      return "From the official CGU email list"
    case "old":
      return "From the earlier version of this site — not re-confirmed yet"
  }
}

/** 10-digit Indian mobile (WhatsApp-able), as opposed to a landline like 06746636555. */
export const isMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone)

/** "9437276618" -> "+91 94372 76618"; "06746636555" -> "0674 6636555". */
export function formatPhone(phone: string): string {
  if (isMobile(phone)) return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
  if (/^0\d{9,11}$/.test(phone)) return `${phone.slice(0, 4)} ${phone.slice(4)}`
  return phone
}

export const telHref = (phone: string) => (isMobile(phone) ? `tel:+91${phone}` : `tel:${phone}`)

export const displayName = (e: Pick<DirectoryEntry, "title" | "name">) => (e.title ? `${e.title} ${e.name}` : e.name)

/** wa.me link with a short, polite opening message the student can edit before sending. */
export function whatsappHref(phone: string, e: DirectoryEntry): string {
  const greeting = e.isOffice ? "Hello" : `Hello ${displayName(e)}`
  const text = `${greeting}, I am a student of ${UNIVERSITY}. `
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
}

export const mailtoHref = (email: string) => `mailto:${email}`

export const gmailHref = (email: string) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`

/** Google Form pre-filled to report a wrong number for this person, or to ask for it to be removed. */
export function reportHref(e: DirectoryEntry): string {
  const u = new URL(FEEDBACK_FORM.url)
  u.searchParams.set("usp", "pp_url")
  u.searchParams.set(
    FEEDBACK_FORM.fields.facultyName,
    `Correction / removal: ${displayName(e)} (${e.department?.short ?? "?"})`,
  )
  return u.toString()
}

const vEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1")

/** vCard 3.0 — opens straight into the phone's "add contact" screen. */
export function toVCard(e: DirectoryEntry): string {
  const parts = e.name.split(" ")
  const last = parts.length > 1 ? parts[parts.length - 1] : ""
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : e.name
  const job = [...e.roles, e.designation].filter(Boolean).join(", ")
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vEscape(last)};${vEscape(first)};;${vEscape(e.title)};`,
    `FN:${vEscape(displayName(e))}`,
    `ORG:${vEscape(UNIVERSITY)}${e.department ? `;${vEscape(e.department.name)}` : ""}`,
    ...(job ? [`TITLE:${vEscape(job)}`] : []),
    ...e.phones.map((p) => `TEL;TYPE=${isMobile(p) ? "CELL" : "WORK"}:${isMobile(p) ? `+91${p}` : p}`),
    ...(e.officialEmail ? [`EMAIL;TYPE=WORK:${e.officialEmail}`] : []),
    ...e.roleEmails.map((m) => `EMAIL;TYPE=WORK:${m}`),
    ...(e.personalEmail ? [`EMAIL;TYPE=HOME:${e.personalEmail}`] : []),
    "NOTE:Saved from CGU Faculty Search",
    "END:VCARD",
  ]
  return lines.join("\r\n") + "\r\n"
}

export const vcardFilename = (e: DirectoryEntry) => `${e.id}.vcf`

/**
 * Plain-text card for sharing / copying. Personal (non-university) emails are left out on
 * purpose — shared text travels to other people. (Saving to your own contacts keeps them.)
 */
export function shareText(e: DirectoryEntry): string {
  const job = [...e.roles, e.designation].filter(Boolean).join(", ")
  return [
    displayName(e),
    [job, e.department?.name].filter(Boolean).join(" — "),
    ...e.phones.map((p) => `📞 ${formatPhone(p)}`),
    ...[e.officialEmail, ...e.roleEmails].filter(Boolean).map((m) => `✉️ ${m}`),
  ]
    .filter(Boolean)
    .join("\n")
}
