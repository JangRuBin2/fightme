'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, AlertCircle } from 'lucide-react';
import { tossAppLogin, isAppsInTossEnvironment } from '@/lib/apps-in-toss/sdk';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { authResponseSchema } from '@/lib/schemas';
import { getErrorMessage } from '@/lib/errors';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const DEV_EMAIL = 'dev@fightme.internal';
const DEV_PASSWORD = 'devmode-fightme-2024';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setTokenBalance } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isTossEnv = typeof window !== 'undefined' && isAppsInTossEnvironment();

  const finalizeLogin = async (supabase: ReturnType<typeof createClient>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Failed to get user after login');

    // Fetch profile for nickname & token balance
    const { data: profileData } = await supabase
      .from('profiles')
      .select('nickname, token')
      .eq('id', user.id)
      .single();
    const profile = profileData as { nickname: string | null; token: number } | null;

    setAuth(user.id, profile?.nickname ?? null);
    setTokenBalance(profile?.token ?? 0);
    router.replace('/');
  };

  const handleTossLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get authorization code from Toss SDK
      const loginResult = await tossAppLogin();
      if (!loginResult) {
        setError('토스 로그인이 취소되었습니다');
        return;
      }

      const { authorizationCode, referrer } = loginResult;

      // Step 2: Exchange code via auth-toss Edge Function
      const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-toss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ authorizationCode, referrer }),
      });

      if (!response.ok) {
        throw new Error('인증 서버 오류가 발생했습니다');
      }

      const json: unknown = await response.json();
      const data = authResponseSchema.parse(json);

      if (!data.success || !data.session) {
        throw new Error(data.error || '인증에 실패했습니다');
      }

      // Step 3: Set Supabase session with returned tokens
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) throw sessionError;

      // Step 4: Finalize login (fetch profile, update store)
      await finalizeLogin(supabase);
    } catch (err) {
      setError(getErrorMessage(err, '로그인 중 오류가 발생했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Try sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          // User doesn't exist - create via signUp
          // signUp may auto-login if email confirmation is disabled
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
            options: { data: { auth_provider: 'dev' } },
          });

          if (signUpError) throw signUpError;

          // Check if signUp returned a session (autoconfirm enabled)
          if (signUpData.session) {
            await finalizeLogin(supabase);
            return;
          }

          // If no session from signUp, try signIn again (might need email confirmation)
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
          });

          if (retryError) {
            if (retryError.message.includes('Email not confirmed')) {
              throw new Error(
                'Supabase에서 이메일 확인이 필요합니다. ' +
                'Supabase Dashboard > Authentication > Providers > Email에서 ' +
                '"Confirm email" 옵션을 비활성화해주세요.'
              );
            }
            throw retryError;
          }
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error(
            'Supabase에서 이메일 확인이 필요합니다. ' +
            'Supabase Dashboard > Authentication > Providers > Email에서 ' +
            '"Confirm email" 옵션을 비활성화하거나, ' +
            'Authentication > Users에서 dev@fightme.internal 유저를 확인(confirm)해주세요.'
          );
        } else {
          throw signInError;
        }
      }

      await finalizeLogin(supabase);
    } catch (err) {
      setError(getErrorMessage(err, '개발 로그인 중 오류가 발생했습니다'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center mb-16"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary-400 flex items-center justify-center mb-6 shadow-lg">
          <Swords className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-h1 text-gray-900 mb-2">나랑 싸울래?</h1>
        <p className="text-body2 text-gray-500 text-center">
          AI 판사에게 판결을 맡겨보세요
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-body2 w-full"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Login Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full space-y-3"
      >
        {/* Toss Login - always shown */}
        <button
          className="w-full py-4 rounded-2xl bg-[#0064FF] text-white font-semibold text-body1
                     active:bg-[#0050CC] transition-colors duration-150
                     flex items-center justify-center gap-2 disabled:opacity-50"
          onClick={handleTossLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '토스로 시작하기'
          )}
        </button>

        {/* Dev Login - only outside Toss environment */}
        {!isTossEnv && (
          <button
            className="w-full py-4 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-body1
                       active:bg-gray-200 transition-colors duration-150
                       flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleDevLogin}
            disabled={isLoading}
          >
            개발자 모드로 시작하기
          </button>
        )}

        <p className="text-caption text-gray-400 text-center mt-4">
          시작하면 이용약관과 개인정보처리방침에 동의하게 됩니다
        </p>
      </motion.div>
    </div>
  );
}
