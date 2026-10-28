export function hasMarkdownExport(entry, glossaryRoute) {
	return Boolean(entry.filePath?.endsWith('.md')) &&
		Boolean(entry.id) &&
		entry.id !== 'index' &&
		entry.id !== glossaryRoute &&
		!entry.data.draft &&
		entry.data.template !== 'splash';
}

function inlineText(value) {
	return String(value).replace(/\s+/g, ' ').trim().replace(/[\\`*_[\]<>]/g, '\\$&');
}

function pageUrl(id, siteRoot, { format, trailingSlash }) {
	// Starlight serves an explicit `index` slug at its parent path.
	const slug = id.replace(/^\/+|\/+$/g, '').replace(/(^|\/)index$/, '').normalize();
	const path = format === 'file' ? `${slug || 'index'}.html` : slug ? `${slug}/` : '';
	const url = new URL(path, siteRoot);
	if (format !== 'file' && trailingSlash === 'never' && url.pathname !== '/') {
		url.pathname = url.pathname.replace(/\/$/, '');
	}
	return url;
}

/** Build a compact index; article bodies stay behind their individual links. */
export function llmsText({ title, description, entries, siteRoot, glossaryRoute, htmlUrls = {} }) {
	const lines = [`# ${inlineText(title)}`, ''];
	if (description) lines.push(`> ${inlineText(description)}`, '');
	lines.push('Follow the Markdown links to read articles. Other pages use their rendered HTML URLs.', '');
	const articles = [];
	const pages = [];
	for (const entry of entries.filter((entry) => !entry.data.draft).sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
		const markdown = hasMarkdownExport(entry, glossaryRoute);
		const target = markdown ? new URL(`${entry.id}.md`, siteRoot) : pageUrl(entry.id, siteRoot, htmlUrls);
		const url = target.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
		const description = entry.data.description ? `: ${inlineText(entry.data.description)}` : '';
		(markdown ? articles : pages).push(`- [${inlineText(entry.data.title)}](${url})${description}`);
	}
	if (articles.length) lines.push('## Articles', '', ...articles, '');
	if (pages.length) lines.push('## Pages', '', ...pages, '');
	return lines.join('\n');
}
