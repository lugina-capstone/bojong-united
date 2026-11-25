"use client";

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { completeSectionAction } from "@/app/(app)/materi/actions";
import { Button, buttonVariants } from "@/components/ui/button";

/** Navigasi bagian dan tombol Tandai selesai di ruang belajar. */
export function SectionActions({
  materialId,
  sectionId,
  done,
  prevHref,
  nextHref,
}: {
  materialId: string;
  sectionId: string;
  done: boolean;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  function complete() {
    startTransition(async () => {
      const result = await completeSectionAction(materialId, sectionId);
      if (!result.ok) {
        toast.error(result.error ?? "Gagal menyimpan progres.");
        return;
      }
      if (result.completed) {
        router.push(`/materi/${materialId}/selesai`);
        return;
      }
      toast.success(`Bagian selesai · progres ${result.progress}%`);
      if (nextHref) router.push(nextHref);
    });
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {prevHref ? (
        <Link
          href={prevHref}
          className={buttonVariants({
            variant: "secondary",
            className: "w-fit",
          })}
        >
          <ChevronLeftIcon aria-hidden="true" />
          Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">
        {done ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-success-50 px-4 text-small-strong text-success-700">
            <CheckIcon aria-hidden="true" className="size-4" />
            Sudah selesai
          </span>
        ) : (
          <Button variant="secondary" disabled={pending} onClick={complete}>
            <CheckIcon aria-hidden="true" />
            Tandai selesai
          </Button>
        )}
        {nextHref && done && (
          <Link href={nextHref} className={buttonVariants()}>
            Bagian berikutnya
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
