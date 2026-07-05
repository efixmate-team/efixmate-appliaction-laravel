import fs from 'node:fs';
import path from 'node:path';

const oldRoot = 'E:/Projects/efixmate/server/src';
const newRoot = 'E:/Projects/efixmate-appliaction-laravel/v1';
const routeListPath = path.join(newRoot, 'storage/app/route-list.json');
const reportPath = path.join(newRoot, 'docs/api-parity-audit.md');
const jsonPath = path.join(newRoot, 'docs/api-parity-audit.json');

const mountedRouteFiles = [
  ['modules/technician/routes/geo.routes.js', ''],
  ['modules/public/routes/public.routes.js', '/public'],
  ['modules/admin/routes/admin.routes.js', '/admin'],
  ['modules/admin/routes/operational.routes.js', '/admin'],
  ['modules/admin/ops/ops.routes.js', '/admin/ops'],
  ['modules/admin/technicians/Routes/technicians.routes.js', '/admin/technicians'],
  ['modules/admin/bookings/Routes/bookings.routes.js', '/admin/bookings'],
  ['modules/admin/dashboard/Routes/dashboard.routes.js', '/admin/dashboard'],
  ['modules/admin/pricing/Routes/pricing.routes.js', '/admin/pricing'],
  ['modules/admin/slots/Routes/slots.routes.js', '/admin/slots'],
  ['modules/admin/service-areas/Routes/serviceAreas.routes.js', '/admin/service-areas'],
  ['modules/admin/notifications/Routes/notifications.routes.js', '/admin/notifications'],
  ['modules/admin/support/Routes/support.routes.js', '/admin/support'],
  ['modules/admin/analytics/Routes/analytics.routes.js', '/admin/analytics'],
  ['modules/admin/audit/Routes/audit.routes.js', '/admin/audit'],
  ['modules/admin/realtime/Routes/realtime.routes.js', '/admin/realtime'],
  ['modules/admin/finance/Routes/finance.routes.js', '/admin/finance'],
  ['modules/admin/security/Routes/security.routes.js', '/admin/security'],
  ['modules/admin/crm/Routes/crm.routes.js', '/admin/crm'],
  ['modules/admin/contact-inquiries/Routes/contactInquiry.routes.js', '/admin/contact-inquiries'],
  ['modules/admin/tracker/Routes/tracker.routes.js', '/admin/tracker'],
  ['modules/user/routes/user.routes.js', '/user'],
  ['modules/technician/routes/technician.routes.js', '/technician'],
  ['modules/booking/routes/booking.routes.js', '/booking'],
  ['modules/masters/routes/lookup.routes.js', '/lookup'],
  ['modules/masters/routes/master.routes.js', '/master'],
  ['modules/masters/routes/pricing.routes.js', '/pricing'],
  ['modules/pricing/routes/pricing.routes.js', '/pricing'],
];

const oldDirectRoutes = [
  { method: 'POST', path: '/check-uid', source: 'src/app.js' },
  { method: 'POST', path: '/logout', source: 'src/app.js' },
  { method: 'GET', path: '/health', source: 'src/app.js' },
  { method: 'GET', path: '/metrics', source: 'src/app.js' },
];

function normalizeRoute(rawPath) {
  let value = rawPath.trim();
  if (!value || value === '*') return '/{legacyPath}';
  value = value.replace(/\/+/g, '/');
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/$/, '') || '/';
  value = value.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  value = value.replace(/\*/g, '{legacyPath}');
  return value;
}

function joinRoute(prefix, child) {
  const p = normalizeRoute(prefix || '/');
  const c = normalizeRoute(child || '/');
  if (p === '/') return c;
  if (c === '/') return p;
  return normalizeRoute(`${p}/${c}`);
}

function expandMethods(method) {
  const upper = method.toUpperCase();
  return upper === 'ALL' || upper === 'ANY' ? ['ANY'] : [upper];
}

function routeKey(method, routePath) {
  return `${method} ${normalizeRoute(routePath)}`;
}

function methodMatches(oldMethod, newMethods) {
  return newMethods.includes('ANY') || newMethods.includes(oldMethod);
}

