import type { Prisma } from "../src/generated/prisma/client";
import type {
  MemberRole,
  OrganizationStatus,
  OrganizationType,
  SubmissionFormat,
} from "../src/generated/prisma/enums";

type Person = { id: string; name: string };
type RubricRef = { id: string; criteria: { id: string }[] };
type Ref = { id: string };

type Context = {
  administratorId: string;
  createUser: (name: string, emailName: string) => Promise<Person>;
  createMember: (
    name: string,
    emailName: string,
    organizationId: string,
    role: MemberRole,
    extra?: { isAdmin?: boolean; removed?: boolean },
  ) => Promise<Person>;
  createOrganization: (data: {
    name: string;
    code: string;
    type: OrganizationType;
    status: OrganizationStatus;
  }) => Promise<Ref & { name: string }>;
  demoOrg: Ref & { name: string };
  pending: Ref & { name: string };
  users: Record<
    | "siti"
    | "budi"
    | "rina"
    | "andi"
    | "fajar"
    | "dimas"
    | "ayu"
    | "rizky"
    | "nanda"
    | "galih",
    Person
  >;
  rubrikPoster: RubricRef;
  rubrikAplikasi: RubricRef;
  template: Ref;
  surveyQuestions: Prisma.SurveyQuestionCreateNestedManyWithoutSurveyInput;
  fields: Record<"uiux" | "poster" | "aplikasi", Ref>;
  categories: Record<"desainProduk" | "desainKomunikasi" | "fotografi", Ref>;
  lomba: Ref & { title: string };
  proyek: Ref & { title: string };
  tim: Ref & { name: string };
  ayuRevision: Ref;
  materiPoster: Ref & { title: string };
};

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
 * Skenario uji tambahan di atas data demo dasar: organisasi kedua (uji isolasi),
 * acara selesai/ditutup/diarsipkan/akan datang/siap terbit/dialihkan, acara tim yang berjalan
 * dan dinilai Asesor, materi dengan semua status dan visibilitas, akun terhapus,
 * serta notifikasi untuk setiap role. Lihat docs/skenario-uji.md.
 */
