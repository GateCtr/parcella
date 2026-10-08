import { useEffect, useMemo, useState } from 'react';

export interface UsePaginationResult<T> {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  pageCount: number;
  pageItems: T[];
  total: number;
  /** 1-based index of the first item shown on the current page (0 when empty). */
  rangeStart: number;
  /** 1-based index of the last item shown on the current page (0 when empty). */
  rangeEnd: number;
}

/**
 * Client-side pagination over an in-memory array.
 *
 * The API returns the full filtered list (no server-side paging), so we page
 * the display here. The current page auto-clamps when the data length changes
 * (e.g. after filtering) so it never points past the last page.
 */
export function usePagination<T>(items: T[] | undefined, pageSize = 10): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const list = items ?? [];
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Clamp the current page whenever the result set shrinks (filters, deletes…).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, safePage, pageSize]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return { page: safePage, setPage, pageSize, pageCount, pageItems, total, rangeStart, rangeEnd };
}
