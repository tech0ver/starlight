import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const workspace = resolve(new URL('..', import.meta.url).pathname);
const temp = mkdtempSync(join(tmpdir(), 'tech0ver-starlight-consumer-'));
const requestedArchive = process.argv[2] ? resolve(process.argv[2]) : undefined;

function write(path, content) {
	writeFileSync(path, content);
}

function run(args, cwd) {
	const result = spawnSync('bun', args, { cwd, encoding: 'utf8', stdio: 'pipe' });
	if (result.status !== 0) {
		console.error(result.stdout);
		console.error(result.stderr);
		throw new Error(`Command failed (${result.status}): bun ${args.join(' ')}`);
	}
	return result.stdout;
}

function assertTutorUrl(html, url) {
	const tutor = html.match(/<details\b[^>]*class="article-tutor(?: [^"]*)?"[^>]*>([\s\S]*?)<\/details>/)?.[1];
	assert.ok(tutor, 'article study prompt is missing');
	const blocks = [...tutor.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/g)]
		.map((match) => match[1].replace(/<[^>]*>/g, ''));
	assert.equal(blocks.length, 2, 'study tools must show a prompt and a separate link');
	assert.ok(blocks[0].includes(`Article: ${url}`), `study prompt must include ${url}`);
	assert.equal(blocks[1], url, 'the separate article link must match the prompt');
}

