export const dashboardStats = [
  { label: "Open deals", value: "18", trend: "+4 this week", tone: "up" },
  { label: "Weighted pipeline", value: "$142K", trend: "73% in active stages", tone: "up" },
  { label: "Overdue tasks", value: "6", trend: "Needs action today", tone: "alert" },
  { label: "Avg. cycle", value: "22d", trend: "3 days faster", tone: "warn" },
];

export const pipelineSnapshot = [
  { label: "Lead", value: 32, width: "84%" },
  { label: "Qualified", value: 18, width: "61%" },
  { label: "Proposal", value: 11, width: "48%" },
  { label: "Negotiation", value: 7, width: "32%" },
];

export const contactRows = [
  {
    id: "c-1",
    title: "Ari Mendoza",
    subtitle: "Head of Ops at Northline Health",
    meta: "ari@northline.health",
    status: "Warm lead",
  },
  {
    id: "c-2",
    title: "Sana Brooks",
    subtitle: "Founder at Tideframe Studio",
    meta: "sana@tideframe.studio",
    status: "Needs follow-up",
  },
  {
    id: "c-3",
    title: "Myles Carter",
    subtitle: "Revenue Ops at Fieldwise",
    meta: "myles@fieldwise.co",
    status: "Qualified",
  },
];

export const companyRows = [
  {
    id: "co-1",
    title: "Northline Health",
    subtitle: "Healthcare operations SaaS",
    meta: "northline.health",
    status: "3 active deals",
  },
  {
    id: "co-2",
    title: "Tideframe Studio",
    subtitle: "Creative operations consultancy",
    meta: "tideframe.studio",
    status: "Expansion candidate",
  },
  {
    id: "co-3",
    title: "Fieldwise",
    subtitle: "Field service analytics",
    meta: "fieldwise.co",
    status: "New inbound",
  },
];

export const dealRows = [
  {
    id: "d-1",
    title: "Northline annual rollout",
    subtitle: "Northline Health · $48,000 ARR",
    meta: "Proposal · Owner: Kira Sloan",
    status: "proposal",
  },
  {
    id: "d-2",
    title: "Tideframe team workspace",
    subtitle: "Tideframe Studio · $16,800 ARR",
    meta: "Negotiation · Owner: Kira Sloan",
    status: "pending",
  },
  {
    id: "d-3",
    title: "Fieldwise pilot",
    subtitle: "Fieldwise · $9,600 ARR",
    meta: "Lead · Owner: Jordan Lee",
    status: "open",
  },
];

export const taskRows = [
  {
    title: "Confirm buying committee for Northline",
    subtitle: "Due today · linked to Northline annual rollout",
    tone: "alert",
  },
  {
    title: "Send recap to Tideframe after pricing call",
    subtitle: "Due tomorrow · linked to Tideframe team workspace",
    tone: "pending",
  },
  {
    title: "Qualify Fieldwise use case fit",
    subtitle: "Due Friday · linked to Fieldwise pilot",
    tone: "open",
  },
];

export const timelineRows = [
  {
    title: "Stage moved to Proposal",
    copy: "Northline annual rollout advanced after stakeholder demo.",
    when: "28 minutes ago",
  },
  {
    title: "Note added",
    copy: "Sana wants a lighter onboarding path for three contributors first.",
    when: "2 hours ago",
  },
  {
    title: "Task overdue",
    copy: "Fieldwise pilot qualification call still missing recap.",
    when: "Yesterday",
  },
];
