# API Parity Audit

Generated: 2026-07-05T06:35:52.171Z

Old source: `E:\Projects\efixmate\server`

New target: `E:\Projects\efixmate-appliaction-laravel\v1`

## Verdict

The Laravel `v1` API is **not exactly the same** as the old Express server API yet.

The new app exposes a broad compatibility layer through `LegacyApiController` catch-all routes, so many old URLs are reserved and will not 404. However, most old Express endpoints are not backed by concrete Laravel controller implementations yet. Treat every `legacy_*` row below as compatibility coverage only, not feature parity.

## Counts

| Metric | Count |
| --- | ---: |
| Old Express routes audited | 567 |
| New Laravel routes exported | 494 |
| Concrete Laravel matches | 181 |
| Legacy fallback/reserved only | 386 |
| Missing from Laravel route table | 0 |

## Status Breakdown

- `legacy_catchall_old_path`: 379
- `implemented_api_prefixed`: 181
- `legacy_exact_reserved`: 7

## Largest Gaps By Area

| Area | Old routes | Concrete | Legacy only | Missing |
| --- | ---: | ---: | ---: | ---: |
| `/admin/bookings` | 34 | 0 | 34 | 0 |
| `/admin/notifications` | 26 | 0 | 26 | 0 |
| `/admin/crm` | 24 | 0 | 24 | 0 |
| `/admin/ops` | 19 | 0 | 19 | 0 |
| `/admin/technicians` | 18 | 0 | 18 | 0 |
| `/admin/users` | 18 | 0 | 18 | 0 |
| `/admin/security` | 17 | 0 | 17 | 0 |
| `/admin/finance` | 17 | 0 | 17 | 0 |
| `/admin/support` | 16 | 0 | 16 | 0 |
| `/admin/promotions` | 10 | 0 | 10 | 0 |
| `/admin/cms` | 10 | 0 | 10 | 0 |
| `/booking` | 17 | 8 | 9 | 0 |
| `/admin/announcements` | 8 | 0 | 8 | 0 |
| `/admin/settings` | 8 | 0 | 8 | 0 |
| `/admin/pricing` | 6 | 0 | 6 | 0 |
| `/admin/dashboard` | 9 | 4 | 5 | 0 |
| `/admin/user-menus` | 5 | 0 | 5 | 0 |
| `/admin/analytics` | 5 | 0 | 5 | 0 |
| `/admin/service-areas` | 5 | 0 | 5 | 0 |
| `/admin/slots` | 5 | 0 | 5 | 0 |
| `/admin/contact-inquiries` | 4 | 0 | 4 | 0 |
| `/public` | 4 | 0 | 4 | 0 |
| `/admin/audit` | 3 | 0 | 3 | 0 |
| `/admin/realtime` | 3 | 0 | 3 | 0 |
| `/admin/scope` | 3 | 0 | 3 | 0 |

## Important Findings

- Old Express mounts APIs at root-level prefixes such as `/admin`, `/user`, `/technician`, `/booking`, `/lookup`, `/master`, `/pricing`, and `/public`.
- Laravel has many concrete routes under `/api/...`, especially auth, dashboard, lookup/master CRUD, user/customer, technician, and booking basics.
- Laravel also registers unprefixed and `/api`-prefixed legacy catch-alls. These preserve path availability but do not prove the old behavior is migrated.
- The old `webapp.routes.js` file exists in the Express project but is not mounted in `src/app.js`; it was not counted as an active old API surface.
- Static upload routes from Express `/uploads` and `/api/uploads` were not counted as API endpoints.

## Missing Or Legacy-Only Route Sample

This table is capped at 250 rows. The full detail is in `docs/api-parity-audit.json`.

