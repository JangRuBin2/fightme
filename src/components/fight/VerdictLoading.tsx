'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';

const LOADING_TEXTS = [
  '양쪽 주장을 검토하는 중',
  '증거를 분석하는 중',
  '공정한 판결을 찾는 중',
  '판사가 심사숙고하는 중',
  '곧 판결이 내려집니다',
];

export default function VerdictLoading() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-5">
      <motion.div
        animate={{ rotate: [0, -15, 0, 15, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <Gavel className="w-12 h-12 text-primary-400" />
      </motion.div>

      <motion.p
        key={textIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-body1 font-medium text-gray-600 text-center"
      >
        {LOADING_TEXTS[textIndex]}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.span>
      </motion.p>
    </div>
  );
}
