# @tech0ver/starlight

Shared Astro/Starlight UI/UX for tech0ver sites built around articles.

The package keeps shared navigation, responsive layout, theme controls, article
callouts, glossary tooltips, inline diagrams, and optional article study prompts
in one versioned dependency. A consumer owns its content and passes a fresh
configuration to `defineTech0verConfig`.

Colors, fonts, the organization favicon, and semantic callout colors are shared
across projects. Consumers configure their name, page content, navigation, and
callout labels through `callouts: { do: 'Try this' }`. Unspecified labels use the
shared defaults. The same labels appear in optional raw Markdown exports.

Set `sidebarWidth: 256` to fit longer navigation labels. The value is a positive
number of pixels; the default is `200`. It controls the desktop sidebar and
tablet drawer, while the phone menu stays full width. Use
`plannedTopLevel: ['Examples']` for unlinked **Planned** labels before the
navigation groups, or
`plannedTopics: { 'Feature gallery': ['Component overrides'] }` for labels
inside a group, as shown in Demo0ver. Strings are hidden by matching entry
labels. Use `{ label: 'More diagrams', slug: 'more-diagrams' }` to match a
published link by its page path without `base`, even if its title changes.

Enable article study tools with `tutor.enabled`. Set `tutor.title` to customize
the block heading and `tutor.intro` to customize the first paragraph of the
copied prompt. The default heading is **Study this article with an AI assistant**.

When enabled, the raw Markdown endpoint exports `.md` content entries. MDX-only
pages keep their rendered article URL in the study prompt because their imports
and components cannot be represented as plain Markdown safely.

The package is tested against Astro `7.3.5`, Starlight `0.42.5`, and
`@astrojs/markdown-satteri` `0.4.2`.

Install the latest published version from GitHub Packages. Configure the consumer's
`.npmrc` and provide `NODE_AUTH_TOKEN` in its environment:

```ini
@tech0ver:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

For local installation, use a personal access token (classic) with `read:packages`
and access to this package. In GitHub Actions, grant the consumer repository read
access in the package settings and use its `GITHUB_TOKEN` with `packages: read`.
Even public npm packages on GitHub Packages require authentication.

```sh
bun add @tech0ver/starlight@latest astro@7.3.5 @astrojs/starlight@0.42.5 @astrojs/markdown-satteri@0.4.2
```

Import `defineTech0verConfig` from `@tech0ver/starlight` in your Astro config.
See the [setup guide](https://github.com/tech0ver/starlight#use-the-package-in-another-project)
and [changelog](CHANGELOG.md). Update the dependency and lockfile, then rebuild
your site to receive a newer release.

Licensed under [MIT](LICENSE). Third-party code and assets keep their included
license notices.
