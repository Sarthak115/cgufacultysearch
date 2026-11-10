"use client"

import type { DirectoryEntry } from "@/lib/data/schema"
import { RANK_FILTERS, groupAZ, matchesRank, sortForBrowse, type RankFilter } from "@/lib/directory"
import { PersonRow, type FavProps } from "./person-card"

export function RankChips({
  list,
  value,
  onChange,
}: {
  list: DirectoryEntry[]
  value: RankFilter
  onChange: (f: RankFilter) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by designation">
      {RANK_FILTERS.map((f) => {
        const n = list.filter((e) => matchesRank(e, f.id)).length
        if (!n && f.id !== "all") return null
        const on = value === f.id
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f.id)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-card-foreground hover:bg-accent"
            }`}
          >
            {f.label}
            <span className={`text-xs ${on ? "opacity-90" : "text-muted-foreground"}`}>{n}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * A department (posts first, then by rank) or the whole directory (A–Z with a letter bar).
 */
export function BrowseList({
  list,
  mode,
  rank,
  onRank,
  fav,
}: {
  list: DirectoryEntry[]
  mode: "department" | "az"
  rank: RankFilter
  onRank: (f: RankFilter) => void
  fav: FavProps
}) {
  const filtered = list.filter((e) => matchesRank(e, rank))
  const groups = mode === "az" ? groupAZ(filtered) : null
  return (
    <div className="space-y-5">
      <RankChips list={list} value={rank} onChange={onRank} />

      {filtered.length === 0 && <p className="text-muted-foreground">Nobody here matches this filter.</p>}

      {groups ? (
        <>
          <nav aria-label="Jump to letter" className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 bg-background/95 px-1 py-2">
            {groups.map(([letter]) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border bg-card px-1.5 text-sm font-semibold text-primary hover:bg-accent"
              >
                {letter}
              </a>
            ))}
          </nav>
          {groups.map(([letter, people]) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-16 space-y-2">
              <h3 className="text-sm font-bold text-primary">{letter}</h3>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {people.map((e) => (
                  <PersonRow key={e.id} entry={e} {...fav} />
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sortForBrowse(filtered).map((e) => (
            <PersonRow key={e.id} entry={e} {...fav} />
          ))}
        </ul>
      )}
    </div>
  )
}
