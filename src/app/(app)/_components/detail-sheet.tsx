"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/** Panel kanan Detail pengguna; ditutup dengan menghapus `?detail=` dari URL. */
function DetailSheet({
  children,
  title = "Detail pengguna",
  param = "detail",
}: {
  children: React.ReactNode;
  title?: string;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        const query = new URLSearchParams(searchParams.toString());
        query.delete(param);
        const search = query.toString();
        router.replace(search ? `${pathname}?${search}` : pathname, {
          scroll: false,
        });
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-5 sm:max-w-md"
      >
        <SheetTitle className="mb-4 text-h3">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

export { DetailSheet };
