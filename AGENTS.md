# Agent instructions

<!-- pilotfish-codex:begin -->
<!-- pilotfish-codex v1.7.1 -->
### Pilotfish always-on bootstrap

Pilotfish supplements the user's rules and does not replace their precedence.
Apply approval, security, blocked-task isolation, and parent-accountability
invariants. Use the available `pilotfish-orchestration` skill for routing,
planning, and verification. If unavailable, use a bounded fallback and do not
claim full Pilotfish verification.
<!-- pilotfish-codex:end -->

## Project

Read [CONTEXT.md](CONTEXT.md) for the purpose, boundaries, and source baseline.
Read [README.md](README.md) for installation, configuration, and actual commands.
Read [WORKFLOW.md](WORKFLOW.md) before changing or delivering the package.

This project provides reusable Astro/Starlight UI for `tech0ver` sites and a demo
that consumes the package. Everything in the project uses simple English.

## Engineering rules

- Shared presentation and reusable behavior belong in the package. Project titles,
  routes, glossary entries, SVGs, home content, and links come from consumers.
- Keep the demo a real package consumer. Import public exports by package name;
  do not reach into the package through relative source paths.
- Do not add a runtime dependency on a sibling checkout, the repository's parent,
  a developer's machine paths, or the original `sysdis` content.
- Preserve the current visual language unless the user asks for a design change.
  Keep color tokens separate from layout and use theme-aware diagram classes.
- Colors, typography, favicon, and callout color meanings are shared. Projects
  configure their name, callout labels, content, and navigation hierarchy. Do not
  demonstrate reuse by giving each project a different palette or favicon.
- Configure each site independently. Avoid process-wide mutable configuration.
- Preserve ordinary Astro and Starlight extension points. Document precedence for
  user styles, component overrides, integrations, and middleware.
- Make both `/` and non-root base paths work. Check generated links, assets,
  search indexing, glossary links, and optional Markdown exports.
- State supported dependency versions conservatively. Component overrides depend
  on Starlight markup and behavior; successful compilation is not visual evidence.
- Keep third-party copyright and license notices when copying or adapting code.
  Source provenance is recorded in [NOTICES.md](NOTICES.md).
- Optional behavior must have a useful disabled state. Do not insert another
  project's analytics, account configuration, or licensing footer by default.
- Put local plans, review records, and screenshots in `.agents/work/` (ignored).
  Durable API decisions and user instructions belong in tracked project files.

## Scope

The source repository is `tech0ver/starlight` on GitHub and is public. Changes use
branches and pull requests. The first code PR includes the shared package and one
`Demo0ver` demo. Build automation and publication to GitHub Artifacts belong in a
separate follow-up PR. Do not include those workflows in the initial code PR.

Consumer migrations, package registry releases, and production deployments remain
separate tasks. Release and change conventions are defined in WORKFLOW.md.
