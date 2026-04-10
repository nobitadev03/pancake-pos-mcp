import { z } from "zod";

// Pagination parameters used across all list endpoints
export const PaginationParams = z.object({
  page_number: z.number().int().positive().optional().describe("Page number (default 1)"),
  page_size: z.number().int().min(1).max(200).optional().describe("Items per page (default 30, max 200)"),
});

// Date range filter for order/transaction queries
export const DateRangeParams = z.object({
  startDateTime: z.number().int().optional().describe("Start date as unix timestamp"),
  endDateTime: z.number().int().optional().describe("End date as unix timestamp"),
});

// Standard paginated response from Pancake API
export interface PancakeListResponse<T> {
  data: T[];
  success: boolean;
  page_number: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
}

// Standard single-item response from Pancake API
export interface PancakeResponse<T> {
  data: T;
  success: boolean;
}

// Pagination metadata returned in tool results
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
