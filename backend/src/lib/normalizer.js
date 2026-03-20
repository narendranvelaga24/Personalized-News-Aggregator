const crypto = require('crypto');

/**
 * Normalizes a raw article from any provider into the internal shape.
 * @param {object} raw - Provider-specific article object
 * @param {string} provider - 'currents' | 'gnews' | 'newsdata' | 'feedbin'
 * @returns {object} Normalized article
 */
function normalize(raw, provider) {
  switch (provider) {
    case 'currents':
      return {
        title: raw.title || '',
        url: raw.url || '',
        canonicalUrl: raw.url || '',
        sourceName: deriveSourceName(raw.author, raw.url),
        sourceId: null,
        provider,
        publishedAt: raw.published ? new Date(raw.published) : new Date(),
        summary: raw.description || '',
        content: raw.content || '',
        imageUrl: cleanOptionalUrl(raw.image),
        tags: raw.category || [],
        rawPayload: raw,
      };

    case 'gnews':
      return {
        title: raw.title || '',
        url: raw.url || '',
        canonicalUrl: raw.url || '',
        sourceName: raw.source?.name || 'Unknown',
        sourceId: null,
        provider,
        publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : new Date(),
        summary: raw.description || '',
        content: raw.content || '',
        imageUrl: cleanOptionalUrl(raw.image),
        tags: [],
        rawPayload: raw,
      };

    case 'newsdata':
      return {
        title: raw.title || '',
        url: raw.link || '',
        canonicalUrl: raw.link || '',
        sourceName: raw.source_id || 'Unknown',
        sourceId: null,
        provider,
        publishedAt: raw.pubDate ? new Date(raw.pubDate) : new Date(),
        summary: raw.description || '',
        content: raw.content || raw.full_description || '',
        imageUrl: cleanOptionalUrl(raw.image_url),
        tags: raw.category || [],
        rawPayload: raw,
      };

    case 'feedbin':
      return {
        title: raw.title || '(No title)',
        url: raw.url || '',
        canonicalUrl: raw.url || '',
        sourceName: raw.feed_id ? `feedbin:${raw.feed_id}` : 'Feedbin',
        sourceId: String(raw.feed_id || ''),
        provider,
        publishedAt: raw.published ? new Date(raw.published) : new Date(),
        summary: raw.summary || '',
        content: raw.content || '',
        imageUrl: null,
        tags: [],
        rawPayload: raw,
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Prefers explicit source/author text. Falls back to hostname for URL values.
 *
 * @param {unknown} primary
 * @param {unknown} fallbackUrl
 * @returns {string}
 */
function deriveSourceName(primary, fallbackUrl) {
  if (typeof primary === 'string' && primary.trim()) return primary.trim();
  if (typeof fallbackUrl === 'string' && fallbackUrl.trim()) {
    try {
      return new URL(fallbackUrl).hostname.replace(/^www\./, '');
    } catch {
      return fallbackUrl;
    }
  }
  return 'Unknown';
}

/**
 * Converts provider placeholder values like "None" into null
 * and returns only valid absolute http(s) or root-relative URLs.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
function cleanOptionalUrl(value) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  if (lower === 'none' || lower === 'null' || lower === 'undefined' || lower === 'nan') {
    return null;
  }

  if (s.startsWith('/')) return s;
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? s : null;
  } catch {
    return null;
  }
}

/**
 * Strips UTM/tracking query parameters and normalizes a URL string.
 * Lowercases the host and removes trailing slashes so that the same
 * article arriving from different providers with different tracking
 * params maps to a single canonical key.
 *
 * @param {string} rawUrl
 * @returns {string} Cleaned, normalized URL
 */
function cleanUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const TRACKING_PARAMS = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'yclid', 'ref', 'source',
    ];
    for (const p of TRACKING_PARAMS) u.searchParams.delete(p);
    // Lowercase host, strip trailing path slash
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/$/, '')}${u.search}${u.hash}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Computes a stable deduplication key for an article.
 *
 * Priority order (most to least reliable):
 *  1. Normalized canonical URL — UTM params stripped, host lowercased.
 *     Catches same article from different providers that just differ in tracking params.
 *  2. SHA-256 of the raw URL string — used when URL parsing throws (e.g. non-ASCII).
 *  3. SHA-256 of title + sourceName + publish date — last resort for malformed entries
 *     that have no usable URL at all.
 *
 * ⚠️ This still won't catch cross-domain syndication (same article hosted at two
 * completely different URLs). That would require title-similarity hashing, which is
 * left as a future enhancement.
 *
 * @param {object} normalized - Normalized article from `normalize()`
 * @returns {string} Stable key (stored as Article.canonicalUrl in DB)
 */
function dedupKey(normalized) {
  const rawUrl = normalized.canonicalUrl || normalized.url || '';

  if (rawUrl) {
    try {
      return cleanUrl(rawUrl);
    } catch {
      // Malformed URL (e.g. relative path) — hash the raw string
      return crypto.createHash('sha256').update(rawUrl).digest('hex');
    }
  }

  // Last resort: deterministic fingerprint of content
  const fingerprint = [
    (normalized.title || '').trim(),
    (normalized.sourceName || '').trim(),
    normalized.publishedAt ? normalized.publishedAt.toISOString().slice(0, 10) : '',
  ].join('|');
  return 'fp:' + crypto.createHash('sha256').update(fingerprint).digest('hex');
}

module.exports = { normalize, dedupKey, cleanUrl, cleanOptionalUrl, deriveSourceName };
