import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  InboxIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceChip, ChoiceChipGroup } from "@/components/ui/choice-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/ui/event-card";
import { FileFormatOption } from "@/components/ui/file-format-option";
import { FileItem } from "@/components/ui/file-item";
import { FilterBar } from "@/components/ui/filter-bar";
import { FormField } from "@/components/ui/form-field";
import { GoogleButton } from "@/components/ui/google-button";
import { IconBox } from "@/components/ui/icon-box";
import { IconButton } from "@/components/ui/icon-button";
import { InfoBox } from "@/components/ui/info-box";
import { Input } from "@/components/ui/input";
import { MaterialCard } from "@/components/ui/material-card";
import { MilestoneItem } from "@/components/ui/milestone-item";
import { MilestoneProgressCell } from "@/components/ui/milestone-progress-cell";
import { OrgLogo } from "@/components/ui/org-logo";
import { OrgTypeSelected } from "@/components/ui/org-type-selected";
import { PageHeader } from "@/components/ui/page-header";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress, ProgressLegend } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RubricCriterion, RubricScoreRow } from "@/components/ui/rubric";
import { ScoreLevel } from "@/components/ui/score-level";
import { SearchInput } from "@/components/ui/search-input";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonCardGrid,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/components/ui/skeleton-patterns";
import { StatCard } from "@/components/ui/stat-card";
import { EVENT_STEPS, MATERIAL_STEPS, Stepper } from "@/components/ui/stepper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadItem } from "@/components/ui/upload-item";
import { UserRow } from "@/components/ui/user-row";
import { WizardActionBar } from "@/components/ui/wizard-action-bar";
import { accessLabel, type Access } from "@/lib/rbac";

import { DialogDemo, OtpDemo, RubricDemo, ToastDemo } from "./interactive";

export const metadata: Metadata = {
  title: "Galeri komponen",
  robots: { index: false },
};

