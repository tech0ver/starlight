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
