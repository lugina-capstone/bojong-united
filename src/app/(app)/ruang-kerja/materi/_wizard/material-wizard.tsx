"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  CircleCheckIcon,
  PaperclipIcon,
  SaveIcon,
  SendIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  publishMaterialAction,
  saveMaterialInfoAction,
  saveMaterialPublishAction,
  saveMaterialSectionsAction,
  type MaterialActionState,
} from "@/app/(app)/ruang-kerja/materi/actions";
import type { MaterialWizardData } from "@/app/(app)/ruang-kerja/materi/_wizard/load";
import { StepContent } from "@/app/(app)/ruang-kerja/materi/_wizard/step-content";
import { StepInfo } from "@/app/(app)/ruang-kerja/materi/_wizard/step-info";
import { StepReview } from "@/app/(app)/ruang-kerja/materi/_wizard/step-review";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { MATERIAL_STEPS, Stepper } from "@/components/ui/stepper";
import { WizardActionBar } from "@/components/ui/wizard-action-bar";

type Data = NonNullable<MaterialWizardData>;
export type Errors = Record<string, string>;

const HEADINGS = [
  {
    title: "Unggah materi baru",
    description:
      "Lengkapi informasi materi. Materi tidak memiliki milestone, tenggat, atau penilaian.",
  },
  {
    title: "Susun konten materi",
    description:
      "Bagi materi menjadi beberapa bagian. Peserta menandai tiap bagian selesai.",
  },
  {
    title: "Tinjau & terbitkan",
    description:
      "Periksa ringkasan, atur visibilitas, dan lampirkan ke acara bila perlu.",
  },
];

