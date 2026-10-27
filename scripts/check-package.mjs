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
	write(join(temp, 'astro.config.mjs'), [
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
		"  plannedTopLevel: ['Future guide', 'Glossary'],",
		"  plannedTopics: { Docs: ['Reading', 'Coming next'] },",
		"  callouts: { do: 'Try \"this\" & learn', explain: 'How it works' },",
		"  glossary: { entries: [{ id: 'callout', term: 'Callout', short: 'A guidance block.', explanation: 'It highlights a useful point.' }] },",
		"  diagrams: { directory: './src/diagrams/' },",
		"  rawMarkdown: { enabled: true },",
		"  tutor: { enabled: true },",
		"  starlight: { title: 'PackedDemo', sidebar: [{ label: 'Docs', items: ['index', 'reading'] }, 'glossary'] },",
		'});',
	].join('\n')));
	write(join(temp, 'src/content.config.ts'), [
		"import { defineCollection } from 'astro:content';",
		"import { docsLoader } from '@astrojs/starlight/loaders';",
		"import { docsSchema } from '@astrojs/starlight/schema';",
		'export const collections = { docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }) };',
	].join('\n'));
	write(join(temp, 'src/content/docs/index.mdx'), [
		'---', 'title: PackedDemo', 'description: A packed consumer.', '---', '', 'A **callout** highlights a useful point.',
	].join('\n'));
	write(join(temp, 'src/content/docs/reading.md'), [
		'---', 'title: Reading', 'description: A packed article.', '---', '', '::diagram{name="layout"}', '', ':::do', 'Use the shared layout.', ':::', '', ':::explain', 'Each site owns its articles.', ':::',
	].join('\n'));
	write(join(temp, 'src/content/docs/glossary.mdx'), [
		'---', 'title: Glossary', '---', '', "import Glossary from '@tech0ver/starlight/components/Glossary.astro';", '', '<Glossary />',
	].join('\n'));
	write(join(temp, 'src/diagrams/layout.svg'), '<svg class="diagram-svg" viewBox="0 0 720 120"><rect class="dg-box" x="10" y="10" width="200" height="80"/><text class="dg-name" x="30" y="55">Article layout</text></svg>\n');

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
	assert.ok(existsSync(join(output, 'reading.md')), 'packed raw Markdown route is missing');
	const html = readFileSync(join(output, 'reading', 'index.html'), 'utf8');
	assert.match(html, /PackedDemo|Packed/);
	const plannedLabels = [...html.matchAll(/class="planned-topic(?: [^"]*)?"[^>]*>\s*<span(?: class="[^"]*")?>([^<]+)<\/span>/g)].map((match) => match[1]);
	assert.deepEqual(plannedLabels, ['Future guide', 'Coming next'], 'planned labels must be unlinked and skip published entries');
	assert.match(html, /class="planned-topic(?: [^"]*)?" aria-disabled="true"/);
	assert.match(html, /class="diagram-svg"/);
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
	console.log(`Packed consumer passed: ${temp}`);
	rmSync(temp, { recursive: true, force: true });
} catch (error) {
	console.error(`Packed consumer kept for inspection: ${temp}`);
	throw error;
}
