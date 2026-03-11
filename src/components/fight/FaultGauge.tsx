'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FaultGaugeProps {
  myFault: number;
  opponentFault: number;
  animated?: boolean;
}

export default function FaultGauge({
  myFault,
  opponentFault,
  animated = true,
}: FaultGaugeProps) {
  const [displayMyFault, setDisplayMyFault] = useState(animated ? 0 : myFault);
  const [displayOpponentFault, setDisplayOpponentFault] = useState(
    animated ? 0 : opponentFault
  );

  useEffect(() => {
    if (!animated) {
      setDisplayMyFault(myFault);
      setDisplayOpponentFault(opponentFault);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayMyFault(Math.round(myFault * eased));
      setDisplayOpponentFault(Math.round(opponentFault * eased));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayMyFault(myFault);
        setDisplayOpponentFault(opponentFault);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [myFault, opponentFault, animated]);

  return (
    <div className="space-y-3">
      {/* Labels */}
      <div className="flex justify-between text-body2 font-medium">
        <span className="text-primary-400">
          나 <span className="font-bold">{displayMyFault}%</span>
        </span>
        <span className="text-accent-400">
          상대 <span className="font-bold">{displayOpponentFault}%</span>
        </span>
      </div>

      {/* Gauge bar */}
      <div className="gauge-bar flex overflow-hidden">
        <motion.div
          className="h-full bg-primary-400 rounded-l-full"
          initial={animated ? { width: '0%' } : { width: `${myFault}%` }}
          animate={{ width: `${myFault}%` }}
          transition={animated ? { duration: 1, ease: 'easeOut' } : { duration: 0 }}
        />
        <motion.div
          className="h-full bg-accent-400 rounded-r-full"
          initial={animated ? { width: '0%' } : { width: `${opponentFault}%` }}
          animate={{ width: `${opponentFault}%` }}
          transition={animated ? { duration: 1, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
}
