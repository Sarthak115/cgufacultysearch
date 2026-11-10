"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, GraduationCap, Linkedin, Mail, MapPin, SearchX, UserPlus, X } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { FEEDBACK_FORM, OWNER } from "@/lib/config"
import type { DirectoryEntry } from "@/lib/data/schema"
import { departmentCounts, leadership, matchesRank, offices, type RankFilter } from "@/lib/directory"
import { buildIndex, search, suggest, type DeptInfo } from "@/lib/search"
import { normalize } from "@/lib/search/normalize"
import { useStoredList } from "@/lib/use-stored-list"
import { BrowseList, RankChips } from "./directory/browse-list"
import { Home } from "./directory/home"
import { PersonCard } from "./directory/person-card"
import { SearchBox, type Option } from "./directory/search-box"
import { ThemeToggle } from "./directory/theme-toggle"

const PAGE = 24
const YEAR = new Date().getFullYear()

/** What is on screen; mirrored in the URL (?q=…&dept=…) so it can be shared and Back works. */
interface View {
  q: string
  /** department id, "all" for the A–Z list, or null */
  dept: string | null
}

function readUrl(): View {
  const p = new URLSearchParams(window.location.search)
  return { q: p.get("q") ?? "", dept: p.get("dept") }
}

function writeUrl(v: View, push: boolean) {
  const p = new URLSearchParams()
  if (v.q) p.set("q", v.q)
  if (v.dept) p.set("dept", v.dept)
  const qs = p.toString()
  const url = qs ? `?${qs}` : window.location.pathname
  window.history[push ? "pushState" : "replaceState"](null, "", url)
}

