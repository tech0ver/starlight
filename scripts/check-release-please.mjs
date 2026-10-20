import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRelease } from './check-release.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'starlight-release-please-'));
const toolDirectory = join(temporaryRoot, 'tool');
const scenariosDirectory = join(temporaryRoot, 'scenarios');

function copy(path, destination) {
	const target = join(destination, path);
	mkdirSync(dirname(target), { recursive: true });
	cpSync(join(root, path), target, { recursive: true });
}

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runBun(args, cwd) {
	execFileSync('bun', args, { cwd, stdio: 'pipe', timeout: 600_000 });
}

try {
	mkdirSync(toolDirectory, { recursive: true });
	writeJson(join(toolDirectory, 'package.json'), { private: true });
	runBun(['add', '--exact', 'release-please@17.3.0', '--ignore-scripts'], toolDirectory);
	const require = createRequire(join(toolDirectory, 'package.json'));
	const load = (path) => require(join(toolDirectory, 'node_modules/release-please/build/src', path));
	// Load the factory first so Release Please initializes its CommonJS strategy graph
	// before a concrete strategy is imported on Node.js 24.
	load('factory.js');
	const { Node } = load('strategies/node.js');
	const { DefaultVersioningStrategy } = load('versioning-strategies/default.js');
	const { Version } = load('version.js');
	const { TagName } = load('util/tag-name.js');
	const { parseConventionalCommits } = load('commit.js');
	const { ReleasePleaseManifest } = load('updaters/release-please-manifest.js');

	const config = JSON.parse(readFileSync(join(root, 'release-please-config.json'), 'utf8'));
	const options = config.packages['packages/starlight'];
	const originalChangelog = readFileSync(join(root, 'packages/starlight/CHANGELOG.md'), 'utf8');
	const initialNotes = originalChangelog.slice(originalChangelog.indexOf('## 0.1.0'));
	mkdirSync(scenariosDirectory, { recursive: true });

	for (const [message, expectedVersion] of [
		['fix: correct a reading control', '0.1.1'],
		['feat: add a reading option', '0.2.0'],
		['feat!: change the config API\n\nBREAKING CHANGE: replace a config option', '0.2.0'],
	]) {
		const scenario = mkdtempSync(join(scenariosDirectory, 'case-'));
		for (const path of ['package.json', 'demo/package.json', 'packages/starlight/package.json', 'packages/starlight/CHANGELOG.md', '.release-please-manifest.json', 'bun.lock']) {
			copy(path, scenario);
		}
		const github = {
			repository: { owner: 'tech0ver', repo: 'starlight' },
			async getFileContentsOnBranch(path) {
				const parsedContent = readFileSync(join(root, path), 'utf8');
				return { sha: 'a'.repeat(40), content: Buffer.from(parsedContent).toString('base64'), parsedContent, mode: '100644' };
			},
		};
		const strategy = new Node({
			github,
			targetBranch: 'main',
			path: 'packages/starlight',
			changelogPath: options['changelog-path'],
			includeComponentInTag: config['include-component-in-tag'],
			extraFiles: options['extra-files'],
			versioningStrategy: new DefaultVersioningStrategy({
				bumpMinorPreMajor: config['bump-minor-pre-major'],
				bumpPatchForMinorPreMajor: config['bump-patch-for-minor-pre-major'],
			}),
		});
		const commits = parseConventionalCommits([{ sha: 'b'.repeat(40), message, files: ['packages/starlight/src/config.mjs'] }]);
		const candidate = await strategy.buildReleasePullRequest(commits, {
			tag: new TagName(Version.parse('0.1.0'), undefined, undefined, true),
			sha: 'a'.repeat(40),
			notes: '',
		});
		assert.ok(candidate, `Release Please skipped ${message.split('\n')[0]}`);
		assert.equal(candidate.version.toString(), expectedVersion);

		const updated = [];
		for (const update of candidate.updates) {
			const target = join(scenario, update.path);
			if (!existsSync(target) && !update.createIfMissing) continue;
			const oldContent = existsSync(target) ? readFileSync(target, 'utf8') : undefined;
			mkdirSync(dirname(target), { recursive: true });
			writeFileSync(target, update.updater.updateContent(oldContent));
			updated.push(update.path);
		}
		assert.ok(updated.includes('packages/starlight/package.json'), 'package update is missing');
		assert.ok(updated.includes('packages/starlight/CHANGELOG.md'), 'changelog update is missing');
		assert.ok(updated.includes('bun.lock'), 'root lockfile update is missing');

		const manifestPath = join(scenario, '.release-please-manifest.json');
		const manifestUpdater = new ReleasePleaseManifest({
			version: candidate.version,
			versionsMap: new Map([['packages/starlight', candidate.version]]),
		});
		writeFileSync(manifestPath, manifestUpdater.updateContent(readFileSync(manifestPath, 'utf8')));

		assert.equal(JSON.parse(readFileSync(join(scenario, 'packages/starlight/package.json'), 'utf8')).version, expectedVersion);
		assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8'))['packages/starlight'], expectedVersion);
		const updatedChangelog = readFileSync(join(scenario, 'packages/starlight/CHANGELOG.md'), 'utf8');
		assert.ok(updatedChangelog.endsWith(initialNotes), 'complete initial release notes were not preserved');
		const lock = readFileSync(join(scenario, 'bun.lock'), 'utf8');
		assert.match(lock, new RegExp(`"version": "${expectedVersion.replaceAll('.', '\\.')}", // x-release-please-version`));
		assert.equal((lock.match(/x-release-please-version/g) || []).length, 1);
		validateRelease(scenario, `v${expectedVersion}`);
		runBun(['install', '--frozen-lockfile', '--ignore-scripts'], scenario);
		console.log(`PASS ${message.split('\n')[0]} -> ${expectedVersion}`);
	}
} finally {
	rmSync(temporaryRoot, { recursive: true, force: true });
}
