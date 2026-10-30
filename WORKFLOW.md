# Making changes

1. Decide what should change for a reader or a site developer.
2. Update the package and show the behavior in `Demo0ver`. Keep changes focused
   and preserve other work in progress.
3. Run the relevant checks below. Update the README when setup or the API changes.
4. Open a PR that explains the result, how it was checked, and any remaining limits.

## Checks

Commands are in [README.md](README.md).

- For docs, check links and confirm that examples match the current code.
- For Markdown or config changes, run the behavior tests and build the demo.
- For package exports, paths, dependencies, or assets, also run `check:package`.
  It installs an archive into a separate project and builds it there.
- For visual or interaction changes, use a browser at phone and desktop widths
  in both themes. Check the affected controls, keyboard use, links, overflow,
  and console errors.

Use a fresh reviewer for substantial package or compatibility changes. A passing
build alone does not show that the UI works. Repeat checks after a relevant fix;
avoid unrelated changes just to make a check pass.

## Compatibility

Compatible releases work with existing site configuration and content. Enable shared
UI improvements by default and reuse existing site configuration. New fields are
optional unless an opt-in capability needs genuinely new user data. Preserve explicit
consumer choices, public extension points, imports and Markdown contracts, URLs, and
saved reading state. Document any breaking change and its migration explicitly.

Keep the demo's toolchain pinned in the lockfile. Test wider dependency ranges
before claiming support. When updating Astro or Starlight, check the markup and
behavior used by component overrides.

Use semantic versioning for releases. Explain breaking API changes and how sites
can update, including before version 1.0. Sites must update their dependency and
lockfile, then rebuild, to receive a package change.

Keep third-party notices with copied code and assets. See [NOTICES.md](NOTICES.md).

## Git and releases

- Use branches named `<type>/<short-topic>` and open a PR against `main`.
- Use Conventional Commits, sign off commits, and credit agent contributions
  with accurate `Co-authored-by` trailers.
- Write PR descriptions for a reader who has not seen the discussion.
- Wait for the author's approval before squash merging. Let GitHub use the PR
  title and description for the squash commit.
- Publish packages and deploy sites only when requested. Check the actual
  repository settings and automation instead of assuming they are configured.

## CI

Pull requests and pushes to `main` run the same checks with Node.js 24 and Bun
1.4.0: frozen dependency installation, release metadata validation, behavior
tests, a demo build, and a packed-consumer build. The workflow can also be run
manually. It does not publish packages.

Use Conventional Commit PR titles because squash merging makes the title the
commit subject. Release Please uses `fix:` for patch releases and `feat:` for
minor releases. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.
Before 1.0, breaking changes increase the minor version; after 1.0, they increase
the major version. A pre-1.0 minor release can therefore contain breaking changes;
the version number alone does not promise compatibility. Review release notes. Explain migration steps in the PR and release notes.

## Releases

Release Please prepares a PR with the next package version,
[changelog](packages/starlight/CHANGELOG.md), release manifest, and Bun workspace
lockfile version. It runs on `main` updates or a manual workflow run. It does
not create tags, publish GitHub Releases, or publish packages.

### One-time GitHub setup

1. Create a GitHub App for release preparation. Give it repository permissions
   **Contents: Read and write**, **Issues: Read and write**, and
   **Pull requests: Read and write**. Install it only on this repository.
2. Add repository Actions secrets `RELEASE_APP_ID` and `RELEASE_APP_PRIVATE_KEY`
   using the App ID and its generated private key. Keep the key out of the
   repository. The workflow requests a short-lived installation token restricted
   to this repository. App-authored PRs trigger CI; PRs created with the default
   `GITHUB_TOKEN` do not trigger normal PR workflows.
3. Require the CI check before merging into `main`. Allow the App to create PRs,
   while retaining maintainer approval for merging. No workflow enables auto-merge.
4. Allow this repository's `GITHUB_TOKEN` to publish GitHub Packages. The package
   is intended to be public. GitHub creates npm packages as private on their
   first publication, even when their source repository is public. Open this
   repository, select the package under **Packages**, then **Package settings** →
   **Danger Zone** → **Change visibility** → **Public**. This is a one-time setting
   for the whole package, not each version; later releases keep it public.
   Changing it requires the GitHub web interface, not the Packages REST API.
   Package admin access is required; GitHub can return 404 when the current
   account cannot access a private package.
5. Check **Manage Actions access** for consumers and use `packages: read` in their
   install jobs. Package visibility and Actions access are separate settings.

Release verification checks that this existing package is public before building
or publishing another version. A failed metadata request also stops publication;
it must not be treated as an absent package or a successful visibility change.
This check does not change the package visibility. No new release is needed just
to make already-published versions public.

