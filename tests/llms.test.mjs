import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasMarkdownExport, llmsText } from '../packages/starlight/src/lib/llms.mjs';

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
