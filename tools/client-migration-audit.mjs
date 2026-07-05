import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const legacyRoot = path.join(root, 'tools', 'legacy-client-source');
const migratedRoot = path.join(root, 'resources', 'js', 'MigratedClient');
const nativeRoots = [
  path.join(root, 'resources', 'js', 'Components', 'Client'),
  path.join(root, 'resources', 'js', 'Layouts'),
  path.join(root, 'resources', 'js', 'Pages'),
];

const reactExtensions = new Set(['.tsx', '.jsx']);
const supportExtensions = new Set(['.js', '.ts', '.css', '.d.ts', '.mjs']);

function walk(dir, predicate = () => true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      out.push(...walk(full, predicate));
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function normalize(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

const legacyReact = walk(legacyRoot, (file) => reactExtensions.has(path.extname(file)));
const legacySupport = walk(legacyRoot, (file) => supportExtensions.has(path.extname(file)));
const migratedVue = walk(migratedRoot, (file) => path.extname(file) === '.vue');
const migratedSupport = walk(migratedRoot, (file) => supportExtensions.has(path.extname(file)));
const nativeVue = nativeRoots.flatMap((dir) => walk(dir, (file) => path.extname(file) === '.vue'));

const placeholderVue = migratedVue.filter((file) => {
  const source = fs.readFileSync(file, 'utf8');
  return source.includes('MigrationFrame');
});

const routeFile = path.join(root, 'routes', 'client.php');
const routeCount = fs.existsSync(routeFile)
  ? (fs.readFileSync(routeFile, 'utf8').match(/Route::get\(/g) || []).length
  : 0;

const report = {
  legacyReactFiles: legacyReact.length,
  legacySupportFiles: legacySupport.length,
  migratedVueMirrorFiles: migratedVue.length,
  migratedSupportFiles: migratedSupport.length,
  nativeVueFiles: nativeVue.length,
  placeholderMirrorFiles: placeholderVue.length,
  clientRouteCount: routeCount,
  status:
    placeholderVue.length === 0
      ? 'fully-native'
      : 'hybrid: structure migrated, component-level native ports pending',
  pendingExamples: placeholderVue.slice(0, 25).map(normalize),
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--fail-on-placeholders') && placeholderVue.length > 0) {
  process.exitCode = 1;
}
