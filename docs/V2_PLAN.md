# CGU Faculty Search — v2.0 Plan

Live site (v1): https://cgufacultysearch.vercel.app/

Work through the phases **in order**. At the end of each phase: run the site, check the
"Done when" list, commit, then move on. Tick the boxes as you go.

## Ground rules (decided by the owner, Sarthak)

- **Department only.** A faculty member is tied to their department — never to a subject,
  semester, group, section or class. Timetables are used only as a source of name/department/contact.
- **One entry per person.** Appearing in many timetables is normal; repeats are merged silently.
- **Keep the visitor counter** (freevisitorcounters.com) exactly as it is — never remove or reset it.
- **Footer credit:** the site is owned by Sarthak — footer says "Made by Sarthak" (or similar).

---

## Phase 1 — Data collection & verification  *(in progress)*

Goal: one clean, verified list of every faculty/staff contact, built from official sources.

Sources:
1. **Timetables** — https://cgu-odisha.ac.in/academic/time-table/ (~200 PDFs, 2026-27 odd sem).
   Each lists *Course Responsibility (name) · Department · Contact No · E-mail*.
2. **Master email list** — `ALL.FACULTY` Google Group export (349 official addresses).
   Used to confirm that an email is real and current.
3. **Existing v1 data** — the 241 entries in `app/page.tsx`.
4. **Official website & other public data** — cgu-odisha.ac.in department/faculty pages, leadership
   & administration pages, contact-us page, public PDFs (NIRF / IQAC / self-disclosure reports).
   Used mainly for **designations** (Professor / Associate / Assistant, HOD, Dean) and to confirm
   department and spelling of names.

Steps:
- [x] Download all timetable PDFs (191 OK, 10 links are dead on the university site)
- [x] Extract name / department / phone / email from the 123 text-based PDFs (table parser)
- [x] OCR the 68 scanned (image-only) PDFs with Tesseract (56 unique after dropping old versions)
- [x] Use the w.e.f. date to detect stale uploads (some 2026 files are really 2025-26 tables)
- [x] Scrape the official website: department pages (designations), academic leadership (Deans/HODs,
      role mailboxes), administrative offices (phones) → `data/offices.json`
- [ ] Public PDFs (NIRF / IQAC / self-disclosure) — only if gaps remain after review
- [x] Merge timetable records + v1 data; match people across sources by email, phone, and fuzzy name
- [x] Cross-check every email against the master list (flag: not in list / bouncing)
- [x] Produce `data/faculty.json` (370 people) + `data/offices.json` (22) + `data/review-report.md`
- [ ] Owner reviews the report and resolves conflicts (duplicate HODs, shared phones, possible duplicates)

Done when: `data/faculty.json` exists, every entry has an id + source, and the review report
has no unresolved "conflict" items.

## Phase 2 — Data model & cleanup  *(done)*

- [x] Move data out of `app/page.tsx` into `data/faculty.json` (+ `departments.json`, `offices.json`).
      `app/page.tsx` is now a server component; the UI lives in `components/faculty-search.tsx`
- [x] Schema (zod) in `lib/data/schema.ts`: `id, name, title, designation, roles[], roleEmails[],
      department, phones[], officialEmail, personalEmail, isOffice` + internal review fields
      (`sources, flags, inMasterList, lastVerified, aliases`) that never reach the browser
- [x] Normalize: Title Case names, titles separate, one id per department, designation = rank only,
      posts (Dean/HOD/VC) in `roles`, phones as 10 digits
- [x] `npm run validate:data`: errors on schema / duplicate ids / duplicate official emails /
      unknown departments / no contact; warns on missing department and shared phones
- [x] Offices (Admission, Academic, Finance, DSW …) kept as office entries; website offices that
      duplicate an existing office entry are skipped
- [x] OCR safety: people seen only in scanned timetables are published only when cross-checked;
      mismatched OCR rows are split off (report §4a, §9a)

Done when: page reads from JSON ✓, validation passes ✓, no duplicate ids/emails ✓.
Still open for the owner: 14 people without a department, shared-phone warnings (review report).

## Phase 3 — Search engine v2 (spelling-tolerant)  *(done)*

- [x] `lib/search/normalize.ts` — lowercase, strip punctuation and titles; edit distance
- [x] `lib/search/phonetic.ts` — Odia/Indian "sounds-like" key (same rules as the merge script):
      Mohapatra = Mahapatra = Mohapatro, Bisoi = Bisoyi, Satpathy = Satapathy, Sahu = Sahoo
- [x] Typo matching — own small edit-distance instead of Fuse.js (no new dependency, tuned for names)
- [x] `lib/search/aliases.ts` — HOD, Dean, VC, Pro VC, Registrar, CoE, DSW; department short forms
      (CSE, ECE, EE, ME, HSS, TPO …) come from `data/departments.json`
- [x] Ranking: exact > post > prefix > sounds-like > department > typo; then seniority, then name.
      Every typed word must match (so "hod cse" = only CSE heads)
