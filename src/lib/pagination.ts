export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const cursor = searchParams.get("cursor") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(
        Math.max(parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE
      )
    : DEFAULT_PAGE_SIZE;

  return { cursor, limit };
}
