import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const MANIFEST_PATH = new URL('./schema-manifest.json', import.meta.url);
const MODELS_DIR = new URL('../../packages/efixmate-domain/src/Models/', import.meta.url);

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

// Tables already covered by a hand-written model — never overwrite these.
const existingTables = new Set();
for (const file of readdirSync(MODELS_DIR)) {
    if (!file.endsWith('.php')) continue;
    const content = readFileSync(new URL(file, MODELS_DIR), 'utf8');
    const m = content.match(/protected \$table = '([^']+)'/);
    if (m) existingTables.add(m[1]);
}

function studly(str) {
    return str
        .split(/[_-]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
}

function singularizeWord(word) {
    if (/ies$/i.test(word)) return word.replace(/ies$/i, 'y');
    if (/(ses|xes|ches|shes)$/i.test(word)) return word.replace(/es$/i, '');
    if (/ss$/i.test(word)) return word; // e.g. "status" stays as-is
    if (/s$/i.test(word) && !/us$/i.test(word)) return word.replace(/s$/i, '');
    return word;
}

function classNameFor(table) {
    const withoutPrefix = table.replace(/^efm_/, '');
    const tokens = withoutPrefix.split('_');
    tokens[tokens.length - 1] = singularizeWord(tokens[tokens.length - 1]);
    return studly(tokens.join('_'));
}

function castTypeFor(col) {
    if (col.name === 'is_deleted') return 'boolean';
    switch (col.prismaType) {
        case 'Boolean':
            return 'boolean';
        case 'Decimal':
            return 'decimal:2';
        case 'Json':
            return 'array';
        case 'DateTime':
            return 'datetime';
        case 'Int':
        case 'BigInt':
            return 'integer';
        default:
            return null;
    }
}

let generated = 0;
let skipped = 0;

for (const [table, def] of Object.entries(manifest)) {
    if (existingTables.has(table)) {
        skipped++;
        continue;
    }

    const className = classNameFor(table);
    const isComposite = def.primaryKey.length > 1;
    const primaryKey = isComposite ? null : def.primaryKey[0];

    // String PKs (natural keys or app-generated UUIDs) must be mass-assignable —
    // unlike auto-increment Int/BigInt PKs, the caller (or HasUuids) sets them
    // explicitly on create(). Auto-increment PKs stay excluded from fillable.
    const fillable = def.columns
        .filter((c) => (!c.isPrimaryKey || c.prismaType === 'String') && c.name !== 'is_deleted')
        .map((c) => `        '${c.name}',`);

    const casts = def.columns
        .map((c) => [c.name, castTypeFor(c)])
        .filter(([, t]) => t !== null)
        .map(([name, type]) => `        '${name}' => '${type}',`);

    const pkCol = isComposite ? null : def.columns.find((c) => c.name === primaryKey);
    const pkIsString = pkCol && pkCol.prismaType === 'String';

    const pkLines = isComposite
        ? `    // Composite primary key (${def.primaryKey.join(', ')}) — Eloquent has no native support;\n    // query via the builder rather than find(). Not auto-incrementing.\n    public $incrementing = false;`
        : pkIsString
            ? `    protected $primaryKey = '${primaryKey}';\n    public $incrementing = false;\n    protected $keyType = 'string';`
            : `    protected $primaryKey = '${primaryKey}';`;

    const body = `<?php

namespace Efixmate\\Domain\\Models;

use Efixmate\\Domain\\Concerns\\HasIsDeletedFlag;
use Illuminate\\Database\\Eloquent\\Model;

class ${className} extends Model
{
    use HasIsDeletedFlag;

    protected $table = '${table}';
${pkLines}
    public $timestamps = false;

    protected $fillable = [
${fillable.join('\n')}
    ];

    protected $casts = [
${casts.join('\n')}
    ];
}
`;

    writeFileSync(new URL(`${className}.php`, MODELS_DIR), body);
    generated++;
}

console.log(`Generated ${generated} model skeletons, skipped ${skipped} tables with existing hand-written models.`);
