function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively sorts plain object keys in deterministic ASCII lexicographical order
 * while preserving array order (such as TextMate tokenColors rule precedence).
 */
export function sortKeysDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item)) as T;
  }
  if (isPlainObject(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted as T;
  }
  return value;
}

/**
 * Serializes any JSON value with sorted keys, 2-space indent, LF endings, and single trailing newline.
 */
export function serializeDeterministicJson(value: unknown): string {
  const normalized = sortKeysDeep(value);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}
