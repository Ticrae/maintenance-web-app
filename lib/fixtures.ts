import type { Priority, Role, Outcome, NotifTag } from "./theme";

export type Home = {
  id: string;
  name: string;
  beds: number;
  prefix: string;
  open: number;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  role: Role;
  homes: string;
  skills: string;
  status: string;
};

export type MaintenanceRequest = {
  ref: string;
  title: string;
  location: string;
  category: string;
  priority: Priority;
  status: string;
  when: string;
  photos: number;
  unread: boolean;
};

export type QueueJob = {
  ref: string;
  title: string;
  meta: string;
  priority: Priority;
  urgent: boolean;
  assignee: string;
  age: string;
  action: "Accept" | "Open";
};

export type JobStage = "accepted" | "site" | "parts";

export type MyJob = {
  ref: string;
  title: string;
  meta: string;
  priority: Priority;
  urgent: boolean;
  stage: JobStage;
  due: string;
  overdue: boolean;
};

export type MyJobGroup = {
  label: "Overdue" | "Today" | "Waiting on parts";
  items: MyJob[];
};

export type CompletedJob = {
  ref: string;
  title: string;
  home: string;
  done: string;
  onJob: string;
  photos: number;
  outcome: Outcome;
};

export type NotifItem = {
  id: string;
  unread: boolean;
  title: string;
  tag: NotifTag;
  body: string;
  meta: string;
};

export type NotifGroup = {
  day: string;
  items: NotifItem[];
};

export type NotifPref = {
  id: string;
  label: string;
  hint: string;
  on: boolean;
};

export type ActivityEntry = {
  id: string;
  initials: string;
  who: string;
  time: string;
  text: string;
};

export type HomeTimeDatum = {
  home: string;
  pct: number;
  value: string;
  tone: "default" | "amber" | "red";
};

export type CategoryDatum = {
  category: string;
  pct: number;
  value: number;
};

export type UnassignedJob = {
  ref: string;
  title: string;
  home: string;
  waiting: string;
  waitLong: boolean;
  suggest: string;
};

export const homes: Home[] = [
  { id: "wh", name: "Willow House", beds: 24, prefix: "WH", open: 7 },
  { id: "bc", name: "Beechcroft", beds: 18, prefix: "BC", open: 3 },
  { id: "sm", name: "St Marks Lodge", beds: 40, prefix: "SM", open: 9 },
  { id: "hc", name: "Harefield Court", beds: 32, prefix: "HC", open: 4 },
  { id: "ac", name: "Ashcombe", beds: 16, prefix: "AC", open: 2 },
  { id: "lg", name: "Linden Grange", beds: 28, prefix: "LG", open: 5 },
];

export const people: Person[] = [
  { id: "p1", name: "Deborah Amos", email: "d.amos@upkeep.care", role: "staff", homes: "Willow House", skills: "—", status: "Active" },
  { id: "p2", name: "Grace Ihenacho", email: "g.ihenacho@upkeep.care", role: "staff", homes: "Beechcroft", skills: "—", status: "Active" },
  { id: "p3", name: "Paul OConnor", email: "p.oconnor@upkeep.care", role: "staff", homes: "St Marks Lodge", skills: "—", status: "Invited" },
  { id: "p4", name: "Marcus Okoro", email: "m.okoro@upkeep.care", role: "maintenance", homes: "Willow House, St Marks Lodge", skills: "Heating, electrical", status: "On site" },
  { id: "p5", name: "Liam Fitzgerald", email: "l.fitzgerald@upkeep.care", role: "maintenance", homes: "Beechcroft, Harefield Court", skills: "Fabric, grounds", status: "Active" },
  { id: "p6", name: "Nadia Hussain", email: "n.hussain@upkeep.care", role: "maintenance", homes: "Ashcombe, Linden Grange", skills: "Electrical, safety", status: "Active" },
  { id: "p7", name: "Rosa Fernandez", email: "r.fernandez@upkeep.care", role: "maintenance", homes: "All homes", skills: "General, plumbing", status: "Invited" },
  { id: "p8", name: "Sade Adebayo", email: "s.adebayo@upkeep.care", role: "agency_admin", homes: "Willow House, Beechcroft", skills: "Operations, safeguarding", status: "Active" },
  { id: "p9", name: "Tom Whitfield", email: "t.whitfield@upkeep.care", role: "super_admin", homes: "All homes", skills: "—", status: "Active" },
  { id: "p10", name: "Sarah Kowalski", email: "s.kowalski@upkeep.care", role: "super_admin", homes: "All homes", skills: "—", status: "Active" },
];

