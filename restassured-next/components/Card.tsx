"use client";
import { motion } from "framer-motion";

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-panel border border-border rounded-xl p-5 mb-4 shadow-lg"
    >
      {children}
    </motion.div>
  );
}
