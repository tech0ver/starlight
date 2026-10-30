import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasMarkdownExport, llmsText, markdownLinkTargets } from '../packages/starlight/src/lib/llms.mjs';
import { articleMarkdown } from '../packages/starlight/src/lib/article-markdown.mjs';

function entry(id, data = {}, extension = 'md') {
	return { id, filePath: `src/content/docs/${id}.${extension}`, data: { title: id, ...data } };
}

test('llms.txt covers published pages and points only eligible articles to Markdown', () => {
	const entries = [
		entry('nested/article', { title: 'An article', description: 'First line\nsecond line.' }),
		entry('index', { title: 'Home' }),
		entry('terms', { title: 'Glossary' }),
		entry('interactive', { title: 'MDX page' }, 'mdx'),
		entry('landing', { title: 'Landing', template: 'splash' }),
		entry('draft', { draft: true }),
	];
	for (const base of ['/', '/docs/']) {
		const text = llmsText({ title: 'Test site', description: 'A site.', entries, siteRoot: new URL(`https://example.test${base}`), glossaryRoute: 'terms' });
		assert.match(text, /^# Test site\n\n> A site\.\n/);
		assert.ok(text.includes(`[An article](https://example.test${base}nested/article.md): First line second line.`));
		assert.ok(text.includes(`[Home](https://example.test${base})`));
		for (const [title, id] of [['Glossary', 'terms'], ['MDX page', 'interactive'], ['Landing', 'landing']]) {
			assert.ok(text.includes(`[${title}](https://example.test${base}${id}/)`));
		}
		assert.doesNotMatch(text, /draft|terms\.md|interactive\.md|landing\.md|index\.md/);
	}
	assert.deepEqual(entries.map((entry) => entry.id), ['nested/article', 'index', 'terms', 'interactive', 'landing', 'draft']);
});

test('llms.txt keeps titles and descriptions on one line and escapes Markdown syntax', () => {
	const text = llmsText({
		title: 'A\nsite',
		entries: [entry('guide(v2)', { title: '[Guide] *two*', description: 'A guide.\n\n## Injected heading' })],
		siteRoot: new URL('https://example.test/docs/'),
	});
	assert.match(text, /^# A site\n/);
	assert.ok(text.includes('- [\\[Guide\\] \\*two\\*](https://example.test/docs/guide%28v2%29.md): A guide. ## Injected heading'));
	assert.doesNotMatch(text, /\n## Injected heading/);
});

test('Markdown eligibility excludes unpublished, special, and component pages', () => {
	assert.equal(hasMarkdownExport(entry('guide'), 'terms'), true);
	for (const page of [entry(''), entry('index'), entry('terms'), entry('draft', { draft: true }), entry('landing', { template: 'splash' }), entry('interactive', {}, 'mdx')]) {
		assert.equal(hasMarkdownExport(page, 'terms'), false);
	}
});

test('HTML links respect file output, trailing slashes, and explicit index slugs', () => {
	const options = {
		title: 'Site',
		entries: [entry('index', {}, 'mdx'), entry('interactive', {}, 'mdx'), entry('nested/index', {}, 'mdx'), entry('article')],
		siteRoot: new URL('https://example.test/docs/'),
	};
	const files = llmsText({ ...options, htmlUrls: { format: 'file' } });
	for (const path of ['index.html', 'interactive.html', 'nested.html', 'article.md']) {
		assert.ok(files.includes(`https://example.test/docs/${path})`));
	}
	const directories = llmsText({ ...options, htmlUrls: { trailingSlash: 'never' } });
	for (const path of ['', '/interactive', '/nested', '/article.md']) {
		assert.ok(directories.includes(`https://example.test/docs${path})`));
	}
});

test('llms.txt follows sidebar groups and order while retaining articles outside the menu', () => {
	const link = (id) => ({ type: 'link', href: `/docs/${id}/`, label: 'Menu label' });
	const text = llmsText({
		title: 'Site', siteRoot: new URL('https://example.test/docs/'),
		entries: [entry('a'), entry('b'), entry('c'), entry('outside'), entry('top'), entry('draft', { draft: true }), entry('interactive', {}, 'mdx')],
		sidebar: [
			link('top'),
			{ type: 'group', label: 'Fundamentals', entries: [link('c'), link('b'), { type: 'group', label: 'Deep topics', entries: [link('a')] }] },
			{ type: 'group', label: 'Empty', entries: [link('draft'), link('interactive'), { type: 'link', href: 'https://external.test/', label: 'External' }] },
			link('b'),
		],
	});
	assert.match(text, /## Articles\n\n- \[top\][\s\S]*### Fundamentals\n\n- \[c\][\s\S]*- \[b\][\s\S]*#### Deep topics\n\n- \[a\][\s\S]*### Other articles\n\n- \[outside\]/);
	assert.equal(text.match(/\[b\]/g)?.length, 1);
	assert.doesNotMatch(text, /Empty|External|draft/);
	assert.match(text, /## Pages\n\n- \[interactive\]/);
});

test('article links prefer existing exports and preserve queries, fragments, and code', () => {
	for (const base of ['/', '/docs/']) {
		const siteRoot = new URL(`https://example.test${base}`);
		const entries = [entry('nested/current'), entry('next'), entry('terms'), entry('interactive', {}, 'mdx'), entry('draft', { draft: true }), entry('landing', { template: 'splash' }), entry('guide(v2)')];
		const markdown = articleMarkdown({
			title: 'Links', articleUrl: new URL('nested/current/', siteRoot), siteRoot,
			markdownUrls: markdownLinkTargets(entries, siteRoot, 'terms'),
			body: [
				'[Relative](../../next/?q=1#section "Next")',
				`[Root](${base}next)`,
				`[Absolute](${siteRoot}next.html#section)`,
				`[Index](${siteRoot}next/index.html)`,
				'[Self](#section)',
				'[Existing](../../next.md)',
				'[Reference][next]', '[next]: ../../next/ "Next"',
				`<${siteRoot}next/>`,
				'[Angle](<../../next/>)',
				'[Parentheses](../../guide(v2)/)',
				'[Label [with brackets]](../../next/)', '[![Image](../../image.svg)](../../next/)',
				'Note[^1].', '[^1]: This is a note.',
				'[Glossary](../../terms/)', '[MDX](../../interactive/)', '[Draft](../../draft/)', '[Splash](../../landing/)',
				'[Missing](../../missing/)', '[External](https://external.test/next/)', '[Mail](mailto:reader@example.test)',
				'[Outside base](https://example.test/elsewhere/next/)',
				'![Image](../../next/)', '[Asset](../../image.svg)',
				'`[Inline](../../next/)`', '```md', '[Fenced](../../next/)', '```',
			].join('\n'),
			renderedHtml: '<span id="term-tip-example"></span>',
			glossary: [{ id: 'example', term: 'Example', short: 'Short.', explanation: 'More.', readMore: { label: 'Next', href: 'next/' } }],
		});
		assert.ok(markdown.includes(`[Relative](${siteRoot}next.md?q=1#section "Next")`));
		for (const label of ['Root', 'Index', 'Existing']) assert.ok(markdown.includes(`[${label}](${siteRoot}next.md)`));
		assert.ok(markdown.includes(`[Absolute](${siteRoot}next.md#section)`));
		assert.ok(markdown.includes(`[Self](${siteRoot}nested/current.md#section)`));
		assert.ok(markdown.includes(`[next]: ${siteRoot}next.md "Next"`));
		assert.ok(markdown.includes(`<${siteRoot}next.md>`));
		assert.ok(markdown.includes(`[Angle](<${siteRoot}next.md>)`));
		assert.ok(markdown.includes(`[Parentheses](${siteRoot}guide(v2).md)`));
		assert.ok(markdown.includes(`[Label [with brackets]](${siteRoot}next.md)`));
		assert.ok(markdown.includes(`[![Image](${siteRoot}image.svg)](${siteRoot}next.md)`));
		assert.ok(markdown.includes('[^1]: This is a note.'));
		for (const id of ['terms', 'interactive', 'draft', 'landing', 'missing']) assert.ok(markdown.includes(`](${siteRoot}${id}/)`));
		assert.ok(markdown.includes(`[Next](${siteRoot}next.md)`));
		assert.ok(markdown.includes(`![Image](${siteRoot}next/)`));
		assert.ok(markdown.includes(`[Asset](${siteRoot}image.svg)`));
		assert.match(markdown, /\[External\]\(https:\/\/external.test\/next\/\)/);
		assert.match(markdown, /\[Mail\]\(mailto:reader@example.test\)/);
		assert.match(markdown, /\[Outside base\]\(https:\/\/example.test\/elsewhere\/next\/\)/);
		assert.match(markdown, /`\[Inline\]\(\.\.\/\.\.\/next\/\)`/);
		assert.match(markdown, /```md\n\[Fenced\]\(\.\.\/\.\.\/next\/\)\n```/);
	}
});

test('sidebar links return to their parent section after a nested group', () => {
	const link = (id) => ({ type: 'link', href: `/${id}/` });
	const text = llmsText({
		title: 'Site', siteRoot: new URL('https://example.test/'),
		entries: ['a', 'b', 'c'].map((id) => entry(id)),
		sidebar: [{ type: 'group', label: 'Parent', entries: [
			{ type: 'group', label: 'Child', entries: [link('a')] }, link('b'),
		] }, link('c')],
	});
	assert.match(text, /### Parent\n\n#### Child\n\n- \[a\][^\n]+\n\n### Parent\n\n- \[b\][^\n]+\n\n## Articles\n\n- \[c\]/);
});

test('file-format article links resolve from the rendered file URL', () => {
	const siteRoot = new URL('https://example.test/docs/');
	const text = articleMarkdown({
		title: 'Current', body: '[Next](./next.html#details)',
		articleUrl: new URL('current.html', siteRoot), siteRoot,
		markdownUrls: markdownLinkTargets([entry('next')], siteRoot, 'terms', { format: 'file' }),
	});
	assert.ok(text.includes('[Next](https://example.test/docs/next.md#details)'));
});
