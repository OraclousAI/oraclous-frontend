export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}

export type FeedbackRating = 1 | -1;
