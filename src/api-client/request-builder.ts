/**
 * Builds query string parameters from a flat object, handling arrays and null/undefined values.
 */
export function buildQueryParams(params: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      // Pancake API expects arrays as JSON-encoded strings in query params
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }

  return result;
}

/**
 * Encode each segment of a URL path, preserving slashes.
 * Prevents path traversal via user-supplied ID values.
 */
function encodePathSegments(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/**
 * Build the full URL for a Pancake API request.
 * Injects /shops/{shopId}/ prefix and api_key query param.
 */
export function buildRequestUrl(
  baseUrl: string,
  shopId: string,
  apiKey: string,
  path: string,
  queryParams?: Record<string, unknown>,
): string {
  // Paths that are not under /shops/{id}/ (global endpoints)
  const globalPrefixes = ["/partners", "partners", "/address", "address"];
  const needsShopPrefix = !globalPrefixes.some((p) => path.startsWith(p));
  const safePath = encodePathSegments(path.replace(/^\//, ""));
  const fullPath = needsShopPrefix ? `/shops/${shopId}/${safePath}` : `/${safePath}`;

  const url = new URL(fullPath, baseUrl);
  url.searchParams.set("api_key", apiKey);

  if (queryParams) {
    const built = buildQueryParams(queryParams);
    for (const [key, value] of Object.entries(built)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Redact api_key from URL for safe logging.
 */
export function redactUrl(url: string): string {
  return url.replace(/api_key=[^&]+/, "api_key=***");
}
