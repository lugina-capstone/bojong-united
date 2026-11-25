import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const backClass =
  "inline-flex items-center gap-1.5 text-small-medium text-muted-foreground hover:text-foreground";

function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={backClass}>
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      {children}
    </Link>
  );
}

/** Tombol kembali untuk langkah di halaman yang sama (mis. dari OTP ke formulir). */
function BackButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={backClass}>
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      {children}
    </button>
  );
}

export { BackButton, BackLink };
