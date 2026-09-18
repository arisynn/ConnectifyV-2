import React from 'react';
import { motion } from 'motion/react';
export const TestButton = () => (
  <div className="p-20">
    <motion.button
      whileTap={{ scale: 0.95, y: "var(--geometry-press-translate-y)", x: "var(--geometry-press-translate-x)", boxShadow: "var(--geometry-shadow-active)" }}
      className="bg-red-500 p-4 border-2 border-black shadow-theme-base"
    >
      Framer Motion whileTap
    </motion.button>
    <br/><br/>
    <button
      className="bg-blue-500 p-4 border-2 border-black shadow-theme-base active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)] transition-all"
    >
      Tailwind active
    </button>
  </div>
);
