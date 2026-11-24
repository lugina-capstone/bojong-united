import { CircleCheckIcon } from "lucide-react";

import { BecraftLogo, BecraftMark } from "@/components/brand/logo";

const HIGHLIGHTS = [
  "Ikuti acara dan kumpulkan karya per milestone",
  "Dapatkan nilai, umpan balik, dan sertifikat",
  "Bangun portofolio yang bisa dibagikan",
];

/** Panel Akses Akun: formulir di kiri, panel brand di kanan (≥ 1024 px). */
function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-16 lg:py-10">
        <BecraftLogo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-114">{children}</div>
        </div>
        <p className="text-caption text-subtle">
          © {new Date().getFullYear()} Becraft · SMK Lugina Rancaekek
        </p>
      </div>
      <div className="hidden p-4 lg:block">
        <div className="flex h-full flex-col justify-between rounded-4xl bg-primary-900 p-12 text-inverse">
          <BecraftMark mono className="size-12" />
          <div className="flex flex-col gap-6">
            <p className="text-hero">Ruang tumbuh bersama.</p>
            <ul className="flex flex-col gap-3">
              {HIGHLIGHTS.map((text) => (
                <li
                  key={text}
                  className="flex items-center gap-2.5 text-body text-primary-100"
                >
                  <CircleCheckIcon
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-success-500"
                  />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthPanel };
