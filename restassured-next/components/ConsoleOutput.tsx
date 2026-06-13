"use client";
import { motion } from "framer-motion";

type Props = { lines: string[]; label?: string };

export default function ConsoleOutput({ lines, label = "📺 Expected console output" }: Props) {
  return (
    <div className="mt-3">
      <div className="text-xs text-muted mb-1">{label}</div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-black border border-border rounded-lg p-3 font-mono text-xs leading-relaxed"
      >
        {lines.map((l, i) => (
          <div key={i} className={l.startsWith(">") ? "text-emerald-400" : "text-slate-300"}>
            {l}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
