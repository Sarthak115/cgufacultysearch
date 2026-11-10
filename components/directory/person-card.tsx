"use client"

import { useState } from "react"
import { ChevronDown, MessageCircle, Phone } from "lucide-react"
import { ContactDetails } from "@/components/contact-actions"
import type { DirectoryEntry } from "@/lib/data/schema"
import { displayName, formatPhone, isMobile, telHref, whatsappHref } from "@/lib/contact"
import { Avatar, Badges, FavButton, badgeLabel } from "./bits"

export interface FavProps {
  isFav: (id: string) => boolean
  toggleFav: (id: string) => void
}

/** Full card used for search results. */
export function PersonCard({ entry, isFav, toggleFav }: { entry: DirectoryEntry } & FavProps) {
  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <header className="flex items-start gap-3 bg-gradient-to-br from-violet-50 to-purple-50 p-5 dark:from-violet-950/40 dark:to-purple-950/20">
        <Avatar name={entry.name} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-card-foreground">{displayName(entry)}</h3>
          <Badges entry={entry} />
        </div>
        <FavButton active={isFav(entry.id)} onToggle={() => toggleFav(entry.id)} name={entry.name} />
      </header>
      <div className="space-y-5 p-5">
        <ContactDetails entry={entry} />
      </div>
    </article>
  )
}

const quick =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** Compact row for long lists (department, A–Z, leadership): tap to expand into full details. */
export function PersonRow({ entry, isFav, toggleFav }: { entry: DirectoryEntry } & FavProps) {
  const [open, setOpen] = useState(false)
  const phone = entry.phones[0]
  const sub = [badgeLabel(entry), entry.department?.short].filter(Boolean).join(" · ")
  const panelId = `row-${entry.id}`
  return (
    <li className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-2 pl-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar name={entry.name} small />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-card-foreground">{displayName(entry)}</span>
            <span className="block truncate text-xs text-muted-foreground">{sub}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {phone && (
          <a
            href={telHref(phone)}
            aria-label={`Call ${displayName(entry)} on ${formatPhone(phone)}`}
            title={`Call ${formatPhone(phone)}`}
            className={`${quick} bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400 dark:hover:bg-green-900/50`}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
        {phone && isMobile(phone) && (
          <a
            href={whatsappHref(phone, entry)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${displayName(entry)}`}
            title="Message on WhatsApp"
            className={`${quick} hidden bg-[#25D366] text-white hover:bg-[#1da851] sm:inline-flex`}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
        <FavButton active={isFav(entry.id)} onToggle={() => toggleFav(entry.id)} name={entry.name} />
      </div>
      {open && (
        <div id={panelId} className="space-y-5 border-t p-4">
          <ContactDetails entry={entry} />
        </div>
      )}
    </li>
  )
}
