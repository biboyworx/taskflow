"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f4ef] px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f4c9a8]/60 blur-3xl" />
        <div className="absolute top-32 -right-20 h-64 w-64 rounded-full bg-[#9fd2c9]/60 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-[#b3c6f4]/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Project clarity for busy teams
            </div>
            <h1 className="mt-5 text-4xl font-bold text-slate-900 sm:text-5xl">
              Tasqon keeps every task visible, aligned, and on time.
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Plan work, assign owners, and sync deadlines to Google Calendar in one place.
              Built for fast-moving teams who want calm, not chaos.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/board"
                className="h-11 px-6 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
              >
                Continue to Tasqon
              </Link>
              <button
                type="button"
                onClick={() => setActiveModal("privacy")}
                className="h-11 px-6 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("terms")}
                className="h-11 px-6 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-white transition-colors"
              >
                Terms of Service
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Role-based access</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Bulk task actions</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1">Calendar sync</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500">Today at a glance</div>
                <div className="text-xs font-medium text-emerald-600">Synced</div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { title: "Website launch", time: "9:00 AM", tone: "bg-emerald-100 text-emerald-700" },
                  { title: "Design review", time: "11:30 AM", tone: "bg-amber-100 text-amber-700" },
                  { title: "Client feedback", time: "3:00 PM", tone: "bg-indigo-100 text-indigo-700" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400">Assigned · Due today</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-10 -left-6 rotate-[-2deg] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
              Google Calendar reminders stay in sync.
            </div>
          </div>
        </div>
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
