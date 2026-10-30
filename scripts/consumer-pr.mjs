import { execFileSync } from 'node:child_process';
import { compareVersions, validateVersion } from './consumer-update.mjs';

export function ownedUpdates(pulls, { owner, base, bot }) {
  return pulls.flatMap((p) => {
    const match = /^starlight-update\/v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/.exec(p.headRefName);
    return match && p.author?.login === bot && p.headRepositoryOwner?.login?.toLowerCase() === owner.toLowerCase() && p.baseRefName === base
      ? [{ ...p, version: match[1] }] : [];
  });
}
export function safeOwnedCommit(commits, files, bot, version) {
  return commits.length === 1 && commits[0].author?.login === bot &&
    commits[0].commit?.message === `chore: update starlight to ${validateVersion(version)}` &&
    files.length > 0 && files.every((file) => ['package.json', 'bun.lock'].includes(file.filename));
}
export function recoverableBranch({ tree, expectedTree, parents, base, author, bot, message, version }) {
  return tree === expectedTree && parents.length === 1 && parents[0] === base && author === bot &&
    message === `chore: update starlight to ${validateVersion(version)}`;
}
function gh(...args) { return JSON.parse(execFileSync('gh', args, { encoding: 'utf8' })); }
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { GH_REPO, OWNER, BASE, BOT, VERSION, RUNNER_TEMP } = process.env;
  validateVersion(VERSION);
  if (process.argv[2] === 'branch') {
    const fs = await import('node:fs');
    const commit = JSON.parse(fs.readFileSync(`${RUNNER_TEMP}/existing.json`));
    if (!recoverableBranch({ tree: commit.commit.tree.sha, expectedTree: process.env.EXPECTED_TREE,
      parents: commit.parents.map((p) => p.sha), base: process.env.BASE_SHA,
      author: commit.author?.login, bot: BOT, message: commit.commit.message, version: VERSION })) {
      throw new Error('Existing branch is not the expected bot update; inspect it manually.');
    }
    process.exit(0);
  }
  const pulls = ownedUpdates(gh('pr', 'list', '--state', 'open', '--json', 'number,author,headRefName,headRepositoryOwner,baseRefName', '--limit', '1000'), { owner: OWNER, base: BASE, bot: BOT });
  // Verify ownership and scope before using a PR for version ordering or closing it.
  for (const pr of pulls) {
    const commits = gh('api', '--paginate', `repos/${GH_REPO}/pulls/${pr.number}/commits`);
    const files = gh('api', '--paginate', `repos/${GH_REPO}/pulls/${pr.number}/files`);
    if (!safeOwnedCommit(commits, files, BOT, pr.version)) throw new Error(`Update PR #${pr.number} has changes that need manual review.`);
  }
  if (process.argv[2] === 'list') {
    const fs = await import('node:fs');
    fs.writeFileSync(`${RUNNER_TEMP}/open.json`, JSON.stringify(pulls.map((p) => p.version)));
  } else if (process.argv[2] === 'close-older') {
    for (const pr of pulls.filter((p) => pulls.some((target) => target.version === VERSION) && compareVersions(p.version, VERSION) < 0)) {
      execFileSync('gh', ['pr', 'close', String(pr.number)], { stdio: 'inherit' });
    }
  } else throw new Error('Unknown operation');
}