/** Wizard materi 3 langkah (PRD-04). Setiap langkah disimpan ke draf sebelum pindah. */
function MaterialWizard({ data, step }: { data: Data; step: number }) {
  const router = useRouter();
  const [info, setInfo] = React.useState(data.info);
  const [sections, setSections] = React.useState(data.sections);
  const [publish, setPublish] = React.useState(data.publish);
  const [categories, setCategories] = React.useState(data.categories);
  const [errors, setErrors] = React.useState<Errors>({});
  const [confirm, setConfirm] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const draft = data.status === "DRAFT";
  const heading = HEADINGS[step - 1]!;
  const edited =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setErrors({});
    };
  const hrefFor = (id: string, target: number) =>
    `/ruang-kerja/materi/${id}/edit?step=${target}`;

  async function saveCurrent(): Promise<MaterialActionState> {
    if (step === 1) return saveMaterialInfoAction(data.materialId, info);
    if (!data.materialId) return { error: "Simpan informasi materi dulu." };
    if (step === 2) {
      return saveMaterialSectionsAction(
        data.materialId,
        sections.map((s) => ({
          id: s.id,
          mode: s.mode,
          title: s.title,
          content: s.content,
          fileId: s.mode === "file" ? s.fileId : null,
          link: s.mode === "link" ? s.link.trim() : "",
          durationMinutes: s.durationMinutes,
        })),
      );
    }
    return saveMaterialPublishAction(data.materialId, publish);
  }

  function run(target: "draft" | "next" | "publish") {
    const submitted = sections;
    startTransition(async () => {
      const result = await saveCurrent();
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.error ?? "Periksa kembali isian yang ditandai.");
        return;
      }
      const id = result.materialId ?? data.materialId!;
      const savedIds = result.sectionIds;
      if (savedIds) {
        setSections((list) =>
          list.map((s) => {
            const i = submitted.findIndex((x) => x.key === s.key);
            if (i === -1 || !savedIds[i]) return s;
            const fileDropped =
              submitted[i].mode !== "file" && s.fileId === submitted[i].fileId;
            return fileDropped
              ? { ...s, id: savedIds[i], fileId: null, file: null }
              : { ...s, id: savedIds[i] };
          }),
        );
      }
      if (result.categoryId && info.newCategory) {
        if (!categories.some((c) => c.id === result.categoryId)) {
          setCategories((list) => [
            ...list,
            { id: result.categoryId!, name: info.newCategory.trim() },
          ]);
        }
        setInfo((v) => ({
          ...v,
          categoryId: result.categoryId!,
          newCategory: "",
        }));
      }
      if (target === "publish") {
        if (draft) setConfirm(true);
        else {
          toast.success("Perubahan materi tersimpan.");
          router.push(`/ruang-kerja/materi/${id}`);
        }
        return;
      }
      if (target === "draft") {
        toast.success(
          draft
            ? "Draf tersimpan. Anda bisa melanjutkannya kapan saja."
            : "Perubahan tersimpan.",
        );
        if (!data.materialId) router.replace(hrefFor(id, step));
        else router.refresh();
        return;
      }
      router.push(hrefFor(id, step + 1));
    });
  }

  function confirmPublish() {
    if (!data.materialId) return;
    startTransition(async () => {
      const result = await publishMaterialAction(data.materialId!);
      if (result?.error) toast.error(result.error);
    });
  }

  const attached = publish.eventIds.length;

  return (
    <div className="-mx-4 -mb-6 flex min-h-full flex-col sm:-mx-8 lg:-mx-12 lg:-mb-8">
      <div className="flex flex-1 flex-col gap-6 px-4 pb-8 sm:px-8 lg:px-12">
        <nav
          className="text-small text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/ruang-kerja/materi" className="hover:text-foreground">
            Materi
          </Link>{" "}
          /{" "}
          {data.materialId
            ? draft
              ? "Lanjutkan draf"
              : "Edit materi"
            : "Unggah materi"}
        </nav>
        <header className="flex flex-col gap-1">
          <h1 className="text-display text-foreground">{heading.title}</h1>
          <p className="text-body text-muted-foreground">
            {heading.description}
          </p>
        </header>
        <Stepper steps={MATERIAL_STEPS} current={step} />
        {step === 1 && (
          <StepInfo
            data={data}
            categories={categories}
            value={info}
            onChange={edited(setInfo)}
            sectionCount={sections.length}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepContent
            value={sections}
            onChange={edited(setSections)}
            errors={errors}
          />
        )}
        {step === 3 && (
          <StepReview
            data={data}
            info={info}
            categories={categories}
            sections={sections}
            value={publish}
            onChange={edited(setPublish)}
            errors={errors}
          />
        )}
      </div>
      <WizardActionBar
        step={step}
        total={3}
        back={
          <Link
            href={
              step > 1 && data.materialId
                ? hrefFor(data.materialId, step - 1)
                : data.materialId && !draft
                  ? `/ruang-kerja/materi/${data.materialId}`
                  : "/ruang-kerja/materi"
            }
            className={buttonVariants({ variant: "ghost" })}
          >
            <ArrowLeftIcon aria-hidden="true" />
            {step > 1 ? "Kembali" : "Batal"}
          </Link>
        }
      >
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run("draft")}
        >
          <SaveIcon aria-hidden="true" />
          {draft ? "Simpan draf" : "Simpan"}
        </Button>
        {step < 3 ? (
          <Button disabled={pending} onClick={() => run("next")}>
            {step === 1 ? "Lanjut ke Konten" : "Lanjut ke Tinjau"}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button disabled={pending} onClick={() => run("publish")}>
            <SendIcon aria-hidden="true" />
            {draft ? "Terbitkan materi" : "Simpan perubahan"}
          </Button>
        )}
      </WizardActionBar>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terbitkan “{info.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Materi langsung bisa diikuti peserta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="flex flex-col gap-2 text-small text-label">
            <li className="flex gap-2">
              <CircleCheckIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-success-600"
              />
              {publish.visibility === "PUBLIC"
                ? "Tampil di Jelajah › Materi (Publik)."
                : "Hanya bisa diikuti lewat acara yang dilampiri."}
            </li>
            {attached > 0 && (
              <li className="flex gap-2">
                <PaperclipIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-label"
                />
                Muncul sebagai materi pendukung di {attached} acara terlampir.
              </li>
            )}
            {attached > 0 && (
              <li className="flex gap-2">
                <BellIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary-600"
                />
                Guru/Asesor pemilik acara menerima notifikasi.
              </li>
            )}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={confirmPublish}>
              <SendIcon aria-hidden="true" />
              Terbitkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export { MaterialWizard };
