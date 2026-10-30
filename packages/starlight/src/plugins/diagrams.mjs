// Inline trusted, consumer-owned SVGs for ::diagram{name="..."}.
import { readFileSync } from 'node:fs';

const FULL_WIDTH = 720;

function toDirectoryUrl(directory) {
	if (!directory) return undefined;
	if (directory instanceof URL) return directory;
	return new URL(directory);
}

function attribute(tag, name) {
	const value = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 's'))?.[2];
	return value?.replace(/&#(x[\da-f]+|\d+);|&(quot|apos|lt|gt|amp);/gi, (match, number, named) => {
		if (number) return String.fromCodePoint(number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number));
		return { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' }[named.toLowerCase()];
	});
}

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function diagramsPlugin({ directory } = {}) {
	const dir = toDirectoryUrl(directory);
	return {
		name: 'tech0ver-diagrams',
		leafDirective(node, ctx) {
			if (node.name !== 'diagram') return;
			const name = node.attributes?.name;
			if (!name) throw new Error('::diagram needs a name attribute');
			if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error(`Invalid diagram name: ${name}`);
			if (!dir) throw new Error('::diagram needs diagrams.directory in defineTech0verConfig');
			let svg = readFileSync(new URL(`${name}.svg`, dir), 'utf8').split('\n').filter((line) => line.trim()).join('\n');
			const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
			const width = Number(attribute(root, 'viewBox')?.trim().split(/[\s,]+/)[2]);
			if (width && width < FULL_WIDTH) {
				const share = width / FULL_WIDTH;
				svg = svg.replace('<svg ', `<svg style="width: ${(share * 100).toFixed(2)}%; min-width: ${Math.round(share * 600)}px" `);
			}
			const board = attribute(root, 'class')?.split(/\s+/).includes('sk-svg');
			const steps = board && attribute(root, 'data-steps');
			if (!steps) {
				ctx.replaceNode(node, { raw: `<figure class="diagram">\n${svg}\n</figure>`, mdxExpressions: false });
				return;
			}
			let labels;
			try { labels = JSON.parse(steps); } catch { throw new Error(`Invalid data-steps in diagram ${name}`); }
			const final = attribute(root, 'data-final');
			if (!Array.isArray(labels) || !labels.length || labels.some((label) => typeof label !== 'string' || !label.trim()) || !final?.trim()) {
				throw new Error(`Diagram ${name} needs non-empty step captions and a final caption`);
			}
			ctx.replaceNode(node, { raw: `<figure class="diagram sk-slides"><div class="sk-scroll" tabindex="0" role="group" aria-label="Diagram, use the arrow keys to change the view">${svg}</div><figcaption class="sk-caption" aria-live="polite">${escapeHtml(final)}</figcaption><div class="sk-controls" hidden></div></figure>`, mdxExpressions: false });
		},
	};
}
