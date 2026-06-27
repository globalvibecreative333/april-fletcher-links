export interface ParsedSearch {
  raw: string;
  subreddit: string;
  query: string;
  redditUrl: string;
  googleUrl: string;
}

export function parseSearch(raw: string): ParsedSearch {
  const match = raw.match(/^(r\/[A-Za-z0-9_]+)\s+(.+)$/);
  const subreddit = match ? match[1] : "";
  const query = match ? match[2].trim() : raw;
  const sub = subreddit.replace(/^r\//, "");

  const redditUrl =
    `https://www.reddit.com/r/${sub}/search/?q=` +
    encodeURIComponent(query).replace(/%20/g, "+") +
    `&restrict_sr=1&sort=new`;

  const googleUrl =
    `https://www.google.com/search?q=` +
    encodeURIComponent(`site:reddit.com/${subreddit} ${query}`).replace(/%20/g, "+");

  return { raw, subreddit, query, redditUrl, googleUrl };
}
