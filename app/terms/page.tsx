export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: April 16, 2026</p>
        </header>

        <section className="space-y-3 text-sm text-slate-700">
          <p>
            These Terms of Service ("Terms") govern your use of Tasqon. By using
            the service, you agree to these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Account Responsibilities</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>You are responsible for your account and all activity under it.</li>
            <li>You must provide accurate information and keep it up to date.</li>
            <li>Do not misuse the service or attempt unauthorized access.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Use of Google Calendar</h2>
          <p className="text-sm text-slate-700">
            If you enable Google Calendar sync, Tasqon will create and update
            calendar events for tasks assigned to you. You can disable access
            anytime in your Google account settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Content Ownership</h2>
          <p className="text-sm text-slate-700">
            You own the content you create in Tasqon. By using the service, you
            grant Tasqon permission to process that content to provide the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Termination</h2>
          <p className="text-sm text-slate-700">
            We may suspend or terminate access if these Terms are violated. You
            may stop using the service at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="text-sm text-slate-700">
            For questions about these Terms, contact us at
            <span className="font-medium"> biboymadrid81@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
