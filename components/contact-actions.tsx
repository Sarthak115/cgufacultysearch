"use client"

import { useState } from "react"
import { Check, Copy, Eye, Flag, Globe, Info, Mail, MessageCircle, Phone, Share2, ShieldCheck, UserPlus } from "lucide-react"
import { toast } from "sonner"
import type { DirectoryEntry } from "@/lib/data/schema"
import {
  displayName,
  formatPhone,
  gmailHref,
  isMobile,
  mailtoHref,
  reportHref,
  shareText,
  telHref,
  toVCard,
  vcardFilename,
  verifiedText,
  whatsappHref,
} from "@/lib/contact"

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // older browsers / non-secure pages
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.select()
    document.execCommand("copy")
    ta.remove()
  }
  toast.success(`${what} copied`)
}

const iconBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1"

function CopyButton({ text, what, tone }: { text: string; what: string; tone: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      aria-label={`Copy ${what.toLowerCase()}`}
      title={`Copy ${what.toLowerCase()}`}
      onClick={async () => {
        await copyText(text, what)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
      className={`${iconBtn} ${tone}`}
    >
      {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

function PhoneRow({ phone, entry }: { phone: string; entry: DirectoryEntry }) {
  return (
    <div className="flex items-stretch gap-2">
      <a
        href={telHref(phone)}
        aria-label={`Call ${formatPhone(phone)}`}
        className="flex flex-1 items-center rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-3 transition-all duration-300 hover:border-green-300 hover:from-green-100 hover:to-emerald-100 dark:border-green-900 dark:from-green-950/60 dark:to-emerald-950/40 dark:hover:border-green-700"
      >
        {/* the number must always be fully visible — no truncation */}
        <span className="whitespace-nowrap font-mono text-[13px] font-medium tracking-tight text-gray-700 dark:text-gray-100">
          {formatPhone(phone)}
        </span>
      </a>
      {isMobile(phone) && (
        <a
          href={whatsappHref(phone, entry)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${formatPhone(phone)}`}
          title="Message on WhatsApp"
          className={`${iconBtn} border-transparent bg-[#25D366] text-white hover:bg-[#1da851]`}
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      )}
      <CopyButton
        text={isMobile(phone) ? `+91${phone}` : phone}
        what="Number"
        tone="border-green-200 bg-white text-green-700 hover:bg-green-50 dark:border-green-900 dark:bg-card dark:text-green-400 dark:hover:bg-green-950/50"
      />
    </div>
  )
}

const EMAIL_TONES = {
  official: { dot: "bg-blue-500", row: "border-blue-200 from-blue-50 to-indigo-50 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:border-blue-900 dark:from-blue-950/60 dark:to-indigo-950/40", icon: "text-blue-600 dark:text-blue-400", btn: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:bg-card dark:text-blue-300 dark:hover:bg-blue-950/50" },
  personal: { dot: "bg-purple-500", row: "border-purple-200 from-purple-50 to-violet-50 hover:border-purple-300 hover:from-purple-100 hover:to-violet-100 dark:border-purple-900 dark:from-purple-950/60 dark:to-violet-950/40", icon: "text-purple-600 dark:text-purple-400", btn: "border-purple-200 bg-white text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:bg-card dark:text-purple-300 dark:hover:bg-purple-950/50" },
  office: { dot: "bg-orange-500", row: "border-orange-200 from-orange-50 to-amber-50 hover:border-orange-300 hover:from-orange-100 hover:to-amber-100 dark:border-orange-900 dark:from-orange-950/60 dark:to-amber-950/40", icon: "text-orange-600 dark:text-orange-400", btn: "border-orange-200 bg-white text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:bg-card dark:text-orange-300 dark:hover:bg-orange-950/50" },
}

function EmailRow({ email, label, tone }: { email: string; label: string; tone: keyof typeof EMAIL_TONES }) {
  const t = EMAIL_TONES[tone]
  return (
    <div>
      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${t.dot}`} />
        {label}
      </p>
      <div className="flex items-stretch gap-2">
        <a
          href={mailtoHref(email)}
          aria-label={`Email ${email}`}
          className={`group/email flex min-w-0 flex-1 items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 transition-all duration-300 ${t.row}`}
        >
          <Mail className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover/email:scale-110 ${t.icon}`} />
          <span className="break-all text-sm font-medium text-gray-700 dark:text-gray-100">{email}</span>
        </a>
        <a
          href={gmailHref(email)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Write to ${email} in Gmail`}
          title="Open in Gmail"
          className={`${iconBtn} w-auto px-2 text-xs font-semibold ${t.btn}`}
        >
          Gmail
        </a>
        <CopyButton text={email} what="Email" tone={t.btn} />
      </div>
    </div>
  )
}

/** Personal (non-university) emails stay hidden until the student taps "Show". */
function PersonalEmail({ email }: { email: string }) {
  const [shown, setShown] = useState(false)
  if (shown) return <EmailRow email={email} label="Personal Email" tone="personal" />
  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      aria-label="Show personal email"
      className="flex w-full items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Eye className="h-4 w-4" aria-hidden />
      <span>
        Personal email · <span className="font-semibold text-primary">Show</span>
      </span>
    </button>
  )
}

const VERIFIED_ICON = { timetable: ShieldCheck, website: Globe, emaillist: Globe, old: Info }

/** "Checked against official timetables · Nov 2026" etc. */
function VerifiedNote({ entry }: { entry: DirectoryEntry }) {
  const Icon = VERIFIED_ICON[entry.verified.kind]
  const good = entry.verified.kind !== "old"
  return (
    <p className={`flex items-start gap-1.5 text-xs ${good ? "text-muted-foreground" : "text-amber-700 dark:text-amber-400"}`}>
      <Icon className={`mt-px h-3.5 w-3.5 shrink-0 ${good ? "text-green-600 dark:text-green-400" : ""}`} aria-hidden />
      {verifiedText(entry.verified)}
    </p>
  )
}

function saveContact(entry: DirectoryEntry) {
  const blob = new Blob([toVCard(entry)], { type: "text/vcard;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = vcardFilename(entry)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  toast.success("Contact file downloaded", { description: "Open it to add to your phone's contacts." })
}

async function shareContact(entry: DirectoryEntry) {
  const text = shareText(entry)
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: displayName(entry), text })
      return
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return // user closed the share sheet
    }
  }
  await copyText(text, "Contact details")
}

const actionBtn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-white px-2 py-2 " +
  "text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50 focus-visible:outline-none " +
  "dark:border-purple-900 dark:bg-card dark:text-purple-300 dark:hover:bg-purple-950/50 " +
  "focus-visible:ring-2 focus-visible:ring-purple-500"

/** Phones, emails and the Save / Share / Report row for one card. */
export function ContactDetails({ entry }: { entry: DirectoryEntry }) {
  const hasEmail = Boolean(entry.officialEmail || entry.personalEmail || entry.roleEmails.length)
  return (
    <>
      {entry.phones.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="rounded-lg bg-green-100 p-1 dark:bg-green-950">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            Phone Numbers
          </div>
          <div className="space-y-2">
            {entry.phones.map((p) => (
              <PhoneRow key={p} phone={p} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {hasEmail && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="rounded-lg bg-blue-100 p-1 dark:bg-blue-950">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            Email Addresses
          </div>
          <div className="space-y-3">
            {entry.officialEmail && <EmailRow email={entry.officialEmail} label="Official Email" tone="official" />}
            {entry.roleEmails.map((m) => (
              <EmailRow key={m} email={m} label="Office Email" tone="office" />
            ))}
            {entry.personalEmail && <PersonalEmail email={entry.personalEmail} />}
          </div>
        </div>
      )}

      <VerifiedNote entry={entry} />

      <div className="grid grid-cols-3 gap-2 border-t pt-4">
        <button type="button" onClick={() => saveContact(entry)} className={actionBtn}>
          <UserPlus className="h-4 w-4" />
          Save
        </button>
        <button type="button" onClick={() => shareContact(entry)} className={actionBtn}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <a
          href={reportHref(entry)}
          target="_blank"
          rel="noopener noreferrer"
          className={actionBtn}
          title="Report wrong info or ask for this contact to be removed"
          aria-label={`Report wrong info or request removal for ${displayName(entry)}`}
        >
          <Flag className="h-4 w-4" />
          Report
        </a>
      </div>
    </>
  )
}
