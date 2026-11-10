"""Merge timetable records + existing directory data + official master email list.

Usage:
  python scripts/timetables/merge.py --records <cache>/records.json --base <existing.json>
         --master <ALL.FACULTY.csv> --departments data/departments.json
         --scanned <cache>/scanned.json --out data/faculty.json --report data/review-report.md

Matching rules (strongest first):
  1. same email                         -> same person
  2. same phone AND compatible names    -> same person   (different names -> "shared phone" conflict)
  3. identical full name (all words)    -> same person   unless their official emails differ
An official email is only attached to a name if the address resembles the name
(e.g. hiranmayee.mohapatra@ <-> "Dr. H. Mohapatra"); otherwise it is reported, not used.
"""
import argparse
import csv
import difflib
import json
import re
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

OFFICIAL_DOMAIN = "cgu-odisha.ac.in"
ROLE_EMAIL = re.compile(
    r"^(hod_|dean|coe$|acoe$|dsw|vc$|registrar|admission|examcell|iqac|hrdept|provicechancellor|pa\.|centrehead|"
    r"research$|ipr\.|ecell|placement|tpo|principal|director|office|info|accounts|coo\.|"
    r"(?:hss|civil|cse|ece|ee|me|mech|physics|chemistry|math|mba|pharmacy|agri|csit|aids)$)")
TITLE_RE = re.compile(r"^(?:prof\.?\s*\(\s*dr\.?\s*\)|prof\.?\s*dr\.?|(?:dr|prof|mrs|mr|ms|miss|chef|er|capt|col|lt)\b\.?)\s*", re.I)
SUFFIX_RE = re.compile(r"(?:\s+(?:sir|madam|maam|ma'am|dsw|hod|dean|coordinator|co-ordinator))+$", re.I)


# ---------------------------------------------------------------- names
def skeleton(word):
    """Spelling-insensitive key for Odia/Indian names: Mohapatra = Mahapatra, Bisoi = Bisoyi."""
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return ""
    for a, b in (("ph", "f"), ("th", "t"), ("dh", "d"), ("bh", "b"), ("kh", "k"), ("gh", "g"), ("chh", "c"),
                 ("ch", "c"), ("jh", "j"), ("sh", "s"), ("w", "b"), ("v", "b"), ("z", "j"), ("q", "k"),
                 ("x", "ks"), ("ck", "k"), ("y", "i")):
        w = w.replace(a, b)
    first, rest = w[0], re.sub(r"[aeiou]", "", w[1:])
    out = first + rest
    return re.sub(r"(.)\1+", r"\1", out)


def split_title(name):
    name = re.sub(r"\s*\([^)]{0,14}\)", " ", name)   # lab-group leftovers: (A&B- T), (SG)
    name = re.sub(r"\s*\([^)]*$", "", name)            # unclosed "(A"
    name = re.sub(r"(?i)\b(capt|dr|prof|mr|ms|mrs)\.(?=[A-Z])", r"\1. ", name)  # "Capt.C.R Biswal"
    name = SUFFIX_RE.sub("", re.sub(r"\s+", " ", name.strip()))
    titles = []
    m = TITLE_RE.match(name)
    while m:
        titles.append(m.group(0).strip())
        name = name[m.end():]
        m = TITLE_RE.match(name)
    return name.strip(" .,-"), " ".join(titles)


def tokens(name):
    """[(word, is_initial)] — 'K.P. Bauri' -> [(k,T),(p,T),(bauri,F)], 'AK Pusity' -> [(a,T),(k,T),(pusity,F)]."""
    out = []
    for raw in re.sub(r"\.", ". ", name).split():
        bare = raw.strip(".,")
        if not bare:
            continue
        if len(bare) == 1 or (raw.endswith(".") and len(bare) <= 2) or bare.lower() in ("ch", "ku", "kr", "md"):
            out += [(c.lower(), True) for c in bare]
        elif len(bare) <= 3 and bare.isupper() and not re.search(r"[AEIOU]", bare[1:]):
            out += [(c.lower(), True) for c in bare]  # "AK", "TK", "PK"
        else:
            out.append((bare.lower(), False))
    return out


def full_words(name):
    return [w for w, ini in tokens(name) if not ini]


def same_word(a, b, loose=False):
    if skeleton(a) == skeleton(b):
        return True
    if len(a) >= 3 and len(b) >= 3 and (a.startswith(b) or b.startswith(a)):  # truncated "Shar" ~ "Sharma"
        return True
    return loose and difflib.SequenceMatcher(None, a, b).ratio() >= 0.75  # typo "Pusity" ~ "Prusty"


