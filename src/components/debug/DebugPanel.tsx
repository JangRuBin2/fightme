'use client';

import { useState, useCallback } from 'react';
import { Bug, X, RefreshCw, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

interface LogEntry {
  id: number;
  time: string;
  type: 'request' | 'response' | 'error' | 'info';
  label: string;
  data: string;
}

let logIdCounter = 0;
const logEntries: LogEntry[] = [];
const listeners: Set<() => void> = new Set();

function addLog(type: LogEntry['type'], label: string, data: unknown) {
  logEntries.unshift({
    id: ++logIdCounter,
    time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
    type,
    label,
    data: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
  });
  if (logEntries.length > 50) logEntries.pop();
  listeners.forEach((fn) => fn());
}

// Intercept fetch globally to capture all API traffic
if (typeof window !== 'undefined' && !(window as unknown as Record<string, boolean>).__debugFetchPatched) {
  (window as unknown as Record<string, boolean>).__debugFetchPatched = true;
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isSupabase = url.includes('supabase') || url.includes('functions/v1');

    if (isSupabase) {
      const method = init?.method || 'GET';
      const headers = init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init?.headers || {});

      // Mask tokens for display
      const safeHeaders = { ...headers } as Record<string, string>;
      if (safeHeaders['Authorization']) {
        const token = safeHeaders['Authorization'];
        safeHeaders['Authorization'] = token.length > 30
          ? `${token.slice(0, 20)}...${token.slice(-10)}`
          : token;
      }
      if (safeHeaders['apikey']) {
        const key = safeHeaders['apikey'];
        safeHeaders['apikey'] = key.length > 20
          ? `${key.slice(0, 10)}...${key.slice(-6)}`
          : key;
      }

      const shortUrl = url.replace(/https?:\/\/[^/]+/, '');
      addLog('request', `${method} ${shortUrl}`, {
        headers: safeHeaders,
        body: init?.body ? JSON.parse(init.body as string) : undefined,
      });

      try {
        const response = await originalFetch(input, init);
        const clone = response.clone();
        const text = await clone.text();

        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text.slice(0, 500);
        }

        addLog(
          response.ok ? 'response' : 'error',
          `${response.status} ${shortUrl}`,
          parsedBody,
        );
        return response;
      } catch (err) {
        addLog('error', `FETCH FAIL ${shortUrl}`, {
          message: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }

    return originalFetch(input, init);
  };
}

function useLogState() {
  const [, setTick] = useState(0);
  const subscribe = useCallback(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  // Manual sync since useSyncExternalStore is tricky with SSR
  useState(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  });

  return logEntries;
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'auth' | 'store'>('logs');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const logs = useLogState();
  const store = useStore();

  const [authInfo, setAuthInfo] = useState<Record<string, unknown> | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const refreshAuth = async () => {
    setAuthLoading(true);
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      setAuthInfo({
        session: session ? {
          access_token: session.access_token
            ? `${session.access_token.slice(0, 20)}...${session.access_token.slice(-10)}`
            : null,
          refresh_token: session.refresh_token ? '(exists)' : null,
          expires_at: session.expires_at
            ? new Date(session.expires_at * 1000).toLocaleString('ko-KR')
            : null,
          token_type: session.token_type,
        } : null,
        sessionError: sessionError?.message || null,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          confirmed: user.confirmed_at ? 'yes' : 'NO - not confirmed!',
          created_at: user.created_at,
        } : null,
        userError: userError?.message || null,
        env: {
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...`
            : 'MISSING',
          ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 15)}...`
            : 'MISSING',
        },
      });
      addLog('info', 'Auth refreshed', { hasSession: !!session, hasUser: !!user });
    } catch (err) {
      setAuthInfo({ error: err instanceof Error ? err.message : String(err) });
    }
    setAuthLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const typeColor: Record<LogEntry['type'], string> = {
    request: 'text-blue-400',
    response: 'text-green-400',
    error: 'text-red-400',
    info: 'text-yellow-400',
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-[100] w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform opacity-60"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950 text-gray-100 text-xs font-mono safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1">
          {(['logs', 'auth', 'store'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'auth') refreshAuth();
              }}
              className={`px-3 py-1 rounded text-xs font-medium ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'logs' && (
            <button onClick={() => { logEntries.length = 0; listeners.forEach((fn) => fn()); }} className="text-gray-500">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {activeTab === 'auth' && (
            <button onClick={refreshAuth} className={`text-gray-500 ${authLoading ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'logs' && (
          <div className="divide-y divide-gray-800/50">
            {logs.length === 0 && (
              <p className="text-gray-500 text-center py-10">No API logs yet. Make a request to see logs here.</p>
            )}
            {logs.map((log) => {
              const expanded = expandedIds.has(log.id);
              return (
                <div key={log.id} className="px-3 py-2">
                  <button onClick={() => toggleExpand(log.id)} className="flex items-center gap-2 w-full text-left">
                    {expanded ? <ChevronUp className="w-3 h-3 text-gray-500 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />}
                    <span className="text-gray-600 shrink-0">{log.time}</span>
                    <span className={`font-bold shrink-0 ${typeColor[log.type]}`}>
                      {log.type === 'request' ? 'REQ' : log.type === 'response' ? 'RES' : log.type === 'error' ? 'ERR' : 'INF'}
                    </span>
                    <span className="text-gray-300 truncate">{log.label}</span>
                  </button>
                  {expanded && (
                    <div className="mt-1 ml-5 relative">
                      <button
                        onClick={() => copyToClipboard(log.data)}
                        className="absolute top-1 right-1 text-gray-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <pre className="bg-gray-900 rounded p-2 overflow-x-auto text-[10px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap break-all">
                        {log.data}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="p-3">
            {authInfo ? (
              <pre className="bg-gray-900 rounded p-3 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(authInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 text-center py-10">Loading...</p>
            )}

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={async () => {
                  const supabase = createClient();
                  const { data, error } = await supabase.auth.refreshSession();
                  addLog('info', 'Session refresh attempt', {
                    success: !!data.session,
                    error: error?.message,
                  });
                  refreshAuth();
                }}
                className="w-full py-2 rounded bg-blue-700 text-white text-xs font-medium"
              >
                Force Refresh Session
              </button>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  useStore.getState().clearAuth();
                  addLog('info', 'Signed out', {});
                  refreshAuth();
                }}
                className="w-full py-2 rounded bg-red-700 text-white text-xs font-medium"
              >
                Sign Out + Clear Store
              </button>
              <button
                onClick={async () => {
                  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fight-judge`;
                  const supabase = createClient();
                  const { data: { session } } = await supabase.auth.getSession();
                  addLog('info', 'Direct test call', {
                    url,
                    hasSession: !!session,
                    tokenPrefix: session?.access_token?.slice(0, 30),
                    anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15),
                  });
                  try {
                    const res = await fetch(url, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || 'NO_TOKEN'}`,
                        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NO_KEY',
                      },
                      body: JSON.stringify({ test: true }),
                    });
                    const text = await res.text();
                    addLog(res.ok ? 'response' : 'error', `Test: ${res.status}`, text);
                  } catch (err) {
                    addLog('error', 'Test fetch failed', err instanceof Error ? err.message : String(err));
                  }
                }}
                className="w-full py-2 rounded bg-yellow-700 text-white text-xs font-medium"
              >
                Test Edge Function Call
              </button>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="p-3">
            <pre className="bg-gray-900 rounded p-3 overflow-x-auto text-[10px] leading-relaxed whitespace-pre-wrap break-all">
              {JSON.stringify({
                isLoggedIn: store.isLoggedIn,
                userId: store.userId,
                nickname: store.nickname,
                tokenBalance: store.tokenBalance,
                theme: store.theme,
                currentFight: store.currentFight,
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
