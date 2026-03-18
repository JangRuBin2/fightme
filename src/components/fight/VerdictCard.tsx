'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Quote, Lock, Shield } from 'lucide-react';
import FaultGauge from './FaultGauge';
import type { Fight, Judge } from '@/types/database';

function DefenseDisplay({ defense, compact, myName, theirName }: { defense: Fight['defense']; compact?: boolean; myName?: string; theirName?: string }) {
  if (!defense || !defense.sections || defense.sections.length === 0) return null;

  const padding = compact ? 'p-2.5' : 'p-4';
  const textSize = compact ? 'text-caption' : 'text-body2';
  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';
  const labelSize = compact ? 'text-caption' : 'text-body2';

  return (
    <div className="space-y-2">
      {defense.sections.map((section, i) => {
        const isOpponent = section.side === 'opponent';
        const bgColor = isOpponent ? 'bg-accent-50' : 'bg-primary-50';
        const iconColor = isOpponent ? 'text-accent-500' : 'text-primary-500';
        const labelColor = isOpponent ? 'text-accent-600' : 'text-primary-600';
        const name = isOpponent ? (theirName || '상대') : (myName || '나');

        return (
          <div key={i} className={`${bgColor} rounded-xl ${padding}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className={`${iconSize} ${iconColor}`} />
              <p className={`${labelSize} font-medium ${labelColor}`}>{name} 측 변론</p>
            </div>
            <p className={`${textSize} text-gray-700 leading-relaxed`}>{section.text}</p>
          </div>
        );
      })}
    </div>
  );
}

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
  const [showOriginal, setShowOriginal] = useState(false);
  const judgeLetter = judge.name.charAt(0);
  const hasOriginal = fight.stage === 'APPEAL' && fight.original_verdict;
  const myName = fight.user_name || '나';
  const theirName = fight.opponent_name || '상대';

  return (
    <div className="space-y-4">
      {/* Original verdict (1심) - shown for appeal cases */}
      {hasOriginal && fight.original_verdict && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-3 border-gray-200"
        >
          <div className="flex items-center justify-between">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-caption font-medium bg-gray-200 text-gray-600">
              1심 판결
            </span>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-caption text-gray-400 flex items-center gap-0.5"
            >
              {showOriginal ? '접기' : '펼치기'}
              {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Always show gauge */}
          {fight.original_verdict.user_fault !== null && fight.original_verdict.opponent_fault !== null && (
            <FaultGauge
              myFault={fight.original_verdict.user_fault}
              opponentFault={fight.original_verdict.opponent_fault}
              myName={myName}
              opponentName={theirName}
              animated={false}
            />
          )}

          {/* Comment */}
          {fight.original_verdict.comment && (
            <div className="relative bg-gray-50 rounded-xl p-3">
              <Quote className="w-3.5 h-3.5 text-gray-300 absolute top-2.5 left-2.5" />
              <p className="text-caption text-gray-600 leading-relaxed pl-5 italic">
                {fight.original_verdict.comment}
              </p>
            </div>
          )}

          <AnimatePresence>
            {showOriginal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-2"
              >
                {/* Claims */}
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <div className="bg-primary-50 rounded-lg p-2.5">
                    <p className="font-medium text-primary-500 mb-1">{myName} 주장</p>
                    <p className="text-gray-600">{fight.user_claim}</p>
                  </div>
                  <div className="bg-accent-50 rounded-lg p-2.5">
                    <p className="font-medium text-accent-500 mb-1">{theirName} 주장</p>
                    <p className="text-gray-600">{fight.opponent_claim}</p>
                  </div>
                </div>

                {/* Defense */}
                {fight.original_verdict.defense && (
                  <DefenseDisplay defense={fight.original_verdict.defense} compact myName={myName} theirName={theirName} />
                )}

                {/* Detail */}
                {fight.original_verdict.verdict_detail && (
                  <p className="text-caption text-gray-500 leading-relaxed">
                    {fight.original_verdict.verdict_detail}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Current verdict (2심 or 1심) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card space-y-5"
      >
        {/* Stage badge */}
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-caption font-medium ${
          fight.stage === 'APPEAL'
            ? 'bg-accent-100 text-accent-700'
            : 'bg-primary-100 text-primary-700'
        }`}>
          {fight.stage === 'APPEAL' ? '2심 판결 (항소심)' : '1심 판결'}
        </span>

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
            myName={myName}
            opponentName={theirName}
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

        {/* Defense (if exists and not yet appealed) */}
        {fight.defense && fight.stage === 'INITIAL' && (
          <DefenseDisplay defense={fight.defense} myName={myName} theirName={theirName} />
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
                상세 판결 보기 (토큰 2개)
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
                      <p className="font-medium text-primary-500 mb-1">{myName} 주장</p>
                      <p className="text-gray-600">{fight.user_claim}</p>
                    </div>
                    <div className="bg-accent-50 rounded-lg p-3">
                      <p className="font-medium text-accent-500 mb-1">{theirName} 주장</p>
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
    </div>
  );
}
