'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import scalesAnimation from '../../../public/animations/scales.json';

const LOADING_TEXTS = [
  '양쪽 주장을 검토하는 중...',
  '증거를 분석하는 중...',
  '공정한 판결을 찾는 중...',
  '판사가 심사숙고하는 중...',
  '곧 판결이 내려집니다...',
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
    <div className="flex flex-col items-center justify-center py-16 px-5">
      {/* Lottie Scale Animation */}
      <div className="w-64 h-64 mb-4">
        <Lottie
          animationData={scalesAnimation}
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Loading text */}
      <motion.p
        key={textIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="text-body1 font-medium text-gray-600 text-center"
      >
        {LOADING_TEXTS[textIndex]}
      </motion.p>

    </div>
  );
}
