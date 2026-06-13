"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Sidebar from "@/components/Sidebar";
import IntroModule from "@/components/IntroModule";
import HttpModule from "@/components/HttpModule";
import SetupModule from "@/components/SetupModule";
import BddModule from "@/components/BddModule";
import GetModule from "@/components/GetModule";
import PostModule from "@/components/PostModule";
import JsonPathModule from "@/components/JsonPathModule";
import PutDelModule from "@/components/PutDelModule";
import SpecsModule from "@/components/SpecsModule";
import PayloadModule from "@/components/PayloadModule";
import SchemaModule from "@/components/SchemaModule";
import OAuthModule from "@/components/OAuthModule";
import EnvModule from "@/components/EnvModule";
import SslModule from "@/components/SslModule";
import FeatureModule from "@/components/FeatureModule";
import TagsModule from "@/components/TagsModule";
import HooksModule from "@/components/HooksModule";
import DynamicModule from "@/components/DynamicModule";
import ParallelModule from "@/components/ParallelModule";
import GuiceModule from "@/components/GuiceModule";
import AllureModule from "@/components/AllureModule";
import LoggingModule from "@/components/LoggingModule";
import AssertsModule from "@/components/AssertsModule";
import ArchModule from "@/components/ArchModule";
import BestModule from "@/components/BestModule";
import InterviewModule from "@/components/InterviewModule";
import { useProgress } from "@/lib/useProgress";
import { TOTAL_MODULES } from "@/lib/curriculum";

export default function Home() {
  const [currentId, setCurrentId] = useState("intro");
  const [menuOpen, setMenuOpen] = useState(false);
  const [levelUpText, setLevelUpText] = useState<string | null>(null);
  const { state, complete, addXp, reset, hydrated } = useProgress();

  const completedCount = Object.values(state.completed).filter(Boolean).length;
  const percent = (completedCount / TOTAL_MODULES) * 100;

  function handleComplete(id: string) {
    if (state.completed[id]) return;
    complete(id);
    setLevelUpText(`+100 XP — ${id} complete!`);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#7c5cff", "#3ddc97", "#ffb84d", "#4ec3ff"],
    });
    setTimeout(() => setLevelUpText(null), 1500);
  }

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => { if (!e.matches) setMenuOpen(false); };
    const mq = window.matchMedia("(max-width: 900px)");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function renderModule() {
    const props = {
      onComplete: () => handleComplete(currentId),
      onXp: addXp,
    };
    switch (currentId) {
      case "intro": return <IntroModule {...props} />;
      case "http": return <HttpModule {...props} />;
      case "setup": return <SetupModule {...props} />;
      case "bdd": return <BddModule {...props} />;
      case "get": return <GetModule {...props} />;
      case "post": return <PostModule {...props} />;
      case "jsonpath":  return <JsonPathModule {...props} />;
      case "putdel":   return <PutDelModule {...props} />;
      case "specs":    return <SpecsModule {...props} />;
      case "payload":  return <PayloadModule {...props} />;
      case "schema":   return <SchemaModule {...props} />;
      case "oauth":    return <OAuthModule {...props} />;
      case "env":      return <EnvModule {...props} />;
      case "ssl":      return <SslModule {...props} />;
      case "feature":  return <FeatureModule {...props} />;
      case "tags":     return <TagsModule {...props} />;
      case "hooks":    return <HooksModule {...props} />;
      case "dynamic":  return <DynamicModule {...props} />;
      case "parallel": return <ParallelModule {...props} />;
      case "guice":    return <GuiceModule {...props} />;
      case "allure":   return <AllureModule {...props} />;
      case "logging":  return <LoggingModule {...props} />;
      case "asserts":  return <AssertsModule {...props} />;
      case "arch":     return <ArchModule {...props} />;
      case "best":     return <BestModule {...props} />;
      case "interview": return <InterviewModule {...props} />;
      default: return <div className="p-8 text-muted">Module not found.</div>;
    }
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-4 flex-wrap">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden bg-panel border border-border text-white px-3 py-1 rounded"
        >
          ☰
        </button>
        <h1 className="text-xl font-bold gradient-text">🚀 RestAssured Mastery</h1>
        <div className="flex-1 min-w-[200px]">
          <div className="h-2.5 bg-panel rounded overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-accent2"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-xs text-muted mt-1">
            {completedCount} / {TOTAL_MODULES} modules complete
          </div>
        </div>
        <button
          onClick={() => { if (confirm("Wipe all progress?")) reset(); }}
          className="bg-transparent border border-border text-white px-3 py-2 rounded-lg text-sm hover:bg-panel transition-colors"
        >
          Reset
        </button>
      </header>

      <div className="grid md:grid-cols-[300px_1fr] min-h-[calc(100vh-65px)]">
        <div
          className={`${menuOpen ? "fixed left-0 top-[65px] z-20 w-[300px]" : "hidden md:block"}`}
        >
          <Sidebar
            currentId={currentId}
            completed={state.completed}
            onSelect={(id) => {
              setCurrentId(id);
              setMenuOpen(false);
              window.scrollTo(0, 0);
            }}
          />
        </div>
        <main className="p-6 md:p-10 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentId}>{renderModule()}</motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed bottom-5 right-5 bg-panel border border-accent px-4 py-2 rounded-full font-bold shadow-lg shadow-accent/40 z-40">
        ⭐ XP: <span>{state.xp}</span>
      </div>

      <AnimatePresence>
        {levelUpText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center bg-black/85 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-accent to-accent2 px-16 py-10 rounded-2xl text-2xl font-bold shadow-2xl shadow-accent/50">
              🎉 {levelUpText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
