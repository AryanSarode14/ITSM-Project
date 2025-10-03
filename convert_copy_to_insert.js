const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, 'itsm.sql');
const fixedPath = path.resolve(__dirname, 'itsm_fixed.sql');
const outputV2Path = path.resolve(__dirname, 'itsm_fixed_v2.sql');
const outputV3Path = path.resolve(__dirname, 'itsm_fixed_v3.sql');

function escapeSingleQuotes(value) {
	return value.replace(/'/g, "''");
}

function isNumeric(value) {
	return /^-?\d+(?:\.\d+)?$/.test(value);
}

function isBoolean(value) {
	return /^(?:true|false|t|f)$/i.test(value);
}

function isNullToken(value) {
	return value === '\\N' || value.toUpperCase() === 'NULL';
}

function shouldQuote(value) {
	if (isNullToken(value)) return false;
	if (isNumeric(value)) return false;
	if (isBoolean(value)) return false;
	if (/^\d{4}-\d{2}-\d{2}(?:\s|$)/.test(value)) return true;
	return true;
}

function splitFields(line) {
	if (line.includes('\t')) {
		return line.split('\t');
	}
	return line.trim().split(/\s+/);
}

function convertCopyBlocks(sql) {
	const copyRegex = /(^COPY\s+public\.)\s*([^(\s]+)\s*\(([^)]*)\)\s*FROM\s+stdin;([\s\S]*?)^\\\.$/gmi;
	let lastIndex = 0;
	let result = '';
	let match;
	while ((match = copyRegex.exec(sql)) !== null) {
		const before = sql.slice(lastIndex, match.index);
		result += before;

		const tableName = match[2].trim();
		const columns = match[3].split(',').map(c => c.trim());
		const dataBlock = match[4];

		const lines = dataBlock.split(/\r?\n/)
			.map(l => l.trimEnd())
			.filter(l => l.length > 0);

		const values = [];
		for (const line of lines) {
			if (!line || line === '\\.') continue;
			const fields = splitFields(line);
			if (fields.length === 1 && fields[0] === '\\.') continue;
			if (fields.length === 0) continue;
			const row = fields.map(raw => {
				if (isNullToken(raw)) return 'NULL';
				if (!shouldQuote(raw)) return raw.toLowerCase();
				return `'${escapeSingleQuotes(raw)}'`;
			});
			while (row.length < columns.length) row.push('NULL');
			values.push(`(${row.join(', ')})`);
		}

		if (values.length > 0) {
			result += `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES\n`;
			result += values.join(',\n');
			result += `;\n\n`;
		}

		lastIndex = copyRegex.lastIndex;
	}
	result += sql.slice(lastIndex);
	return result;
}

function rewriteIdentitiesToSequences(sql) {
	const identityRegex = /ALTER\s+TABLE\s+public\.([^(\s]+)\s+ALTER\s+COLUMN\s+([^(\s]+)\s+ADD\s+GENERATED\s+(?:ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY\s*\(\s*SEQUENCE\s+NAME\s+public\.([^(\s]+)[\s\S]*?\);/gmi;
	let result = '';
	let lastIndex = 0;
	let match;
	const identityTables = new Set();
	while ((match = identityRegex.exec(sql)) !== null) {
		const before = sql.slice(lastIndex, match.index);
		result += before;
		const table = match[1];
		const column = match[2];
		const seq = match[3];
		identityTables.add(table);
		result += `DO $$\nBEGIN\n    IF NOT EXISTS (\n        SELECT 1 FROM pg_class c\n        JOIN pg_namespace n ON n.oid = c.relnamespace\n        WHERE c.relkind = 'S' AND n.nspname = 'public' AND c.relname = '${seq}'\n    ) THEN\n        CREATE SEQUENCE public.${seq}\n            START WITH 1\n            INCREMENT BY 1\n            NO MINVALUE\n            NO MAXVALUE\n            CACHE 1;\n    END IF;\nEND\n$$;\n\nALTER TABLE ONLY public.${table} ALTER COLUMN ${column} DROP DEFAULT;\nALTER TABLE ONLY public.${table} ALTER COLUMN ${column} SET DEFAULT nextval('public.${seq}'::regclass);\nALTER SEQUENCE public.${seq} OWNED BY public.${table}.${column};\n`;
		lastIndex = identityRegex.lastIndex;
	}
	result += sql.slice(lastIndex);
	return { sql: result, identityTables: Array.from(identityTables) };
}

function wrapInsertsForIdentityTables(sql, identityTables) {
	if (identityTables.length === 0) return sql;
	return sql.replace(/(^INSERT\s+INTO\s+public\.([^(\s]+)\s*\([^;]*?;)/gims, (m, stmt, tbl) => {
		if (!identityTables.includes(tbl)) return m;
		return `SET session_replication_role = replica;\n${stmt}\nSET session_replication_role = DEFAULT;`;
	});
}

function replaceBooleansInInsertValues(sql) {
	// Only inside INSERT ... VALUES ... ; blocks
	return sql.replace(/(INSERT\s+INTO\s+public\.[\s\S]*?VALUES\s*)([\s\S]*?)(;)/gim, (full, head, valuesPart, tail) => {
		let v = valuesPart;
		v = v.replace(/,\s*t,\s*/g, ', true, ');
		v = v.replace(/,\s*f,\s*/g, ', false, ');
		v = v.replace(/\(\s*t,\s*/g, '(true, ');
		v = v.replace(/\(\s*f,\s*/g, '(false, ');
		v = v.replace(/,\s*t\)/g, ', true)');
		v = v.replace(/,\s*f\)/g, ', false)');
		v = v.replace(/\(\s*t\s*\)/g, '(true)');
		v = v.replace(/\(\s*f\s*\)/g, '(false)');
		return head + v + tail;
	});
}

(function main() {
	const original = fs.readFileSync(inputPath, 'utf8');
	const fixed = convertCopyBlocks(original);
	fs.writeFileSync(fixedPath, fixed, 'utf8');

	const fixedContent = fs.readFileSync(fixedPath, 'utf8');
	const { sql: seqSql, identityTables } = rewriteIdentitiesToSequences(fixedContent);
	const v2Sql = wrapInsertsForIdentityTables(seqSql, identityTables);
	fs.writeFileSync(outputV2Path, v2Sql, 'utf8');

	const v3Sql = replaceBooleansInInsertValues(v2Sql);
	fs.writeFileSync(outputV3Path, v3Sql, 'utf8');
	console.log(`Wrote ${outputV2Path} with ${identityTables.length} identity table(s) handled.`);
	console.log(`Wrote ${outputV3Path} with boolean t/f converted inside INSERT VALUES.`);
})();
