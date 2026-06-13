"use client";
import { motion } from "framer-motion";
import { CURRICULUM } from "@/lib/curriculum";

type Props = {
  currentId: string;
  completed: Record<string, boolean>;
  onSelect: (id: string) => void;
};

export default function Sidebar({ currentId, completed, onSelect }: Props) {
  return (
    <nav className="bg-panel border-r border-border p-4 overflow-y-auto sticky top-[65px] h-[calc(100vh-65px)]">
      {CURRICULUM.map((phase) => (
        <div key={phase.phase} className="mb-3">
          <div className="text-[11px] uppercase tracking-widest text-accent2 my-3 font-bold">
            {phase.phase}
          </div>
          {phase.items.map((it) => {
            const active = it.id === currentId;
            const done = !!completed[it.id];
            return (
              <motion.div
                key={it.id}
                whileHover={{ x: 3 }}
                onClick={() => onSelect(it.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm mb-1 transition-colors ${
                  active
                    ? "bg-gradient-to-r from-accent/25 to-transparent text-white border-l-2 border-accent"
                    : "text-muted hover:bg-panel2 hover:text-white"
                }`}
              >
                <span>{it.icon}</span>
                <span className="flex-1">{it.title}</span>
                {done && <span className="text-accent2 text-xs">✓</span>}
              </motion.div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