def compatible(a, b, loose=False):
    """Could names a and b be the same person?  'H. Mohapatra' ~ 'Hiranmayee Mohapatra'.

    loose=True is used when there is other evidence (same phone): allows small typos in the surname.
    """
    ta, tb = tokens(a), tokens(b)
    fa, fb = [w for w, i in ta if not i], [w for w, i in tb if not i]
    if fa and fb:
        short, long_ = (fa, fb) if len(fa) <= len(fb) else (fb, fa)
        if len(short) >= 2 and all(same_word(x, y) for x, y in zip(short, long_)):
            return True  # truncated name: "Kamal Lochan" ~ "Kamal Lochan Mohanta"
    if not fa or not fb or not same_word(fa[-1], fb[-1], loose):
        # allow reversed order "Mohanty Sujata" vs "Sujata Mohanty"
        if not (fa and fb and {skeleton(x) for x in fa} == {skeleton(x) for x in fb}):
            return False
        return True
    ga, gb = ta[:-1], tb[:-1]
    if not ga or not gb:
        return True
    ia, ib = [w[0] for w, _ in ga], [w[0] for w, _ in gb]
    short, long_ = (ia, ib) if len(ia) <= len(ib) else (ib, ia)
    it = iter(long_)
    if not all(c in it for c in short):  # initials must be a subsequence
        return False
    for wa, ina in ga:
        for wb, inb in gb:
            if not ina and not inb and wa[0] == wb[0] and not same_word(wa, wb, loose):
                return False
    return True


def name_quality(n):
    fw = full_words(n)
    return (min(len(fw), 4) - (5 if len(fw) > 5 else 0), len(n))


def pretty(name):
    out = []
    for raw in name.split():
        bare = raw.strip(",")
        if re.fullmatch(r"(?:[A-Za-z]\.)+[A-Za-z]?\.?", bare) or len(bare.strip(".")) <= 1:
            out.append(bare.upper())
        elif len(bare) <= 3 and bare.isupper() and not re.search(r"[AEIOU]", bare[1:]):
            out.append(bare)
        else:
            out.append("-".join(p[:1].upper() + p[1:].lower() for p in bare.split("-")))
    return " ".join(out)


def norm_title(t):
    t = t.lower().replace(" ", "")
    if "prof" in t and "dr" in t:
        return "Prof. (Dr.)"
    for k, v in (("prof", "Prof."), ("dr", "Dr."), ("mrs", "Mrs."), ("mr", "Mr."), ("ms", "Ms."), ("miss", "Ms."), ("chef", "Chef")):
        if t.startswith(k):
            return v
    return ""


# ---------------------------------------------------------------- designation / roles
def norm_rank(d):
    """Academic rank only: 'Asst. Professor (Agronomy)' -> 'Assistant Professor'."""
    s = (d or "").lower()
    if "practice" in s or "pratice" in s:
        return "Professor of Practice"
    if "teaching assistant" in s:
        return "Teaching Assistant"
    if re.search(r"assoc", s):
        return "Associate Professor"
    if re.search(r"\b(asst|assistant|ast)\b", s) and "prof" in s:
        return "Assistant Professor"
    if "prof" in s:
        return "Professor"
    for k, v in (("librarian", "Librarian"), ("lecturer", "Lecturer"), ("instructor", "Instructor"),
                 ("trainee", "Management Trainee"), ("web admin", "Web Administrator")):
        if k in s:
            return "Assistant Librarian" if k == "librarian" and "asst" in s else v
    return ""


ROLE_EMAIL_LABEL = {
    "vc": "Vice Chancellor", "provicechancellor": "Pro Vice Chancellor", "registrar": "Registrar",
    "coe": "Controller of Examinations", "dsw": "Dean, Student Welfare", "deana": "Dean, Academics",
    "deanagriculture": "Dean, Agriculture", "deanpharmacy": "Dean, Pharmacy", "deanresearch": "Dean, Research",
    "deanengineering": "Dean, Engineering & Technology", "deaninternational": "Dean, International Relations",
    "deanfth": "Dean, Tourism & Hospitality", "hod_cse": "HOD, CSE", "hod_etc": "HOD, ECE",
    "hod_chemical": "HOD, Chemical", "hod_hss": "HOD, HSS", "hod_management": "HOD, Management",
    "hod_phy": "HOD, Physics",
}


def roles_in(d):
    """Positions held, from a designation string: 'Dean, Pharmacy', 'HoD, CSE', 'Vice Chancellor' ..."""
    s = re.sub(r"\S+@\S+", " ", d or "")  # "deanagriculture@..." is an email, not a role
    s = re.sub(r"\s+", " ", s).strip()
    low = s.lower()
    out = []
    if re.search(r"pro[\s-]*vice[\s-]*chancellor", low):
        out.append("Pro Vice Chancellor")
    elif "vice chancellor" in low or "vice-chancellor" in low:
        out.append("Vice Chancellor")
    if "registrar" in low:
        out.append("Registrar")
    if "controller of exam" in low:
        out.append("Controller of Examinations")
    m = re.search(r"\bdean\b[\s,:-]*(?:of\s+|faculty of\s+)?([A-Za-z&.' ]{2,50})?", s, re.I)
    if m:
        what = re.sub(r"(?i)^faculty of\s+|\)|\(", "", (m.group(1) or "").strip(" ,.")).strip()
        what = {"fth": "Tourism & Hospitality", "marine engg": "Marine Engineering", "marine": "Marine Engineering",
                "international": "International Relations", "academic": "Academics",
                "engineering": "Engineering & Technology"}.get(what.lower(), what)
        out.append(f"Dean, {what}" if what else "Dean")
    m = re.search(r"\b(?:hod|head of (?:the )?department)\b[\s,:-]*([A-Za-z&. ]{2,30})?", s, re.I)
    if m:
        what = re.sub(r"(?i)\b(hod|and|&|assistant|associate|asst\.?|professor|prof\.?|dept\.?)\b", " ", m.group(1) or "")
        what = re.sub(r"\s+", " ", re.sub(r"[^A-Za-z ]", " ", what)).strip()
        out.append(f"HOD, {what}" if what else "HOD")
    if "director" in low:
        out.append(re.sub(r"(?i).*?(director[\w ,&]*)", r"\1", s).strip().title())
    return out


