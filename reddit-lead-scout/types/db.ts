export type Score = "A" | "B" | "C" | "Trash";
export type SubStatus = "fresh" | "combed" | "watching";

export interface Lead {
  id: string;
  username: string | null;
  post_link: string | null;
  subreddit: string | null;
  lane: string | null;
  offer_fit: string | null;
  score: Score | null;
  public_comment: boolean;
  dm_date: string | null;
  notes: string | null;
  original_post: string | null;
  created_at: string;
}

export interface SubredditStatusRow {
  subreddit: string;
  lane: string;
  status: SubStatus;
  updated_at?: string;
}