function extractOldRoutes() {
  const routes = [...oldDirectRoutes];
  const routeCall = /(?:router|adminRoutes|app)\s*\.\s*(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  const routeChain = /(?:router|adminRoutes)\s*\.\s*route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)([\s\S]*?)(?=;|\n\s*(?:router|adminRoutes)\s*\.|$)/gi;
  const chainMethod = /\.(get|post|put|patch|delete|all)\s*\(/gi;

  for (const [relativeFile, prefix] of mountedRouteFiles) {
    const fullPath = path.join(oldRoot, relativeFile);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const match of content.matchAll(routeCall)) {
      for (const method of expandMethods(match[1])) {
        routes.push({
          method,
          path: joinRoute(prefix, match[2]),
          source: relativeFile.replaceAll('\\', '/'),
        });
      }
    }

    for (const match of content.matchAll(routeChain)) {
      const childPath = match[1];
      const chain = match[2];
      for (const methodMatch of chain.matchAll(chainMethod)) {
        for (const method of expandMethods(methodMatch[1])) {
          routes.push({
            method,
            path: joinRoute(prefix, childPath),
            source: relativeFile.replaceAll('\\', '/'),
          });
        }
      }
    }
  }

  const byKey = new Map();
  for (const route of routes) {
    const key = routeKey(route.method, route.path);
    if (!byKey.has(key)) byKey.set(key, { ...route, sources: [route.source] });
    else byKey.get(key).sources.push(route.source);
  }
  return [...byKey.values()].sort((a, b) => routeKey(a.method, a.path).localeCompare(routeKey(b.method, b.path)));
}

function extractNewRoutes() {
  const raw = JSON.parse(fs.readFileSync(routeListPath, 'utf8').replace(/^\uFEFF/, ''));
  return raw.flatMap((route) => {
    const uri = normalizeRoute(`/${route.uri}`);
    const methods = String(route.method)
      .split('|')
      .map((method) => method.trim().toUpperCase())
      .filter((method) => method && method !== 'HEAD');
    return methods.map((method) => ({
      method: method === 'ANY' ? 'ANY' : method,
      path: uri,
      action: route.action || '',
      name: route.name || '',
      middleware: route.middleware || [],
      legacy: String(route.action || '').includes('LegacyApiController'),
    }));
  });
}

function findDirect(newRoutes, method, candidatePath, legacyWanted) {
  const normalized = normalizeRoute(candidatePath);
  return newRoutes.find((route) => {
    return route.path === normalized
      && methodMatches(method, [route.method])
      && (legacyWanted == null || route.legacy === legacyWanted);
  });
}

function prefixBucket(routePath) {
  const segments = normalizeRoute(routePath).split('/').filter(Boolean);
  if (segments[0] === 'admin' && segments[1]) return `/admin/${segments[1]}`;
  return segments[0] ? `/${segments[0]}` : '/';
}

function classify(oldRoute, newRoutes) {
  const oldPath = normalizeRoute(oldRoute.path);
  const apiPath = normalizeRoute(`/api${oldPath}`);

  const exactReal = findDirect(newRoutes, oldRoute.method, oldPath, false);
  if (exactReal) return { status: 'implemented_exact_old_path', matchedPath: exactReal.path, action: exactReal.action };

  const apiReal = findDirect(newRoutes, oldRoute.method, apiPath, false);
  if (apiReal) return { status: 'implemented_api_prefixed', matchedPath: apiReal.path, action: apiReal.action };

  const exactLegacy = findDirect(newRoutes, oldRoute.method, oldPath, true) || findDirect(newRoutes, 'ANY', oldPath, true);
  if (exactLegacy) return { status: 'legacy_exact_reserved', matchedPath: exactLegacy.path, action: exactLegacy.action };

  const apiLegacy = findDirect(newRoutes, oldRoute.method, apiPath, true) || findDirect(newRoutes, 'ANY', apiPath, true);
  if (apiLegacy) return { status: 'legacy_api_reserved', matchedPath: apiLegacy.path, action: apiLegacy.action };

  const legacyCatchalls = newRoutes.filter((route) => route.legacy && methodMatches(oldRoute.method, [route.method]) && route.path.endsWith('/{legacyPath}'));
  const catchallOld = legacyCatchalls.find((route) => oldPath === route.path.replace('/{legacyPath}', '') || oldPath.startsWith(`${route.path.replace('/{legacyPath}', '')}/`));
  if (catchallOld) return { status: 'legacy_catchall_old_path', matchedPath: catchallOld.path, action: catchallOld.action };

  const catchallApi = legacyCatchalls.find((route) => apiPath === route.path.replace('/{legacyPath}', '') || apiPath.startsWith(`${route.path.replace('/{legacyPath}', '')}/`));
  if (catchallApi) return { status: 'legacy_catchall_api_prefixed', matchedPath: catchallApi.path, action: catchallApi.action };

  return { status: 'missing', matchedPath: null, action: null };
}

const oldRoutes = extractOldRoutes();
const newRoutes = extractNewRoutes();
const audited = oldRoutes.map((route) => ({ ...route, ...classify(route, newRoutes), bucket: prefixBucket(route.path) }));

const statusCounts = audited.reduce((counts, route) => {
  counts[route.status] = (counts[route.status] || 0) + 1;
  return counts;
}, {});

