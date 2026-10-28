export const SITE_URL = "https://trypickle.site";
export const BLOG_PATH = "/blog";
export const PAGE_SIZE = 4;
export const SITE_NAME = "Pickle";
export const BLOG_DESCRIPTION =
  "Thoughtful reads on iPhone productivity, intuitive design, and making room for what matters. From the team at Pickle.";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function pagePath(page: number) {
  return page === 1 ? BLOG_PATH : `${BLOG_PATH}/page/${page}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
