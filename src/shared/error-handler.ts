/**
 * Format errors from Pancake API or internal errors into a consistent MCP tool error result.
 */
export function formatToolError(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
  let message: string;
  let code: string;

  if (error instanceof PancakeApiError) {
    code = error.code;
    message = error.message;
  } else if (error instanceof Error) {
    code = "INTERNAL_ERROR";
    message = error.message;
  } else {
    code = "UNKNOWN_ERROR";
    message = String(error);
  }

  return {
    content: [{ type: "text", text: JSON.stringify({ error: true, code, message }) }],
    isError: true,
  };
}

/**
 * Custom error class for Pancake API errors with HTTP status and error code.
 */
export class PancakeApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "PancakeApiError";
  }
}
