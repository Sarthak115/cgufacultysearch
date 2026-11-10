"use client"

import { useState } from "react"
import { Building2, Clock, Crown, Landmark, ListOrdered, Star, X } from "lucide-react"
import type { DirectoryEntry } from "@/lib/data/schema"
import type { DeptCount, Leadership } from "@/lib/directory"
import { PersonRow, type FavProps } from "./person-card"

function Section({ icon, title, children, action }: { icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const chip =
  "inline-flex min-h-10 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground " +
  "transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function Rows({ list, fav, limit }: { list: DirectoryEntry[]; fav: FavProps; limit?: number }) {
  const [all, setAll] = useState(false)
  const shown = limit && !all ? list.slice(0, limit) : list
  return (
    <>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {shown.map((e) => (
          <PersonRow key={e.id} entry={e} {...fav} />
        ))}
      </ul>
      {limit && list.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="text-sm font-semibold text-primary hover:underline">
          {all ? "Show less" : `Show all ${list.length}`}
        </button>
      )}
    </>
  )
}

interface HomeProps {
  fav: FavProps
  favourites: DirectoryEntry[]
  recents: string[]
  onSearch: (q: string) => void
  clearRecents: () => void
  departments: DeptCount[]
  onDept: (id: string) => void
  onAll: () => void
  leaders: Leadership
  officeList: DirectoryEntry[]
}

const EXAMPLES = ["hod cse", "dean pharmacy", "mahapatra", "dsw", "admission", "physics"]

export function Home({ fav, favourites, recents, onSearch, clearRecents, departments, onDept, onAll, leaders, officeList }: HomeProps) {
  return (
    <div className="space-y-10">
      {recents.length > 0 && (
        <Section
          icon={<Clock className="h-4 w-4" />}
          title="Recent searches"
          action={
            <button type="button" onClick={clearRecents} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {recents.map((q) => (
              <button key={q} type="button" onClick={() => onSearch(q)} className={chip}>
                {q}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section icon={<Star className="h-4 w-4" />} title="Your favourites">
        {favourites.length ? (
          <Rows list={favourites} fav={fav} />
        ) : (
          <p className="rounded-xl border border-dashed bg-card/50 p-4 text-sm text-muted-foreground">
            Tap the ☆ star on anyone to keep them here for quick access. Saved only on this device.
          </p>
        )}
      </Section>

      <Section
        icon={<Building2 className="h-4 w-4" />}
        title="Browse by department"
        action={
          <button type="button" onClick={onAll} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <ListOrdered className="h-4 w-4" /> Everyone A–Z
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {departments.map((d) => (
            <button key={d.id} type="button" onClick={() => onDept(d.id)} className={chip} title={d.name}>
              <span>{d.short === d.name ? d.name : d.short}</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{d.count}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={<Crown className="h-4 w-4" />} title="University leadership">
        <Rows list={[...leaders.top, ...leaders.deans]} fav={fav} limit={8} />
      </Section>

      <Section icon={<Crown className="h-4 w-4" />} title="Heads of department">
        <Rows list={leaders.hods} fav={fav} limit={6} />
      </Section>

      {officeList.length > 0 && (
        <Section icon={<Landmark className="h-4 w-4" />} title="Important offices">
          <Rows list={officeList} fav={fav} limit={6} />
        </Section>
      )}

      <Section icon={<ListOrdered className="h-4 w-4" />} title="Try searching">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <button key={q} type="button" onClick={() => onSearch(q)} className={chip}>
              {q}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Spelling doesn&apos;t have to be exact — “mahapatra” also finds Mohapatra. You can also search by post (HOD, Dean, VC,
          DSW), department (CSE, ECE, ME) or phone number.
        </p>
      </Section>
    </div>
  )
}
