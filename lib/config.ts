// Site-wide settings that the owner may want to change without touching components.

/** Google Form used for "Missing faculty?" and "Report wrong info". */
export const FEEDBACK_FORM = {
  url: "https://docs.google.com/forms/d/e/1FAIpQLSfF1IOZred3hxEvOLZo0MTjY0Lt5F_drP8RZiXCA64eYh0OUg/viewform",
  /** Form field ids (from the form's HTML) used to pre-fill answers. */
  fields: {
    facultyName: "entry.693888704",
    phone: "entry.546038468",
  },
}

export const UNIVERSITY = "C. V. Raman Global University"

/** Public address of the site (used for share previews, sitemap, robots). */
export const SITE_URL = "https://cgufacultysearch.vercel.app"
