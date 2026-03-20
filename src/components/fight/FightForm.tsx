'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getCharLimits } from '@/lib/limits';

interface FightFormProps {
  onSubmit: (myClaim: string, opponentClaim: string) => void;
  disabled?: boolean;
}

export default function FightForm({ onSubmit, disabled = false }: FightFormProps) {
  const isPremium = useStore((s) => s.isPremium);
  const limits = getCharLimits(isPremium);
  const [myClaim, setMyClaim] = useState('');
  const [opponentClaim, setOpponentClaim] = useState('');

  const canSubmit =
    myClaim.trim().length > 0 &&
    opponentClaim.trim().length > 0 &&
    !disabled;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(myClaim.trim(), opponentClaim.trim());
  };

  return (
    <div className="space-y-4">
      {/* My Claim */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          내 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="내가 왜 맞는지 적어주세요..."
          maxLength={limits.userClaim ?? undefined}
          value={myClaim}
          onChange={(e) => setMyClaim(e.target.value)}
          disabled={disabled}
        />
        {limits.userClaim && (
          <p className="text-caption text-gray-400 text-right mt-1">
            {myClaim.length}/{limits.userClaim}
          </p>
        )}
      </motion.div>

      {/* Opponent Claim */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="block text-body2 font-medium text-gray-700 mb-2">
          상대방 주장
        </label>
        <textarea
          className="textarea-field h-28"
          placeholder="상대방은 뭐라고 했나요..."
          maxLength={limits.userClaim ?? undefined}
          value={opponentClaim}
          onChange={(e) => setOpponentClaim(e.target.value)}
          disabled={disabled}
        />
        {limits.userClaim && (
          <p className="text-caption text-gray-400 text-right mt-1">
            {opponentClaim.length}/{limits.userClaim}
          </p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          className="btn-primary flex items-center justify-center gap-2"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Swords className="w-5 h-5" />
              판결 받기
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
