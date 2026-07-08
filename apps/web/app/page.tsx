const highlights = [
  {
    title: "Mobile",
    description:
      "Expo app shell for students, peer coaches, clubs, and support units.",
  },
  {
    title: "API",
    description:
      "Placeholder service with a health endpoint and a clear upgrade path.",
  },
  {
    title: "Shared packages",
    description:
      "Workspace-ready `db` and `types` packages for future schema and contracts.",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Fresher Hub</p>
        <h1>Monorepo foundation is ready.</h1>
        <p className="lede">
          The mobile app, web admin shell, API stub, and shared packages now
          live in one workspace so Week 1 can grow from a clean base.
        </p>

        <div className="highlight-grid">
          {highlights.map((item) => (
            <article key={item.title} className="highlight-card">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <div className="status-row">
          <span>Turbo workspace</span>
          <span>Expo mobile</span>
          <span>Next.js web</span>
          <span>Node API</span>
        </div>
      </section>
    </main>
  );
}
