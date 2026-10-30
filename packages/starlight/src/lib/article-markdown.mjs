import { resolveCalloutLabels } from './callouts.mjs';

function isImageLink(line, end) {
	let depth = 1;
	for (let index = end - 1; index >= 0; index--) {
		if (line[index] === ']') depth++;
		if (line[index] === '[' && --depth === 0) return line[index - 1] === '!';
	}
	return false;
}

// Keep inline code unchanged while making article links usable outside the site.
function inlineText(line, articleUrl, resolveLink) {
	// Reference definitions also cover links reused later in an article.
	line = line.replace(/^( {0,3}\[(?!\^)[^\]]+\]:\s*)(<[^>]+>|\S+)/, (_match, prefix, href) => {
		const angle = href.startsWith('<');
		return `${prefix}${angle ? '<' : ''}${resolveLink(angle ? href.slice(1, -1) : href)}${angle ? '>' : ''}`;
	});
	return line.replace(/(`+)(.*?)\1|<!--.*?-->|\]\((<[^>]+>|(?:[^\s()]|\([^()]*\))+)([^)]*)\)|<(https?:\/\/[^>]+)>/g, (match, ticks, _code, href, suffix, autolink, offset) => {
		if (ticks) return match;
		if (autolink) return `<${resolveLink(autolink)}>`;
		if (!href) return '';
		const angle = href.startsWith('<');
		const target = angle ? href.slice(1, -1) : href;
		const url = isImageLink(line, offset) ? new URL(target, articleUrl).href : resolveLink(target);
		return `](${angle ? '<' : ''}${url}${angle ? '>' : ''}${suffix})`;
	});
}

/** Export article text with expanded callouts and visible glossary notes, omitting diagrams. */
export function articleMarkdown({ title, description, body, renderedHtml = '', articleUrl, siteRoot, glossary = [], callouts = {}, markdownUrls = {} }) {
	const labels = resolveCalloutLabels(callouts);
	const resolveLink = (href, base = articleUrl) => {
		const url = new URL(href, base);
		const query = url.search;
		const hash = url.hash;
		url.search = '';
		url.hash = '';
		const markdown = markdownUrls[url.href];
		return markdown ? `${markdown}${query}${hash}` : new URL(href, base).href;
	};
	const output = [];
	const containers = [];
	let fence;
	const emit = (text) => output.push(...text.split('\n').map((line) => `${'> '.repeat(containers.length)}${line}`.trimEnd()));

	for (const line of body.split(/\r?\n/)) {
		const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
		if (fence) {
			emit(line);
			if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
			continue;
		}
		if (marker) {
			fence = marker[1];
			emit(line);
			continue;
		}
		const directive = line.match(/^(:{3,})(\w+)?\s*$/);
		if (directive) {
			if (directive[2]) {
				const label = labels[directive[2]];
				if (!label) throw new Error(`Unknown article block: ${directive[2]}`);
				containers.push(directive[1]);
				emit(`**${label}**\n`);
			} else {
				if (!containers.length || directive[1].length < containers.at(-1).length) throw new Error('Unmatched article block');
				containers.pop();
				emit('');
			}
			continue;
		}
		if (/^::diagram\{.*\}\s*$/.test(line)) continue;
		if (/^\s*::mark-as-read\s*$/.test(line)) continue;
		emit(inlineText(line, articleUrl, resolveLink));
	}
	if (containers.length) throw new Error('Unclosed article block');

	const termIds = new Set([...renderedHtml.matchAll(/id="term-tip-([^"]+)"/g)].map((match) => match[1]));
	const notes = glossary
		.filter((term) => termIds.has(term.id))
		.map((term) => {
			const name = term.expansion ? `${term.term} (${term.expansion})` : term.term;
			const more = term.readMore ? ` [${term.readMore.label}](${resolveLink(term.readMore.href, siteRoot)})` : '';
			return `**${name}**: ${term.short} ${term.explanation}${more}`;
		});
	return [
		`# ${title}`,
		description,
		output.join('\n').trim(),
		...(notes.length ? ['## Glossary notes', ...notes] : []),
	].filter(Boolean).join('\n\n') + '\n';
}