export const initialMyRequests: MaintenanceRequest[] = [
  { ref: "WH-0442", title: "Radiator in Room 12 not heating", location: "Room 12", category: "Heating & plumbing", priority: "Urgent", status: "In progress", when: "updated 11m ago", photos: 2, unread: true },
  { ref: "WH-0438", title: "Window latch broken", location: "Room 6", category: "Fabric", priority: "Medium", status: "Accepted", when: "updated 2h ago", photos: 1, unread: false },
  { ref: "WH-0435", title: "Corridor light flickering", location: "East corridor", category: "Electrical", priority: "High", status: "In progress", when: "updated 4h ago", photos: 0, unread: false },
  { ref: "WH-0431", title: "Room 14 radiator lukewarm", location: "Room 14", category: "Heating & plumbing", priority: "Medium", status: "Accepted", when: "updated 6h ago", photos: 0, unread: false },
  { ref: "WH-0426", title: "Fire door not closing fully", location: "Ground floor", category: "Safety", priority: "High", status: "Open", when: "raised yesterday", photos: 1, unread: false },
  { ref: "WH-0420", title: "Garden bench needs repair", location: "Courtyard", category: "Grounds", priority: "Low", status: "Open", when: "raised 2 days ago", photos: 2, unread: false },
  { ref: "WH-0418", title: "Boiler pressure dropping", location: "Plant room", category: "Heating & plumbing", priority: "High", status: "In progress", when: "updated 1 day ago", photos: 0, unread: false },
  { ref: "WH-0411", title: "Kitchen tap dripping", location: "Kitchen", category: "Heating & plumbing", priority: "Low", status: "Completed", when: "closed 3 days ago", photos: 0, unread: false },
];

export const initialQueue: QueueJob[] = [
  { ref: "SM-0117", title: "No hot water in west wing", meta: "St Marks Lodge · west wing bathrooms", priority: "Urgent", urgent: true, assignee: "Unassigned", age: "18m ago", action: "Accept" },
  { ref: "WH-0442", title: "Radiator in Room 12 not heating", meta: "Willow House · Room 12", priority: "Urgent", urgent: true, assignee: "Marcus Okoro", age: "41m ago", action: "Open" },
  { ref: "SM-0114", title: "Smoke alarm beeping intermittently", meta: "St Marks Lodge · Room 22", priority: "High", urgent: false, assignee: "Unassigned", age: "1h ago", action: "Accept" },
  { ref: "WH-0435", title: "Corridor light flickering", meta: "Willow House · east corridor", priority: "High", urgent: false, assignee: "Marcus Okoro", age: "4h ago", action: "Open" },
  { ref: "WH-0418", title: "Boiler pressure dropping", meta: "Willow House · plant room", priority: "High", urgent: false, assignee: "Marcus Okoro", age: "1 day ago", action: "Open" },
  { ref: "SM-0109", title: "Loose handrail on stairs", meta: "St Marks Lodge · main stairs", priority: "Medium", urgent: false, assignee: "Unassigned", age: "2 days ago", action: "Accept" },
];

