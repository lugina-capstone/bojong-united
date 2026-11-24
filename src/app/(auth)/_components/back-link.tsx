import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-small-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      {children}
    </Link>
  );
}

export { BackLink };
