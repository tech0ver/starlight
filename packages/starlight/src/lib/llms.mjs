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

export function pageUrl(id, siteRoot, { format, trailingSlash } = {}) {
	// Starlight serves an explicit `index` slug at its parent path.
	const slug = id.replace(/^\/+|\/+$/g, '').replace(/(^|\/)index$/, '').normalize();
	const path = format === 'file' ? `${slug || 'index'}.html` : slug ? `${slug}/` : '';
	const url = new URL(path, siteRoot);
	if (format !== 'file' && trailingSlash === 'never' && url.pathname !== '/') {
		url.pathname = url.pathname.replace(/\/$/, '');
	}
	return url;
}

/** Map rendered article URLs to exports; other pages and assets stay unchanged. */
export function markdownLinkTargets(entries, siteRoot, glossaryRoute, htmlUrls = {}) {
	const targets = {};
	for (const entry of entries.filter((entry) => hasMarkdownExport(entry, glossaryRoute))) {
		const markdown = new URL(`${entry.id}.md`, siteRoot).href;
		const directory = pageUrl(entry.id, siteRoot);
		for (const url of [directory, pageUrl(entry.id, siteRoot, htmlUrls), pageUrl(entry.id, siteRoot, { format: 'file' }), new URL('index.html', directory)]) {
			targets[url.href] = markdown;
		}
		targets[directory.href.replace(/\/$/, '')] = markdown;
	}
	return targets;
}

/** Build a compact index; article bodies stay behind their individual links. */
export function llmsText({ title, description, entries, siteRoot, glossaryRoute, htmlUrls = {}, sidebar = [] }) {
	const lines = [`# ${inlineText(title)}`, ''];
	if (description) lines.push(`> ${inlineText(description)}`, '');
	lines.push('Follow the Markdown links to read articles. Other pages use their rendered HTML URLs.', '');
	const articles = new Map();
	const pages = [];
	for (const entry of entries.filter((entry) => !entry.data.draft).sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
		const markdown = hasMarkdownExport(entry, glossaryRoute);
		const target = markdown ? new URL(`${entry.id}.md`, siteRoot) : pageUrl(entry.id, siteRoot, htmlUrls);
		const url = target.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
		const description = entry.data.description ? `: ${inlineText(entry.data.description)}` : '';
		const link = `- [${inlineText(entry.data.title)}](${url})${description}`;
		if (markdown) articles.set(pageUrl(entry.id, siteRoot, htmlUrls).href, link);
		else pages.push(link);
	}
	if (articles.size) {
		lines.push('## Articles', '');
		const remaining = new Map(articles);
		let activeGroups = [];
		function addHeading(label, depth) {
			if (lines.at(-1) !== '') lines.push('');
			lines.push(`${'#'.repeat(Math.min(depth, 6))} ${inlineText(label)}`, '');
		}
		function appendSidebar(items, groups = []) {
			for (const item of items) {
				if (item.type === 'group') {
					appendSidebar(item.entries, [...groups, item]);
				} else {
					const url = new URL(item.href, siteRoot);
					if (url.search || url.hash) continue;
					const link = remaining.get(url.href);
					if (link) {
						let common = 0;
						while (common < groups.length && groups[common] === activeGroups[common]) common++;
						// A heading keeps its scope until a peer or parent heading.
						// Reopen the parent when links follow a nested group.
						if (common === groups.length && activeGroups.length > groups.length) {
							addHeading(groups.at(-1)?.label ?? 'Articles', groups.length + 2);
						}
						for (let index = common; index < groups.length; index++) addHeading(groups[index].label, index + 3);
						lines.push(link);
						activeGroups = groups;
						remaining.delete(url.href);
					}
				}
			}
		}
		appendSidebar(sidebar);
		if (lines.at(-1) !== '') lines.push('');
		if (remaining.size) {
			if (sidebar.length) lines.push('### Other articles', '');
			lines.push(...remaining.values(), '');
		}
	}
	if (pages.length) lines.push('## Pages', '', ...pages, '');
	return lines.join('\n');
}
