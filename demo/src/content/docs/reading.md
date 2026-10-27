---
title: Feature gallery
description: One page that exercises the shared Markdown and reading features.
---

## Markdown blocks

A **consumer** can combine a **callout**, code, tables, headings, and a diagram
on one page. The URL prefix keeps those links and assets under `/starlight`.

Glossary terms can appear near the right edge of the article. Hover or focus
the term below: its card should stay readable over the table of contents.
The read-more link inside the card works with a pointer or keyboard.

<div style="text-align: end">

**base path**

</div>

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

This compact diagram shows the first step of the same flow. Its 360-unit width
uses half of the 720-unit reference grid, keeping its text at the same scale.

::diagram{name="compact-flow"}

:::do
Use a short page to show one idea, then link to a deeper article when the
consumer needs more context.
:::

:::tradeoff
A compact gallery is easy to scan, while separate pages give each feature more
room for explanation and examples.
:::

:::explain
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
“Explore this article with AI” prompt and a plain Markdown link when
the reader opens the article tools. Both the prompt and the separate link
include the full URL, such as `https://tech0ver.github.io/starlight/reading.md`,
so they work when copied into an external chat.

## Try a small change

Change the table or add a heading, then use the same page to check navigation,
search, the table of contents, and the light and dark themes.

## Reading status and favorites

Nested articles in the menu show an empty circle before the first visit, a circle
filled on the left after opening the page, and a check inside after pressing
**Mark as read**. Press the same button again to return to **Seen**.

Press an article's icon in the menu to add it to favorites. The circle becomes
a star with the same reading status. Press the star to remove the favorite.
The icon and article name have separate touch and keyboard targets.

Marks stay in this browser across visits and package updates. They do not sync
to other devices, and clearing site data removes them.

The author places each button with `::mark-as-read` on its own line. This page
places one before the sheet below and another after it. Both control the same
article, regardless of the heading's name.

::mark-as-read

## Cheat Sheet

| Action | Control |
| --- | --- |
| Open an article | Press its name in the menu |
| Add or remove a favorite | Press its circle or star in the menu |
| Mark as read or return to seen | Press **Mark as read** above this sheet or at the end |

::mark-as-read
