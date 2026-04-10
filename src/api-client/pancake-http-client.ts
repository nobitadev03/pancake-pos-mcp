import type { PancakeConfig } from "../config.js";
import type { PancakeListResponse, PancakeResponse } from "../shared/schemas.js";
import { PancakeApiError } from "../shared/error-handler.js";
import { buildRequestUrl, redactUrl } from "./request-builder.js";
import { parseResponse, parsePaginatedResponse } from "./response-parser.js";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const FETCH_TIMEOUT_MS = 30_000;

/**
 * HTTP client for the Pancake POS API.
 * Handles auth injection, token-bucket rate limiting, and exponential backoff retry.
 */
export class PancakeHttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly shopId: string;

  // Per-minute token bucket: 1000 tokens/min
  private minuteTokens = 1000;
  private readonly maxMinuteTokens = 1000;
  private lastMinuteRefill = Date.now();
  private readonly minuteRefillRateMs = 60; // 1 token every 60ms = 1000/min

  // Per-hour token bucket: 10000 tokens/hour
  private hourTokens = 10000;
  private readonly maxHourTokens = 10000;
  private lastHourRefill = Date.now();
  private readonly hourRefillRateMs = 360; // 1 token every 360ms = 10000/hour

  constructor(config: PancakeConfig) {
    this.baseUrl = config.PANCAKE_BASE_URL;
    this.apiKey = config.PANCAKE_API_KEY;
    this.shopId = config.PANCAKE_SHOP_ID;
  }

  async getRaw<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path, params);
    const response = await this.executeWithRetry(url, { method: "GET" });
    if (!response.ok) {
      throw new PancakeApiError("API_ERROR", `HTTP ${response.status}`, response.status);
    }
    const json = await response.json() as T;
    return json;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<PancakeResponse<T>> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path, params);
    const response = await this.executeWithRetry(url, { method: "GET" });
    return parseResponse<T>(response);
  }

  async getList<T>(path: string, params?: Record<string, unknown>): Promise<PancakeListResponse<T>> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path, params);
    const response = await this.executeWithRetry(url, { method: "GET" });
    return parsePaginatedResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown): Promise<PancakeResponse<T>> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path);
    const response = await this.executeWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(response);
  }

  async put<T>(path: string, body?: unknown): Promise<PancakeResponse<T>> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path);
    const response = await this.executeWithRetry(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(response);
  }

  async delete(path: string): Promise<PancakeResponse<void>> {
    const url = buildRequestUrl(this.baseUrl, this.shopId, this.apiKey, path);
    const response = await this.executeWithRetry(url, { method: "DELETE" });
    return parseResponse<void>(response);
  }

  private async executeWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.consumeToken();

      try {
        const response = await fetch(url, {
          ...init,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          console.error(`[PancakeHTTP] ${response.status} on ${redactUrl(url)}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          console.error(`[PancakeHTTP] Network error on ${redactUrl(url)}, retrying in ${delay}ms: ${lastError.message}`);
          await sleep(delay);
        }
      }
    }

    throw new PancakeApiError("NETWORK_ERROR", `Failed after ${MAX_RETRIES} retries: ${lastError?.message}`, 0);
  }

  /**
   * Async token bucket rate limiter. Waits if no tokens available.
   */
  private async consumeToken(): Promise<void> {
    this.refillTokens();

    while (this.minuteTokens <= 0 || this.hourTokens <= 0) {
      const waitMs = this.minuteTokens <= 0 ? this.minuteRefillRateMs : this.hourRefillRateMs;
      console.error(`[PancakeHTTP] Rate limit reached, waiting ${waitMs}ms`);
      await sleep(waitMs);
      this.refillTokens();
    }

    this.minuteTokens--;
    this.hourTokens--;
  }

  private refillTokens(): void {
    const now = Date.now();

    const minuteElapsed = now - this.lastMinuteRefill;
    const minuteToAdd = Math.floor(minuteElapsed / this.minuteRefillRateMs);
    if (minuteToAdd > 0) {
      this.minuteTokens = Math.min(this.maxMinuteTokens, this.minuteTokens + minuteToAdd);
      this.lastMinuteRefill = now;
    }

    const hourElapsed = now - this.lastHourRefill;
    const hourToAdd = Math.floor(hourElapsed / this.hourRefillRateMs);
    if (hourToAdd > 0) {
      this.hourTokens = Math.min(this.maxHourTokens, this.hourTokens + hourToAdd);
      this.lastHourRefill = now;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
