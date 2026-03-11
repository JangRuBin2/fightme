import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export async function callEdgeFunction<T = unknown>(
  functionName: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
): Promise<T> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Unauthorized');
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
      const error = JSON.parse(text);
      errorMessage = error.error || errorMessage;
      errorCode = error.code;
    } catch {
      // Non-JSON error response
    }
    const err = new Error(errorMessage);
    (err as unknown as Record<string, unknown>).code = errorCode;
    (err as unknown as Record<string, unknown>).status = response.status;
    throw err;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Server returned an unexpected response. Please try again.');
  }
}

export async function callPublicEdgeFunction<T = unknown>(
  functionName: string,
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
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    let errorMessage = `Edge function error: ${response.status}`;
    try {
      const error = JSON.parse(text);
      errorMessage = error.error || errorMessage;
    } catch {
      // Non-JSON error response
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Server returned an unexpected response. Please try again.');
  }
}
