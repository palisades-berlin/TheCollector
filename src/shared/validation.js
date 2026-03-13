const DEFAULT_ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

/**
 * Converts a value to a positive integer.
 *
 * @param {unknown} value
 * Input value (number-like values such as `"6"` are accepted).
 * @returns {number|null}
 * Positive integer when valid, otherwise `null`.
 * Edge cases: `0`, negatives, decimals, `NaN`, and non-numeric strings return `null`.
 */
export function toPositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * Checks whether a value is a non-empty string after trimming.
 *
 * @param {unknown} value
 * Candidate value.
 * @returns {value is string}
 * `true` only when value is a string whose trimmed length is greater than zero.
 * Edge cases: non-string input and whitespace-only strings return `false`.
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates a URL string and optionally restricts allowed protocols.
 *
 * @param {unknown} value
 * Candidate URL string.
 * @param {{ allowedProtocols?: string[] | Set<string> }} [options]
 * Optional protocol allowlist (defaults to `http:` and `https:`).
 * @returns {boolean}
 * `true` when URL parses successfully and protocol is allowed.
 * Edge cases: non-string/blank input, parse failures, and disallowed schemes return `false`.
 */
export function isValidUrl(value, options = {}) {
  if (!isNonEmptyString(value)) return false;
  const input = value.trim();
  const allowedProtocols =
    options.allowedProtocols instanceof Set
      ? options.allowedProtocols
      : Array.isArray(options.allowedProtocols)
        ? new Set(options.allowedProtocols)
        : DEFAULT_ALLOWED_PROTOCOLS;
  try {
    const parsed = new URL(input);
    return allowedProtocols.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a user-facing email address format.
 *
 * @param {unknown} value
 * Candidate email value.
 * @returns {boolean}
 * `true` for pragmatic RFC-lite addresses like `name@example.com`.
 * Edge cases: non-string input, whitespace-only values, missing domain parts,
 * or malformed addresses return `false`.
 */
export function isEmail(value) {
  if (!isNonEmptyString(value)) return false;
  const input = value.trim();
  return EMAIL_PATTERN.test(input);
}
