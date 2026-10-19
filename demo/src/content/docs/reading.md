---
title: Feature gallery
description: One page that exercises the shared Markdown and reading features.
---

## Markdown blocks

A **consumer** can combine a **callout**, code, tables, headings, and a diagram
on one page. The **base path** keeps those links and assets under `/starlight`.

### Code

```js
const features = ['callouts', 'code', 'tables', 'diagrams'];

export function firstFeature(items = features) {
	return items[0];
}
```

### Table

| Feature | What it demonstrates |
| --- | --- |
| Callouts | Scannable guidance with semantic colors |
| Diagrams | Consumer-owned SVGs that follow both themes |
| Glossary | A tooltip on the first eligible term |

## A generic template flow

::diagram{name="template-flow"}

:::do
Use a short page to show one idea, then link to a deeper article when the
consumer needs more context.
:::

:::tradeoff
A compact gallery is easy to scan, while separate pages give each feature more
room for explanation and examples.
:::

:::interview
Explain which settings belong to the consumer and which behavior comes from the
shared package.
:::

:::avoid
Do not copy shared colors or layout rules into every consumer page. Configure
content and extension points at the project boundary.
:::

:::distinguish
Keep a package feature, a consumer setting, and a page-level Markdown example
as separate pieces when you describe the system.
:::

The first eligible mention of each configured glossary term gets a
keyboard-friendly tooltip. This Markdown page also exposes the optional
“Study this article with an AI assistant” prompt and a plain Markdown link when
the reader opens the article tools.

## Try a small change

Change the table or add a heading, then use the same page to check navigation,
search, the table of contents, and the light and dark themes.