const legacyOnlyStatuses = new Set(['legacy_exact_reserved', 'legacy_api_reserved', 'legacy_catchall_old_path', 'legacy_catchall_api_prefixed']);
const implementedStatuses = new Set(['implemented_exact_old_path', 'implemented_api_prefixed']);
const implementedCount = audited.filter((route) => implementedStatuses.has(route.status)).length;
const legacyOnlyCount = audited.filter((route) => legacyOnlyStatuses.has(route.status)).length;
const missingCount = audited.filter((route) => route.status === 'missing').length;

const byBucket = audited.reduce((counts, route) => {
  counts[route.bucket] ??= { total: 0, implemented: 0, legacyOnly: 0, missing: 0 };
  counts[route.bucket].total += 1;
  if (implementedStatuses.has(route.status)) counts[route.bucket].implemented += 1;
  if (legacyOnlyStatuses.has(route.status)) counts[route.bucket].legacyOnly += 1;
  if (route.status === 'missing') counts[route.bucket].missing += 1;
  return counts;
}, {});

const topBuckets = Object.entries(byBucket)
  .sort((a, b) => (b[1].legacyOnly + b[1].missing) - (a[1].legacyOnly + a[1].missing) || b[1].total - a[1].total)
  .slice(0, 25);

const missingOrLegacy = audited
  .filter((route) => route.status === 'missing' || legacyOnlyStatuses.has(route.status))
  .sort((a, b) => a.bucket.localeCompare(b.bucket) || routeKey(a.method, a.path).localeCompare(routeKey(b.method, b.path)));

const sampleRows = missingOrLegacy.slice(0, 250).map((route) => {
  return `| \`${route.method}\` | \`${route.path}\` | ${route.status} | \`${route.matchedPath || '-'}\` | \`${route.sources[0]}\` |`;
});

const report = `# API Parity Audit

Generated: ${new Date().toISOString()}

Old source: \`E:\\Projects\\efixmate\\server\`

New target: \`E:\\Projects\\efixmate-appliaction-laravel\\v1\`

## Verdict

The Laravel \`v1\` API is **not exactly the same** as the old Express server API yet.

The new app exposes a broad compatibility layer through \`LegacyApiController\` catch-all routes, so many old URLs are reserved and will not 404. However, most old Express endpoints are not backed by concrete Laravel controller implementations yet. Treat every \`legacy_*\` row below as compatibility coverage only, not feature parity.

## Counts

| Metric | Count |
| --- | ---: |
| Old Express routes audited | ${oldRoutes.length} |
| New Laravel routes exported | ${newRoutes.length} |
| Concrete Laravel matches | ${implementedCount} |
| Legacy fallback/reserved only | ${legacyOnlyCount} |
| Missing from Laravel route table | ${missingCount} |

## Status Breakdown

${Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => `- \`${status}\`: ${count}`).join('\n')}

## Largest Gaps By Area

| Area | Old routes | Concrete | Legacy only | Missing |
| --- | ---: | ---: | ---: | ---: |
${topBuckets.map(([bucket, counts]) => `| \`${bucket}\` | ${counts.total} | ${counts.implemented} | ${counts.legacyOnly} | ${counts.missing} |`).join('\n')}

## Important Findings

- Old Express mounts APIs at root-level prefixes such as \`/admin\`, \`/user\`, \`/technician\`, \`/booking\`, \`/lookup\`, \`/master\`, \`/pricing\`, and \`/public\`.
- Laravel has many concrete routes under \`/api/...\`, especially auth, dashboard, lookup/master CRUD, user/customer, technician, and booking basics.
- Laravel also registers unprefixed and \`/api\`-prefixed legacy catch-alls. These preserve path availability but do not prove the old behavior is migrated.
- The old \`webapp.routes.js\` file exists in the Express project but is not mounted in \`src/app.js\`; it was not counted as an active old API surface.
- Static upload routes from Express \`/uploads\` and \`/api/uploads\` were not counted as API endpoints.

## Missing Or Legacy-Only Route Sample

This table is capped at 250 rows. The full detail is in \`docs/api-parity-audit.json\`.

| Method | Old path | Status | Matched new route | Old source |
| --- | --- | --- | --- | --- |
${sampleRows.join('\n')}
`;

fs.writeFileSync(jsonPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  oldSource: 'E:/Projects/efixmate/server',
  newTarget: 'E:/Projects/efixmate-appliaction-laravel/v1',
  counts: {
    oldRoutes: oldRoutes.length,
    newRoutes: newRoutes.length,
    implemented: implementedCount,
    legacyOnly: legacyOnlyCount,
    missing: missingCount,
    statusCounts,
    byBucket,
  },
  routes: audited,
}, null, 2));

fs.writeFileSync(reportPath, report);

console.log(JSON.stringify({
  oldRoutes: oldRoutes.length,
  newRoutes: newRoutes.length,
  implemented: implementedCount,
  legacyOnly: legacyOnlyCount,
  missing: missingCount,
  reportPath,
  jsonPath,
}, null, 2));
