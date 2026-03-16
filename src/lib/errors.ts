// Error utility - type-safe error code extraction without `as` casts

export function getErrorCode(err: unknown): string | undefined {
  if (err !== null && typeof err === 'object' && 'code' in err) {
    return typeof err.code === 'string' ? err.code : undefined;
  }
  return undefined;
}

export function getErrorMessage(err: unknown, fallback = '오류가 발생했습니다'): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

export function isInsufficientTokens(err: unknown): boolean {
  return getErrorCode(err) === 'INSUFFICIENT_TOKENS';
}
