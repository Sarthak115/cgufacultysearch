// Small shared pieces: avatar, post/designation badges, favourite star.
import { Building, Crown, Star, User } from "lucide-react"
import type { DirectoryEntry } from "@/lib/data/schema"
import { initials } from "@/lib/directory"

/** Text for the coloured badge: the post if any (Dean, HOD …), else the academic rank. */
export function badgeLabel(f: DirectoryEntry) {
  return f.roles.join(" · ") || f.designation || (f.isOffice ? "Office" : "Faculty")
}

function badgeColor(label: string) {
  if (label.includes("Pro Vice Chancellor")) return "from-purple-600 to-indigo-700"
  if (label.includes("Vice Chancellor")) return "from-red-500 to-pink-600"
  if (label.includes("Dean")) return "from-orange-500 to-red-600"
  if (/Controller|Registrar|HOD|Director/.test(label)) return "from-amber-500 to-orange-600"
  if (label === "Professor" || label === "Professor of Practice") return "from-blue-500 to-indigo-600"
  if (label === "Associate Professor") return "from-emerald-500 to-blue-600"
  if (label === "Office") return "from-teal-500 to-cyan-600"
  return "from-purple-500 to-violet-600"
}

const isPost = (label: string) => /Vice Chancellor|Dean|Controller|Registrar|HOD|Director/.test(label)

export function Badges({ entry }: { entry: DirectoryEntry }) {
  const label = badgeLabel(entry)
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-semibold text-white ${badgeColor(label)}`}
      >
        {isPost(label) ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {label}
      </span>
      {entry.roles.length > 0 && entry.designation && (
        <span className="inline-flex items-center rounded-full border border-primary/25 px-2.5 py-0.5 text-xs font-medium text-primary">
          {entry.designation}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 px-2.5 py-0.5 text-xs font-medium text-primary">
        <Building className="h-3 w-3" />
        {entry.department?.name ?? "Department not listed"}
      </span>
    </div>
  )
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 font-semibold text-white ${
        small ? "h-10 w-10 text-sm" : "h-12 w-12 text-base"
      }`}
    >
      {initials(name)}
    </span>
  )
}

export function FavButton({ active, onToggle, name }: { active: boolean; onToggle: () => void; name: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
      title={active ? "Remove from favourites" : "Add to favourites"}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-400" : ""}`} />
    </button>
  )
}
