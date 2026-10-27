// Sätteri mdast plugin: inline SVG diagrams written as a leaf directive.
//
//   ::diagram{name="queue"}   → the consumer's configured SVG directory
//
// The SVG is inlined so its theme-aware classes follow the light/dark toggle.

import { readFileSync } from 'node:fs';

const FULL_WIDTH = 720;

function toDirectoryUrl(directory) {
	if (!directory) return undefined;
	if (directory instanceof URL) return directory;
	return new URL(directory);
}

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

			let svg = readFileSync(new URL(`${name}.svg`, dir), 'utf8')
				.split('\n')
				.filter((line) => line.trim())
				.join('\n');
			const viewBox = svg.match(/\bviewBox=["']([^"']+)["']/)?.[1];
			const width = Number(viewBox?.trim().split(/[\s,]+/)[2]);
			if (width && width < FULL_WIDTH) {
				const share = width / FULL_WIDTH;
				svg = svg.replace(
					'<svg ',
					`<svg style="width: ${(share * 100).toFixed(2)}%; min-width: ${Math.round(share * 600)}px" `,
				);
			}
			ctx.replaceNode(node, { raw: `<figure class="diagram">\n${svg}\n</figure>`, mdxExpressions: false });
		},
	};
}
