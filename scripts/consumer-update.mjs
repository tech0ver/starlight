import fs from 'node:fs';

export const packageName = '@tech0ver/starlight';
const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function validateVersion(version) {
  if (!stable.test(version || '')) throw new Error('Expected a canonical stable x.y.z version.');
  return version;
}
export function compareVersions(a, b) {
  validateVersion(a); validateVersion(b);
  for (const [x, y] of a.split('.').map(BigInt).map((n, i) => [n, BigInt(b.split('.')[i])])) {
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}
export function releaseUrl(version, url = '') {
  const canonical = `https://github.com/tech0ver/starlight/releases/tag/v${validateVersion(version)}`;
  if (url && url !== canonical) throw new Error('Release URL must be canonical and match the version.');
  return canonical;
}
export function updateManifest(manifest, version, metadata, openVersions = []) {
  validateVersion(version);
  if (metadata.name !== packageName || metadata.version !== version) throw new Error('Registry metadata does not match target package and version.');
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies'];
  const locations = sections.filter((section) => Object.hasOwn(manifest[section] || {}, packageName));
  if (locations.length !== 1) throw new Error('Expected exactly one installed starlight dependency in package.json.');
  const current = manifest[locations[0]][packageName];
  const match = /^[~^]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(current);
  if (!match) throw new Error('Use a simple stable version, ^version, or ~version for starlight.');
  if (compareVersions(version, match.slice(1).join('.')) <= 0 || openVersions.some((v) => compareVersions(version, v) <= 0)) return false;
  manifest[locations[0]][packageName] = version;
  for (const [name, peerVersion] of Object.entries(metadata.peerDependencies || {})) {
    validateVersion(peerVersion);
    if (!sections.some((section) => Object.hasOwn(manifest[section] || {}, name))) {
      if (!metadata.peerDependenciesMeta?.[name]?.optional) throw new Error(`Required peer ${name} is absent; add it manually before updating.`);
      continue;
    }
    for (const section of sections) {
      if (Object.hasOwn(manifest[section] || {}, name)) manifest[section][name] = peerVersion;
    }
  }
  return true;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [version, url, metadataFile, openFile] = process.argv.slice(2);
  const canonical = releaseUrl(version, url);
  const file = 'package.json';
  const original = fs.readFileSync(file, 'utf8');
  const manifest = JSON.parse(original);
  const updated = updateManifest(manifest, version, JSON.parse(fs.readFileSync(metadataFile)), JSON.parse(fs.readFileSync(openFile)));
  if (updated) {
    const indent = /\n([\t ]+)"/.exec(original)?.[1] || '  ';
    fs.writeFileSync(file, JSON.stringify(manifest, null, indent) + '\n');
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `update=${updated}\nrelease_url=${canonical}\n`);
}