export async function seedScenarios(
  db: Prisma.TransactionClient,
  ctx: Context,
) {
  const { demoOrg, users, fields, categories, template } = ctx;
  const { siti, budi, rina, andi, fajar, dimas, ayu, rizky, nanda, galih } =
    users;

  function milestone(
    order: number,
    title: string,
    dueInDays: number,
    rubricId: string,
    formats: SubmissionFormat[] = ["PDF", "IMAGE", "LINK", "TEXT"],
  ) {
    return {
      order,
      title,
      instructions: `Kerjakan ${title.toLowerCase()} sesuai arahan acara.`,
      formats,
      dueAt: daysFromNow(dueInDays),
      rubricId,
      survey: {
        create: { title: `Survei ${title}`, questions: ctx.surveyQuestions },
      },
    };
  }

  const withMilestones = {
    milestones: {
      orderBy: { order: "asc" },
      include: { survey: { include: { questions: true } } },
    },
  } satisfies Prisma.EventInclude;
  type SeededMilestone = Prisma.MilestoneGetPayload<{
    include: { survey: { include: { questions: true } } };
  }>;

  async function submit(
    target: SeededMilestone,
    userId: string,
    options: {
      scores?: number[];
      rubric?: RubricRef;
      graderId?: string;
      version?: number;
      text?: boolean;
      survey?: boolean;
      revisionNote?: string;
      daysAgo?: number;
    } = {},
  ) {
    const { scores, rubric, version = 1, daysAgo = 1 } = options;
    const submission = await db.submission.create({
      data: {
        milestoneId: target.id,
        userId,
        version,
        ...(options.text
          ? { text: `Catatan pengerjaan ${target.title.toLowerCase()}.` }
          : {
              link: `https://example.com/karya/${userId}/${target.id}/v${version}`,
            }),
        status: scores
          ? "GRADED"
          : options.revisionNote
            ? "REVISION_REQUESTED"
            : "SUBMITTED",
        submittedAt: daysFromNow(-daysAgo),
      },
    });
    if (options.revisionNote) {
      await db.revisionRequest.create({
        data: {
          submissionId: submission.id,
          requestedById: options.graderId ?? budi.id,
          note: options.revisionNote,
        },
      });
    }
    if (scores && rubric) {
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const maxScore = scores.length * 5;
      await db.grade.create({
        data: {
          submissionId: submission.id,
          graderId: options.graderId ?? budi.id,
          totalScore,
          maxScore,
          score: (totalScore / maxScore) * 100,
          feedback:
            "Sudah sesuai rubrik. Perhatikan catatan pada tiap kriteria.",
          scores: {
            create: scores.map((score, index) => ({
              criterionId: rubric.criteria[index]!.id,
              score,
            })),
          },
        },
      });
    }
    if (options.survey ?? Boolean(scores)) {
      await db.surveyResponse.create({
        data: {
          surveyId: target.survey!.id,
          userId,
          answers: {
            create: target.survey!.questions.map((question) => ({
              questionId: question.id,
              value:
                question.type === "RATING"
                  ? "5"
                  : question.type === "SINGLE_CHOICE"
                    ? question.options[1]!
                    : "Waktu pengerjaan sudah cukup.",
            })),
          },
        },
      });
    }
    return submission;
  }

  const percent = (scores: number[]) =>
    (scores.reduce((sum, score) => sum + score, 0) / (scores.length * 5)) * 100;

  // --- Anggota dan akun tambahan ---
  const sari = await ctx.createMember(
    "Sari Dewanti",
    "guru2",
    demoOrg.id,
    "GURU",
  );
  const selesai = await ctx.createUser("Putri Anjani", "peserta.selesai");
  const unverified = await ctx.createUser("Bagas Nugroho", "belum.verifikasi");
  await db.user.update({
    where: { id: unverified.id },
    data: { emailVerified: false },
  });
  // Akun Peserta yang sudah dihapus: kiriman dan nilainya tetap tampil sebagai "Akun dihapus".
  const deleted = await db.user.create({
    data: {
      name: "Akun dihapus",
      email: "deleted+seed@becraft.invalid",
      emailVerified: true,
      status: "DELETED",
      deletedAt: daysFromNow(-4),
    },
  });

  await db.trainerRequest.create({
    data: {
      userId: andi.id,
      organizationId: demoOrg.id,
      plannedMaterial: "Dasar Tipografi untuk Poster",
      status: "APPROVED",
      reviewedById: siti.id,
      reviewedAt: daysFromNow(-30),
    },
  });

  // --- Organisasi kedua yang aktif (uji isolasi antar-organisasi) dan pengajuan kedua ---
  const poltek = await ctx.createOrganization({
    name: "Politeknik Karya Mandiri",
    code: "POLTEK01",
    type: "SEKOLAH_UNIVERSITAS",
    status: "APPROVED",
  });
  const yoga = await ctx.createMember(
    "Yoga Permana",
    "admin.organisasi2",
    poltek.id,
    "GURU",
    { isAdmin: true },
  );
  const tari = await ctx.createMember(
    "Tari Anggraini",
    "trainer2",
    poltek.id,
    "TRAINER",
  );
  const yayasan = await ctx.createOrganization({
    name: "Yayasan Cipta Karya",
    code: "YAYASAN1",
    type: "INSTANSI_LAINNYA",
    status: "PENDING",
  });
  await ctx.createMember("Indra Gunawan", "pemohon2", yayasan.id, "GURU", {
    isAdmin: true,
  });
  const rubrikPoltek = await db.rubric.create({
    data: {
      organizationId: poltek.id,
      creatorId: yoga.id,
      title: "Rubrik Basis Data Poltek",
      fieldId: fields.uiux.id,
      criteria: {
        create: [
          { order: 1, name: "Rancangan", ...levels("Rancangan") },
          { order: 2, name: "Normalisasi", ...levels("Normalisasi") },
        ],
      },
    },
  });
  const materiPoltek = await db.material.create({
    data: {
      organizationId: poltek.id,
      trainerId: tari.id,
      categoryId: categories.desainProduk.id,
      title: "Pengantar Riset Pengguna",
      description: "Menyusun pertanyaan wawancara dan merangkum temuan.",
      outcomes: ["Menyusun panduan wawancara", "Merangkum temuan riset"],
      level: "BEGINNER",
      coverColor: "sky",
      status: "PUBLISHED",
      publishedAt: daysFromNow(-9),
      sections: {
        create: [
          {
            order: 1,
            title: "Mengapa riset",
            content: "Tujuan riset pengguna.",
          },
          { order: 2, title: "Wawancara", content: "Teknik bertanya terbuka." },
        ],
      },
    },
  });
  const acaraPoltek = await db.event.create({
    data: {
      organizationId: poltek.id,
      creatorId: yoga.id,
      title: "Tantangan Riset Pengguna Kampus",
      description: "Riset kebutuhan mahasiswa terhadap layanan kampus.",
      fieldId: fields.uiux.id,
      kkm: 70,
      startsAt: daysFromNow(-3),
      endsAt: daysFromNow(21),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-5),
      materials: { create: { materialId: materiPoltek.id } },
      milestones: {
        create: [milestone(1, "Rencana riset", 10, rubrikPoltek.id)],
      },
    },
  });
  await db.enrollment.create({
    data: { eventId: acaraPoltek.id, userId: nanda.id },
  });

  // --- Rubrik: belum dipakai (bisa diedit) dan milik pengajar lain ---
  await db.rubric.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Rubrik Presentasi Karya",
      fieldId: fields.uiux.id,
      criteria: {
        create: [
          { order: 1, name: "Penyampaian", ...levels("Penyampaian") },
          { order: 2, name: "Isi", ...levels("Isi") },
          { order: 3, name: "Tanya jawab", ...levels("Tanya jawab") },
        ],
      },
    },
  });
  const rubrikInfografis = await db.rubric.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: sari.id,
      title: "Rubrik Infografis",
      fieldId: fields.poster.id,
      criteria: {
        create: [
          { order: 1, name: "Akurasi data", ...levels("Akurasi data") },
          { order: 2, name: "Visual", ...levels("Visual") },
          { order: 3, name: "Keterbacaan", ...levels("Keterbacaan") },
        ],
      },
    },
    include: { criteria: { orderBy: { order: "asc" } } },
  });

  // --- Materi: hanya lewat acara, tanpa acara, arsip, lanjutan, dan cukup banyak untuk paginasi ---
  const materiKartuNama = await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: andi.id,
      categoryId: categories.desainKomunikasi.id,
      title: "Panduan Ukuran dan Cetak Kartu Nama",
      description: "Ukuran standar, margin aman, dan persiapan berkas cetak.",
      outcomes: [
        "Menentukan ukuran dan margin aman",
        "Menyiapkan berkas cetak",
      ],
      level: "BEGINNER",
      coverColor: "sand",
      status: "PUBLISHED",
      visibility: "EVENT_ONLY",
      publishedAt: daysFromNow(-6),
      sections: {
        create: [
          {
            order: 1,
            title: "Ukuran standar",
            content: "9 × 5,5 cm.",
            durationMinutes: 5,
          },
          {
            order: 2,
            title: "Referensi",
            link: "https://example.com/kartu-nama",
            durationMinutes: 10,
          },
        ],
      },
    },
  });
  const materiTanpaAcara = await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: andi.id,
      categoryId: categories.fotografi.id,
      title: "Menata Cahaya untuk Foto Produk",
      description: "Materi khusus acara yang acaranya sudah dilepas.",
      level: "INTERMEDIATE",
      coverColor: "sage",
      status: "PUBLISHED",
      visibility: "EVENT_ONLY",
      publishedAt: daysFromNow(-12),
      sections: {
        create: [
          { order: 1, title: "Cahaya alami", content: "Memakai jendela." },
        ],
      },
    },
  });
  const materiArsip = await db.material.create({
    data: {
      organizationId: demoOrg.id,
      trainerId: andi.id,
      categoryId: categories.desainKomunikasi.id,
      title: "Teori Warna Dasar (versi lama)",
      description: "Diarsipkan; peserta lama tetap bisa membukanya.",
      level: "BEGINNER",
      coverColor: "sky",
      status: "ARCHIVED",
      publishedAt: daysFromNow(-60),
      archivedAt: daysFromNow(-8),
      sections: {
        create: [
          {
            order: 1,
            title: "Roda warna",
            content: "Primer, sekunder, tersier.",
          },
          {
            order: 2,
            title: "Harmoni warna",
            content: "Komplementer dan analog.",
          },
        ],
      },
    },
    include: { sections: true },
  });
  await db.materialEnrollment.create({
    data: {
      materialId: materiArsip.id,
      userId: rizky.id,
      progress: 100,
      completedAt: daysFromNow(-20),
      sections: {
        create: materiArsip.sections.map((section) => ({
          sectionId: section.id,
        })),
      },
    },
  });
  const paginated = [
    ["Sistem Grid untuk Tata Letak", "ADVANCED", "sage", siti.id],
    ["Menulis Brief Desain", "BEGINNER", "sand", andi.id],
    ["Dasar Ilustrasi Vektor", "BEGINNER", "sky", andi.id],
    ["Membuat Moodboard", "BEGINNER", "sage", siti.id],
    ["Presentasi Karya ke Klien", "INTERMEDIATE", "sand", andi.id],
    ["Menyusun Portofolio Digital", "INTERMEDIATE", "sky", siti.id],
  ] as const;
  for (const [
    index,
    [title, level, coverColor, trainerId],
  ] of paginated.entries()) {
    await db.material.create({
      data: {
        organizationId: demoOrg.id,
        trainerId,
        categoryId:
          index % 2 === 0
            ? categories.desainKomunikasi.id
            : categories.desainProduk.id,
        title,
        description: `Materi ${title.toLowerCase()} untuk latihan mandiri.`,
        outcomes: [
          `Memahami ${title.toLowerCase()}`,
          "Menerapkannya pada karya sendiri",
        ],
        level,
        coverColor,
        status: "PUBLISHED",
        publishedAt: daysFromNow(-(index + 1)),
        sections: {
          create: [
            {
              order: 1,
              title: "Pengantar",
              content: `Gambaran ${title.toLowerCase()}.`,
              durationMinutes: 10,
            },
            {
              order: 2,
              title: "Contoh",
              link: "https://example.com/contoh",
              durationMinutes: 15,
            },
            {
              order: 3,
              title: "Latihan",
              content: "Kerjakan latihan singkat.",
              durationMinutes: 20,
            },
          ],
        },
      },
    });
  }
  // Nanda baru mengikuti materi (0%).
  await db.materialEnrollment.create({
    data: { materialId: ctx.materiPoster.id, userId: nanda.id },
  });

  // --- Acara selesai: dibuat Guru lain, dinilai Asesor, ada lulus, tidak lulus, dan akun terhapus ---
  const infografis = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: sari.id,
      title: "Kompetisi Infografis Kemerdekaan",
      description: "Sajikan data sejarah kemerdekaan dalam satu infografis.",
      guidelines: "Cantumkan sumber data di bagian bawah karya.",
      fieldId: fields.poster.id,
      kkm: 75,
      startsAt: daysFromNow(-45),
      endsAt: daysFromNow(-10),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-50),
      certificateEnabled: true,
      certificateTemplateId: template.id,
      milestones: {
        create: [
          milestone(1, "Riset data", -35, rubrikInfografis.id),
          milestone(2, "Infografis final", -12, rubrikInfografis.id),
        ],
      },
    },
    include: withMilestones,
  });
  const [riset, infografisFinal] = infografis.milestones;
  const results: [Person, number[], number[]][] = [
    [dimas, [5, 4, 5], [4, 5, 5]],
    [selesai, [4, 4, 4], [5, 4, 4]],
    [rizky, [3, 2, 3], [3, 3, 2]],
    [deleted, [4, 4, 5], [4, 4, 4]],
  ];
  for (const [index, [user, first, second]] of results.entries()) {
    const enrollment = await db.enrollment.create({
      data: { eventId: infografis.id, userId: user.id },
    });
    await submit(riset!, user.id, {
      scores: first,
      rubric: rubrikInfografis,
      graderId: rina.id,
      daysAgo: 36,
      text: index === 1,
    });
    await submit(infografisFinal!, user.id, {
      scores: second,
      rubric: rubrikInfografis,
      graderId: rina.id,
      daysAgo: 13,
    });
    const finalScore = (percent(first) + percent(second)) / 2;
    if (finalScore >= infografis.kkm && user.id !== deleted.id) {
      await db.certificate.create({
        data: {
          enrollmentId: enrollment.id,
          templateId: template.id,
          number: `BCR-2026-SEED0${index + 2}`,
          recipientName: user.name,
          finalScore,
          issuedAt: daysFromNow(-11),
        },
      });
    }
  }

  // --- Acara ditutup lebih awal dan acara diarsipkan ---
  const kilat = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Kelas Kilat Desain Logo",
      description: "Ditutup lebih awal oleh pengajar.",
      fieldId: fields.poster.id,
      startsAt: daysFromNow(-20),
      endsAt: daysFromNow(5),
      status: "CLOSED",
      draftStep: 5,
      publishedAt: daysFromNow(-22),
      closedAt: daysFromNow(-3),
      milestones: {
        create: [milestone(1, "Sketsa logo", -10, ctx.rubrikPoster.id)],
      },
    },
    include: withMilestones,
  });
  await db.enrollment.create({ data: { eventId: kilat.id, userId: galih.id } });
  await submit(kilat.milestones[0]!, galih.id, {
    scores: [4, 4, 3, 4],
    rubric: ctx.rubrikPoster,
    daysAgo: 12,
  });
  await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Lomba Maskot Sekolah 2025",
      description: "Arsip acara tahun lalu.",
      fieldId: fields.poster.id,
      startsAt: daysFromNow(-200),
      endsAt: daysFromNow(-170),
      status: "ARCHIVED",
      draftStep: 5,
      publishedAt: daysFromNow(-205),
      archivedAt: daysFromNow(-150),
      milestones: {
        create: [milestone(1, "Desain maskot", -175, ctx.rubrikPoster.id)],
      },
    },
  });

  // --- Acara akan datang buatan Trainer, pendaftaran terbuka, dengan materi khusus acara ---
  await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: andi.id,
      title: "Tantangan Desain Kartu Nama",
      description: "Rancang kartu nama untuk usaha kecil di sekitar Anda.",
      guidelines: "Gunakan maksimal dua jenis huruf.",
      fieldId: fields.poster.id,
      kkm: 70,
      startsAt: daysFromNow(7),
      endsAt: daysFromNow(28),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-1),
      certificateEnabled: true,
      certificateTemplateId: template.id,
      materials: { create: { materialId: materiKartuNama.id } },
      milestones: {
        create: [
          milestone(1, "Konsep kartu nama", 14, ctx.rubrikPoster.id),
          milestone(2, "Desain siap cetak", 27, ctx.rubrikPoster.id),
        ],
      },
    },
  });

  // --- Draf lengkap yang siap diterbitkan ---
  await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: budi.id,
      title: "Pameran Karya Akhir Semester",
      description: "Kurasi dan presentasi karya terbaik semester ini.",
      guidelines: "Setiap peserta memilih satu karya terbaik.",
      fieldId: fields.uiux.id,
      kkm: 75,
      startsAt: daysFromNow(10),
      endsAt: daysFromNow(40),
      draftStep: 5,
      certificateEnabled: true,
      certificateTemplateId: template.id,
      certificateTitle: "Sertifikat Pameran Karya",
      certificateIssuer: demoOrg.name,
      certificateSigner: budi.name,
      milestones: {
        create: [
          milestone(1, "Pilih karya", 20, ctx.rubrikPoster.id),
          milestone(2, "Presentasi", 38, ctx.rubrikPoster.id),
        ],
      },
    },
  });

  // --- Acara yang dialihkan ke Admin Organisasi setelah pembuatnya dikeluarkan ---
  const canva = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: siti.id,
      transferredFromId: fajar.id,
      title: "Pelatihan Dasar Desain Presentasi",
      description: "Dibuat Fajar Hidayat, kini dikelola Admin Organisasi.",
      fieldId: fields.uiux.id,
      startsAt: daysFromNow(-2),
      endsAt: daysFromNow(12),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-4),
      milestones: {
        create: [milestone(1, "Slide pembuka", 6, ctx.rubrikPoster.id)],
      },
    },
    include: withMilestones,
  });
  await db.enrollment.create({ data: { eventId: canva.id, userId: galih.id } });
  const galihSlide = await submit(canva.milestones[0]!, galih.id, {
    text: true,
  });

  // --- Acara tim yang sedang berjalan, dinilai Asesor ---
  const hackathon = await db.event.create({
    data: {
      organizationId: demoOrg.id,
      creatorId: rina.id,
      title: "Hackathon Aplikasi Sekolah",
      description:
        "Bangun aplikasi sederhana untuk kebutuhan sekolah secara berkelompok.",
      guidelines: "Setiap anggota mengumpulkan dan dinilai sendiri.",
      fieldId: fields.aplikasi.id,
      participantType: "TEAM",
      maxTeamMembers: 3,
      kkm: 70,
      startsAt: daysFromNow(-10),
      endsAt: daysFromNow(20),
      status: "PUBLISHED",
      draftStep: 5,
      publishedAt: daysFromNow(-14),
      certificateEnabled: true,
      certificateTemplateId: template.id,
      milestones: {
        create: [
          milestone(1, "Proposal ide", 2, ctx.rubrikAplikasi.id),
          milestone(2, "Demo aplikasi", 18, ctx.rubrikAplikasi.id),
        ],
      },
    },
    include: withMilestones,
  });
  const [proposal] = hackathon.milestones;
  // Tim penuh (3 dari 3).
  const timAyu = await db.team.create({
    data: { eventId: hackathon.id, leaderId: ayu.id, name: "Tim Kode Ceria" },
  });
  for (const user of [ayu, nanda, galih]) {
    await db.enrollment.create({
      data: { eventId: hackathon.id, userId: user.id, teamId: timAyu.id },
    });
    if (user.id !== ayu.id) {
      await db.teamInvite.create({
        data: {
          teamId: timAyu.id,
          inviteeId: user.id,
          inviterId: ayu.id,
          status: "ACCEPTED",
          respondedAt: daysFromNow(-12),
        },
      });
    }
  }
  // Tim dengan satu anggota dan undangan yang dibatalkan.
  const timRizky = await db.team.create({
    data: {
      eventId: hackathon.id,
      leaderId: rizky.id,
      name: "Kelompok Rizky Maulana",
    },
  });
  await db.enrollment.create({
    data: { eventId: hackathon.id, userId: rizky.id, teamId: timRizky.id },
  });
  await db.teamInvite.create({
    data: {
      teamId: timRizky.id,
      inviteeId: selesai.id,
      inviterId: rizky.id,
      status: "CANCELLED",
      respondedAt: daysFromNow(-9),
    },
  });
  // Ayu dinilai Asesor (milestone 2 terbuka), Nanda menunggu dinilai, Galih belum mengumpulkan,
  // Rizky diminta revisi.
  const ayuProposal = await submit(proposal!, ayu.id, {
    scores: [4, 5, 4],
    rubric: ctx.rubrikAplikasi,
    graderId: rina.id,
    daysAgo: 4,
  });
  const nandaProposal = await submit(proposal!, nanda.id, {
    survey: true,
    daysAgo: 3,
  });
  await submit(proposal!, rizky.id, {
    graderId: rina.id,
    revisionNote: "Jelaskan pengguna sasaran dan masalah yang diselesaikan.",
    daysAgo: 3,
  });

  // --- Notifikasi untuk setiap role ---
  const administratorOrgs = [ctx.pending, yayasan];
  await db.notification.createMany({
    data: [
      ...administratorOrgs.map((organization) => ({
        userId: ctx.administratorId,
        type: "organization.submitted",
        payload: {
          organizationId: organization.id,
          organizationName: organization.name,
        },
      })),
      {
        userId: siti.id,
        type: "trainer-request.submitted",
        payload: { userName: budi.name },
      },
      {
        userId: siti.id,
        type: "member.joined",
        payload: { userName: sari.name, organizationName: demoOrg.name },
        readAt: daysFromNow(-2),
      },
      {
        userId: siti.id,
        type: "event.transferred",
        payload: { eventId: canva.id, eventTitle: canva.title },
      },
      {
        userId: siti.id,
        type: "submission.new",
        payload: {
          userName: galih.name,
          eventId: canva.id,
          eventTitle: canva.title,
          milestoneTitle: canva.milestones[0]!.title,
          submissionId: galihSlide.id,
        },
      },
      {
        userId: budi.id,
        type: "submission.revised",
        payload: {
          userName: ayu.name,
          eventId: ctx.lomba.id,
          eventTitle: ctx.lomba.title,
          milestoneTitle: "Sketsa konsep",
          submissionId: ctx.ayuRevision.id,
        },
      },
      {
        userId: rina.id,
        type: "trainer-request.rejected",
        payload: {
          reason: "Materi serupa sudah tersedia. Silakan ajukan topik lain.",
        },
      },
      {
        userId: rina.id,
        type: "submission.new",
        payload: {
          userName: nanda.name,
          eventId: hackathon.id,
          eventTitle: hackathon.title,
          milestoneTitle: proposal!.title,
          submissionId: nandaProposal.id,
        },
      },
      {
        userId: andi.id,
        type: "trainer-request.approved",
        payload: { organizationName: demoOrg.name },
        readAt: daysFromNow(-29),
      },
      {
        userId: andi.id,
        type: "material.enrolled",
        payload: {
          materialId: ctx.materiPoster.id,
          materialTitle: ctx.materiPoster.title,
          count: "3",
        },
      },
      {
        userId: andi.id,
        type: "material.unreachable",
        payload: {
          materialId: materiTanpaAcara.id,
          materialTitle: materiTanpaAcara.title,
          eventTitle: "Kelas Kilat Desain Logo",
        },
      },
      {
        userId: budi.id,
        type: "material.attached",
        payload: {
          eventId: ctx.lomba.id,
          eventTitle: ctx.lomba.title,
          materialTitle: ctx.materiPoster.title,
        },
        readAt: daysFromNow(-14),
      },
      {
        userId: dimas.id,
        type: "certificate.issued",
        payload: {
          eventTitle: ctx.lomba.title,
          certificateNumber: "BCR-2026-0001",
        },
      },
      {
        userId: dimas.id,
        type: "team.invite-rejected",
        payload: {
          userName: ayu.name,
          teamName: ctx.tim.name,
          eventId: ctx.proyek.id,
        },
        readAt: daysFromNow(-1),
      },
      {
        userId: ayu.id,
        type: "revision.requested",
        payload: {
          eventId: ctx.lomba.id,
          eventTitle: ctx.lomba.title,
          milestoneTitle: "Sketsa konsep",
          milestoneOrder: "1",
        },
        readAt: daysFromNow(-1),
      },
      {
        userId: ayu.id,
        type: "grade.published",
        payload: {
          eventId: hackathon.id,
          eventTitle: hackathon.title,
          milestoneTitle: proposal!.title,
          milestoneOrder: "1",
          score: "87",
          submissionId: ayuProposal.id,
        },
      },
      {
        userId: ayu.id,
        type: "milestone.unlocked",
        payload: {
          eventId: hackathon.id,
          eventTitle: hackathon.title,
          milestoneTitle: "Demo aplikasi",
          milestoneOrder: "2",
        },
      },
      {
        userId: rizky.id,
        type: "revision.requested",
        payload: {
          eventId: hackathon.id,
          eventTitle: hackathon.title,
          milestoneTitle: proposal!.title,
          milestoneOrder: "1",
        },
      },
      {
        userId: nanda.id,
        type: "event.updated",
        payload: {
          eventId: hackathon.id,
          eventTitle: hackathon.title,
          change: "Tenggat Proposal ide diperbarui",
        },
      },
    ],
  });

  // Undangan tim yang menunggu (acara tim yang belum mulai) beserta notifikasinya.
  const invite = await db.teamInvite.findFirstOrThrow({
    where: { teamId: ctx.tim.id, inviteeId: rizky.id, status: "PENDING" },
  });
  await db.notification.create({
    data: {
      userId: rizky.id,
      type: "team.invited",
      payload: {
        userName: dimas.name,
        teamName: ctx.tim.name,
        eventTitle: ctx.proyek.title,
        inviteId: invite.id,
      },
    },
  });
}