- [x] Also searches other recorded spellings of a name, emails, and phone numbers (+91 / spaces ok)
- [x] "Did you mean …?" when there are no results (also splits words typed together)
- [x] `npm test` — 32 tests on the real data (Node's built-in test runner, no new dependency)

Done when: all test cases pass ✓ and search feels instant on a phone ✓ (362 entries, in-memory).

## Phase 4 — Contact actions  *(done)*

- [x] WhatsApp button for mobile numbers only (`wa.me/91…` + "Hello Dr. X, I am a student of
      C. V. Raman Global University."); landlines (0674 …) get no WhatsApp button
- [x] Copy number / copy email with a toast (clipboard API + fallback for older browsers)
- [x] Save contact → `.vcf` vCard (name, title, university + department, post, phones, emails)
- [x] Share → phone's share sheet (Web Share API); on desktop copies the contact text instead
- [x] Real `tel:` / `mailto:` links (no more `window.open`), numbers shown as `+91 94372 76618`,
      "Gmail" button opens Gmail compose
- [x] "Report" → the existing Google Form, pre-filled with "Correction: <name> (<dept>)".
      Form link + field ids live in `lib/config.ts` (swap in a dedicated corrections form later)
- [x] Mobile fixes: no card zoom on tap (zoom only on desktop), card no longer slides sideways when
      a button is tapped, phone numbers never truncated
- [x] `lib/contact.ts` is pure + unit-tested (`npm test`: 41 tests)

## Phase 5 — Browse & UX  *(done)*

- [x] Home without typing: recent searches, favourites, department chips (with counts),
      University leadership (VC, Pro-VC, CoE, Deans), Heads of department, Important offices,
      example searches + short "spelling doesn't need to be exact" tip
- [x] Department page (`?dept=cse`: post holders first, then by rank), Everyone A–Z (`?dept=all`,
      letter jump bar), designation filter chips with counts (also on search results)
- [x] Autocomplete dropdown (departments + people; ↑ ↓ Enter, Esc), `/` focuses search
- [x] Favourites ⭐ and recent searches — saved in this browser only (localStorage, fails safely)
- [x] Dark mode (follows the phone setting, toggle in the header) — purple theme tokens
- [x] Lighter design: no animated blur blobs / pulsing dots / frosted glass; compact expandable
      rows for long lists; search results paged 24 at a time; empty state with "Did you mean"
      and a "someone missing?" link. (No skeletons needed — the page is prerendered, nothing loads.)
- [x] Footer: "Made with ♥ by Sarthak" + automatic year; "expertise areas" promise removed
- [x] Shareable URLs (`?q=…`, `?dept=…`) and the phone's Back button work
- [x] Fixed: visitor-counter script caused a React hydration error (counter itself unchanged);
      rows overflowing on phones
- [x] `lib/directory.ts` browse helpers unit-tested (`npm test`: 51 tests)

## Phase 6 — Privacy & trust  *(done)*

- [x] Official contacts first (phone → official email → office mailbox); personal Gmail etc. hidden
      behind a "Show" tap and left out of the Share text (Save-to-contacts still includes it).
      Phone numbers stay visible: they come from the university's own published timetables and are
      the main reason students use the site
- [x] "Report" on each card → form pre-filled "Correction / removal: <name> (<dept>)";
      "Request a correction or removal" link in the footer
- [x] Source note on every card (no subject / semester / class): "Checked against official
      timetables · Nov 2026" (231), "Listed on the official CGU website" (52), "From the earlier
      version of this site — not re-confirmed yet" (79, shown in amber)
- [x] Footer disclaimer: collected from public university documents; independent student project,
      not an official CGU website
- Note: the site is a static page, so all public fields are in the page source anyway — "Show" is
  about not displaying personal emails to casual viewers, not about hiding them from scrapers

## Phase 7 — Code quality, performance, SEO  *(done)*

- [x] UI split into components (done in Phases 2–5: `components/directory/*`, `contact-actions.tsx`)
- [x] Removed 46 unused shadcn components, `hooks/`, duplicate `styles/globals.css`, placeholder
      images, and 34 unused packages (45 → 11 dependencies). Package renamed `cgu-faculty-search` 2.0.0.
      Google Search Console file kept. Autoprefixer switched on for older phone browsers
- [x] TypeScript + ESLint checks back on in `next.config.mjs` (`eslint.config.mjs` with
      next/core-web-vitals + next/typescript) — build passes with 0 warnings
- [x] Invalid HTML, index keys, `dsw` bug — fixed in Phases 2–3
- [x] Visitor counter kept exactly as is (lint exception commented, React-only hydration flag)
      — Vercel Analytics not added (optional; needs the Vercel dashboard)
- [x] Metadata: title/description/keywords, canonical, Open Graph + Twitter card with a generated
      share image (`app/opengraph-image.tsx`), favicon `app/icon.svg`, Apple icon, `robots.txt`,
      `sitemap.xml`, theme colour; removed "generator: v0.dev"
- [x] PWA: `app/manifest.ts` (installable, icons from `scripts/make-icons.py`) + `public/sw.js`
      offline cache — verified: with the server stopped, the site loads, is styled and searches

## Phase 8 — QA & launch  *(done — v2 live on 2026-11-10 via PR #2)*

- [x] Release checks: data valid, 54 tests, 0 lint warnings, type-checked build
- [x] Lighthouse mobile: Performance 85–89 (92 with the visitor counter blocked), Accessibility 91,
      Best Practices 82, SEO 92, layout shift 0. All remaining deductions come from the
      visitor counter (image without alt, unnamed links, an http tracker it loads) — kept as is.
      Search index now built when the browser is idle (less work on first load)
- [x] Fixed: Next 15.2 crashed on *cached* rebuilds with icons in `app/` → icons moved to `public/`
- [x] Tested in Chrome's mobile emulation (Android) — **real iPhone Safari + Android phone still to do**
- [x] README with setup, data refresh and changelog
- [x] Committed on branch `v2`, pushed; Vercel preview build passed
- [x] Merged to `main` (PR #2) → production deploy passed; live site checked (search, counter,
      offline worker, robots/sitemap/manifest/share image, Google verification file all OK)
- [ ] Tag `v2.0.0`
- [ ] Owner: go through `data/review-report.md` (duplicate HODs, shared phones, 79 unconfirmed v1 entries)

## Ongoing — data refresh each semester

`scripts/` keeps the timetable scraper so the list can be re-built when new timetables are
posted: download → extract → merge → validate → review report.
