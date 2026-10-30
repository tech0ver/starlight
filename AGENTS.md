# Working on Tech0ver Starlight

This is the shared UI/UX package for tech0ver sites built around articles.
Read [README.md](README.md) to run it, [CONTEXT.md](CONTEXT.md) to understand the
design, and [WORKFLOW.md](WORKFLOW.md) when making changes.

## Where things go

- `packages/starlight/`: reusable components, styles, Markdown features, and config.
- `demo/`: one `Demo0ver` site that shows how to use the package.
- `tests/`: behavior tests. `scripts/`: checks that need a separate consumer.

## Keep in mind

- Use simple English in code, docs, and demo pages. Explain what a reader or
  developer needs to do without repeating rules across documents.
- Keep shared UI in the package. Each consuming site owns its articles, name,
  navigation, glossary entries, and diagrams.
- Share colors, fonts, favicon, and callout colors. Sites can change callout
  labels. Put visual improvements in the package so all sites can receive them.
- Keep config local to each site. Support both `/` and a URL prefix, and preserve
  the documented Astro and Starlight extension points.
- The demo must use public package imports. The package must also work when
  installed on its own, without local checkout paths or machine settings.
- Keep third-party license notices with their code and assets; see
  [NOTICES.md](NOTICES.md).
- Follow the [compatibility contract](WORKFLOW.md#compatibility) for releases.
- Update the demo and docs when behavior or the public API changes. Follow the
  checks in WORKFLOW.md and report what passed and what remains unverified.

Use `.agents/work/` for temporary notes and review output. It is ignored; keep
lasting project decisions in the docs above.
