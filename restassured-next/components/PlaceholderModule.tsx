"use client";
import { motion } from "framer-motion";

export default function PlaceholderModule({ id }: { id: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold gradient-text mb-2">Module &quot;{id}&quot; coming soon</h2>
      <p className="text-muted max-w-md mx-auto">
        This module is part of the full curriculum. In the POC, only{" "}
        <b className="text-accent2">intro</b> and <b className="text-accent2">http</b> are ported.
      </p>
      <p className="text-muted text-sm mt-4">
        If you like this Next.js version, the remaining 24 modules can be ported using the same pattern.
      </p>
    </motion.div>
  );
}