| Method | Old path | Status | Matched new route | Old source |
| --- | --- | --- | --- | --- |
| `POST` | `/admin/activate-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/admin-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/analytics/bookings` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/analytics/Routes/analytics.routes.js` |
| `GET` | `/admin/analytics/customers` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/analytics/Routes/analytics.routes.js` |
| `GET` | `/admin/analytics/funnel` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/analytics/Routes/analytics.routes.js` |
| `GET` | `/admin/analytics/revenue` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/analytics/Routes/analytics.routes.js` |
| `GET` | `/admin/analytics/technicians` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/analytics/Routes/analytics.routes.js` |
| `DELETE` | `/admin/announcements/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/announcements/analytics` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/announcements` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/announcements/{id}/duplicate` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/announcements/bulk-action` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/announcements/paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/announcements/reorder` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `PUT` | `/admin/announcements/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/area-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/area-pricing-get` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/area-pricing-save` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-copy-setup` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-delete` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-dropdown` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/areas-update` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/audit/action-types` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/audit/Routes/audit.routes.js` |
| `GET` | `/admin/audit/logs` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/audit/Routes/audit.routes.js` |
| `GET` | `/admin/audit/security/events` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/audit/Routes/audit.routes.js` |
| `GET` | `/admin/bookings/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/bookings/{id}/chat` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/detail` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/duplicates` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/fraud` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/nearby-technicians` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/overview` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/timeline` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/{id}/timeline/unified` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/dispute` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/disputes/list` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/live` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/bookings/tags/catalog` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/workflow` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `GET` | `/admin/bookings/workflow/dashboard` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/assign-multiple` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/auto-assign` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/dispatch` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/emergency` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/internal-notes` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/reschedule` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/{id}/tags` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/assignments` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/bookings/bulk` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/confirm` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/bookings/create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/dispute` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/escalate` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/force-complete` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/bookings/reassign` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/refund` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/bookings/replace-technician` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bookings/state-override` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/bookings/Routes/bookings.routes.js` |
| `POST` | `/admin/bulk-activate-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/bulk-deactivate-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/change-password` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/cms/globals` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/cms/pages` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/cms/pages/{slug}/sections` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/cms/pages/{slug}/versions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/cms/sections/{key}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `PATCH` | `/admin/cms/pages/{slug}/status` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `PATCH` | `/admin/cms/sections/{key}/toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/cms/sections` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/cms/sections/{key}/publish` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `PUT` | `/admin/cms/sections/{key}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/contact-inquiries` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/contact-inquiries/Routes/contactInquiry.routes.js` |
| `GET` | `/admin/contact-inquiries/{inquiryId}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/contact-inquiries/Routes/contactInquiry.routes.js` |
| `GET` | `/admin/contact-inquiries/stats` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/contact-inquiries/Routes/contactInquiry.routes.js` |
| `PATCH` | `/admin/contact-inquiries/{inquiryId}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/contact-inquiries/Routes/contactInquiry.routes.js` |
| `POST` | `/admin/coupon-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/coupons-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/coupons-get` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/coupons-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/coupons-update` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/create-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/crm/analytics/clv` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/analytics/referrals` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/complaints` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/block-history` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/clv` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/communications` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/loyalty` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/notes` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/referrals` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/timeline` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/customers/{customerId}/wallet` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/dashboard` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/crm/spam` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `PATCH` | `/admin/crm/complaints/{complaintId}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/block` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/communications` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/complaints` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/loyalty/adjust` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/notes` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/unblock` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/customers/{customerId}/wallet/credit` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `POST` | `/admin/crm/spam/scan/{customerId}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/crm/Routes/crm.routes.js` |
| `GET` | `/admin/dashboard/live-bookings` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/dashboard/Routes/dashboard.routes.js` |
| `GET` | `/admin/dashboard/live-metrics` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/dashboard/Routes/dashboard.routes.js` |
| `GET` | `/admin/dashboard/revenue-summary` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/dashboard/Routes/dashboard.routes.js` |
| `GET` | `/admin/dashboard/system-health` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/dashboard/Routes/dashboard.routes.js` |
| `GET` | `/admin/dashboard/technician-map` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/dashboard/Routes/dashboard.routes.js` |
| `POST` | `/admin/deactivate-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/delete-menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/finance/commissions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/dashboard` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/export` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/failed-payments` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/gst` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/invoices` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/payouts` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/reconciliation` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/refunds` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/revenue` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/settlements` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/tds` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `GET` | `/admin/finance/wallet` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `POST` | `/admin/finance/commissions/preview` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `POST` | `/admin/finance/invoices/generate` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `POST` | `/admin/finance/refunds/approve` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `POST` | `/admin/finance/settlements/process` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/finance/Routes/finance.routes.js` |
| `POST` | `/admin/get` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/get-groups` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/get-parents` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/menu-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/menus` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `DELETE` | `/admin/notifications/schedules/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `DELETE` | `/admin/notifications/templates/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/campaigns` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/dashboard` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/delivery` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/delivery-report` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/inbox` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/inbox/unread-count` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/logs` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/meta` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/schedules` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/templates` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `GET` | `/admin/notifications/templates/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `PATCH` | `/admin/notifications/inbox/{id}/read` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `PATCH` | `/admin/notifications/schedules/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/broadcast` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/campaigns` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/delivery/{id}/retry` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/delivery/bulk-retry` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/inbox/mark-all-read` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/schedules` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/schedules/{id}/run` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/schedules/process-due` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/send` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/send-single` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `POST` | `/admin/notifications/templates` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/notifications/Routes/notifications.routes.js` |
| `DELETE` | `/admin/ops/cancellation-policies/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/ops/cancellation-policies` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/ops/monitoring/summary` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/ops/no-service-queue` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/ops/queue/failures` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/ops/technicians/suspensions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/booking/{bookingId}/force-assign` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/booking/{bookingId}/resolve-no-service` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/booking/{bookingId}/retry-dispatch` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/booking/{bookingId}/retry-settlement` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/booking/{bookingId}/unlock` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/cancellation-policies` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/no-service-queue/enqueue` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/payout/retry` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/queue/replay` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/run-retention` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/technicians/{techId}/reinstate` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `POST` | `/admin/ops/technicians/{techId}/suspend` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `PUT` | `/admin/ops/cancellation-policies/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/ops/ops.routes.js` |
| `GET` | `/admin/payments/reconciliation` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/operational.routes.js` |
| `GET` | `/admin/pricing/configs` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing/commission/config` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing/dynamic` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing/emergency` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing/peak-hours` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing/surge` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/pricing/Routes/pricing.routes.js` |
| `POST` | `/admin/pricing-rule-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/pricing-rules-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/pricing-rules-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/pricing-rules-update` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-by-menu` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-delete` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-list` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-list-with-menu` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/privileges-update` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `DELETE` | `/admin/promotions/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/promotions/{id}/history` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/promotions/{id}/preview` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/promotions/analytics` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/promotions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/promotions/{id}/duplicate` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/promotions/bulk-action` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/promotions/paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/promotions/reorder` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `PUT` | `/admin/promotions/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/realtime/bookings` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/realtime/Routes/realtime.routes.js` |
| `GET` | `/admin/realtime/system-health` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/realtime/Routes/realtime.routes.js` |
| `GET` | `/admin/realtime/technicians` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/realtime/Routes/realtime.routes.js` |
| `POST` | `/admin/refunds/approve` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/operational.routes.js` |
| `POST` | `/admin/reset-password` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/role-paginated` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/role-permissions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/role-permissions-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/roles-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/roles-delete` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/roles-dropdown` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/roles-toggle` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/roles-update` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/scope/cascade` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `GET` | `/admin/scope/meta` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `POST` | `/admin/scope/preference` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
| `DELETE` | `/admin/security/ip-rules/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `DELETE` | `/admin/security/sessions/{id}` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/2fa/status` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/activity` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/alerts` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/dashboard` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/events` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/operational.routes.js` |
| `GET` | `/admin/security/failed-logins` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/ip-rules` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/login-history` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/security/sessions` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/2fa/disable` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/2fa/enable` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/2fa/setup` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/ip-rules` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/sessions/revoke-all` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `POST` | `/admin/security/step-up` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/security/Routes/security.routes.js` |
| `GET` | `/admin/service-areas` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/service-areas/Routes/serviceAreas.routes.js` |
| `POST` | `/admin/service-areas` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/service-areas/Routes/serviceAreas.routes.js` |
| `POST` | `/admin/service-areas/geo-fencing` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/service-areas/Routes/serviceAreas.routes.js` |
| `POST` | `/admin/service-areas/pincodes` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/service-areas/Routes/serviceAreas.routes.js` |
| `POST` | `/admin/service-areas/zones` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/service-areas/Routes/serviceAreas.routes.js` |
| `POST` | `/admin/service-categories-create` | legacy_catchall_old_path | `/admin/{legacyPath}` | `modules/admin/routes/admin.routes.js` |
