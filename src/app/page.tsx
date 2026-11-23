import { GraduationCap, Hammer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-1 flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between gap-4 border-b py-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap aria-hidden="true" className="size-5" />
          </span>
          <p className="text-sm font-medium sm:text-base">
            SMK Lugina Rancaekek
          </p>
        </div>
        <Badge variant="outline" className="h-auto px-3 py-1 text-sm">
          V2
        </Badge>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium tracking-wide text-muted-foreground">
            BERTUMBUH BERSAMA, BERKARYA LEBIH JAUH
          </p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Bojong United
          </h1>
          <p className="mt-5 text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Digital Portfolio &amp; Assessment System
          </p>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
            Ruang untuk mendokumentasikan karya dan mendukung proses penilaian
            di SMK Lugina Rancaekek.
          </p>

          <Card className="mt-10 bg-muted/40">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                <Hammer aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-medium">Dalam pengembangan</h2>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  Kami sedang menyiapkan fondasi Bojong United. Fitur untuk guru
                  dan siswa akan dikembangkan pada tahap berikutnya.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="flex flex-col gap-2 border-t py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Bojong United</p>
        <p>Dikembangkan untuk SMK Lugina Rancaekek.</p>
      </footer>
    </div>
  );
}
