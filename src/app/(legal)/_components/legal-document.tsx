import { Alert } from "@/components/ui/alert";

type LegalSection = { title: string; paragraphs: string[] };

/** Dokumen legal publik. Teksnya masih sementara sampai versi resmi tersedia. */
function LegalDocument({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-foreground">{title}</h1>
        <p className="text-small text-muted-foreground">
          Terakhir diperbarui {updatedAt}
        </p>
      </header>
      <Alert tone="warning" title="Teks sementara">
        Dokumen ini masih versi sementara dan akan diganti dengan versi resmi
        dari SMK Lugina Rancaekek.
      </Alert>
      <ol className="flex flex-col gap-6">
        {sections.map((section, index) => (
          <li key={section.title} className="flex flex-col gap-2">
            <h2 className="text-h3 text-foreground">
              {index + 1}. {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-body text-label">
                {paragraph}
              </p>
            ))}
          </li>
        ))}
      </ol>
    </article>
  );
}

export { LegalDocument, type LegalSection };
