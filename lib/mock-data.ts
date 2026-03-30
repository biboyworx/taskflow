import { Member, Task, Project, ActivityItem, Tag } from "./types";

export const MEMBERS: Member[] = [
  {
    id: "m1",
    name: "Alex Rivera",
    avatar: "",
    color: "#14b8a6",
    initials: "AR",
    role: "Designer",
  },
  {
    id: "m2",
    name: "Sam Chen",
    avatar: "",
    color: "#0ea5e9",
    initials: "SC",
    role: "Developer",
  },
  {
    id: "m3",
    name: "Jordan Lee",
    avatar: "",
    color: "#10b981",
    initials: "JL",
    role: "PM",
  },
  {
    id: "m4",
    name: "Morgan Kim",
    avatar: "",
    color: "#f59e0b",
    initials: "MK",
    role: "Developer",
  },
  {
    id: "m5",
    name: "Riley Park",
    avatar: "",
    color: "#ec4899",
    initials: "RP",
    role: "QA",
  },
];

export const TAGS: Tag[] = [
  { id: "t1", label: "Frontend", color: "#14b8a6" },
  { id: "t2", label: "Backend", color: "#0ea5e9" },
  { id: "t3", label: "Design", color: "#ec4899" },
  { id: "t4", label: "Bug", color: "#ef4444" },
  { id: "t5", label: "Feature", color: "#10b981" },
  { id: "t6", label: "Docs", color: "#f59e0b" },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Redesign onboarding flow for new users",
    description:
      "Create a seamless onboarding experience that guides new users through key features and helps them set up their workspace quickly. Focus on reducing friction and improving activation rates.",
    status: "todo",
    priority: "high",
    assignees: [MEMBERS[0], MEMBERS[2]],
    dueDate: "2025-07-15",
    coverColor: "#14b8a6",
    checklist: [
      { id: "cl1", text: "User research interviews", done: true },
      { id: "cl2", text: "Wireframe new flow", done: true },
      { id: "cl3", text: "Create high-fidelity mockups", done: false },
      { id: "cl4", text: "Prototype interactions", done: false },
      { id: "cl5", text: "Usability testing", done: false },
    ],
    comments: [
      {
        id: "c1",
        author: MEMBERS[2],
        text: "We should prioritize the mobile experience first since 60% of signups happen on mobile.",
        createdAt: "2025-07-01T10:30:00",
      },
      {
        id: "c2",
        author: MEMBERS[0],
        text: "Agreed, I'll start with the mobile wireframes. @Sam can you check the analytics for drop-off points?",
        createdAt: "2025-07-01T14:15:00",
      },
    ],
    attachments: [
      {
        id: "a1",
        name: "onboarding-research.pdf",
        size: "2.4 MB",
        type: "pdf",
        url: "#",
        uploadedAt: "2025-07-01",
      },
      {
        id: "a2",
        name: "current-flow-screenshot.png",
        size: "856 KB",
        type: "image",
        url: "#",
        uploadedAt: "2025-07-02",
      },
    ],
    tags: [TAGS[0], TAGS[2]],
    order: 0,
  },
  {
    id: "task-2",
    title: "API rate limiting implementation",
    description:
      "Implement robust rate limiting across all public API endpoints to prevent abuse and ensure fair usage.",
    status: "todo",
    priority: "urgent",
    assignees: [MEMBERS[1]],
    dueDate: "2025-07-10",
    checklist: [
      { id: "cl6", text: "Research rate limiting strategies", done: true },
      { id: "cl7", text: "Implement Redis-based throttling", done: false },
      { id: "cl8", text: "Add rate limit headers", done: false },
      { id: "cl9", text: "Write documentation", done: false },
    ],
    comments: [],
    attachments: [],
    tags: [TAGS[1], TAGS[3]],
    order: 1,
  },
  {
    id: "task-3",
    title: "Update design system tokens",
    description:
      "Migrate from hard-coded values to design tokens across all components for better consistency and theming support.",
    status: "todo",
    priority: "medium",
    assignees: [MEMBERS[0]],
    dueDate: "2025-07-20",
    checklist: [
      { id: "cl10", text: "Audit existing color usage", done: false },
      { id: "cl11", text: "Define token taxonomy", done: false },
      { id: "cl12", text: "Update component library", done: false },
    ],
    comments: [
      {
        id: "c3",
        author: MEMBERS[0],
        text: "This will also help with dark mode implementation down the line.",
        createdAt: "2025-07-03T09:00:00",
      },
    ],
    attachments: [],
    tags: [TAGS[0], TAGS[2]],
    order: 2,
  },
  {
    id: "task-4",
    title: "Performance audit & optimization",
    description:
      "Conduct a thorough performance audit of the web app and implement fixes to achieve Core Web Vitals green scores.",
    status: "inprogress",
    priority: "high",
    assignees: [MEMBERS[1], MEMBERS[3]],
    dueDate: "2025-07-08",
    checklist: [
      { id: "cl13", text: "Run Lighthouse audit", done: true },
      { id: "cl14", text: "Optimize image loading", done: true },
      { id: "cl15", text: "Implement code splitting", done: true },
      { id: "cl16", text: "Reduce bundle size", done: false },
      { id: "cl17", text: "Add performance monitoring", done: false },
    ],
    comments: [
      {
        id: "c4",
        author: MEMBERS[3],
        text: "Initial Lighthouse score is 68. Target is 90+. Main issues are LCP and CLS.",
        createdAt: "2025-07-02T11:00:00",
      },
    ],
    attachments: [
      {
        id: "a3",
        name: "lighthouse-report.html",
        size: "128 KB",
        type: "html",
        url: "#",
        uploadedAt: "2025-07-02",
      },
    ],
    tags: [TAGS[0], TAGS[1]],
    order: 0,
  },
  {
    id: "task-5",
    title: "Implement real-time notifications",
    description:
      "Build a WebSocket-based notification system that delivers real-time updates for task assignments, mentions, and due date reminders.",
    status: "inprogress",
    priority: "high",
    assignees: [MEMBERS[1], MEMBERS[2]],
    dueDate: "2025-07-18",
    checklist: [
      { id: "cl18", text: "Design notification schema", done: true },
      { id: "cl19", text: "WebSocket server setup", done: true },
      { id: "cl20", text: "Client-side integration", done: false },
      { id: "cl21", text: "Notification preferences", done: false },
      { id: "cl22", text: "Email digest fallback", done: false },
    ],
    comments: [],
    attachments: [],
    tags: [TAGS[0], TAGS[1], TAGS[4]],
    order: 1,
  },
  {
    id: "task-6",
    title: "Fix payment webhook handling",
    description:
      "Stripe webhooks are occasionally failing due to signature verification timeout. Need to increase timeout and add retry logic.",
    status: "inprogress",
    priority: "urgent",
    assignees: [MEMBERS[3]],
    dueDate: "2025-07-05",
    checklist: [
      { id: "cl23", text: "Reproduce the issue", done: true },
      { id: "cl24", text: "Increase timeout threshold", done: false },
      { id: "cl25", text: "Implement retry queue", done: false },
    ],
    comments: [
      {
        id: "c5",
        author: MEMBERS[3],
        text: "Confirmed the issue happens during high traffic periods. Stripe is timing out after 5s but our handler takes 6-7s.",
        createdAt: "2025-07-03T16:45:00",
      },
      {
        id: "c6",
        author: MEMBERS[2],
        text: "Can we process it async and respond immediately with 200?",
        createdAt: "2025-07-03T17:00:00",
      },
    ],
    attachments: [],
    tags: [TAGS[1], TAGS[3]],
    order: 2,
  },
  {
    id: "task-7",
    title: "Write API documentation",
    description:
      "Create comprehensive API documentation using OpenAPI 3.0 spec, including authentication guides and code examples.",
    status: "review",
    priority: "medium",
    assignees: [MEMBERS[2], MEMBERS[1]],
    dueDate: "2025-07-12",
    checklist: [
      { id: "cl26", text: "Document authentication endpoints", done: true },
      { id: "cl27", text: "Document resource endpoints", done: true },
      { id: "cl28", text: "Add code examples in 3 languages", done: true },
      { id: "cl29", text: "Peer review", done: false },
    ],
    comments: [
      {
        id: "c7",
        author: MEMBERS[1],
        text: "Docs look great! Just a few endpoints missing error response schemas.",
        createdAt: "2025-07-04T10:00:00",
      },
    ],
    attachments: [
      {
        id: "a4",
        name: "api-spec-draft.yaml",
        size: "45 KB",
        type: "yaml",
        url: "#",
        uploadedAt: "2025-07-03",
      },
    ],
    tags: [TAGS[5], TAGS[1]],
    order: 0,
  },
  {
    id: "task-8",
    title: "Dark mode implementation",
    description:
      "Implement system-aware dark mode across the entire application using CSS variables and Tailwind's dark mode utilities.",
    status: "review",
    priority: "low",
    assignees: [MEMBERS[0], MEMBERS[4]],
    dueDate: "2025-07-25",
    checklist: [
      { id: "cl30", text: "Design dark color palette", done: true },
      { id: "cl31", text: "Update all components", done: true },
      { id: "cl32", text: "Test on all major browsers", done: true },
      { id: "cl33", text: "QA sign-off", done: false },
    ],
    comments: [],
    attachments: [],
    tags: [TAGS[0], TAGS[2]],
    order: 1,
  },
  {
    id: "task-9",
    title: "Set up CI/CD pipeline",
    description:
      "Configure GitHub Actions for automated testing, staging deployments, and production releases with rollback support.",
    status: "done",
    priority: "high",
    assignees: [MEMBERS[3]],
    dueDate: "2025-06-30",
    checklist: [
      { id: "cl34", text: "Configure test runner", done: true },
      { id: "cl35", text: "Set up staging environment", done: true },
      { id: "cl36", text: "Configure production deploy", done: true },
      { id: "cl37", text: "Add Slack notifications", done: true },
    ],
    comments: [
      {
        id: "c8",
        author: MEMBERS[3],
        text: "Pipeline is live! Average deploy time is 3m 45s. Slack notifications are working.",
        createdAt: "2025-06-30T15:30:00",
      },
    ],
    attachments: [],
    tags: [TAGS[1], TAGS[4]],
    order: 0,
  },
  {
    id: "task-10",
    title: "User profile page redesign",
    description:
      "Redesign the user profile page with better activity visualization and profile customization options.",
    status: "done",
    priority: "medium",
    assignees: [MEMBERS[0], MEMBERS[2]],
    dueDate: "2025-06-28",
    checklist: [
      { id: "cl38", text: "New mockups approved", done: true },
      { id: "cl39", text: "Frontend implementation", done: true },
      { id: "cl40", text: "Backend integration", done: true },
    ],
    comments: [],
    attachments: [],
    tags: [TAGS[0], TAGS[2], TAGS[4]],
    order: 1,
  },
];

