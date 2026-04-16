export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: April 16, 2026</p>
        </header>

        <section className="space-y-3 text-sm text-slate-700">
          <p>
            Tasqon ("we", "us", or "our") provides a project management platform.
            This Privacy Policy explains how we collect, use, and protect your
            information when you use Tasqon.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Information We Collect</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>Account information (name, email, avatar) provided by your login.</li>
            <li>Project data you create (tasks, comments, files, tags, and metadata).</li>
            <li>Calendar data (event IDs) when you connect Google Calendar.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">How We Use Information</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>To provide and maintain Tasqon features and services.</li>
            <li>To sync assigned tasks to your Google Calendar when enabled.</li>
            <li>To improve product performance and user experience.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Google Calendar Integration</h2>
          <p className="text-sm text-slate-700">
            If you connect Google Calendar, Tasqon will create or update calendar
            events for tasks assigned to you. We store the minimal data required
            to keep those events in sync.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Data Sharing</h2>
          <p className="text-sm text-slate-700">
            We do not sell your personal data. We only share data with third-party
            services required to provide core functionality (for example, Google
            Calendar when you enable it).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Data Retention</h2>
          <p className="text-sm text-slate-700">
            We retain your data for as long as your account is active or as needed
            to provide the service. You can request deletion by contacting us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p className="text-sm text-slate-700">
            For questions about this Privacy Policy, contact us at
            <span className="font-medium"> biboymadrid81@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