The publication workflow uses its own `GITHUB_TOKEN`; it does not need a stored
registry publishing token. Local consumers need a personal access token (classic)
with `read:packages`, including when the package is public. See the
[GitHub npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

### First release: 0.1.0

The initial changelog describes the package's existing capabilities. It is written
by hand because the initial commit history does not describe each feature.
The package version and Release Please manifest both start at `0.1.0`.

After merging the release setup and seeing CI pass, prepare a GitHub Release
named `v0.1.0`, with a new tag `v0.1.0` targeting that exact merged commit.
Use the `0.1.0` changelog section as the release description. A draft can be
reviewed before publication. Publishing the GitHub Release authorizes package
publication; merging the setup PR alone does not publish anything.

### Later releases

1. Review the Release Please PR. Check the version, the changes since the previous
   release, migration notes, and CI. The initial capability description stays in
   the changelog; later sections describe only changes.
2. Squash merge the release PR after approval. Use its exact merge commit for the
   new `vX.Y.Z` tag, even if `main` has moved on.
3. Prepare a GitHub Release named `vX.Y.Z` with that tag and copy the corresponding
   changelog section into its description. Review it, then publish it manually.
4. Check the **Publish package** workflow and the resulting package version.
   A GitHub Release existing does not by itself prove the package was published.

Only a published stable GitHub Release triggers publication. Drafts, prereleases,
tag pushes, and ordinary pushes to `main` do not publish the package. The workflow
checks that the tag is on `main` and matches the package, manifest, lockfile, and
latest changelog version. It tests the exact archive before publishing it.

Successful publication marks the matching release PR as `autorelease: tagged`.
This lets Release Please prepare the next PR. While a merged release PR is still
pending publication, Release Please waits instead of preparing another release.

### Checks and recovery

Run `bun run check:release` to check version consistency. To validate a proposed
stable release tag, run `bun run check:release v0.1.0` with its actual version.
Keep the `x-release-please-version` comment beside the package's workspace version
in `bun.lock`; it tells Release Please which lockfile version to update. Restore
that comment if a dependency update rewrites the lockfile. CI checks for it.

For release automation changes, also run `bun run check:release-please`. It
installs the exact Release Please library used by the pinned action in a temporary
directory and simulates later patch, feature, and breaking releases. It checks
that the package, manifest, changelog, and lockfile update together, that the
initial release notes survive, and that frozen installation still works. It needs
network access to install the test tool and dependencies, but no GitHub token.

If a release workflow fails, fix the cause and rerun the failed workflow jobs.
An existing registry version is accepted only when its archive integrity matches
the tested archive. Authentication and registry errors fail the job. Never reuse
a version for different contents; publish a new patch version instead.

If publication succeeded but marking the release PR failed, rerun the failed
cleanup job. Keep `autorelease: pending` until publication has been verified.
The initial release has no generated release PR and needs no label cleanup.

Before claiming the setup works on GitHub, verify a hosted CI run, the initial
publication, and an installation from the registry in a consumer. Local archive
checks cover package contents and compatibility, but do not verify registry
permissions or consumer authentication.

### Consumer update notifications

Publication and notification are separate jobs. After successful publication,
`notify-consumers.yml` verifies the stable release and registry version and sends
`starlight-release` repository dispatches to explicitly enabled consumers. The
payload has `package`, `version`, and `release_url`. Delivery failures fail the
notification job without changing the publication result. Each matrix entry runs
independently. A disabled consumer produces a warning; an enabled consumer with
missing credentials fails visibly. Rerun failed jobs or manually run **Notify
Starlight consumers** with the published version to retry. Delivery can repeat.

To enable the initial `tech0ver/sysdes` consumer:

1. Create a separate update GitHub App with repository **Contents: Read and write**
   and **Pull requests: Read and write** permissions. Install it on this repository
   and each opted-in consumer. The existing release App is scoped to this repository
   and is not assumed to have consumer access.
2. Add `UPDATE_APP_ID` and `UPDATE_APP_PRIVATE_KEY` Actions secrets to this
   repository and each consumer, or grant them access to organization secrets.
   Keep the private key out of the repository.
3. Grant each consumer repository access under the package's **Manage Actions
   access**, and give its caller workflow `contents: read` and `packages: read`.
   The registry read uses the caller's `GITHUB_TOKEN`, exposed as both
   `GITHUB_PACKAGES_READ_TOKEN` and `NODE_AUTH_TOKEN`; an App token does not grant
   package access. Use the variable expected by the consumer's `.npmrc`.
4. Install a receiver on the consumer default branch for `repository_dispatch`
   type `starlight-release` and optional `workflow_dispatch`. Have its `jobs.update`
   call `tech0ver/starlight/.github/workflows/update-consumer.yml` pinned to a
   reviewed full commit SHA. Pass required string `version`, optional string
   `release-url`, and the two named App secrets. Check the dispatch package name
   before calling; derive the version from `client_payload.version` or the manual
   input. An empty release URL derives the canonical URL.
5. After the receiver and credentials are ready, set the Starlight repository
   Actions variable `STARLIGHT_UPDATE_SYSDES_ENABLED` to `true`. Verify a manual
   notification and the consumer PR and CI before relying on later releases.

The updater checks the stable release and published package, updates the root
`package.json` and `bun.lock`, and updates installed peer dependencies to the
package's required exact versions. Missing required peers stop the update for manual
installation. It accepts simple stable, caret, or tilde
Starlight dependency versions; other specifications need manual migration. It
serializes runs and uses a per-version branch. An existing equal or newer update
PR or an equal or newer dependency makes an event a no-op. It never overwrites
an existing branch. A retry can create a missing PR only if the existing branch
has the exact expected tree, base, and bot commit; otherwise inspect it manually.
After creating a newer PR, it closes older bot update PRs only after checking
their author, commit and changed files. Human changes stop the run for review. Review release
notes, migrations, and consumer CI before merging; no automation enables auto-merge.
A registry or hosted workflow failure needs a retry after the underlying setup is
fixed. Local tests cannot establish GitHub App, package access, or delivery setup.
