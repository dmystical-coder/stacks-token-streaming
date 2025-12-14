/**
 * Stream Manager Contract Error Codes & Messages
 * Maps Clarity error codes to user-friendly messages
 */

export interface StreamError {
  code: number;
  name: string;
  message: string;
  userMessage: string;
  suggestion?: string;
}

/**
 * Contract error codes mapping
 */
export const STREAM_ERRORS: Record<number, StreamError> = {
  100: {
    code: 100,
    name: "ERR_UNAUTHORIZED",
    message: "Unauthorized action",
    userMessage: "You are not authorized to perform this action",
    suggestion:
      "Only the stream sender can cancel or pause. Only the recipient can withdraw.",
  },

  101: {
    code: 101,
    name: "ERR_STREAM_NOT_FOUND",
    message: "Stream not found",
    userMessage: "This stream does not exist",
    suggestion: "Please check the stream ID and try again.",
  },

  102: {
    code: 102,
    name: "ERR_STREAM_ALREADY_EXISTS",
    message: "Stream already exists",
    userMessage: "A stream with this ID already exists",
    suggestion: "This error should not occur in normal usage.",
  },

  103: {
    code: 103,
    name: "ERR_INVALID_AMOUNT",
    message: "Invalid amount",
    userMessage: "The amount must be at least 0.001 STX (1,000 microSTX)",
    suggestion: "Please increase the amount to at least 0.001 STX.",
  },

  104: {
    code: 104,
    name: "ERR_INVALID_DURATION",
    message: "Invalid duration",
    userMessage: "Duration must be between 1 minute and 1 year",
    suggestion:
      "Please set a duration between 60 seconds (1 min) and 31,536,000 seconds (1 year).",
  },

  105: {
    code: 105,
    name: "ERR_STREAM_NOT_STARTED",
    message: "Stream has not started",
    userMessage: "This stream has not started yet",
    suggestion: "Please wait until the stream start time.",
  },

  106: {
    code: 106,
    name: "ERR_STREAM_ENDED",
    message: "Stream has ended or been cancelled",
    userMessage: "This stream has already ended or been cancelled",
    suggestion: "Cancelled streams cannot be modified.",
  },

  107: {
    code: 107,
    name: "ERR_NO_TOKENS_TO_WITHDRAW",
    message: "No tokens available to withdraw",
    userMessage: "There are no tokens available to withdraw yet",
    suggestion:
      "Tokens vest over time. Please wait for more tokens to vest, or check if the stream is paused.",
  },

  108: {
    code: 108,
    name: "ERR_INVALID_RECIPIENT",
    message: "Invalid recipient",
    userMessage: "You cannot create a stream to yourself",
    suggestion: "Please choose a different recipient address.",
  },

  109: {
    code: 109,
    name: "ERR_STREAM_PAUSED",
    message: "Stream is paused",
    userMessage: "This stream is currently paused",
    suggestion: "The stream sender needs to resume it before you can withdraw.",
  },

  110: {
    code: 110,
    name: "ERR_STREAM_NOT_PAUSED",
    message: "Stream is not paused",
    userMessage: "This stream is not currently paused",
    suggestion: "You can only resume a paused stream.",
  },

  111: {
    code: 111,
    name: "ERR_TRANSFER_FAILED",
    message: "Token transfer failed",
    userMessage: "The STX transfer failed",
    suggestion:
      "Please check your balance and try again. You may need more STX for gas fees.",
  },

  112: {
    code: 112,
    name: "ERR_INVALID_TOKEN",
    message: "Invalid token type",
    userMessage: "Invalid token type for this operation",
    suggestion: "This error should not occur in normal usage.",
  },

  113: {
    code: 113,
    name: "ERR_INSUFFICIENT_BALANCE",
    message: "Insufficient balance",
    userMessage: "Insufficient STX balance",
    suggestion: "You need more STX to create this stream.",
  },
};

/**
 * Get error details from a Clarity error response
 */
export function getStreamError(errorCode: number | bigint): StreamError | null {
  const code = typeof errorCode === "bigint" ? Number(errorCode) : errorCode;
  return STREAM_ERRORS[code] || null;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(errorCode: number | bigint): string {
  const error = getStreamError(errorCode);
  return error?.userMessage || "An unknown error occurred";
}

/**
 * Get error suggestion
 */
export function getErrorSuggestion(
  errorCode: number | bigint
): string | undefined {
  const error = getStreamError(errorCode);
  return error?.suggestion;
}

/**
 * Format complete error message with suggestion
 */
export function formatErrorMessage(errorCode: number | bigint): string {
  const error = getStreamError(errorCode);
  if (!error) return "An unknown error occurred. Please try again.";

  return error.suggestion
    ? `${error.userMessage}. ${error.suggestion}`
    : error.userMessage;
}

/**
 * Check if error is a specific type
 */
export function isUnauthorizedError(errorCode: number | bigint): boolean {
  return Number(errorCode) === 100;
}

export function isInsufficientTokensError(errorCode: number | bigint): boolean {
  return Number(errorCode) === 107;
}

export function isStreamPausedError(errorCode: number | bigint): boolean {
  return Number(errorCode) === 109;
}

export function isStreamEndedError(errorCode: number | bigint): boolean {
  return Number(errorCode) === 106;
}

interface ClarityErrorResponse {
  type: string;
  value?:
    | {
        type?: string;
        value?: number | bigint;
      }
    | bigint
    | number;
}

/**
 * Parse error from Clarity response
 */
export function parseContractError(response: ClarityErrorResponse): {
  code: number;
  message: string;
  suggestion?: string;
} | null {
  if (!response || response.type !== "error") return null;

  // Extract error code from Clarity error response
  let errorCode: number;

  if (
    typeof response.value === "object" &&
    response.value !== null &&
    "value" in response.value &&
    response.value.type === "uint"
  ) {
    errorCode = Number(response.value.value);
  } else if (typeof response.value === "bigint") {
    errorCode = Number(response.value);
  } else if (typeof response.value === "number") {
    errorCode = response.value;
  } else {
    return {
      code: 0,
      message: "Unknown error format",
    };
  }

  const error = getStreamError(errorCode);

  return {
    code: errorCode,
    message: error?.userMessage || "An unknown error occurred",
    suggestion: error?.suggestion,
  };
}

/**
 * Export all error codes as constants for easy reference
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 100,
  STREAM_NOT_FOUND: 101,
  STREAM_ALREADY_EXISTS: 102,
  INVALID_AMOUNT: 103,
  INVALID_DURATION: 104,
  STREAM_NOT_STARTED: 105,
  STREAM_ENDED: 106,
  NO_TOKENS_TO_WITHDRAW: 107,
  INVALID_RECIPIENT: 108,
  STREAM_PAUSED: 109,
  STREAM_NOT_PAUSED: 110,
  TRANSFER_FAILED: 111,
  INVALID_TOKEN: 112,
  INSUFFICIENT_BALANCE: 113,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
