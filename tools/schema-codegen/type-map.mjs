/**
 * Maps a DMMF scalar field to a Laravel migration column-builder call.
 * Returns { call: string, needsExpressionImport: boolean } where `call` is the
 * fluent chain starting after `$table->`, e.g. "string('email', 100)->nullable()".
 */
export function columnForField(field, { isCompositePkMember }) {
    const { name, type, nativeType, isRequired, isId, hasDefaultValue, default: def } = field;
    let base;
    let needsExpressionImport = false;

    if (isId && !isCompositePkMember) {
        if (type === 'BigInt') {
            return { call: `id('${name}')`, needsExpressionImport };
        }
        if (type === 'Int') {
            return { call: `increments('${name}')`, needsExpressionImport };
        }
        if (type === 'String') {
            // All observed single-column String PKs are uuid()/dbgenerated(gen_random_uuid()) —
            // app-generated UUIDs (Laravel HasUuids), never a MySQL-side default.
            return { call: `uuid('${name}')->primary()`, needsExpressionImport };
        }
    }

    switch (type) {
        case 'Int':
            base = `unsignedInteger('${name}')`;
            break;
        case 'BigInt':
            base = `unsignedBigInteger('${name}')`;
            break;
        case 'Boolean':
            base = `boolean('${name}')`;
            break;
        case 'Decimal': {
            const [precision, scale] = (nativeType && nativeType[1]) || [10, 2];
            base = `decimal('${name}', ${precision}, ${scale})`;
            break;
        }
        case 'Float':
            base = `double('${name}')`;
            break;
        case 'Json':
            base = `json('${name}')`;
            break;
        case 'DateTime': {
            const nt = nativeType ? nativeType[0] : null;
            if (nt === 'Date') {
                base = `date('${name}')`;
            } else {
                // dateTime (not timestamp): Postgres timestamp/timestamptz has MySQL DATETIME's
                // range and semantics (no implicit zero-date default, no auto-update-on-modify).
                // A plain MySQL TIMESTAMP NOT NULL column with no explicit default trips
                // strict-mode error 1067 on MariaDB/MySQL — DATETIME has no such special-casing.
                const precision = (nativeType && nativeType[1] && nativeType[1][0]) || '0';
                base = `dateTime('${name}', ${precision})`;
            }
            break;
        }
        case 'String':
        default: {
            const nt = nativeType ? nativeType[0] : null;
            if (nt === 'VarChar') {
                base = `string('${name}', ${nativeType[1][0]})`;
            } else if (nt === 'Char') {
                base = `char('${name}', ${nativeType[1][0]})`;
            } else if (nt === 'Uuid') {
                base = `uuid('${name}')`;
            } else {
                base = `text('${name}')`;
            }
            break;
        }
    }

    // Column-level defaults (skip autoincrement/uuid/dbgenerated — those are handled above
    // or are app-generated, never a MySQL-side column default).
    if (hasDefaultValue && def && typeof def === 'object' && !Array.isArray(def)) {
        if (def.name === 'now') {
            base += '->useCurrent()';
        }
        // autoincrement / uuid / dbgenerated: no DB-side default emitted.
    } else if (hasDefaultValue && (typeof def === 'string' || typeof def === 'boolean' || typeof def === 'number')) {
        if (type === 'Json' && def === '[]') {
            // MySQL 8.0.13+ / MariaDB required for non-null JSON column defaults — see Stage 2 verification.
            base += `->default(new \\Illuminate\\Database\\Query\\Expression("(JSON_ARRAY())"))`;
            needsExpressionImport = true;
        } else if (typeof def === 'string') {
            base += `->default(${JSON.stringify(def)})`;
        } else {
            base += `->default(${JSON.stringify(def)})`;
        }
    }

    if (!isRequired) {
        base += '->nullable()';
    }

    return { call: base, needsExpressionImport };
}

export function laravelTypeManifestEntry(field, isCompositePkMember) {
    return {
        name: field.name,
        prismaType: field.type,
        nativeType: field.nativeType,
        nullable: !field.isRequired,
        isPrimaryKey: field.isId || !!isCompositePkMember,
        hasDefault: field.hasDefaultValue,
    };
}
