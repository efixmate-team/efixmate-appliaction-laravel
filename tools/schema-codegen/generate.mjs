import pkg from '@prisma/internals';
const { getDMMF } = pkg;
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { columnForField, laravelTypeManifestEntry } from './type-map.mjs';

const OUT_DIR = new URL('../../database/migrations/', import.meta.url);
const MANIFEST_PATH = new URL('./schema-manifest.json', import.meta.url);

mkdirSync(OUT_DIR, { recursive: true });

/**
 * MySQL/MariaDB identifiers are capped at 64 chars. Laravel's default index name
 * (table_col1_col2..._index) can exceed that on wide composite indexes — fall back to a
 * short deterministic name when it would.
 */
function safeIndexName(table, cols, suffix) {
    const laravelDefault = `${table}_${cols.join('_')}_${suffix}`;
    if (laravelDefault.length <= 64) return laravelDefault;
    const hash = createHash('md5').update(cols.join(',')).digest('hex').slice(0, 8);
    return `${table}`.slice(0, 45) + `_${hash}_${suffix}`;
}

// Clear any previously generated efm_* migrations so re-running the generator is idempotent.
for (const f of readdirSync(OUT_DIR)) {
    if (/_create_efm_.*_table\.php$/.test(f) || f.endsWith('_add_foreign_keys_to_efm_tables.php')) {
        unlinkSync(new URL(f, OUT_DIR));
    }
}

const datamodel = readFileSync(new URL('./source-schema.prisma', import.meta.url), 'utf8');
const dmmf = await getDMMF({ datamodel });

const models = dmmf.datamodel.models;
const indexesByModel = new Map();
for (const idx of dmmf.datamodel.indexes) {
    if (!indexesByModel.has(idx.model)) indexesByModel.set(idx.model, []);
    indexesByModel.get(idx.model).push(idx);
}

const manifest = {};
const foreignKeys = []; // { table, column, refTable, refColumn, onDelete }

let seq = 0;
const baseDate = '2026_07_05';

for (const model of models) {
    const tableName = model.name;
    const indexes = indexesByModel.get(tableName) || [];
    const compositePk = indexes.find((i) => i.type === 'id' && i.fields.length > 1);
    const compositePkCols = new Set(compositePk ? compositePk.fields.map((f) => f.name) : []);

    const scalarFields = model.fields.filter((f) => f.kind === 'scalar');
    const relationFields = model.fields.filter((f) => f.kind === 'object' && f.relationFromFields?.length);

    const lines = [];
    let needsExpressionImport = false;

    for (const field of scalarFields) {
        const { call, needsExpressionImport: needsExpr } = columnForField(field, {
            isCompositePkMember: compositePkCols.has(field.name),
        });
        needsExpressionImport = needsExpressionImport || needsExpr;
        lines.push(`            $table->${call};`);
    }

    if (compositePk) {
        const cols = compositePk.fields.map((f) => `'${f.name}'`).join(', ');
        lines.push(`            $table->primary([${cols}]);`);
    }

    for (const idx of indexes) {
        if (idx.type === 'id') continue; // handled via column type or composite primary() above
        const colNames = idx.fields.map((f) => f.name);
        const cols = colNames.map((c) => `'${c}'`).join(', ');
        const name = idx.dbName || safeIndexName(tableName, colNames, idx.type === 'unique' ? 'unique' : 'index');
        const nameArg = `, '${name}'`;
        if (idx.type === 'unique') {
            lines.push(`            $table->unique([${cols}]${nameArg});`);
        } else {
            lines.push(`            $table->index([${cols}]${nameArg});`);
        }
    }

    for (const rel of relationFields) {
        for (let i = 0; i < rel.relationFromFields.length; i++) {
            foreignKeys.push({
                table: tableName,
                column: rel.relationFromFields[i],
                refTable: rel.type,
                refColumn: rel.relationToFields[i],
                onDelete: rel.relationOnDelete,
            });
        }
    }

    const useStatement = needsExpressionImport ? '' : '';
    const migrationBody = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${tableName}', function (Blueprint $table) {
${lines.join('\n')}
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${tableName}');
    }
};
`;

    const filename = `${baseDate}_${String(seq).padStart(6, '0')}_create_${tableName}_table.php`;
    writeFileSync(new URL(filename, OUT_DIR), migrationBody);
    seq++;

    manifest[tableName] = {
        primaryKey: compositePk
            ? compositePk.fields.map((f) => f.name)
            : scalarFields.filter((f) => f.isId).map((f) => f.name),
        columns: scalarFields.map((f) => laravelTypeManifestEntry(f, compositePkCols.has(f.name))),
    };
}

// Final migration: all real @relation-derived foreign keys, added after every table exists.
if (foreignKeys.length) {
    const fkLines = foreignKeys
        .map(
            (fk) => `        Schema::table('${fk.table}', function (Blueprint $table) {
            $table->foreign('${fk.column}')->references('${fk.refColumn}')->on('${fk.refTable}')${
                fk.onDelete === 'Cascade'
                    ? '->cascadeOnDelete()'
                    : fk.onDelete === 'SetNull'
                      ? '->nullOnDelete()'
                      : ''
            };
        });`
        )
        .join('\n\n');

    const dropLines = foreignKeys
        .map(
            (fk) => `        Schema::table('${fk.table}', function (Blueprint $table) {
            $table->dropForeign(['${fk.column}']);
        });`
        )
        .join('\n\n');

    const fkMigration = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

/**
 * Real @relation-derived foreign keys from the source Prisma schema (${foreignKeys.length} total).
 * Added in a single trailing migration so table-creation order never matters.
 */
return new class extends Migration
{
    public function up(): void
    {
${fkLines}
    }

    public function down(): void
    {
${dropLines}
    }
};
`;
    const fkFilename = `${baseDate}_${String(seq).padStart(6, '0')}_add_foreign_keys_to_efm_tables.php`;
    writeFileSync(new URL(fkFilename, OUT_DIR), fkMigration);
    seq++;
}

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

console.log(`Generated ${models.length} table migrations + 1 foreign-key migration (${foreignKeys.length} constraints).`);
console.log(`Manifest written to ${MANIFEST_PATH.pathname}`);
