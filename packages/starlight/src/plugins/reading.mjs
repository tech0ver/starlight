/** Place a reading button where the author writes ::mark-as-read. */
export function readingPlugin() {
	return {
		name: 'tech0ver-reading',
		leafDirective(node, ctx) {
			if (node.name !== 'mark-as-read') return;
			ctx.replaceNode(node, {
				raw: '<div class="not-content" data-mark-read-slot hidden></div>',
				mdxExpressions: false,
			});
		},
	};
}