export default function FacultySearch({
  facultyData,
  departmentList,
}: {
  facultyData: DirectoryEntry[]
  departmentList: DeptInfo[]
}) {
  const [q, setQ] = useState("")
  const [dept, setDept] = useState<string | null>(null)
  const [rank, setRank] = useState<RankFilter>("all")
  const [shown, setShown] = useState(PAGE)
  const [favIds, updateFav] = useStoredList("cgu.favourites", 100)
  const [recents, updateRecents] = useStoredList("cgu.recentSearches", 8)

  // ---- data that never changes while the page is open
  // The search index is only needed once someone searches: build it when the browser is idle
  // after loading (or immediately on the first keystroke), so it doesn't slow the first paint.
  const [indexWanted, setIndexWanted] = useState(false)
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIndexWanted(true), { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(() => setIndexWanted(true), 500) // Safari has no requestIdleCallback
    return () => clearTimeout(t)
  }, [])
  const needIndex = indexWanted || q.trim() !== ""
  const index = useMemo(
    () => (needIndex ? buildIndex(facultyData, departmentList) : null),
    [needIndex, facultyData, departmentList],
  )
  const depts = useMemo(() => departmentCounts(facultyData), [facultyData])
  const leaders = useMemo(() => leadership(facultyData), [facultyData])
  const officeList = useMemo(() => offices(facultyData), [facultyData])
  const byId = useMemo(() => new Map(facultyData.map((e) => [e.id, e])), [facultyData])
  const deptName = (id: string | null) =>
    id === "all" ? "Everyone A–Z" : (depts.find((d) => d.id === id)?.name ?? (id === "offices" ? "Administrative Offices" : id ?? ""))

  // ---- URL <-> state
  useEffect(() => {
    const apply = () => {
      const v = readUrl()
      setQ(v.q)
      setDept(v.dept)
      setRank("all")
      setShown(PAGE)
    }
    apply()
    window.addEventListener("popstate", apply)
    return () => window.removeEventListener("popstate", apply)
  }, [])

  const go = useCallback((v: View, push = true) => {
    setQ(v.q)
    setDept(v.dept)
    setRank("all")
    setShown(PAGE)
    writeUrl(v, push)
    window.scrollTo({ top: 0 })
  }, [])

  const onType = (value: string) => {
    // Typing starts a fresh search across everyone (leaves the department page).
    const nextDept = value.trim() ? null : dept
    setIndexWanted(true)
    setQ(value)
    setDept(nextDept)
    setRank("all")
    setShown(PAGE)
    writeUrl({ q: value, dept: nextDept }, false)
  }

  // ---- search
  const results = useMemo(() => (index && q.trim() ? search(q, index) : []), [q, index])
  const scoped = dept && dept !== "all" ? results.filter((e) => e.department?.id === dept) : results
  const filtered = scoped.filter((e) => matchesRank(e, rank))
  const suggestion = useMemo(
    () => (index && q.trim() && results.length === 0 ? suggest(q, index) : null),
    [q, results, index],
  )

  const options = useMemo<Option[]>(() => {
    const nq = normalize(q)
    if (!index || nq.length < 2) return []
    const deptIds = new Set<string>()
    for (const [phrase, ids] of index.deptPhrases) if (phrase.startsWith(nq)) ids.forEach((id) => deptIds.add(id))
    const deptOpts: Option[] = depts.filter((d) => deptIds.has(d.id)).slice(0, 2).map((d) => ({ kind: "dept", dept: d }))
    return [...deptOpts, ...results.slice(0, 6).map((entry): Option => ({ kind: "person", entry }))]
  }, [q, index, depts, results])

  // ---- recent searches & favourites (this device only)
  const addRecent = useCallback(
    (text: string) => {
      const t = text.trim()
      if (t.length < 2) return
      updateRecents((prev) => [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())])
    },
    [updateRecents],
  )
  useEffect(() => {
    if (!q.trim() || results.length === 0) return
    const t = setTimeout(() => addRecent(q), 2000) // remember searches the user paused on
    return () => clearTimeout(t)
  }, [q, results.length, addRecent])

  const fav = useMemo(
    () => ({
      isFav: (id: string) => favIds.includes(id),
      toggleFav: (id: string) => updateFav((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev])),
    }),
    [favIds, updateFav],
  )
  const favourites = favIds.map((id) => byId.get(id)).filter((e): e is DirectoryEntry => Boolean(e))

  const onPick = (o: Option) => {
    if (o.kind === "dept") return go({ q: "", dept: o.dept.id })
    addRecent(o.entry.name)
    go({ q: o.entry.name, dept: null })
  }

  const view = q.trim() ? "results" : dept ? "browse" : "home"
  const browseList =
    dept === "all" ? facultyData : facultyData.filter((e) => (e.department?.id ?? "") === dept)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <button type="button" onClick={() => go({ q: "", dept: null })} className="flex items-center gap-3 text-left">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-md">
              <GraduationCap className="h-7 w-7" />
            </span>
            <span>
              <span className="block bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl dark:from-purple-300 dark:to-violet-300">
                CGU Faculty Search
              </span>
              <span className="block text-sm text-muted-foreground">Faculty &amp; office contacts · C. V. Raman Global University</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <a
              href={FEEDBACK_FORM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2 text-white shadow-sm transition-colors hover:from-green-600 hover:to-emerald-700"
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-left leading-tight">
                <span className="block text-sm font-bold">Missing Faculty?</span>
                <span className="block text-xs opacity-90">Request Addition</span>
              </span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <SearchBox
          value={q}
          onChange={onType}
          options={options}
          onPick={onPick}
          onSubmit={() => addRecent(q)}
          resultCount={q.trim() ? filtered.length : null}
        />

        {view === "results" && (
          <section aria-label="Search results" className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground" aria-live="polite">
                {filtered.length} {filtered.length === 1 ? "result" : "results"} for “{q.trim()}”
              </p>
              {dept && (
                <button
                  type="button"
                  onClick={() => go({ q, dept: null }, false)}
                  className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm hover:bg-accent"
                  aria-label={`Remove filter: ${deptName(dept)}`}
                >
                  in {deptName(dept)} <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {scoped.length > 6 && <RankChips list={scoped} value={rank} onChange={(r) => { setRank(r); setShown(PAGE) }} />}

            {filtered.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
                <SearchX className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
                <h2 className="mt-3 text-lg font-semibold">No one found for “{q.trim()}”</h2>
                {suggestion && (
                  <p className="mt-3">
                    Did you mean{" "}
                    <button
                      type="button"
                      onClick={() => go({ q: suggestion, dept }, false)}
                      className="font-semibold text-primary underline underline-offset-4"
                    >
                      {suggestion}
                    </button>
                    ?
                  </p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  Try just the surname, or a short form like CSE, HOD or Dean.
                </p>
                <a
                  href={FEEDBACK_FORM.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Is someone missing? Tell us →
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {filtered.slice(0, shown).map((e) => (
                    <PersonCard key={e.id} entry={e} {...fav} />
                  ))}
                </div>
                {filtered.length > shown && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShown((s) => s + PAGE)}
                      className="rounded-xl border bg-card px-5 py-3 font-semibold text-primary hover:bg-accent"
                    >
                      Show more ({filtered.length - shown} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {view === "browse" && (
          <section aria-label={deptName(dept)} className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => window.history.length > 1 ? window.history.back() : go({ q: "", dept: null })}
                className="inline-flex h-10 items-center gap-1 rounded-xl border bg-card px-3 text-sm font-medium hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="text-xl font-bold">{deptName(dept)}</h2>
              <span className="text-sm text-muted-foreground">{browseList.length} people · tap a name for all contacts</span>
            </div>
            <BrowseList list={browseList} mode={dept === "all" ? "az" : "department"} rank={rank} onRank={setRank} fav={fav} />
          </section>
        )}

        {view === "home" && (
          <Home
            fav={fav}
            favourites={favourites}
            recents={recents}
            onSearch={(text) => go({ q: text, dept: null })}
            clearRecents={() => updateRecents(() => [])}
            departments={depts}
            onDept={(id) => go({ q: "", dept: id })}
            onAll={() => go({ q: "", dept: "all" })}
            leaders={leaders}
            officeList={officeList}
          />
        )}
      </main>

      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-center sm:px-6 lg:px-8">
          <p className="flex items-center justify-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-primary" aria-hidden /> CGU Faculty Search
          </p>
          <p className="text-sm">
            Made by <strong>{OWNER.name}</strong>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <a
              href={OWNER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Linkedin className="h-4 w-4" aria-hidden /> Find me on LinkedIn
            </a>
            <a
              href={`mailto:${OWNER.email}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden /> {OWNER.email}
            </a>
          </p>
          <p className="mx-auto max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Contacts are collected from public university documents (official timetables and cgu-odisha.ac.in) to help
            students reach faculty. This is an independent student project, not an official CGU website. Personal emails
            stay hidden until you tap “Show”.
          </p>
          <p className="text-xs">
            <a
              href={FEEDBACK_FORM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Request a correction or removal
            </a>
          </p>
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            © {YEAR} CGU Faculty Search · <MapPin className="h-3.5 w-3.5" aria-hidden /> Bhubaneswar, Odisha
          </p>
        </div>
      </footer>
    </div>
  )
}
