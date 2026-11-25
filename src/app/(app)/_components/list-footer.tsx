import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/** "Menampilkan 1–10 dari 24 anggota" + navigasi halaman. */
function ListFooter({
  page,
  pageSize,
  total,
  noun,
  hrefFor,
  pageSizeControl,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  hrefFor: (page: number) => string;
  /** Pilihan "Per halaman", mis. `SearchParamSelect` untuk `?per=`. */
  pageSizeControl?: React.ReactNode;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-small text-muted-foreground">
        Menampilkan {from}–{to} dari {total.toLocaleString("id-ID")} {noun}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {pageSizeControl && (
          <div className="flex items-center gap-2 text-small text-muted-foreground">
            <span>Per halaman</span>
            <div className="w-20">{pageSizeControl}</div>
          </div>
        )}
        {pageCount > 1 && (
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={hrefFor(page - 1)}
                  disabled={page <= 1}
                />
              </PaginationItem>
              {pages.map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink href={hrefFor(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href={hrefFor(page + 1)}
                  disabled={page >= pageCount}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

export { ListFooter };
