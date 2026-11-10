"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Building, Search, X } from "lucide-react"
import type { DirectoryEntry } from "@/lib/data/schema"
import { displayName } from "@/lib/contact"
import type { DeptCount } from "@/lib/directory"
import { Avatar, badgeLabel } from "./bits"

export type Option = { kind: "person"; entry: DirectoryEntry } | { kind: "dept"; dept: DeptCount }

interface Props {
  value: string
  onChange: (v: string) => void
  options: Option[]
  onPick: (o: Option) => void
  /** Enter pressed without choosing a suggestion. */
  onSubmit: () => void
  resultCount: number | null
}

/** Search input with a suggestion dropdown (ARIA combobox). Press "/" anywhere to jump here. */
export function SearchBox({ value, onChange, options, onPick, onSubmit, resultCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const show = open && value.trim().length > 0 && options.length > 0

  useEffect(() => setActive(-1), [value])

  // "/" focuses the search box unless the user is already typing somewhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const pick = (o: Option) => {
    onPick(o)
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % options.length)
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (show && active >= 0) pick(options[active])
      else {
        onSubmit()
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      if (show) setOpen(false)
      else onChange("")
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Search faculty by name, department, post or phone number"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Name, dept, HOD, phone…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`h-14 w-full rounded-2xl border-2 border-primary/20 bg-card pl-14 ${value ? "pr-32" : "pr-4 sm:pr-12"} text-base text-card-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary [&::-webkit-search-cancel-button]:hidden`}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {resultCount === null ? (
          <kbd className="hidden rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline">/</kbd>
        ) : (
          <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground" aria-live="polite">
            {resultCount} found
          </span>
        )}
      </div>

      {show && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-xl"
        >
          {options.map((o, i) => (
            <li
              key={o.kind === "person" ? o.entry.id : `dept-${o.dept.id}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => pick(o)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ${i === active ? "bg-accent" : ""}`}
            >
              {o.kind === "person" ? (
                <>
                  <Avatar name={o.entry.name} small />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{displayName(o.entry)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[badgeLabel(o.entry), o.entry.department?.short].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Building className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.dept.name}</span>
                    <span className="block text-xs text-muted-foreground">Department · {o.dept.count} people</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
