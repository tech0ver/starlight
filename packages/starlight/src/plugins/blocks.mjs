// Sätteri mdast plugin: article blocks written as container directives.
//
//   :::do            → "What to do": the recommended action
//   :::tradeoff      → "Trade-off": what you win and what you pay
//   :::explain       → "Explanation": how or why something works
//   :::avoid         → "Avoid": a common mistake
//   :::distinguish   → "Do not confuse": two things that share a name or look alike
//
// Each keeps its shared semantic class and carries a consumer-owned text label.

import { resolveCalloutLabels } from '../lib/callouts.mjs';

export function blocksPlugin(overrides = {}) {
	const labels = resolveCalloutLabels(overrides);
	return {
		name: 'tech0ver-blocks',
		containerDirective(node, ctx) {
			if (!Object.hasOwn(labels, node.name)) return;
			ctx.setProperty(node, 'data', {
				hName: 'div',
				hProperties: { className: ['block', `block-${node.name}`], 'data-label': labels[node.name] },
			});
		},
	};
}