export const initialMyJobGroups: MyJobGroup[] = [
  {
    label: "Overdue",
    items: [
      { ref: "SM-0109", title: "Loose handrail on stairs", meta: "St Marks Lodge · main stairs", priority: "Medium", urgent: false, stage: "accepted", due: "due yesterday 17:00", overdue: true },
    ],
  },
  {
    label: "Today",
    items: [
      { ref: "WH-0442", title: "Radiator in Room 12 not heating", meta: "Willow House · Room 12", priority: "Urgent", urgent: true, stage: "site", due: "target 18:00", overdue: false },
      { ref: "WH-0435", title: "Corridor light flickering", meta: "Willow House · east corridor", priority: "High", urgent: false, stage: "accepted", due: "target 16:00", overdue: false },
      { ref: "SM-0114", title: "Smoke alarm beeping intermittently", meta: "St Marks Lodge · Room 22", priority: "High", urgent: false, stage: "accepted", due: "target 17:30", overdue: false },
    ],
  },
  {
    label: "Waiting on parts",
    items: [
      { ref: "WH-0418", title: "Boiler pressure dropping", meta: "Willow House · plant room", priority: "High", urgent: false, stage: "parts", due: "parts due Thu", overdue: false },
      { ref: "SM-0102", title: "Extractor fan not running", meta: "St Marks Lodge · laundry", priority: "Medium", urgent: false, stage: "parts", due: "parts due Fri", overdue: false },
    ],
  },
];

export const initialCompleted: CompletedJob[] = [
  { ref: "WH-0411", title: "Kitchen tap dripping", home: "Willow House", done: "12 Aug · 15:20", onJob: "0h 35m", photos: 1, outcome: "Fixed" },
  { ref: "SM-0098", title: "Broken chair leg", home: "St Marks Lodge", done: "12 Aug · 11:05", onJob: "0h 20m", photos: 0, outcome: "Fixed" },
  { ref: "WH-0402", title: "Leaking shower head", home: "Willow House", done: "11 Aug · 16:40", onJob: "1h 10m", photos: 2, outcome: "Fixed" },
  { ref: "SM-0093", title: "Fence panel blown down", home: "St Marks Lodge", done: "10 Aug · 09:15", onJob: "2h 05m", photos: 3, outcome: "Contractor" },
  { ref: "WH-0397", title: "Radiator bleed valve stuck", home: "Willow House", done: "9 Aug · 14:30", onJob: "0h 45m", photos: 1, outcome: "Reopened" },
  { ref: "WH-0388", title: "Bedroom door sticking", home: "Willow House", done: "8 Aug · 10:50", onJob: "0h 55m", photos: 0, outcome: "Fixed" },
  { ref: "SM-0081", title: "Nurse call button unresponsive", home: "St Marks Lodge", done: "6 Aug · 13:05", onJob: "1h 30m", photos: 1, outcome: "Reopened" },
  { ref: "WH-0375", title: "Loose skirting board", home: "Willow House", done: "4 Aug · 09:40", onJob: "0h 25m", photos: 0, outcome: "Fixed" },
  { ref: "SM-0070", title: "Overflowing gutter", home: "St Marks Lodge", done: "2 Aug · 08:55", onJob: "1h 50m", photos: 2, outcome: "Fixed" },
  { ref: "WH-0361", title: "Wobbly bed frame", home: "Willow House", done: "31 Jul · 16:15", onJob: "0h 40m", photos: 1, outcome: "Fixed" },
];

export const initialNotifGroups: NotifGroup[] = [
  {
    day: "Today · Thursday 13 August",
    items: [
      { id: "n1", unread: true, title: "WH-0442 is now urgent", tag: "urgent", body: "The radiator request in Room 12 was flagged urgent and paged the on-call maintenance lead.", meta: "08:14 · Willow House · room 12" },
      { id: "n2", unread: true, title: "Marcus Okoro accepted WH-0442", tag: "status", body: "Status changed from Open to Accepted.", meta: "08:31 · Willow House · room 12" },
      { id: "n3", unread: true, title: "New comment on WH-0442", tag: "comment", body: "Bled the radiator and reseated the TRV head — heat restored to about 80%.", meta: "09:48 · Willow House · room 12" },
    ],
  },
  {
    day: "Yesterday · Wednesday 12 August",
    items: [
      { id: "n4", unread: false, title: "WH-0411 marked completed", tag: "status", body: "Kitchen tap dripping — fixed on the first visit.", meta: "15:20 · Willow House · kitchen" },
      { id: "n5", unread: false, title: "Reminder: WH-0426 still open", tag: "reminder", body: "Fire door not closing fully has been open for 1 day without an update.", meta: "09:00 · Willow House · ground floor" },
      { id: "n6", unread: false, title: "New comment on WH-0435", tag: "comment", body: "Replaced the starter — flickering should be gone, keep an eye on it this week.", meta: "17:12 · Willow House · east corridor" },
      { id: "n7", unread: false, title: "WH-0431 accepted", tag: "status", body: "Status changed from Open to Accepted.", meta: "10:40 · Willow House · room 14" },
      { id: "n8", unread: false, title: "WH-0420 raised", tag: "status", body: "Garden bench needs repair was submitted.", meta: "08:05 · Willow House · courtyard" },
    ],
  },
];

