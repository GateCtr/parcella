import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Total number of items across all pages (for the "X–Y sur Z" counter). */
  total: number;
  rangeStart: number;
  rangeEnd: number;
  /** Singular/plural label for the counted entity, e.g. "fiche" / "plaque". */
  itemLabel?: string;
  className?: string;
}

/**
 * Builds a compact list of page numbers with ellipses, e.g. 1 … 4 5 6 … 20.
 * Always shows the first and last page plus a window around the current one.
 */
function pageWindow(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < pageCount - 1) pages.push('ellipsis');
  pages.push(pageCount);
  return pages;
}

export function DataPagination({
  page,
  pageCount,
  onPageChange,
  total,
  rangeStart,
  rangeEnd,
  itemLabel = 'élément',
  className,
}: DataPaginationProps) {
  // Nothing to paginate: hide the whole bar (a single page with no items).
  if (total === 0) return null;

  const plural = total > 1 ? 's' : '';
  const windowPages = pageWindow(page, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground order-2 sm:order-1" aria-live="polite">
        {rangeStart}–{rangeEnd} sur {total} {itemLabel}{plural}
      </p>

      <Pagination className="order-1 w-auto sm:order-2 mx-0 sm:mx-0 justify-end">
        <PaginationContent className="flex-wrap">
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Précédent</span>
            </Button>
          </PaginationItem>

          {/* Numbered pages: hidden on small screens to save space. */}
          <div className="hidden items-center gap-1 sm:flex">
            {windowPages.map((p, i) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(p);
                    }}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
          </div>

          {/* Compact "page X / N" shown only on small screens. */}
          <span className="px-2 text-sm text-muted-foreground sm:hidden">
            {page} / {pageCount}
          </span>

          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
              aria-label="Page suivante"
            >
              <span className="hidden sm:inline">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
