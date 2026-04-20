"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Calendar, Users, Zap, ArrowRight, Lock } from "lucide-react";

export default function Home() {
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f7f4ef] via-white to-[#f0f9f8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[#f4c9a8]/40 blur-3xl" />
        <div className="absolute top-48 -right-32 h-80 w-80 rounded-full bg-[#9fd2c9]/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-full -translate-x-1/2 rounded-full bg-gradient-to-t from-[#b3c6f4]/30 to-transparent blur-3xl" />
      </div>

      <div className="relative">
        {/* Hero Section */}
        <section className="px-6 py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm mb-6">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Project clarity for busy teams
                </div>

                <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-slate-900 mb-6">
                  Keep tasks <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">visible and aligned</span>
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
                  Assign work, track progress, and sync deadlines to Google Calendar—all in one calm, organized space. Built for teams that move fast but want less chaos.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <Link
                    href="/board"
                    className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setActiveModal("privacy")}
                    className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-white/50 transition-colors"
                  >
                    Privacy & Terms
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/50">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">3min</div>
                    <div className="text-xs text-slate-500">Setup time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">100%</div>
                    <div className="text-xs text-slate-500">Privacy focused</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">∞</div>
                    <div className="text-xs text-slate-500">Free forever</div>
                  </div>
                </div>
              </div>

              {/* Visual Demo */}
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-200/20 to-blue-200/20 rounded-3xl blur-2xl" />
                <div className="relative rounded-3xl border border-white/70 bg-white/80 backdrop-blur-sm p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today at a glance</div>
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Synced
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Website launch", time: "9:00 AM", status: "emerald" },
                      { title: "Design review", time: "11:30 AM", status: "amber" },
                      { title: "Client feedback", time: "3:00 PM", status: "blue" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/50 px-4 py-3 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className={`w-4 h-4 text-${item.status}-500 flex-shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400">Assigned · Due today</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold text-${item.status}-700 bg-${item.status}-100 whitespace-nowrap`}>
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      Syncs directly to Google Calendar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 border-t border-slate-200/50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Everything teams need
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Simple, powerful features that scale with your team's workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Role-based access",
                  description: "Control who can edit, view, or manage. Keep projects secure with granular permissions.",
                  color: "teal"
                },
                {
                  icon: Zap,
                  title: "Bulk actions",
                  description: "Update multiple tasks at once—change status, assign, tag, or prioritize in seconds.",
                  color: "amber"
                },
                {
                  icon: Calendar,
                  title: "Google Calendar sync",
                  description: "Assigned tasks appear on your calendar with customizable reminders.",
                  color: "blue"
                },
                {
                  icon: CheckCircle2,
                  title: "Task management",
                  description: "Kanban boards, checklists, tags, priorities, and custom columns.",
                  color: "emerald"
                },
                {
                  icon: Lock,
                  title: "Privacy focused",
                  description: "Your data stays yours. We don't sell data or track you. GDPR ready.",
                  color: "slate"
                },
                {
                  icon: ArrowRight,
                  title: "Invite & collaborate",
                  description: "Add team members with one link. Manage roles, remove access anytime.",
                  color: "indigo"
                },
              ].map((feature) => {
                const IconComponent = feature.icon;
                const colorMap: Record<string, string> = {
                  teal: "from-teal-500 to-teal-600",
                  amber: "from-amber-500 to-amber-600",
                  blue: "from-blue-500 to-blue-600",
                  emerald: "from-emerald-500 to-emerald-600",
                  slate: "from-slate-600 to-slate-700",
                  indigo: "from-indigo-500 to-indigo-600",
                };
                return (
                  <div key={feature.title} className="group rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8 hover:border-slate-300 hover:bg-white/70 hover:shadow-lg transition-all duration-200">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[feature.color]} text-white mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-3xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-blue-400/5 pointer-events-none" />
              <div className="relative text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Ready to keep work aligned?
                </h2>
                <p className="text-slate-600 mb-8">
                  Start organizing your team's tasks in minutes. No credit card required.
                </p>
                <Link
                  href="/board"
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Get started for free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-slate-200/50 text-center text-sm text-slate-600">
          <div className="mx-auto max-w-6xl">
            <p>Built with ❤️ for teams that move fast. © 2026 Tasqon.</p>
          </div>
        </footer>
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {activeModal === "privacy" ? "Privacy Policy" : "Terms of Service"}
                </h2>
                <p className="text-xs text-slate-400">Last updated: April 16, 2026</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
              >
                Back
              </button>
            </div>

            <div className="mt-5 max-h-[60vh] overflow-y-auto pr-2 text-sm text-slate-700 space-y-4">
              {activeModal === "privacy" ? (
                <>
                  <p>
                    Tasqon ("we", "us", or "our") provides a project management platform.
                    This Privacy Policy explains how we collect, use, and protect your
                    information when you use Tasqon.
                  </p>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Information We Collect</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Account information (name, email, avatar) provided by your login.</li>
                      <li>Project data you create (tasks, comments, files, tags, and metadata).</li>
                      <li>Calendar data (event IDs) when you connect Google Calendar.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">How We Use Information</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>To provide and maintain Tasqon features and services.</li>
                      <li>To sync assigned tasks to your Google Calendar when enabled.</li>
                      <li>To improve product performance and user experience.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Data Sharing</h3>
                    <p>
                      We do not sell your personal data. We only share data with third-party
                      services required to provide core functionality (for example, Google
                      Calendar when you enable it).
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Contact</h3>
                    <p>Questions? Email biboymadrid81@gmail.com.</p>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    These Terms of Service ("Terms") govern your use of Tasqon. By using
                    the service, you agree to these Terms.
                  </p>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Account Responsibilities</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>You are responsible for your account and all activity under it.</li>
                      <li>You must provide accurate information and keep it up to date.</li>
                      <li>Do not misuse the service or attempt unauthorized access.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Use of Google Calendar</h3>
                    <p>
                      If you enable Google Calendar sync, Tasqon will create and update
                      calendar events for tasks assigned to you. You can disable access
                      anytime in your Google account settings.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Termination</h3>
                    <p>
                      We may suspend or terminate access if these Terms are violated. You
                      may stop using the service at any time.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Contact</h3>
                    <p>Questions? Email biboymadrid81@gmail.com.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