def _role_key(r):
    words = re.sub(r"[^a-z ]", " ", r.lower()).split()
    stop = {"of", "and", "the", "faculty", "engg", "engineering", "science", "sciences", "affairs", "relations", "dept"}
    return (words[0] if words else "", frozenset(w[:6] for w in words[1:] if w not in stop))


def _same_role(a, b):
    ka, kb = _role_key(a), _role_key(b)
    return ka[0] == kb[0] and (ka[1] <= kb[1] or kb[1] <= ka[1])


# ---------------------------------------------------------------- emails / phones
def is_official(e):
    return e.endswith("@" + OFFICIAL_DOMAIN)


def is_role(e):
    return is_official(e) and bool(ROLE_EMAIL.match(e.split("@")[0]))


def is_junk_email(e):
    """Roll-number style addresses (2401070047@...) are student/guest IDs, not faculty contacts."""
    local = e.split("@")[0]
    return sum(c.isdigit() for c in local) >= max(5, len(local) // 2)


def _part_matches(part, w):
    if len(part) < 2 or len(w) < 2:
        return False
    return (part == w or skeleton(part) == skeleton(w) or (len(w) >= 4 and w in part)
            or (len(part) >= 4 and part.startswith(w[:4])) or (len(part) >= 3 and w.startswith(part)))


def affinity(name, email):
    """0..1: how much does the email address look like this person's name?

    hiranmayee.mohapatra ~ 'H. Mohapatra' (0.9), satyahort ~ 'Satyaprakash Barik' (0.5),
    priyanka.nayak !~ 'Priyanka Saha' (0: the 'nayak' part contradicts the name).
    """
    raw_local = email.split("@")[0].lower()
    parts = [p for p in re.split(r"[._\-]+", re.sub(r"\d+", "", raw_local)) if p]
    local = "".join(parts)
    if not local:
        return 0.0
    tk = tokens(name)
    fulls = [w for w, i in tk if not i]
    initials = "".join(w[0] for w, _ in tk)
    surname = fulls[-1] if fulls else ""
    if len(parts) >= 2:
        name_initials = {w for w, i in tk if i}  # "H. Mohapatra": part "hiranmayee" fits initial "h"
        unmatched = [p for p in parts if len(p) >= 3 and not any(_part_matches(p, w) for w in fulls)
                     and p[0] not in name_initials]
        if unmatched:
            return 0.0
        if surname and any(_part_matches(p, surname) for p in parts):
            return 0.9
        if any(_part_matches(p, w) for p in parts for w in fulls):
            return 0.6
        return 0.5 if all(len(p) <= 2 and set(p) <= set(initials) for p in parts) else 0.0
    sk_local = skeleton(local)
    if surname and len(surname) >= 3 and (surname in local or (len(skeleton(surname)) >= 3 and skeleton(surname) in sk_local)):
        return 1.0 if any(w in local for w in fulls[:-1]) else 0.8
    if fulls and len(fulls[0]) >= 4 and local.startswith(fulls[0][:4]):
        return 0.5  # first-name based: madhuece ~ Madhusudan, satyahort ~ Satyaprakash
    if len(local) <= 4 and all(c in iter(initials) for c in local):
        return 0.5  # kb13 ~ K.P. Bauri
    return 0.0


def clean_phone(p):
    d = re.sub(r"\D", "", p or "")
    if len(d) == 12 and d.startswith("91"):
        d = d[2:]
    if len(d) == 10 and d.startswith("67466"):
        return "0" + d  # CGU landline 0674-66xxxxx written without the 0 — not a mobile
    if len(d) == 11 and d.startswith("0674"):
        return d
    return d if re.fullmatch(r"[6-9]\d{9}", d) else ""


# ---------------------------------------------------------------- departments
class Depts:
    def __init__(self, path):
        self.items = json.loads(Path(path).read_text(encoding="utf-8"))
        self.alias = {}
        for d in self.items:
            for a in [d["id"], d["name"].lower(), d["short"].lower()] + d["aliases"]:
                self.alias[a.lower()] = d["id"]

    def resolve(self, raw):
        s = re.sub(r"\s+", " ", (raw or "").strip().lower())
        if not s:
            return ""
        if s in self.alias:
            return self.alias[s]
        # stray characters from neighbouring cells: "k HSS", "baƩa CSE", "CSE 7", "S Chemistry"
        for cand in (re.sub(r"^\S{1,4}\s+", "", s), re.sub(r"\s+\S{1,2}$", "", s), s.replace(" ", "")):
            if cand in self.alias:
                return self.alias[cand]
        close = difflib.get_close_matches(s, list(self.alias), n=1, cutoff=0.85)
        return self.alias[close[0]] if close else ""

    def is_office(self, did):
        return any(d["id"] == did and d.get("office") for d in self.items)


# ---------------------------------------------------------------- union-find
class Clusters:
    def __init__(self, obs):
        self.obs = obs
        self.parent = list(range(len(obs)))

    def find(self, i):
        while self.parent[i] != i:
            self.parent[i] = self.parent[self.parent[i]]
            i = self.parent[i]
        return i

    def members(self, root):
        return [i for i in range(len(self.obs)) if self.find(i) == root]

    def emails_of(self, root, cache):
        return cache[root]


def build(args):
    depts = Depts(args.departments)
    report = defaultdict(list)

    # ---- master list
    master = {}
    with open(args.master, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    hdr_i = next(i for i, r in enumerate(rows) if r and r[0].lower().startswith("email"))
    for r in rows[hdr_i + 1:]:
        if r and "@" in r[0]:
            master[r[0].strip().lower()] = {"bouncing": (r[3].strip().lower() == "bouncing"), "role": r[2].strip()}
    master_list = list(master)

    # ---- observations
    obs = []

    def add_obs(name, title, dept_raw, phones, emails, source, file="", subject="", designation="", year="", ocr=False):
        name, t2 = split_title(name)
        title = norm_title(title or t2)
        if len(re.sub(r"[^A-Za-z]", "", name)) < 3 or re.search(r"allocated|project guide|^nf$|^na$|faculty$", name, re.I):
            return
        phones = [p for p in (clean_phone(x) for x in phones) if p]
        emails = [re.sub(r"^[._%+\-]+", "", e.strip().lower()) for e in emails if e and "@" in e]
        if ocr:  # OCR noise around a real address: "peeasavneeesweta.saha@" -> "sweta.saha@"
            fixed = []
            for e in emails:
                if is_official(e) and e not in master:
                    local = e.split("@")[0]
                    hit = [m for m in master if len(m.split("@")[0]) >= 6 and local.endswith(m.split("@")[0])]
                    e = hit[0] if len(hit) == 1 else e
                fixed.append(e)
            emails = fixed
        report["junk_emails"] += [e for e in emails if is_junk_email(e)]
        emails = [e for e in emails if not is_junk_email(e)]
        trusted, role_emails = [], []
        for e in emails:
            if is_role(e):
                if source in ("website", "v1"):  # official site shows it next to this person
                    role_emails.append(e)
                else:
                    report["role_email_on_person"].append((name, e, file or source))
                continue
            if is_official(e) and affinity(name, e) < 0.4 and source != "v1":
                report["email_name_mismatch"].append((name, e, file))
                continue
            if is_official(e) and affinity(name, e) < 0.4 and source == "v1":
                report["v1_email_name_mismatch"].append((name, e))
            trusted.append(e)
        obs.append({"name": name, "title": title, "dept_raw": dept_raw, "dept": depts.resolve(dept_raw),
                    "phones": phones, "emails": trusted, "source": source, "file": file,
                    "subject": subject, "designation": designation, "year": year, "ocr": ocr,
                    "role_emails": role_emails})

    base = json.loads(Path(args.base).read_text(encoding="utf-8"))
    for b in base:
        add_obs(b["name"], "", b.get("department", ""), b.get("phone") or b.get("phones") or [],
                [b.get("officialEmail", ""), b.get("personalEmail", "")], "v1",
                designation=b.get("designation", ""))
    n_base_obs = len(obs)

    website_offices = []
    if args.website:
        for w in json.loads(Path(args.website).read_text(encoding="utf-8")):
            if "office" in w:
                website_offices.append(w)
                continue
            add_obs(w["name"], "", w.get("department", ""), w.get("phones", []), w.get("emails", []),
                    "website", w.get("page", ""), designation=w.get("designation", ""))

    records = [r for path in args.records for r in json.loads(Path(path).read_text(encoding="utf-8"))]
    years = Counter(r.get("year") for r in records if r.get("year"))
    current_year = max(years) if years else ""
    for r in records:
        if "name" not in r:
            continue
        emails = list(r["emails"])
        if not r["paired"] and r.get("raw"):
            # multi-teacher row with unequal counts: give each email to the name it resembles
            raw_emails = re.findall(r"[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:in|com)",
                                    re.sub(r"\s+", "", (r["raw"].get("email") or "").lower()))
            emails = [e for e in raw_emails if affinity(r["name"], e) >= 0.6]
        add_obs(r["name"], r.get("title", ""), r.get("department", ""),
                r["phones"] if r["paired"] else [], emails, "timetable", r["file"], r.get("subject", ""),
                year=r.get("year") or current_year, ocr=bool(r.get("ocr")))

    # ---- clustering
    C = Clusters(obs)
    c_emails = {i: {e for e in o["emails"] if is_official(e)} for i, o in enumerate(obs)}
    c_names = {i: [o["name"]] for i, o in enumerate(obs)}

    def union(a, b, need_names=False, why=""):
        ra, rb = C.find(a), C.find(b)
        if ra == rb:
            return True
        ea, eb = c_emails[ra], c_emails[rb]
        if ea and eb and not (ea & eb):
            # Same phone + same name but differently spelled emails (mosarof.sarkar@ vs mosarofsarkar@)
            # is one person with a typo somewhere — unless BOTH addresses are real (in the master list).
            same_person = need_names and any(compatible(x, y) for x in c_names[ra] for y in c_names[rb])
            if not (same_person and not (ea & master.keys() and eb & master.keys())):
                report["email_blocked_merge"].append((c_names[ra][0], sorted(ea), c_names[rb][0], sorted(eb)))
                return False
        if need_names and not any(compatible(x, y, loose=True) for x in c_names[ra] for y in c_names[rb]):
            return False
        C.parent[rb] = ra
        c_emails[ra] |= c_emails.pop(rb)
        c_names[ra] += c_names.pop(rb)
        return True

    by_email, by_phone, by_name = defaultdict(list), defaultdict(list), defaultdict(list)
    for i, o in enumerate(obs):
        for e in o["emails"]:
            by_email[e].append(i)
        for p in o["phones"]:
            by_phone[p].append(i)
        fw = full_words(o["name"])
        if len(fw) >= 2 and len(fw) == len(tokens(o["name"])):
            by_name[" ".join(skeleton(w) for w in fw)].append(i)

    for e, idx in by_email.items():
        for j in idx[1:]:
            if not union(idx[0], j) and is_official(e):
                pass
    for p, idx in by_phone.items():
        for n, j in enumerate(idx[1:], 1):
            if not any(union(idx[k], j, need_names=True) for k in range(n)):
                a, b = obs[C.find(idx[0])]["name"], obs[C.find(j)]["name"]
                report["shared_phone"].append((p, a, b))
    for k, idx in by_name.items():
        for j in idx[1:]:
            union(idx[0], j)

    # initials-only names with no contact info: attach to the single compatible cluster, if unique
    groups = defaultdict(list)
    for i in range(len(obs)):
        groups[C.find(i)].append(i)
    contactless = [r for r, m in groups.items() if not any(obs[i]["phones"] or obs[i]["emails"] for i in m)]
    contactful = [r for r in groups if r not in set(contactless)]
    for r in contactless:
        n = obs[r]["name"]
        cands = [c for c in contactful if any(compatible(n, obs[i]["name"]) for i in groups[c])]
        same_dept = [c for c in cands if obs[r]["dept"] and any(obs[i]["dept"] == obs[r]["dept"] for i in groups[c])]
        pick = same_dept if len(same_dept) == 1 else cands if len(cands) == 1 else []
        if pick:
            union(pick[0], r)
    groups = defaultdict(list)
    for i in range(len(obs)):
        groups[C.find(i)].append(i)

    # ---- build people
    people = []
    used_ids = Counter()
    phone_owner = defaultdict(set)
    def contacts(ms):
        phones = Counter(p for m in ms for p in m["phones"])
        # An OCR'd number that is 1-2 digits off a number from a typed source is a misread: drop it.
        typed = {p for m in ms if not m["ocr"] for p in m["phones"]}
        for p in list(phones):
            if p not in typed and any(sum(a != b for a, b in zip(p, q)) <= 2 for q in typed):
                del phones[p]
        emails = Counter(e for m in ms for e in m["emails"])
        role_emails = sorted({e for m in ms for e in m["role_emails"]})
        return phones, emails, role_emails

    for root, idx in groups.items():
        ms = [obs[i] for i in idx]
        phones, emails, role_emails = contacts(ms)
        if not phones and not emails and not role_emails:
            report["no_contact_info"].append((max((m["name"] for m in ms), key=name_quality), sorted({m["dept_raw"] for m in ms} - {""})))
            continue
        # Prefer spellings from typed sources (v1, text PDFs) over OCR ("Avuta Mohantv"), and only
        # plausible-looking names (letters only, ≤5 words) — rejects OCR junk like "UT. Omlda Ina Pala?".
        clean = [m["name"] for m in ms if re.fullmatch(r"[A-Za-z][A-Za-z .'\-]*", m["name"])
                 and len(full_words(m["name"])) <= 5]
        if not clean:
            report["incomplete_name"].append((ms[0]["name"], sorted(phones), sorted(emails)))
            continue
        name = max(clean,
                   key=lambda n: (name_quality(n)[0], any(x["name"] == n and not x["ocr"] for x in ms),
                                  name_quality(n)[1], sum(x["name"] == n for x in ms)))
        # Records whose name can't be this person (OCR rows read out of line, e.g. "Prangya Prusty"
        # pulled into Ranimama Subudhi) are split off, and their phones/emails are not used.
        keep = [m for m in ms if m["name"] == name or compatible(name, m["name"], loose=True)]
        if len(keep) < len(ms):
            for m in ms:
                if m not in keep:
                    report["split_records"].append((name, m["name"], tuple(m["phones"] + m["emails"]),
                                                    m["file"][8:] or m["source"]))
            ms = keep
            phones, emails, role_emails = contacts(ms)
            if not phones and not emails and not role_emails:
                report["no_contact_info"].append((name, []))
                continue
        if len(tokens(name)) < 2 and not any(m["source"] == "v1" for m in ms):  # owner-entered names are kept
            report["incomplete_name"].append((name, sorted(phones), sorted(emails)))
            continue
        if all(m["ocr"] for m in ms):
            # Seen only in scanned timetables: publish only if a second signal agrees with the
            # OCR'd name — its own official email matches the name, or the master list has an
            # address that clearly belongs to this name. Otherwise it may be OCR noise.
            ok = any(is_official(e) and affinity(name, e) >= 0.8 for e in emails) or \
                sum(affinity(name, e) >= 0.9 for e in master if is_official(e)) == 1
            if not ok:
                report["ocr_unverified"].append((name, sorted(phones), sorted(emails),
                                                 sorted({m["file"] for m in ms})))
                continue
        years_seen = sorted({m["year"] for m in ms if m["source"] == "timetable" and m["year"]})
        titles = Counter(m["title"] for m in ms if m["title"])
        depts_c = Counter(m["dept"] for m in ms if m["dept"])
        tt_depts = Counter(m["dept"] for m in ms if m["dept"] and m["source"] == "timetable")
        dept = (tt_depts or depts_c).most_common(1)[0][0] if (tt_depts or depts_c) else ""
        v1 = [m for m in ms if m["source"] == "v1"]
        web = [m for m in ms if m["source"] == "website"]
        # rank: official website first, then v1
        ranks = Counter(norm_rank(m["designation"]) for m in web if norm_rank(m["designation"]))
        ranks = ranks or Counter(norm_rank(m["designation"]) for m in v1 if norm_rank(m["designation"]))
        designation = ranks.most_common(1)[0][0] if ranks else ""
        # roles: (label, from_website). Role mailbox labels are the most specific, then website, then v1.
        cand = [(ROLE_EMAIL_LABEL[e.split("@")[0]], any(e in m["role_emails"] for m in web))
                for e in role_emails if e.split("@")[0] in ROLE_EMAIL_LABEL]
        cand.sort(key=lambda c: not c[1])  # website-backed first
        cand += [(r, True) for m in web for r in roles_in(m["designation"])]
        cand += [(r, False) for m in v1 for r in roles_in(m["designation"])]
        short = next((d["short"] for d in depts.items if d["id"] == dept), "")
        roles, role_src = [], {}
        for r, from_web in cand:
            if r == "HOD" and short:
                r = f"HOD, {short}"
            kind = r.split(",")[0]
            bare = [x for x in roles if x == kind]
            if bare and "," in r:  # a specific "Dean, Pharmacy" replaces a bare "Dean"
                roles = [x for x in roles if x != kind]
            if any(_same_role(r, x) for x in roles):
                continue
            if kind == "HOD" and any(x.startswith("HOD") for x in roles):
                continue  # one department head post per person
            roles.append(r)
            role_src[r] = from_web
        if depts.is_office(dept) and dept != "leadership":
            roles, role_src = [], {}  # office entries ("DSW Office") are not post holders
        official = [e for e, _ in emails.most_common() if is_official(e)]
        personal = [e for e, _ in emails.most_common() if not is_official(e)]
        official.sort(key=lambda e: (e not in master, master.get(e, {}).get("bouncing", False), -emails[e]))
        files = sorted({m["file"] for m in ms if m["file"]})
        flags = []
        if len(official) > 1:
            flags.append("multiple official emails: " + ", ".join(official))
        if len(phones) > 2:
            flags.append(f"{len(phones)} different phone numbers")
        if official and official[0] not in master:
            flags.append("email not in master list")
        if official and master.get(official[0], {}).get("bouncing"):
            flags.append("email is bouncing in master list")
        if len(depts_c) > 1:
            flags.append("departments disagree: " + ", ".join(f"{d}×{n}" for d, n in depts_c.most_common()))
        if all(i for _, i in tokens(name)[:-1]) and len(tokens(name)) > 1:
            flags.append("only initials known for first name")
        if years_seen and current_year not in years_seen and not v1:
            flags.append(f"only in older {', '.join(years_seen)} timetable — may have left")
        if all(m["ocr"] for m in ms):
            flags.append("only from scanned (OCR) timetable — check spelling and number")
        pretty_name = pretty(name)
        slug = re.sub(r"[^a-z0-9]+", "-", pretty_name.lower()).strip("-")
        used_ids[slug] += 1
        pid = slug if used_ids[slug] == 1 else f"{slug}-{used_ids[slug]}"
        person = {
            "id": pid,
            "name": pretty_name,
            "title": titles.most_common(1)[0][0] if titles else "",
            "designation": designation,
            "roles": roles,
            "roleEmails": role_emails,
            "department": dept,
            "phones": [p for p, _ in phones.most_common()],
            "officialEmail": official[0] if official else "",
            "otherEmails": official[1:],
            "personalEmail": personal[0] if personal else "",
            "isOffice": depts.is_office(dept) and dept != "leadership",
            # Department only: no subjects / semesters / groups are stored (owner's rule).
            "sources": (["v1"] if v1 else []) + (["website"] if web else []) + [f"timetable-{y}" for y in years_seen],
            "inMasterList": bool(official) and official[0] in master,
            "lastVerified": date.today().isoformat() if current_year in years_seen else "",
            "flags": flags,
            "_aliases": sorted({pretty(m["name"]) for m in ms} - {pretty_name}),
            "_role_src": role_src,
        }
        for p in person["phones"]:
            phone_owner[p].add(pid)
        people.append(person)

    for p, owners in phone_owner.items():
        if len(owners) > 1:
            for person in people:
                if person["id"] in owners:
                    person["flags"].append(f"phone {p} also listed for: " + ", ".join(sorted(owners - {person['id']})))

    people.sort(key=lambda x: (x["department"], x["name"]))
    for p in people:
        p["aliases"] = p.pop("_aliases")

    # One holder per post. The official website/role mailbox wins over the old v1 list.
    holders = defaultdict(list)
    for p in people:
        for r in p["roles"]:
            if r.split(",")[0] in ("Dean", "HOD", "Vice Chancellor", "Pro Vice Chancellor", "Registrar",
                                   "Controller of Examinations") and r not in ("Dean", "HOD"):
                key = next((k for k in holders if _same_role(k, r)), r)
                holders[key].append((p, r))
    for role, hs in holders.items():
        if len(hs) < 2:
            continue
        if any(p["_role_src"].get(r) for p, r in hs):
            for p, r in hs:
                if not p["_role_src"].get(r):
                    p["roles"].remove(r)
                    # ...and the role mailbox that went with it (deaninternational@ etc.)
                    p["roleEmails"] = [e for e in p["roleEmails"]
                                       if not _same_role(ROLE_EMAIL_LABEL.get(e.split("@")[0], "x"), r)]
                    report["stale_roles"].append((p["name"], r))
            hs = [(p, r) for p, r in hs if r in p["roles"]]
        if len(hs) > 1:
            for p, r in hs:
                others = ", ".join(q["name"] for q, _ in hs if q is not p)
                p["flags"].append(f"role '{r}' also listed for {others}")
    for p in people:
        p.pop("_role_src")

    # Possible duplicates: compatible names in the same department that were not merged
    for i, a in enumerate(people):
        for b in people[i + 1:]:
            if b["department"] != a["department"]:
                break
            if compatible(a["name"], b["name"]) and a["officialEmail"] != b["officialEmail"] or (
                    a["name"] == b["name"]):
                if not (a["officialEmail"] in master and b["officialEmail"] in master):
                    report["possible_duplicates"].append((a["id"], a["phones"], a["officialEmail"],
                                                          b["id"], b["phones"], b["officialEmail"]))

    # ---- master emails never matched
    used = {e for p in people for e in [p["officialEmail"], *p["otherEmails"]]}
    report["master_unmatched"] = sorted(e for e in master if e not in used and not is_role(e) and is_official(e))
    # A person's email missing from the master list + an unclaimed master email that resembles the
    # person's name -> probably a typo in the timetable/v1 data. Suggest it (never auto-replace).
    for p in people:
        if p["officialEmail"] and p["officialEmail"] not in master:
            cands = [e for e in report["master_unmatched"] if affinity(p["name"], e) >= 0.8]
            cands = cands or [e for e in difflib.get_close_matches(p["officialEmail"], report["master_unmatched"], n=1, cutoff=0.9)
                              if affinity(p["name"], e) >= 0.5]
            if cands:
                p["flags"] = [f if f != "email not in master list" else f"email not in master list — master has {cands[0]}" for f in p["flags"]]
        elif not p["officialEmail"]:
            cands = [e for e in report["master_unmatched"] if affinity(p["name"], e) >= 0.9]
            if len(cands) == 1:
                p["flags"].append(f"no official email — master list has {cands[0]}")
    report["master_roles"] = sorted(e for e in master if is_role(e))
    report["v1_not_in_timetables"] = sorted(p["name"] for p in people if p["sources"] == ["v1"] and not p["isOffice"])
    report["new_people"] = sorted(p["name"] for p in people if "v1" not in p["sources"])
    report["scanned"] = json.loads(Path(args.scanned).read_text()) if args.scanned else []
    # Offices: phone numbers from the website's administrative-offices page + role mailboxes
    claimed = {e for p in people for e in p["roleEmails"]}
    report["offices"] = [
        {"id": re.sub(r"[^a-z0-9]+", "-", w["office"].lower()).strip("-"), "name": w["office"],
         "contact": w["contact"], "phones": list(dict.fromkeys(w["phones"] + w["landlines"])),
         "emails": w["emails"], "source": "website"} for w in website_offices]
    report["offices"] += [
        {"id": e.split("@")[0], "name": ROLE_EMAIL_LABEL.get(e.split("@")[0], ""), "contact": "",
         "phones": [], "emails": [e], "source": "master-list"}
        for e in report["master_roles"] if e not in claimed]

    return people, report, n_base_obs, len(obs)


def write_report(people, report, path, n_base, n_obs):
    L = []
    w = L.append
    flagged = [p for p in people if p["flags"]]
    w(f"# Faculty data review report\n\nGenerated {date.today().isoformat()} by `scripts/timetables/merge.py`.\n")
    w("## Summary\n")
    w(f"- **{len(people)} people** in `data/faculty.json`")
    w(f"- {sum('timetable-2026-27' in p['sources'] for p in people)} found in 2026-27 timetables, "
      f"{sum(p['sources'] == ['v1'] for p in people)} only in the old v1 list, {len(report['new_people'])} new (not in v1)")
    w(f"- {sum(p['inMasterList'] for p in people)} have an official email confirmed by the ALL.FACULTY master list")
    w(f"- {len(flagged)} entries have flags to review (below)")
    w(f"- {len(report['scanned'])} scanned timetable PDFs were read with OCR "
      f"(entries only seen there are flagged for a check)")
    w(f"- {sum(bool(p['designation']) for p in people)} have a designation; "
      f"{sum(bool(p['roles']) for p in people)} hold a post (Dean / HOD / VC …)")
    w(f"- {len(report['offices'])} office contacts written to `data/offices.json`\n")
    w("## 0. Old roles removed because the official website lists someone else\n")
    for n, r in sorted(set(report["stale_roles"])):
        w(f"- {n} — {r}")
    w("")

    w("## 1. Flagged entries\n")
    w("| Name | Dept | Phones | Official email | Flags |\n|---|---|---|---|---|")
    for p in flagged:
        w(f"| {p['title']} {p['name']} | {p['department']} | {', '.join(p['phones'])} | {p['officialEmail']} | {'; '.join(p['flags'])} |")

    w("\n## 2. Email ignored because it doesn't match the name (timetable typo or wrong row)\n")
    for n, e, f in sorted(set(report["email_name_mismatch"])):
        w(f"- {n} — `{e}` ({f})")
    w("\n## 3. Old v1 entries whose email doesn't look like the name\n")
    for n, e in sorted(set(report["v1_email_name_mismatch"])):
        w(f"- {n} — `{e}`")
    w("\n## 4. Same phone number listed for different people\n")
    for p, a, b in sorted(set(report["shared_phone"])):
        w(f"- {p}: {a} / {b}")
    w("\n## 4a. Records split off because the name didn't fit (their phone/email was NOT used)\n")
    for keep_name, other, contact, src in sorted(set(report["split_records"])):
        w(f"- kept **{keep_name}**, dropped \"{other}\" — {', '.join(contact) or 'no contact'} ({src})")
    w("\n## 4b. Possible duplicates (similar names, same department, not merged)\n")
    for a, pa, ea, b, pb, eb in report["possible_duplicates"]:
        w(f"- `{a}` ({', '.join(pa)}; {ea or 'no email'})  vs  `{b}` ({', '.join(pb)}; {eb or 'no email'})")
    w("\n## 5. In old v1 list but not in any 2026-27 timetable (left? non-teaching? or in a scanned PDF)\n")
    w(", ".join(report["v1_not_in_timetables"]) or "none")
    w("\n\n## 6. New people found in timetables (not in v1)\n")
    w(", ".join(report["new_people"]) or "none")
    w("\n\n## 7. Official master-list emails not matched to anyone yet\n")
    w(", ".join(f"`{e}`" for e in report["master_unmatched"]))
    w("\n\n## 8. Office / role emails in master list (for an 'Important offices' section)\n")
    w(", ".join(f"`{e}`" for e in report["master_roles"]))
    w("\n\n## 9. Names in timetables with no phone or email anywhere\n")
    for n, d in sorted(report["no_contact_info"]):
        w(f"- {n} {('(' + ', '.join(d) + ')') if d else ''}")
    w("\n## 9a. Seen only in scanned timetables and not confirmed — NOT published\n")
    w("Add them by hand (in the v1/base data) if they are real.\n")
    for n, ph, em, files in sorted(report["ocr_unverified"]):
        w(f"- {n} — {', '.join(ph + em) or 'no contact'} ({', '.join(f[8:] for f in files)})")
    w("\n## 9b. Names too incomplete to publish (one word / cut off in the PDF)\n")
    for n, ph, em in sorted(report["incomplete_name"]):
        w(f"- {n} — {', '.join(ph + em)}")
    w("\n## 10. Scanned timetables (read with OCR — entries flagged 'only from scanned' need a check)\n")
    for s in report["scanned"]:
        w(f"- {s}")
    Path(path).write_text("\n".join(L) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--records", required=True, nargs="+", help="records.json and/or records_ocr.json")
    ap.add_argument("--base", required=True)
    ap.add_argument("--master", required=True)
    ap.add_argument("--departments", default="data/departments.json")
    ap.add_argument("--scanned")
    ap.add_argument("--website", help="website.json from scripts/website/scrape_site.py")
    ap.add_argument("--out", default="data/faculty.json")
    ap.add_argument("--report", default="data/review-report.md")
    args = ap.parse_args()
    people, report, n_base, n_obs = build(args)
    Path(args.out).with_name("offices.json").write_text(
        json.dumps(report["offices"], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    Path(args.out).write_text(json.dumps(people, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_report(people, report, args.report, n_base, n_obs)
    print(f"{len(people)} people -> {args.out}; {sum(bool(p['flags']) for p in people)} flagged -> {args.report}")


if __name__ == "__main__":
    main()
