import type { PancakeListResponse, PaginationMeta } from "./schemas.js";

/**
 * Extract pagination metadata from a Pancake list response.
 */
export function extractPagination(response: PancakeListResponse<unknown>): PaginationMeta {
  return {
    page: response.page_number,
    pageSize: response.page_size,
    total: response.total_entries,
    totalPages: response.total_pages,
  };
}

/**
 * Format a paginated tool result with data + pagination info.
 */
export function formatPaginatedResult<T>(response: PancakeListResponse<T>): {
  data: T[];
  pagination: PaginationMeta;
} {
  return {
    data: response.data,
    pagination: extractPagination(response),
  };
}
