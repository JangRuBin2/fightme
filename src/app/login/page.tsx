'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTossLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // TODO: connect to API - call tossAppLogin() from @apps-in-toss/web-framework SDK
      console.log('Initiating Toss login...');

      // Placeholder for actual Toss login flow
      // const { code } = await tossAppLogin();
      // const { data } = await supabase.functions.invoke('auth-toss', { body: { code } });
    } catch (error) {
      console.error('Login failed:', error);
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

      {/* Login Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
      >
        <button
          className="w-full py-4 rounded-2xl bg-[#0064FF] text-white font-semibold text-body1
                     active:bg-[#0050CC] transition-colors duration-150
                     flex items-center justify-center gap-2"
          onClick={handleTossLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '토스로 시작하기'
          )}
        </button>

        <p className="text-caption text-gray-400 text-center mt-4">
          시작하면 이용약관과 개인정보처리방침에 동의하게 됩니다
        </p>
      </motion.div>
    </div>
  );
}