export const ACTIVITY_FEED: ActivityItem[] = [
  {
    id: "act1",
    user: MEMBERS[1],
    action: "moved",
    target: "Performance audit to In Progress",
    createdAt: "2026-03-16T09:58:00.000Z",
  },
  {
    id: "act2",
    user: MEMBERS[0],
    action: "commented on",
    target: "Redesign onboarding flow",
    createdAt: "2026-03-16T09:45:00.000Z",
  },
  {
    id: "act3",
    user: MEMBERS[3],
    action: "completed",
    target: "Set up CI/CD pipeline",
    createdAt: "2026-03-16T08:50:00.000Z",
  },
  {
    id: "act4",
    user: MEMBERS[2],
    action: "assigned you to",
    target: "API rate limiting",
    createdAt: "2026-03-16T08:20:00.000Z",
  },
  {
    id: "act5",
    user: MEMBERS[4],
    action: "reviewed",
    target: "Dark mode implementation",
    createdAt: "2026-03-16T07:30:00.000Z",
  },
  {
    id: "act6",
    user: MEMBERS[1],
    action: "uploaded a file to",
    target: "Fix payment webhook",
    createdAt: "2026-03-16T06:10:00.000Z",
  },
];

export const INITIAL_PROJECT: Project = {
  id: "proj-1",
  name: "Taskflow v2.0",
  description: "Next generation of our flagship product",
  color: "#14b8a6",
  emoji: "🚀",
  members: MEMBERS,
  tasks: INITIAL_TASKS,
  activities: ACTIVITY_FEED,
};

export const SIDEBAR_PROJECTS = [
  { id: "proj-1", name: "Taskflow v2.0", emoji: "🚀", color: "#14b8a6" },
  { id: "proj-2", name: "Marketing Site", emoji: "🌐", color: "#0ea5e9" },
  { id: "proj-3", name: "Mobile App", emoji: "📱", color: "#10b981" },
  { id: "proj-4", name: "Analytics Dashboard", emoji: "📊", color: "#f59e0b" },
];
