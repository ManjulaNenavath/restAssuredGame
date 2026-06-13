"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = { hints: string[] };

export default function HintBox({ hints }: Props) {
  const [shown, setShown] = useState(0);

  if (shown >= hints.length) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-muted/10 border border-border text-xs text-muted">
        No more hints — try the solution.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setShown((s) => s + 1)}
        className="text-xs px-3 py-1.5 rounded-md bg-amber-400/10 border border-amber-400/40 text-amber-300 hover:bg-amber-400/20 transition-colors"
      >
        💡 Reveal hint {shown + 1}/{hints.length}
      </button>
      <AnimatePresence>
        {hints.slice(0, shown).map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 rounded-lg bg-amber-400/10 border-l-4 border-amber-400 text-sm"
          >
            <span className="text-amber-300 font-semibold">Hint {i + 1}: </span>
            {h}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
