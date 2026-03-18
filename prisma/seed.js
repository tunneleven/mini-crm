/* eslint-disable @typescript-eslint/no-require-imports */
const { ActivityType, PrismaClient, TaskStatus, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

const workspaceId = "northstar-labs";
const pipelineId = "pipeline-sales";
const stageKinds = [
  { id: "stage-lead", name: "Lead", kind: "LEAD", position: 0 },
  { id: "stage-qualified", name: "Qualified", kind: "QUALIFIED", position: 1 },
  { id: "stage-proposal", name: "Proposal", kind: "PROPOSAL", position: 2 },
  { id: "stage-negotiation", name: "Negotiation", kind: "NEGOTIATION", position: 3 },
  { id: "stage-won", name: "Won", kind: "WON", position: 4 },
  { id: "stage-lost", name: "Lost", kind: "LOST", position: 5 },
];

async function main() {
  await prisma.workspace.deleteMany({
    where: {
      id: workspaceId,
    },
  });

  await prisma.workspace.create({
    data: {
      id: workspaceId,
      name: "Northstar Labs",
      slug: "northstar-labs",
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: "kira-sloan",
        workspaceId,
        email: "kira@northstarlabs.io",
        name: "Kira Sloan",
        role: UserRole.ADMIN,
      },
      {
        id: "jordan-lee",
        workspaceId,
        email: "jordan@northstarlabs.io",
        name: "Jordan Lee",
        role: UserRole.MEMBER,
      },
    ],
  });

  await prisma.pipeline.create({
    data: {
      id: pipelineId,
      workspaceId,
      name: "Sales Pipeline",
      isDefault: true,
      stages: {
        create: stageKinds,
      },
    },
  });

  await prisma.company.createMany({
    data: [
      {
        id: "company-northline",
        workspaceId,
        ownerId: "kira-sloan",
        name: "Northline Health",
        domain: "northline.health",
        industry: "Healthcare operations SaaS",
        website: "https://northline.health",
      },
      {
        id: "company-tideframe",
        workspaceId,
        ownerId: "kira-sloan",
        name: "Tideframe Studio",
        domain: "tideframe.studio",
        industry: "Creative operations consultancy",
        website: "https://tideframe.studio",
      },
      {
        id: "company-fieldwise",
        workspaceId,
        ownerId: "jordan-lee",
        name: "Fieldwise",
        domain: "fieldwise.co",
        industry: "Field service analytics",
        website: "https://fieldwise.co",
      },
    ],
  });

  await prisma.contact.createMany({
    data: [
      {
        id: "contact-ari-mendoza",
        workspaceId,
        ownerId: "kira-sloan",
        firstName: "Ari",
        lastName: "Mendoza",
        email: "ari@northline.health",
        normalizedEmail: "ari@northline.health",
        title: "Head of Ops",
      },
      {
        id: "contact-sana-brooks",
        workspaceId,
        ownerId: "kira-sloan",
        firstName: "Sana",
        lastName: "Brooks",
        email: "sana@tideframe.studio",
        normalizedEmail: "sana@tideframe.studio",
        title: "Founder",
      },
      {
        id: "contact-myles-carter",
        workspaceId,
        ownerId: "jordan-lee",
        firstName: "Myles",
        lastName: "Carter",
        email: "myles@fieldwise.co",
        normalizedEmail: "myles@fieldwise.co",
        title: "Revenue Ops",
      },
    ],
  });

  await prisma.contactCompany.createMany({
    data: [
      {
        contactId: "contact-ari-mendoza",
        companyId: "company-northline",
        isPrimary: true,
      },
      {
        contactId: "contact-sana-brooks",
        companyId: "company-tideframe",
        isPrimary: true,
      },
      {
        contactId: "contact-myles-carter",
        companyId: "company-fieldwise",
        isPrimary: true,
      },
    ],
  });

  await prisma.deal.createMany({
    data: [
      {
        id: "deal-northline-rollout",
        workspaceId,
        ownerId: "kira-sloan",
        pipelineId,
        stageId: "stage-proposal",
        title: "Northline annual rollout",
        amount: 48000,
        currency: "USD",
        closeDate: new Date("2026-04-15T00:00:00.000Z"),
      },
      {
        id: "deal-tideframe-workspace",
        workspaceId,
        ownerId: "kira-sloan",
        pipelineId,
        stageId: "stage-negotiation",
        title: "Tideframe team workspace",
        amount: 16800,
        currency: "USD",
        closeDate: new Date("2026-04-04T00:00:00.000Z"),
      },
      {
        id: "deal-fieldwise-pilot",
        workspaceId,
        ownerId: "jordan-lee",
        pipelineId,
        stageId: "stage-lead",
        title: "Fieldwise pilot",
        amount: 9600,
        currency: "USD",
        closeDate: new Date("2026-04-22T00:00:00.000Z"),
      },
    ],
  });

  await prisma.dealCompany.createMany({
    data: [
      {
        dealId: "deal-northline-rollout",
        companyId: "company-northline",
        isPrimary: true,
      },
      {
        dealId: "deal-tideframe-workspace",
        companyId: "company-tideframe",
        isPrimary: true,
      },
      {
        dealId: "deal-fieldwise-pilot",
        companyId: "company-fieldwise",
        isPrimary: true,
      },
    ],
  });

  await prisma.dealContact.createMany({
    data: [
      {
        dealId: "deal-northline-rollout",
        contactId: "contact-ari-mendoza",
      },
      {
        dealId: "deal-tideframe-workspace",
        contactId: "contact-sana-brooks",
      },
      {
        dealId: "deal-fieldwise-pilot",
        contactId: "contact-myles-carter",
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        id: "task-northline-committee",
        workspaceId,
        assigneeId: "kira-sloan",
        dealId: "deal-northline-rollout",
        title: "Confirm buying committee for Northline",
        status: TaskStatus.TODO,
        dueAt: new Date("2026-03-18T09:00:00.000Z"),
      },
      {
        id: "task-tideframe-recap",
        workspaceId,
        assigneeId: "kira-sloan",
        dealId: "deal-tideframe-workspace",
        title: "Send recap to Tideframe after pricing call",
        status: TaskStatus.IN_PROGRESS,
        dueAt: new Date("2026-03-19T09:00:00.000Z"),
      },
      {
        id: "task-fieldwise-qualify",
        workspaceId,
        assigneeId: "jordan-lee",
        dealId: "deal-fieldwise-pilot",
        title: "Qualify Fieldwise use case fit",
        status: TaskStatus.TODO,
        dueAt: new Date("2026-03-20T09:00:00.000Z"),
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        id: "activity-northline-stage",
        workspaceId,
        dealId: "deal-northline-rollout",
        type: ActivityType.STAGE_CHANGE,
        summary: "Stage moved to Proposal after stakeholder demo.",
        happenedAt: new Date("2026-03-18T11:32:00.000Z"),
      },
      {
        id: "activity-tideframe-note",
        workspaceId,
        dealId: "deal-tideframe-workspace",
        companyId: "company-tideframe",
        contactId: "contact-sana-brooks",
        type: ActivityType.NOTE,
        summary: "Sana wants a lighter onboarding path for three contributors first.",
        happenedAt: new Date("2026-03-18T09:45:00.000Z"),
      },
      {
        id: "activity-fieldwise-followup",
        workspaceId,
        dealId: "deal-fieldwise-pilot",
        type: ActivityType.TASK,
        summary: "Qualification call recap still missing for Fieldwise pilot.",
        happenedAt: new Date("2026-03-17T08:15:00.000Z"),
      },
    ],
  });

  console.log("Seeded Northstar Labs workspace with CRM sample data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
