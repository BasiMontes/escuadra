// Email links carry one-time values in the URL, and error and analytics tools record URLs.
const secretParameter = /(^|[?&#])((?:code|token|token_hash|access_token|refresh_token)=)[^&#\s"']*/gi;

function scrub(value: unknown, seen: Map<object, unknown>): unknown {
  if (typeof value === 'string') { return value.replace(secretParameter, '$1$2redacted'); }
  if (typeof value !== 'object' || value === null) { return value; }
  const isPlain = Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
  if (!isPlain) { return value; }
  const known = seen.get(value);
  if (known) { return known; }

  const copy = (Array.isArray(value) ? [] : {}) as Record<string, unknown>;
  seen.set(value, copy);
  Object.entries(value).forEach(([key, entry]) => {
    copy[key] = scrub(entry, seen);
  });
  return copy;
}

export function scrubSecrets<Value>(value: Value): Value {
  return scrub(value, new Map()) as Value;
}
