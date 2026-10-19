# Change workflow

This workflow adapts the focused-change and visual-review approach from
`tech0ver/sysdis` to a shared UI package. [README.md](README.md) owns commands and
API usage; [AGENTS.md](AGENTS.md) owns engineering rules.

## Develop a change

1. Identify the user-visible behavior, affected public API, and consumer example.
   Use existing decisions; ask only for a missing choice that affects the result.
2. Make the smallest coherent package change and update the demo that exercises it.
   Preserve unrelated changes and consumer customization.
3. Run relevant behavior tests and builds. For packaging, exports, paths, or asset
   changes, run the packed-consumer check as well as the workspace build.
4. Check changed UI in a browser. Review light and dark themes at desktop and phone
   widths. Exercise controls, keyboard focus, search, navigation, and base-path links
   when affected. Inspect console errors and horizontal overflow.
5. Update API documentation, supported-version claims, and provenance where needed.
6. Report what changed, which checks passed, and any unverified behavior. Use a
   fresh reviewer for substantial package integration or compatibility changes.

An unrelated typography edit does not require retesting every public option. Run
checks proportional to the change; repeat them after a relevant correction.

## Public API and compatibility

Keep consumer data out of shared defaults. Prefer explicit configuration over
copying components. Preserve a documented escape hatch for project CSS and
Starlight component overrides. Avoid silently changing option precedence.

Use semantic versioning when releasing. Describe breaking configuration or
compatibility changes and provide migration instructions. For a pre-1.0 version,
call out breaking changes explicitly; do not rely on the version number alone.

Pin the demo's tested toolchain in its lockfile. A wider peer dependency range is
a compatibility promise: test it or keep the claim narrow. Review upstream markup
and interaction changes when updating Astro or Starlight.

## Source copying

Inspect the current source before copying. Record where adapted files came from
and preserve their attribution. Verify that configurable data, paths, services,
and content were not carried into generic defaults.

Do not modify source or consuming projects merely to make the shared demo pass.
Keep a failing package installation reproducible, and fix it in the package or
the documented consumer contract.

## Preview

Start previews on an available port and keep ownership of the process clear.
Do not stop another project's server. For a remote BB reader, share the preview
through the existing BB Connect service and give the returned authenticated URL.
This preview is distinct from a production deployment or package release.

## Git and publication

The public source repository is `tech0ver/starlight`. Its `main` branch starts
with an empty bootstrap commit so the complete initial code can be reviewed in a
PR. Keep the first PR focused on the shared package, one `Demo0ver` demo, tests,
and documentation. Add build automation and GitHub Artifacts publication in a
separate follow-up PR.

Use these conventions:

- GitHub Flow with focused `<type>/<kebab-case-topic>` branches.
- Conventional Commits for English commit messages and PR titles.
- Signed-off commits and accurate `Co-authored-by` trailers for agent contributions.
- PR descriptions that explain final behavior and validation without tool banners.
- Human approval before squash merge. Let GitHub derive the squash message from
  the PR title and description rather than passing subject/body overrides.

Branch protections and automation must be verified separately; these conventions
do not claim they exist. Keep registry releases and deployments behind explicit
session authorization. Preserve authorization already granted in the current
session; do not ask for the same permission again.