try {
	mkdirSync(join(temp, 'src/content/docs'), { recursive: true });
	mkdirSync(join(temp, 'src/diagrams'), { recursive: true });
	const packageDirectory = join(workspace, 'packages', 'starlight');
	const packedOutput = requestedArchive ? undefined : run(['pm', 'pack', '--destination', temp], packageDirectory);
	const archiveName = packedOutput?.split(/\r?\n/).map((line) => line.trim()).find((line) => line.endsWith('.tgz'));
	assert.ok(requestedArchive || archiveName, 'bun pm pack did not report an archive path');
	const archive = requestedArchive || (archiveName.startsWith('/') ? archiveName : join(temp, archiveName));
	assert.ok(existsSync(archive), `Package archive was not created: ${archive}`);

	write(join(temp, 'package.json'), JSON.stringify({
		name: 'fresh-tech0ver-consumer',
		private: true,
		type: 'module',
		scripts: { build: 'astro build' },
		dependencies: {
			'@astrojs/markdown-satteri': '0.4.2',
			'@astrojs/starlight': '0.42.5',
			'@tech0ver/starlight': `file:${archive}`,
			astro: '7.3.5',
			sharp: '0.35.3',
		},
	}, null, 2));
	const consumerConfig = [
		"import { defineTech0verConfig } from '@tech0ver/starlight';",
		"import { fileURLToPath } from 'node:url';",
		'default export should be replaced',
	].join('\n').replace('default export should be replaced', [
		"export default defineTech0verConfig({",
		"  site: 'https://example.test',",
		"  root: fileURLToPath(new URL('./', import.meta.url)),",
		"  base: '/consumer',",
		"  outDir: fileURLToPath(new URL('./dist/consumer/', import.meta.url)),",
		"  brand: { name: 'Packed', suffix: 'Demo' },",
		"  sidebarWidth: 256,",
		"  reading: { storageKey: 'packed-demo', position: { ignoreSections: ['reference'] } },",
		"  plannedTopLevel: ['Future guide', 'Glossary'],",
		"  plannedTopics: { Docs: ['Reading', 'Coming next'] },",
		"  callouts: { do: 'Try \"this\" & learn', explain: 'How it works' },",
		"  glossary: { entries: [{ id: 'callout', term: 'Callout', short: 'A guidance block.', explanation: 'It highlights a useful point.' }] },",
		"  diagrams: { directory: './src/diagrams/' },",
		"  rawMarkdown: { enabled: true },",
		"  tutor: { enabled: true, title: 'Explore this article with AI' },",
		"  starlight: { title: 'PackedDemo', description: 'A packed documentation site.', sidebar: [{ label: 'Docs', items: ['index', 'reading', 'interactive'] }, 'glossary'] },",
		'});',
	].join('\n'));
	write(join(temp, 'astro.config.mjs'), consumerConfig);
	write(join(temp, 'src/content.config.ts'), [
		"import { defineCollection } from 'astro:content';",
		"import { docsLoader } from '@astrojs/starlight/loaders';",
		"import { docsSchema } from '@astrojs/starlight/schema';",
		'export const collections = { docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }) };',
	].join('\n'));
	write(join(temp, 'src/content/docs/index.md'), [
		'---', 'title: PackedDemo', 'description: A packed consumer.', '---', '', 'A **callout** highlights a useful point.',
	].join('\n'));
	write(join(temp, 'src/content/docs/reading.md'), [
		'---', 'title: Reading', 'description: A packed article.', '---', '', '::diagram{name="layout"}', '', '::diagram{name="compact"}', '', ':::do', 'Use the shared layout.', ':::', '', ':::explain', 'Each site owns its articles.', ':::',
		'', '::mark-as-read', '', '## A custom summary', '', 'Reference text.', '', '::mark-as-read',
	].join('\n'));
	write(join(temp, 'src/content/docs/interactive.mdx'), [
		'---', 'title: Interactive', 'description: A packed MDX article.', '---', '', "import MarkAsRead from '@tech0ver/starlight/components/MarkAsRead.astro';", '', '<span>This page uses MDX.</span>', '', '<MarkAsRead />',
	].join('\n'));
	write(join(temp, 'src/content/docs/no-outline.md'), '---\ntitle: Without an outline\ntableOfContents: false\n---\n\n## First section\n\nArticle content.\n\n## Reference\n\nReference content.');
	write(join(temp, 'src/content/docs/glossary.mdx'), [
		'---', 'title: Glossary', '---', '', "import Glossary from '@tech0ver/starlight/components/Glossary.astro';", '', '<Glossary />',
	].join('\n'));
	mkdirSync(join(temp, 'src/content/docs/nested'), { recursive: true });
	write(join(temp, 'src/content/docs/nested/guide.md'), '---\ntitle: Nested guide\ndescription: A nested article.\n---\n\nNested content.');
	write(join(temp, 'src/content/docs/nested/overview.mdx'), '---\ntitle: Nested overview\nslug: nested/index\n---\n\nAn MDX landing page.');
	write(join(temp, 'src/content/docs/draft.md'), '---\ntitle: Unpublished\ndraft: true\n---\n\nDraft content.');
	write(join(temp, 'src/diagrams/layout.svg'), '<svg class="diagram-svg" viewBox="0 0 720 120"><rect class="dg-box" x="10" y="10" width="200" height="80"/><text class="dg-name" x="30" y="55">Article layout</text></svg>\n');
	write(join(temp, 'src/diagrams/compact.svg'), '<svg class="diagram-svg" viewBox="0 0 360 120"><rect class="dg-box" x="10" y="10" width="200" height="80"/><text class="dg-name" x="30" y="55">Compact layout</text></svg>\n');

	run(['install', '--no-progress'], temp);
	const installedPackage = join(temp, 'node_modules', '@tech0ver', 'starlight');
	assert.equal(JSON.parse(readFileSync(join(installedPackage, 'package.json'), 'utf8')).license, 'MIT');
	assert.equal(readFileSync(join(installedPackage, 'LICENSE'), 'utf8'),
		readFileSync(join(workspace, 'LICENSE'), 'utf8'), 'installed package must include the project license');
	assert.equal(readFileSync(join(installedPackage, 'CHANGELOG.md'), 'utf8'),
		readFileSync(join(packageDirectory, 'CHANGELOG.md'), 'utf8'), 'installed package must include the project changelog');
	run(['run', 'build'], temp);
	const output = join(temp, 'dist', 'consumer');
	assert.ok(existsSync(join(output, 'index.html')), 'packed home page is missing');
	assert.ok(existsSync(join(output, 'reading', 'index.html')), 'packed article is missing');
	assert.ok(existsSync(join(output, 'glossary', 'index.html')), 'packed glossary is missing');
	const noOutlineHtml = readFileSync(join(output, 'no-outline', 'index.html'), 'utf8');
	assert.match(noOutlineHtml, /data-reading-position/, 'articles without a TOC must support section progress');
	const positionScript = noOutlineHtml.match(/src="([^"]*ReadingPosition[^"]*\.js)"/)?.[1];
	assert.ok(positionScript, 'section tracking must load independently of the table of contents');
	assert.ok(existsSync(join(output, positionScript.slice('/consumer/'.length))), 'installed section tracking script is missing');
	const glossaryHtml = readFileSync(join(output, 'glossary', 'index.html'), 'utf8');
	assert.match(glossaryHtml, /<h2\b[^>]*id="callout"[^>]*>/, 'glossary terms must be headings tracked by Starlight');
	assert.match(glossaryHtml, /<a\b[^>]*class="sl-anchor-link"[^>]*href="#callout"/, 'glossary terms must have shareable anchor links');
	assert.ok(existsSync(join(output, 'reading.md')), 'packed raw Markdown route is missing');
	const llms = readFileSync(join(output, 'llms.txt'), 'utf8');
	assert.match(llms, /^# PackedDemo\n\n> A packed documentation site\.\n/);
	assert.ok(llms.includes('[Reading](https://example.test/consumer/reading.md): A packed article.'));
	assert.ok(llms.includes('[Nested guide](https://example.test/consumer/nested/guide.md): A nested article.'));
	assert.ok(llms.includes('[Interactive](https://example.test/consumer/interactive/)'));
	assert.ok(llms.includes('[Glossary](https://example.test/consumer/glossary/)'));
	assert.ok(llms.includes('[Nested overview](https://example.test/consumer/nested/)'));
	assert.ok(llms.includes('[PackedDemo](https://example.test/consumer/)'));
	assert.doesNotMatch(llms, /Unpublished|draft\.md|interactive\.md|glossary\.md|index\.md/);
	assert.doesNotMatch(readFileSync(join(output, 'index.html'), 'utf8'), /rel="alternate"[^>]*type="text\/markdown"/);
	assert.ok(!existsSync(join(output, 'draft.md')), 'draft articles must not have Markdown exports');
	const html = readFileSync(join(output, 'reading', 'index.html'), 'utf8');
	assert.match(html, /<link\b[^>]*rel="describedby"[^>]*href="\/consumer\/llms\.txt"/);
	assert.match(html, /<link\b[^>]*rel="alternate"[^>]*type="text\/markdown"[^>]*href="\/consumer\/reading\.md"/);
	assert.equal([...html.matchAll(/<div\b[^>]*\bdata-mark-read-slot/g)].length, 2, 'each Markdown marker must have its own button slot');
	assert.doesNotMatch(readFileSync(join(output, 'reading.md'), 'utf8'), /::mark-as-read/, 'raw exports must omit reading controls');
	assert.match(html, /PackedDemo|Packed/);
	assertTutorUrl(html, 'https://example.test/consumer/reading.md');
	assert.match(html, /<summary\b[^>]*><span\b[^>]*>Explore this article with AI<\/span>/, 'installed package must use the configured study heading');
	const mdxHtml = readFileSync(join(output, 'interactive', 'index.html'), 'utf8');
	assert.match(mdxHtml, /data-mark-read="interactive"/, 'MDX must support the public reading button without props');
	assertTutorUrl(mdxHtml, 'https://example.test/consumer/interactive/');
	assert.ok(!existsSync(join(output, 'interactive.md')), 'MDX must not have a plain Markdown endpoint');
	assert.doesNotMatch(mdxHtml, /rel="alternate"[^>]*type="text\/markdown"/);
	const plannedLabels = [...html.matchAll(/class="planned-topic(?: [^"]*)?"[^>]*>\s*<span(?: class="[^"]*")?>([^<]+)<\/span>/g)].map((match) => match[1]);
	assert.deepEqual(plannedLabels, ['Future guide', 'Coming next'], 'planned labels must be unlinked and skip published entries');
	assert.match(html, /class="planned-topic(?: [^"]*)?" aria-disabled="true"/);
	assert.match(html, /class="diagram-svg"/);
	assert.match(html, /<svg style="width: 50\.00%; min-width: 300px"/);
	assert.match(html, /data-label="Try &quot;this&quot; &amp; learn"/);
	assert.match(html, /class="block block-explain" data-label="How it works"/);
	assert.match(readFileSync(join(output, 'reading.md'), 'utf8'), /> \*\*Try "this" & learn\*\*/);
	assert.match(readFileSync(join(output, 'reading.md'), 'utf8'), /> \*\*How it works\*\*/);
	const icons = [...html.matchAll(/<link\b[^>]*rel="(?:shortcut )?icon"[^>]*>/g)];
	assert.equal(icons.length, 1, 'there must be one shared favicon');
	const iconPath = icons[0][0].match(/href="([^"]+)"/)?.[1];
	assert.ok(iconPath?.startsWith('/consumer/_astro/'), 'favicon must use the consumer base');
	const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
	assert.equal(digest(join(output, iconPath.slice('/consumer/'.length))),
		digest(join(packageDirectory, 'src/assets/favicon.png')), 'favicon bytes changed during packaging');
	const assets = readdirSync(join(output, '_astro'));
	const css = assets.filter((name) => name.endsWith('.css')).map((name) => readFileSync(join(output, '_astro', name), 'utf8')).join('\n');
	assert.match(css, /--site-left-sidebar-width:\s*256px/, 'consumer sidebar width must be included in the installed package build');
	assert.ok(assets.some((name) => name.endsWith('.ttf')), 'wordmark font was not packaged');

	// Rebuild at the domain root to check index and discovery links without a prefix.
	const rootConfig = consumerConfig
		.replace("base: '/consumer'", "base: '/'")
		.replace("'./dist/consumer/'", "'./dist/root/'");
	write(join(temp, 'astro.config.mjs'), rootConfig);
	run(['run', 'build'], temp);
	const rootOutput = join(temp, 'dist', 'root');
	const rootLlms = readFileSync(join(rootOutput, 'llms.txt'), 'utf8');
	assert.ok(rootLlms.includes('[Nested guide](https://example.test/nested/guide.md)'));
	assert.ok(rootLlms.includes('[PackedDemo](https://example.test/)'));
	assert.doesNotMatch(rootLlms, /\/consumer\/|Unpublished/);
	assert.match(readFileSync(join(rootOutput, 'reading', 'index.html'), 'utf8'), /rel="describedby"[^>]*href="\/llms\.txt"/);

	// File output must link to the actual .html pages, including explicit index slugs.
	write(join(temp, 'astro.config.mjs'), consumerConfig
		.replace("  base: '/consumer',", "  base: '/consumer',\n  build: { format: 'file' },")
		.replace("'./dist/consumer/'", "'./dist/files/'"));
	run(['run', 'build'], temp);
	const fileOutput = join(temp, 'dist', 'files');
	const fileLlms = readFileSync(join(fileOutput, 'llms.txt'), 'utf8');
	for (const [title, path] of [['PackedDemo', 'index.html'], ['Interactive', 'interactive.html'], ['Glossary', 'glossary.html'], ['Nested overview', 'nested.html'], ['Reading', 'reading.md']]) {
		assert.ok(fileLlms.includes(`[${title}](https://example.test/consumer/${path})`));
		assert.ok(existsSync(join(fileOutput, path)), `index target ${path} must exist`);
	}

	// Disable exports: prompts must use rendered pages and discovery links disappear.
	write(join(temp, 'astro.config.mjs'), consumerConfig
		.replace("base: '/consumer'", "base: '/'")
		.replace("'./dist/consumer/'", "'./dist/root/'")
		.replace('rawMarkdown: { enabled: true }', 'rawMarkdown: { enabled: false }')
		.replace("tutor: { enabled: true, title: 'Explore this article with AI' }", 'tutor: { enabled: true }'));
	run(['run', 'build'], temp);
	const rootHtml = readFileSync(join(rootOutput, 'reading', 'index.html'), 'utf8');
	assert.equal([...rootHtml.matchAll(/<div\b[^>]*\bdata-mark-read-slot/g)].length, 2, 'explicit placement must also work at the domain root');
	assertTutorUrl(rootHtml, 'https://example.test/reading/');
	assert.match(rootHtml, /<summary\b[^>]*><span\b[^>]*>Study this article with an AI assistant<\/span>/, 'omitting the study heading must preserve the default');
	assert.ok(!existsSync(join(rootOutput, 'reading.md')), 'disabled exports must not create Markdown endpoints');
	assert.ok(!existsSync(join(rootOutput, 'llms.txt')), 'disabled exports must not create the index');
	assert.doesNotMatch(rootHtml, /rel="describedby"|rel="alternate"[^>]*type="text\/markdown"/);
	assertTutorUrl(readFileSync(join(rootOutput, 'interactive', 'index.html'), 'utf8'), 'https://example.test/interactive/');
	console.log(`Packed consumer passed: ${temp}`);
	rmSync(temp, { recursive: true, force: true });
} catch (error) {
	console.error(`Packed consumer kept for inspection: ${temp}`);
	throw error;
}
