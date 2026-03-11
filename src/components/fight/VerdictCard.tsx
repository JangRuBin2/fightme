'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Quote, Lock } from 'lucide-react';
import FaultGauge from './FaultGauge';
import type { Fight, Judge } from '@/types/database';

interface VerdictCardProps {
  fight: Fight;
  judge: Judge | { id: string; name: string; description?: string | null };
  verdictDetail?: string | null;
  onRequestDetail?: () => void;
  isDetailLoading?: boolean;
}

export default function VerdictCard({
  fight,
  judge,
  verdictDetail,
  onRequestDetail,
  isDetailLoading,
}: VerdictCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const judgeLetter = judge.name.charAt(0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="card space-y-5"
    >
      {/* Stage badge */}
      {fight.stage === 'APPEAL' && (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-caption font-medium bg-amber-100 text-amber-700">
          항소심
        </span>
      )}

      {/* Judge info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-body1 font-bold text-primary-500">
            {judgeLetter}
          </span>
        </div>
        <div>
          <p className="text-body2 font-semibold text-gray-800">{judge.name}</p>
          {'description' in judge && judge.description && (
            <span className="text-caption text-gray-400">{judge.description}</span>
          )}
        </div>
      </div>

      {/* Fault gauge */}
      {fight.user_fault !== null && fight.opponent_fault !== null && (
        <FaultGauge
          myFault={fight.user_fault}
          opponentFault={fight.opponent_fault}
          animated
        />
      )}

      {/* Judge comment */}
      {fight.comment && (
        <div className="relative bg-gray-50 rounded-xl p-4">
          <Quote className="w-4 h-4 text-gray-300 absolute top-3 left-3" />
          <p className="text-body2 text-gray-700 leading-relaxed pl-5 italic">
            {fight.comment}
          </p>
        </div>
      )}

      {/* Detail (collapsible) */}
      <div>
        <button
          onClick={() => {
            if (!verdictDetail && !fight.verdict_detail && onRequestDetail) {
              onRequestDetail();
              return;
            }
            setShowDetail(!showDetail);
          }}
          className="flex items-center gap-1 text-body2 font-medium text-gray-500
                     active:text-gray-700 transition-colors w-full justify-center"
        >
          {verdictDetail || fight.verdict_detail ? (
            <>
              판결 근거
              {showDetail ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </>
          ) : (
            <>
              {isDetailLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              상세 판결 보기 (토큰 1개)
            </>
          )}
        </button>

        <AnimatePresence>
          {showDetail && (verdictDetail || fight.verdict_detail) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                {/* Claims summary */}
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <div className="bg-primary-50 rounded-lg p-3">
                    <p className="font-medium text-primary-500 mb-1">내 주장</p>
                    <p className="text-gray-600">{fight.user_claim}</p>
                  </div>
                  <div className="bg-accent-50 rounded-lg p-3">
                    <p className="font-medium text-accent-500 mb-1">상대 주장</p>
                    <p className="text-gray-600">{fight.opponent_claim}</p>
                  </div>
                </div>

                {/* Detail text */}
                <p className="text-body2 text-gray-600 leading-relaxed whitespace-pre-line">
                  {verdictDetail || fight.verdict_detail}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
