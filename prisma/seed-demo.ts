import { hashPassword } from "better-auth/crypto";

import type { Prisma } from "../src/generated/prisma/client";
import type {
  MemberRole,
  OrganizationStatus,
  OrganizationType,
} from "../src/generated/prisma/enums";
import { seedScenarios } from "./seed-demo-scenarios";

/** Kode organisasi demo utama. Seed demo dilewati jika organisasi ini sudah ada. */
export const DEMO_ORGANIZATION_CODE = "BECRAFT1";
// Kode demo lama; database yang sudah di-seed dengan kode ini tidak di-seed ulang.
const LEGACY_DEMO_CODE = "LUGINA25";

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

const levels = (name: string) => ({
  level1: `${name} belum terlihat.`,
  level2: `${name} masih kurang.`,
  level3: `${name} cukup.`,
  level4: `${name} baik.`,
  level5: `${name} sangat baik.`,
});

/**
 * Data contoh untuk semua alur demo PRD: organisasi dengan semua status, semua role,
 * acara individu dan tim, revisi, nilai di bawah KKM, sertifikat, materi, dan pengajuan Trainer.
 * Semua akun demo memakai email @becraft.test dan kata sandi dari `DEMO_PASSWORD`.
 */
export async function seedDemo(
  db: Prisma.TransactionClient,
  { password, administratorId }: { password: string; administratorId: string },
) {
  const existing = await db.organization.findFirst({
    where: { code: { in: [DEMO_ORGANIZATION_CODE, LEGACY_DEMO_CODE] } },
  });
  if (existing) {
    console.log("Data demo sudah ada, dilewati.");
    return;
  }

  const hash = await hashPassword(password);

  async function createUser(name: string, emailName: string) {
    const user = await db.user.create({
      data: {
        name,
        email: `${emailName}@becraft.test`,
        emailVerified: true,
      },
    });
    await db.account.create({
      data: {
        providerId: "credential",
        accountId: user.id,
        userId: user.id,
        password: hash,
      },
    });
    return user;
  }

  async function createOrganization(data: {
    name: string;
    code: string;
    type: OrganizationType;
    status: OrganizationStatus;
    rejectionReason?: string;
  }) {
    const reviewed = data.status !== "PENDING";
    return db.organization.create({
      data: {
        ...data,
        contactEmail: `kontak.${data.code.toLowerCase()}@becraft.test`,
        contactPhone: "081200000000",
        reviewedById: reviewed ? administratorId : null,
        reviewedAt: reviewed ? daysFromNow(-20) : null,
        deactivatedAt: data.status === "DISABLED" ? daysFromNow(-2) : null,
      },
    });
  }

  // Organisasi dengan semua status.
  const demoOrg = await createOrganization({
    name: "SMK Harapan Bangsa",
    code: DEMO_ORGANIZATION_CODE,
    type: "SEKOLAH_UNIVERSITAS",
    status: "APPROVED",
  });
  const pending = await createOrganization({
    name: "Lembaga Kreatif Bandung",
    code: "KREATIF1",
    type: "LEMBAGA",
    status: "PENDING",
  });
  const rejected = await createOrganization({
    name: "PT Contoh Ditolak",
    code: "DITOLAK1",
    type: "PERUSAHAAN",
    status: "REJECTED",
    rejectionReason: "Dokumen legalitas organisasi belum dilampirkan.",
  });
  const disabled = await createOrganization({
    name: "Komunitas Desain Nonaktif",
    code: "NONAKTF1",
    type: "INSTANSI_LAINNYA",
    status: "DISABLED",
  });

  // Anggota organisasi.
  async function createMember(
    name: string,
    emailName: string,
    organizationId: string,
    role: MemberRole,
    extra: { isAdmin?: boolean; removed?: boolean } = {},
  ) {
    const user = await createUser(name, emailName);
    await db.membership.create({
      data: {
        userId: user.id,
        organizationId,
        role,
        isAdmin: extra.isAdmin ?? false,
        status: extra.removed ? "REMOVED" : "ACTIVE",
        removedAt: extra.removed ? daysFromNow(-1) : null,
      },
    });
    return user;
  }

  const siti = await createMember(
    "Siti Rahmawati",
    "admin.organisasi",
    demoOrg.id,
    "TRAINER",
    { isAdmin: true },
  );
  const budi = await createMember("Budi Santoso", "guru", demoOrg.id, "GURU");
  const rina = await createMember(
    "Rina Kusuma",
    "asesor",
    demoOrg.id,
    "ASESOR",
  );
  const andi = await createMember(
    "Andi Pratama",
    "trainer",
    demoOrg.id,
    "TRAINER",
  );
  const fajar = await createMember(
    "Fajar Hidayat",
    "dikeluarkan",
    demoOrg.id,
    "GURU",
    {
      removed: true,
    },
  );
  await createMember("Dewi Lestari", "pemohon", pending.id, "GURU", {
    isAdmin: true,
  });
  await createMember("Hendra Wijaya", "ditolak", rejected.id, "GURU", {
    isAdmin: true,
  });
  await createMember("Maya Sari", "nonaktif", disabled.id, "GURU", {
    isAdmin: true,
  });

  // Peserta (tanpa membership).
  const dimas = await createUser("Dimas Saputra", "peserta");
  const ayu = await createUser("Ayu Wulandari", "ayu");
  const rizky = await createUser("Rizky Maulana", "rizky");
  const nanda = await createUser("Nanda Putri", "nanda");
  const galih = await createUser("Galih Ramadhan", "galih");
  await createUser("Lina Marlina", "peserta.baru");

  // Pengajuan Trainer: satu menunggu, satu ditolak.
  await db.trainerRequest.create({
    data: {
      userId: budi.id,
      organizationId: demoOrg.id,
      plannedMaterial: "Dasar Fotografi Produk untuk Katalog Online",
    },
  });
  await db.trainerRequest.create({
    data: {
      userId: rina.id,
      organizationId: demoOrg.id,
      plannedMaterial: "Pengantar Desain UI",
      status: "REJECTED",
      rejectionReason:
        "Materi serupa sudah tersedia. Silakan ajukan topik lain.",
      reviewedById: siti.id,
      reviewedAt: daysFromNow(-3),
    },
  });

  // Kategori materi dan bidang bawaan dibuat oleh migrasi; yang custom milik organisasi.
  const desainProduk = await db.materialCategory.findFirstOrThrow({
    where: { organizationId: null, name: "Desain Produk" },
  });
  const desainKomunikasi = await db.materialCategory.findFirstOrThrow({
    where: { organizationId: null, name: "Desain Komunikasi" },
  });
  const fotografi = await db.materialCategory.create({
    data: { organizationId: demoOrg.id, name: "Fotografi Produk" },
  });
  const [bidangUiux, bidangPoster] = await Promise.all(
    ["UI/UX", "Poster"].map((name) =>
      db.subjectField.findFirstOrThrow({
        where: { organizationId: null, name },
      }),
    ),
  );
  const bidangAplikasi = await db.subjectField.create({
    data: { organizationId: demoOrg.id, name: "Pengembangan Aplikasi" },
  });

  // Materi Trainer.
  const materiPoster = await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: andi.id,
      categoryId: desainKomunikasi.id,
      title: "Dasar Tipografi untuk Poster",
      description: "Memilih dan memadukan huruf agar poster mudah dibaca.",
      level: "BEGINNER",
      coverColor: "sage",
      status: "PUBLISHED",
      publishedAt: daysFromNow(-14),
      sections: {
        create: [
          {
            order: 1,
            title: "Anatomi huruf",
            content: "Mengenal bagian-bagian huruf.",
          },
          {
            order: 2,
            title: "Hierarki teks",
            content: "Judul, subjudul, dan isi.",
          },
          {
            order: 3,
            title: "Studi kasus",
            link: "https://example.com/studi-kasus",
          },
          {
            order: 4,
            title: "Latihan",
            content: "Buat tiga variasi judul poster.",
          },
        ],
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: siti.id,
      categoryId: desainProduk.id,
      title: "Prototyping Kemasan Sederhana",
      description: "Membuat mockup kemasan dari kertas.",
      level: "INTERMEDIATE",
      coverColor: "sky",
      status: "PUBLISHED",
      publishedAt: daysFromNow(-7),
      sections: {
        create: [
          {
            order: 1,
            title: "Riset kemasan",
            content: "Mengamati kemasan di pasaran.",
          },
          {
            order: 2,
            title: "Pola dan lipatan",
            content: "Membuat pola kemasan.",
          },
        ],
      },
    },
  });
  await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: andi.id,
      categoryId: fotografi.id,
      title: "Foto Produk dengan Ponsel",
      level: "BEGINNER",
      coverColor: "sand",
    },
  });

  // Riwayat belajar: Dimas selesai, Ayu setengah jalan.
  await db.materialEnrollment.create({
    data: {
      materialId: materiPoster.id,
      userId: dimas.id,
      progress: 100,
      completedAt: daysFromNow(-5),
      sections: {
        create: materiPoster.sections.map((section) => ({
          sectionId: section.id,
        })),
      },
    },
  });
  await db.materialEnrollment.create({
    data: {
      materialId: materiPoster.id,
      userId: ayu.id,
      progress: 50,
      sections: {
        create: materiPoster.sections
          .slice(0, 2)
          .map((section) => ({ sectionId: section.id })),
      },
    },
  });

  // Rubrik dan salinan perubahannya.
  const rubrikPoster = await db.rubric.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Rubrik Desain Poster",
      fieldId: bidangPoster!.id,
      criteria: {
        create: [
          { order: 1, name: "Konsep", ...levels("Konsep") },
          { order: 2, name: "Tipografi", ...levels("Tipografi") },
          { order: 3, name: "Komposisi", ...levels("Komposisi") },
          { order: 4, name: "Kerapian", ...levels("Kerapian") },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });
  await db.rubric.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Rubrik Desain Poster",
      fieldId: bidangPoster!.id,
      sourceRubricId: rubrikPoster.id,
      version: 2,
      criteria: {
        create: [
          { order: 1, name: "Konsep", ...levels("Konsep") },
          { order: 2, name: "Tipografi", ...levels("Tipografi") },
          { order: 3, name: "Komposisi", ...levels("Komposisi") },
          { order: 4, name: "Kerapian", ...levels("Kerapian") },
          { order: 5, name: "Orisinalitas", ...levels("Orisinalitas") },
        ],
      },
    },
  });
  const rubrikAplikasi = await db.rubric.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: rina.id,
      title: "Rubrik Proyek Aplikasi",
      fieldId: bidangAplikasi.id,
      criteria: {
        create: [
          { order: 1, name: "Fungsionalitas", ...levels("Fungsionalitas") },
          { order: 2, name: "Antarmuka", ...levels("Antarmuka") },
          { order: 3, name: "Dokumentasi", ...levels("Dokumentasi") },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  const template = await db.certificateTemplate.create({
    data: { name: "Klasik", layout: "classic" },
  });
  await db.certificateTemplate.create({
    data: { name: "Modern", layout: "modern" },
  });

  const surveyQuestions = {
    create: [
      {
        order: 1,
        text: "Seberapa jelas instruksi milestone ini?",
        type: "RATING" as const,
      },
      {
        order: 2,
        text: "Bagian mana yang paling sulit?",
        type: "SINGLE_CHOICE" as const,
        options: ["Riset", "Eksekusi", "Presentasi"],
      },
      {
        order: 3,
        text: "Saran untuk milestone berikutnya",
        type: "TEXT" as const,
        required: false,
      },
    ],
  };

  // Acara individu yang sedang berjalan.
  const lomba = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Lomba Desain Poster Hari Guru",
      description: "Rancang poster bertema apresiasi guru.",
      fieldId: bidangPoster!.id,
      kkm: 75,
      startsAt: daysFromNow(-14),
      endsAt: daysFromNow(14),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-15),
      certificateEnabled: true,
      certificateTemplateId: template.id,
      materials: { create: { materialId: materiPoster.id } },
      milestones: {
        create: [
          {
            order: 1,
            title: "Sketsa konsep",
            instructions: "Unggah 3 sketsa konsep poster.",
            formats: ["PDF", "IMAGE", "LINK"],
            dueAt: daysFromNow(-7),
            rubricId: rubrikPoster.id,
            survey: {
              create: { title: "Survei Sketsa", questions: surveyQuestions },
            },
          },
          {
            order: 2,
            title: "Desain final",
            instructions: "Unggah desain final poster.",
            formats: ["PDF", "IMAGE", "LINK"],
            dueAt: daysFromNow(7),
            rubricId: rubrikPoster.id,
            survey: {
              create: {
                title: "Survei Desain Final",
                questions: surveyQuestions,
              },
            },
          },
        ],
      },
    },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: { survey: { include: { questions: true } } },
      },
    },
  });
  const [sketsa, final] = lomba.milestones;

  for (const user of [dimas, ayu, rizky, galih]) {
    await db.enrollment.create({
      data: { eventId: lomba.id, userId: user.id },
    });
  }

  async function fillSurvey(
    milestone: (typeof lomba.milestones)[number],
    userId: string,
  ) {
    const survey = milestone.survey!;
    await db.surveyResponse.create({
      data: {
        surveyId: survey.id,
        userId,
        answers: {
          create: survey.questions.map((question) => ({
            questionId: question.id,
            value:
              question.type === "RATING"
                ? "4"
                : question.type === "SINGLE_CHOICE"
                  ? question.options[0]!
                  : "Contoh yang lebih banyak.",
          })),
        },
      },
    });
  }

  async function submitAndGrade(
    milestoneId: string,
    userId: string,
    scores: number[] | null,
    { version = 1, graderId = budi.id } = {},
  ) {
    const submission = await db.submission.create({
      data: {
        milestoneId,
        userId,
        version,
        link: `https://example.com/karya/${userId}/${milestoneId}/v${version}`,
        status: scores ? "GRADED" : "SUBMITTED",
      },
    });
    if (scores) {
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const maxScore = scores.length * 5;
      await db.grade.create({
        data: {
          submissionId: submission.id,
          graderId,
          totalScore,
          maxScore,
          score: (totalScore / maxScore) * 100,
          feedback: "Terima kasih, lanjutkan kerja bagusnya.",
          scores: {
            create: scores.map((score, index) => ({
              criterionId: rubrikPoster.criteria[index]!.id,
              score,
            })),
          },
        },
      });
    }
    return submission;
  }

  // Dimas: dua milestone dinilai, nilai akhir ≥ KKM → sertifikat.
  await submitAndGrade(sketsa!.id, dimas.id, [5, 4, 4, 4]);
  await fillSurvey(sketsa!, dimas.id);
  await submitAndGrade(final!.id, dimas.id, [5, 5, 4, 4]);
  await fillSurvey(final!, dimas.id);
  const dimasFinalScore = ((17 / 20) * 100 + (18 / 20) * 100) / 2;
  const dimasEnrollment = await db.enrollment.findUniqueOrThrow({
    where: { eventId_userId: { eventId: lomba.id, userId: dimas.id } },
  });
  await db.certificate.create({
    data: {
      enrollmentId: dimasEnrollment.id,
      templateId: template.id,
      number: "BCR-2026-0001",
      recipientName: dimas.name,
      finalScore: dimasFinalScore,
    },
  });

  // Ayu: diminta revisi, lalu mengirim versi 2 yang menunggu pemeriksaan.
  const ayuV1 = await submitAndGrade(sketsa!.id, ayu.id, null);
  await db.submission.update({
    where: { id: ayuV1.id },
    data: { status: "REVISION_REQUESTED" },
  });
  await db.revisionRequest.create({
    data: {
      submissionId: ayuV1.id,
      requestedById: budi.id,
      note: "Perjelas hierarki judul dan tambahkan satu alternatif warna.",
    },
  });
  await submitAndGrade(sketsa!.id, ayu.id, null, { version: 2 });
  await fillSurvey(sketsa!, ayu.id);

  // Rizky: dinilai di bawah KKM.
  await submitAndGrade(sketsa!.id, rizky.id, [2, 3, 2, 3]);
  await fillSurvey(sketsa!, rizky.id);
  await submitAndGrade(final!.id, rizky.id, [3, 3, 2, 3]);
  await fillSurvey(final!, rizky.id);

  // Galih: sudah mengumpulkan tetapi survei belum diisi (milestone 2 masih terkunci).
  await submitAndGrade(sketsa!.id, galih.id, null);

  // Acara tim.
  const proyek = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: rina.id,
      title: "Proyek Aplikasi Kantin Sekolah",
      description:
        "Bangun prototipe aplikasi pemesanan kantin secara berkelompok.",
      fieldId: bidangAplikasi.id,
      participantType: "TEAM",
      maxTeamMembers: 4,
      kkm: 70,
      startsAt: daysFromNow(3),
      endsAt: daysFromNow(30),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-2),
      certificateEnabled: true,
      certificateTemplateId: template.id,
      milestones: {
        create: [
          {
            order: 1,
            title: "Rancangan alur",
            formats: ["PDF"],
            dueAt: daysFromNow(10),
            rubricId: rubrikAplikasi.id,
            survey: {
              create: { title: "Survei Rancangan", questions: surveyQuestions },
            },
          },
          {
            order: 2,
            title: "Prototipe",
            formats: ["LINK"],
            dueAt: daysFromNow(28),
            rubricId: rubrikAplikasi.id,
            survey: {
              create: { title: "Survei Prototipe", questions: surveyQuestions },
            },
          },
        ],
      },
    },
  });
  const tim = await db.team.create({
    data: {
      eventId: proyek.id,
      leaderId: dimas.id,
      name: "Kelompok Dimas Saputra",
    },
  });
  for (const user of [dimas, nanda]) {
    await db.enrollment.create({
      data: { eventId: proyek.id, userId: user.id, teamId: tim.id },
    });
  }
  await db.teamInvite.create({
    data: {
      teamId: tim.id,
      inviteeId: nanda.id,
      inviterId: dimas.id,
      status: "ACCEPTED",
      respondedAt: daysFromNow(-1),
    },
  });
  await db.teamInvite.create({
    data: { teamId: tim.id, inviteeId: rizky.id, inviterId: dimas.id },
  });
  await db.teamInvite.create({
    data: {
      teamId: tim.id,
      inviteeId: ayu.id,
      inviterId: dimas.id,
      status: "REJECTED",
      respondedAt: daysFromNow(-1),
    },
  });

  // Draf acara Guru.
  await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Workshop Wireframe Sehari",
      fieldId: bidangUiux!.id,
      startsAt: daysFromNow(20),
      endsAt: daysFromNow(20),
      draftStep: 2,
    },
  });

  // Acara organisasi nonaktif (dijeda untuk peserta).
  const nonaktifCreator = await db.membership.findFirstOrThrow({
    where: { organizationId: disabled.id },
  });
  await db.event.create({
    data: {
      organizationId: disabled.id,
      creatorId: nonaktifCreator.userId,
      title: "Kelas Ilustrasi Digital",
      fieldId: bidangPoster!.id,
      startsAt: daysFromNow(-5),
      endsAt: daysFromNow(10),
      status: "PUBLISHED",
      publishedAt: daysFromNow(-6),
    },
  });

  await seedScenarios(db, {
    administratorId,
    createUser,
    createMember,
    createOrganization,
    demoOrg,
    pending,
    users: { siti, budi, rina, andi, fajar, dimas, ayu, rizky, nanda, galih },
    rubrikPoster,
    rubrikAplikasi,
    template,
    surveyQuestions,
    fields: {
      uiux: bidangUiux!,
      poster: bidangPoster!,
      aplikasi: bidangAplikasi,
    },
    categories: { desainProduk, desainKomunikasi, fotografi },
    lomba,
    proyek,
    tim,
    ayuRevision: ayuV1,
    materiPoster,
  });

  console.log(
    "Data demo siap. Daftar akun dan skenario: docs/skenario-uji.md.",
  );
}
