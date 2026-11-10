# CGU Faculty Search

Find the phone number, email and department of any faculty member, Dean, HOD or office at
**C. V. Raman Global University (CGU), Bhubaneswar** — and call, WhatsApp or email them in one tap.

**Live:** https://cgufacultysearch.vercel.app · Made by **Sarthak Kumar** · [LinkedIn](https://www.linkedin.com/in/sarthak-kumar-309033263/) · cgufacultysearch@gmail.com

> Independent student project, not an official CGU website. Contacts are collected from public
> university documents (official timetables and cgu-odisha.ac.in).

## What it does

- **Search that forgives spelling** — `mahapatra` finds Mohapatra, `bisoi` finds Bisoyi, typos are fine,
  and you can search by post (`hod cse`, `dean pharmacy`, `vc`, `dsw`), department (`cse`, `me`) or phone number.
- **One-tap contact** — call, WhatsApp (with a polite opening message), email / Gmail, copy,
  save to phone contacts (.vcf), share.
- **Browse** — departments (Deans and HODs first), everyone A–Z, university leadership, offices.
- **Favourites ⭐ and recent searches** — kept on your own device only.
- **Works offline** and can be installed ("Add to Home screen"); dark mode.
- **Trust** — each card says where its contact came from; personal emails are hidden until you tap
  "Show"; every card has *Report* (correction / removal).

## Development

Needs Node 20+ (Node 24 for the test/validate scripts) and pnpm 9.

```bash
pnpm install
pnpm dev               # http://localhost:3000
pnpm test              # search, contact and browse tests (Node's built-in test runner)
pnpm validate:data     # checks data/*.json
pnpm lint
pnpm build             # type-check + lint + static build
```

## Data

| File | What |
|---|---|
| `data/faculty.json` | everyone in the directory (built by the merge script — don't hand-edit names here, fix the sources) |
| `data/offices.json` | office phone numbers and role mailboxes |
| `data/departments.json` | one id per department + every spelling the sources use (`CSE` = `Computer Science` …) |

The data is rebuilt each semester from the official timetables, the CGU website and the official
`ALL.FACULTY` email list — see [`scripts/timetables/README.md`](scripts/timetables/README.md).
The merge also writes `data/review-report.md` (kept out of git: it contains unpublished entries and the
master email list) listing everything that needs a human look.

Rules for the data: faculty are listed **by department only** — no subjects, semesters or groups.

## Project layout

```
app/                  page, layout (metadata, visitor counter), manifest, robots, sitemap, share image
components/           faculty-search.tsx (the page), contact-actions.tsx, directory/* (search box, cards, home…)
lib/search/           spelling-tolerant search (sounds-like key, typo matching, short forms) + tests
lib/contact.ts        call / WhatsApp / Gmail links, vCard, share text + tests
lib/directory.ts      leadership, department lists, A–Z, filters + tests
lib/data/             data schema (zod) and loader
public/sw.js          offline support
scripts/              timetable scraper + OCR, website scraper, merge, data validator, icon maker
docs/V2_PLAN.md       the v2 plan, phase by phase
```

Keep the **freevisitorcounters.com** counter in `app/layout.tsx` exactly as it is.

## Changelog

### 2.0.0 — 2026-11

- **Data:** 362 people + 22 offices (was 241), rebuilt from 2026-27 timetables (including scanned
  ones, via OCR), the official website and the official email list; duplicates merged, one name per
  department, designations and posts (Dean / HOD / VC …) from the official site, wrong merges and
  unverified OCR entries held back for review.
- **Search:** spelling-tolerant (Odia/Indian name variants), typo matching, post and department short
  forms, phone/email search, ranking by seniority, "Did you mean …?", autocomplete.
- **Contact:** WhatsApp, copy, save contact, share, Gmail, report; numbers shown as `+91 94372 76618`.
- **Browse:** home page with leadership, departments, offices, favourites and recent searches;
  department pages; A–Z list; designation filters; shareable links.
- **Privacy & trust:** personal emails behind "Show", source note on every card, correction/removal links,
  disclaimer.
- **Quality:** lighter design for low-end phones, dark mode, offline + installable, share preview,
  SEO files, 34 unused packages removed, type and lint checks back on, 54 tests.

### 1.0

- First version: searchable list of 241 faculty contacts.