export const initialNotifPrefs: NotifPref[] = [
  { id: "pref-status", label: "Status changes", hint: "When a request you raised changes status", on: true },
  { id: "pref-comments", label: "Comments on my requests", hint: "When maintenance adds a note or reply", on: true },
  { id: "pref-urgent", label: "Urgent escalations in my home", hint: "Any urgent request raised at Willow House", on: true },
  { id: "pref-weekly", label: "Weekly summary", hint: "A digest of open and completed requests", on: false },
];

export const initialActivity: ActivityEntry[] = [
  { id: "a1", initials: "DA", who: "Deborah Amos", time: "08:14", text: "Raised the request — resident moved to the day room, radiator cold to the touch." },
  { id: "a2", initials: "SY", who: "System", time: "08:14", text: "Flagged urgent — paged the on-call maintenance lead." },
  { id: "a3", initials: "MO", who: "Marcus Okoro", time: "08:31", text: "Accepted the job, heading over after the morning round." },
  { id: "a4", initials: "MO", who: "Marcus Okoro", time: "09:48", text: "Bled the radiator and reseated the TRV head — heat restored to about 80%. Valve body is weeping slightly; ordered a replacement head, fitting Thursday." },
  { id: "a5", initials: "DA", who: "Deborah Amos", time: "10:02", text: "Thank you — resident's back in the room and much more comfortable." },
];

export const homeTimes: HomeTimeDatum[] = [
  { home: "Willow House", pct: 52, value: "3h 15m", tone: "default" },
  { home: "Beechcroft", pct: 44, value: "2h 40m", tone: "default" },
  { home: "St Marks Lodge", pct: 88, value: "6h 35m", tone: "red" },
  { home: "Harefield Court", pct: 38, value: "2h 15m", tone: "default" },
  { home: "Ashcombe", pct: 30, value: "1h 50m", tone: "default" },
  { home: "Linden Grange", pct: 64, value: "4h 45m", tone: "amber" },
];

export const categories: CategoryDatum[] = [
  { category: "Heating & plumbing", pct: 100, value: 138 },
  { category: "Electrical", pct: 69, value: 95 },
  { category: "Fabric & fittings", pct: 52, value: 72 },
  { category: "Safety & compliance", pct: 44, value: 61 },
  { category: "Grounds", pct: 33, value: 46 },
];

export const initialUnassigned: UnassignedJob[] = [
  { ref: "SM-0117", title: "No hot water in west wing", home: "St Marks Lodge", waiting: "18m", waitLong: false, suggest: "Marcus Okoro · nearest" },
  { ref: "SM-0114", title: "Smoke alarm beeping intermittently", home: "St Marks Lodge", waiting: "1h 02m", waitLong: false, suggest: "Marcus Okoro · nearest" },
  { ref: "SM-0109", title: "Loose handrail on stairs", home: "St Marks Lodge", waiting: "1 day 4h", waitLong: true, suggest: "Rosa Fernandez · covering" },
  { ref: "AC-0044", title: "Extractor fan noisy", home: "Ashcombe", waiting: "6h 20m", waitLong: false, suggest: "Nadia Hussain · nearest" },
];

export const currentUser = {
  staff: { initials: "DA", name: "Deborah Amos", subtitle: "Willow House" },
  maintenance: { initials: "MO", name: "Marcus Okoro", subtitle: "Maintenance" },
};
