import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function handleAuthFailure() {
  useStore.getState().clearAuth();
}

interface EdgeError extends Error {
  code?: string;
  status?: number;
}

function createEdgeError(message: string, code?: string, status?: number): EdgeError {
  const err = new Error(message) as EdgeError;
  err.code = code;
  err.status = status;
  return err;
}

const edgeErrorSchema = z.object({
  error: z.string().optional(),
  code: z.string().optional(),
}).passthrough();

export async function callEdgeFunction<T>(
  functionName: string,
  schema: z.ZodType<T>,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const supabase = createClient();

  // getUser() triggers token refresh if expired; getSession() only reads cache
  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    // Token refresh failed - try explicit refresh
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      handleAuthFailure();
      throw createEdgeError('로그인이 필요합니다', 'AUTH_REQUIRED', 401);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    handleAuthFailure();
    throw createEdgeError('로그인이 필요합니다', 'AUTH_REQUIRED', 401);
  }

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    let errorMessage = `Edge function error: ${response.status}`;
    let errorCode: string | undefined;
    try {
      const parsed = edgeErrorSchema.safeParse(JSON.parse(text));
      if (parsed.success) {
        errorMessage = parsed.data.error || errorMessage;
        errorCode = parsed.data.code;
      }
    } catch {
      // Non-JSON error response
    }
    if (response.status === 401) {
      handleAuthFailure();
    }
    throw createEdgeError(errorMessage, errorCode, response.status);
  }

  try {
    const json: unknown = JSON.parse(text);
    return schema.parse(json);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw createEdgeError(
        `Invalid server response: ${err.issues.map((i) => i.message).join(', ')}`
      );
    }
    throw createEdgeError('Server returned an unexpected response. Please try again.');
  }
}

export async function callPublicEdgeFunction<T>(
  functionName: string,
  schema: z.ZodType<T>,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    let errorMessage = `Edge function error: ${response.status}`;
    try {
      const parsed = edgeErrorSchema.safeParse(JSON.parse(text));
      if (parsed.success) {
        errorMessage = parsed.data.error || errorMessage;
      }
    } catch {
      // Non-JSON error response
    }
    throw new Error(errorMessage);
  }

  try {
    const json: unknown = JSON.parse(text);
    return schema.parse(json);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(
        `Invalid server response: ${err.issues.map((i) => i.message).join(', ')}`
      );
    }
    throw new Error('Server returned an unexpected response. Please try again.');
  }
}