const ROLES: Record<string, Access> = {
  peserta: { role: "PESERTA", isOrganizationAdmin: false },
  guru: { role: "GURU", isOrganizationAdmin: false },
  trainer: { role: "TRAINER", isOrganizationAdmin: false },
  "admin-organisasi": { role: "TRAINER", isOrganizationAdmin: true },
  administrator: { role: "ADMINISTRATOR", isOrganizationAdmin: false },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-h3 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default async function DevUiPage({
  searchParams,
}: PageProps<"/dev/ui">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { role } = await searchParams;
  const roleKey = typeof role === "string" && role in ROLES ? role : "trainer";
  const access = ROLES[roleKey];

  return (
    <AppShell
      access={access}
      workspace="SMK Lugina Rancaekek"
      user={{ name: "Andi Saputra", roleLabel: accessLabel(access) }}
      breadcrumb="Pengembangan  /  Galeri komponen"
      notificationCount={4}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Hanya development"
          title="Galeri komponen"
          description="Cek setiap komponen di lebar 375, 768, 1366, 1440, dan 1920 px."
          actions={
            <Button>
              <PlusIcon />
              Buat acara
            </Button>
          }
        />

        <Section title="Sidebar per role">
          <div className="flex flex-wrap gap-2">
            {Object.keys(ROLES).map((key) => (
              <Link key={key} href={`/dev/ui?role=${key}`}>
                <Badge tone={key === roleKey ? "primary" : "neutral"}>
                  {key}
                </Badge>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Tombol">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Primary L</Button>
            <Button>Primary M</Button>
            <Button size="sm">Primary S</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">
              <TrashIcon />
              Danger
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button loading>Menyimpan</Button>
            <Button disabled>Nonaktif</Button>
            <IconButton label="Hapus">
              <TrashIcon />
            </IconButton>
          </div>
          <GoogleButton className="max-w-114" />
        </Section>

        <Section title="Form">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="email"
              label="Email"
              description="Gunakan email aktif."
            >
              <Input id="email" type="email" placeholder="nama@email.com" />
            </FormField>
            <FormField
              id="password"
              label="Kata sandi"
              error="Kata sandi salah."
              action={<a href="#">Lupa kata sandi?</a>}
            >
              <Input
                id="password"
                type="password"
                aria-invalid
                defaultValue="rahasia"
              />
            </FormField>
            <SearchInput aria-label="Cari" />
            <Input disabled placeholder="Nonaktif" aria-label="Nonaktif" />
            <Textarea
              placeholder="Deskripsi acara"
              aria-label="Deskripsi"
              className="md:col-span-2"
            />
          </div>
          <OtpDemo />
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-body">
              <Checkbox defaultChecked /> Setuju
            </label>
            <RadioGroup defaultValue="individu" className="flex gap-4">
              <label className="flex items-center gap-2 text-body">
                <RadioGroupItem value="individu" /> Individu
              </label>
              <label className="flex items-center gap-2 text-body">
                <RadioGroupItem value="tim" /> Tim
              </label>
            </RadioGroup>
          </div>
          <ChoiceChipGroup defaultValue={["UI/UX"]}>
            {["UI/UX", "Basis Data", "Poster", "Umum"].map((field) => (
              <ChoiceChip key={field} value={field}>
                {field}
              </ChoiceChip>
            ))}
          </ChoiceChipGroup>
          <SegmentedControl defaultValue={["semua"]}>
            <SegmentedControlItem value="semua">Semua</SegmentedControlItem>
            <SegmentedControlItem value="aktif">Aktif</SegmentedControlItem>
            <SegmentedControlItem value="arsip">Arsip</SegmentedControlItem>
          </SegmentedControl>
          <div className="flex flex-wrap gap-3">
            <FileFormatOption defaultChecked>PDF</FileFormatOption>
            <FileFormatOption>Gambar</FileFormatOption>
            <FileFormatOption>Tautan</FileFormatOption>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <OrgTypeSelected type="SEKOLAH_UNIVERSITAS" />
            <OrgTypeSelected type="LEMBAGA" />
            <OrgTypeSelected type="PERUSAHAAN" />
            <OrgTypeSelected type="INSTANSI_LAINNYA" />
          </div>
        </Section>

        <Section title="Tab, badge, skor, pagination">
          <Tabs defaultValue="perlu">
            <TabsList>
              <TabsTrigger value="perlu">
                Perlu dinilai <TabsCount>12</TabsCount>
              </TabsTrigger>
              <TabsTrigger value="revisi">
                Menunggu revisi <TabsCount>3</TabsCount>
              </TabsTrigger>
              <TabsTrigger value="sudah">Sudah dinilai</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Badge>Primary</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger" size="sm">
              Danger S
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <ScoreLevel key={score} score={score} />
            ))}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Section title="Umpan balik">
          <ToastDemo />
          <DialogDemo />
          <Alert tone="info" title="Organisasi sedang ditinjau">
            Administrator akan memeriksa data organisasi Anda.
          </Alert>
          <Alert tone="danger" title="Kode salah atau sudah kedaluwarsa" />
          <Alert tone="warning" title="Email belum diverifikasi" />
          <Alert tone="success" title="Organisasi disetujui">
            Bagikan kode organisasi ke anggota.
          </Alert>
          <div className="flex flex-col gap-2">
            <Progress value={33} label="Progres 33%" />
            <Progress value={67} label="Progres 67%" />
            <ProgressLegend />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <UploadItem
              name="rekaman-wawancara.mp4"
              size={6_400_000}
              progress={62}
            />
            <UploadItem
              name="video-final.mp4"
              size={24_000_000}
              progress={0}
              error="Ukuran melebihi batas 10 MB. Gunakan tautan YouTube/Google Drive."
            />
          </div>
          <InfoBox
            title="Aturan penilaian"
            items={[
              {
                title: "Kirim nilai & umpan balik",
                description: "Nilai dan catatan terlihat peserta.",
              },
              {
                title: "Minta revisi",
                description:
                  "Peserta mengirim versi baru sebelum batas revisi.",
              },
            ]}
          />
          <div className="flex items-center gap-3">
            <Skeleton shape="circle" className="size-10" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </Section>

        <Section title="Statistik dan kartu">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={CalendarDaysIcon}
              label="Acara aktif"
              value="8"
              delta="+2 minggu ini"
            />
            <StatCard
              icon={ClipboardCheckIcon}
              tone="warning"
              label="Perlu dinilai"
              value="12"
            />
            <StatCard
              icon={UsersIcon}
              tone="success"
              label="Peserta"
              value="146"
            />
            <StatCard
              icon={BookOpenIcon}
              tone="neutral"
              label="Materi"
              value="5"
              compact
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <EventCard
              title="Desain Ulang Aplikasi Kantin"
              field="UI/UX"
              organization="SMK Lugina Rancaekek"
              period="1–20 Des 2026 · 3 milestone"
              status="ongoing"
              isTeam
              enrollmentNote="Pendaftaran mandiri"
            />
            <EventCard
              title="Workshop Wireframe Sehari"
              field="Lokakarya"
              organization="Lembaga Kursus Cakap"
              period="5 Des 2026"
              status="finished"
              joined
              coverTone="peach"
            />
            <MaterialCard
              title="Dasar Figma untuk Pemula"
              category="Desain"
              description="Kenali frame, auto layout, dan komponen."
              organization="SMK Lugina Rancaekek"
              sections={6}
              duration="± 2 jam"
              learners={86}
              status="in-progress"
              progress={40}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <OrgLogo name="SMK Lugina" size="sm" />
            <OrgLogo name="SMK Lugina" />
            <OrgLogo name="SMK Lugina" size="lg" />
            <IconBox icon={BookOpenIcon} tone="sage" />
            <IconBox icon={CalendarDaysIcon} tone="lilac" size="lg" />
          </div>
        </Section>

        <Section title="Milestone dan rubrik">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <MilestoneItem
                order={1}
                title="Riset pengguna"
                status="Sudah dinilai"
                state="done"
              />
              <MilestoneItem
                order={2}
                title="Wireframe"
                status="Sedang dikerjakan"
                state="active"
              />
              <MilestoneItem
                order={3}
                title="Prototipe"
                status="Terkunci"
                state="locked"
              />
            </div>
            <div className="flex flex-col gap-4">
              <RubricCriterion order={1} name="Konsistensi" />
              <RubricScoreRow name="Kerapian" value={4} />
              <RubricDemo />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <MilestoneProgressCell status="graded" value="86" date="2 Des" />
            <MilestoneProgressCell status="submitted" date="3 Des" />
            <MilestoneProgressCell status="revision" value="Dikumpulkan" />
            <MilestoneProgressCell status="empty" />
          </div>
          <FileItem
            name="wireframe-v2.pdf"
            meta="2,4 MB · Berkas siap dilampirkan"
          />
        </Section>

        <Section title="Tabel, filter, dan kosong">
          <FilterBar search={<SearchInput aria-label="Cari anggota" />}>
            <Input aria-label="Peran" placeholder="Semua peran" />
            <Input aria-label="Status" placeholder="Semua status" />
          </FilterBar>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {["Aisyah Putri", "Budi Santoso"].map((name) => (
                  <TableRow key={name}>
                    <TableCell>
                      <UserRow
                        name={name}
                        detail={`${name.split(" ")[0].toLowerCase()}@gmail.com`}
                      />
                    </TableCell>
                    <TableCell>Guru</TableCell>
                    <TableCell>
                      <Badge tone="success">Aktif</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <EmptyState
            icon={InboxIcon}
            title="Belum ada pengajuan"
            description="Pengajuan Trainer dari anggota akan muncul di sini."
          />
        </Section>

        <Section title="Stepper">
          <Stepper steps={EVENT_STEPS} current={2} />
          <Stepper steps={MATERIAL_STEPS} current={1} />
        </Section>

        <Section title="Pola memuat">
          <SkeletonStatGrid />
          <SkeletonCardGrid count={3} />
          <SkeletonTable rows={3} />
        </Section>
      </div>
      <WizardActionBar
        step={2}
        total={5}
        back={<Button variant="secondary">Kembali</Button>}
        className="-mx-4 mt-6 sm:-mx-8 lg:-mx-12"
      >
        <Button variant="secondary">Simpan draf</Button>
        <Button>Lanjut ke rubrik</Button>
      </WizardActionBar>
    </AppShell>
  );
}
