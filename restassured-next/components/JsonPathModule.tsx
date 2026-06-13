"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const SAMPLE = `// Imagine this is the response body:
{
  "count": 5,
  "rows": [
    { "id": "p-001", "type": "PRODUCT", "active": true },
    { "id": "p-002", "type": "ORDER",   "active": true },
    { "id": "p-003", "type": "PRODUCT", "active": false }
  ],
  "owner": { "name": "Alice", "email": "alice@example.com" }
}`;

const PATTERNS = `// Inline assertions inside then()
.body("count", equalTo(5))                    // top-level
.body("rows[0].id", equalTo("p-001"))         // first array element
.body("rows[2].active", equalTo(false))       // third array element
.body("rows.id", hasItem("p-002"))            // list contains
.body("owner.email", containsString("@"))     // nested object

// Extract into variables
int count       = response.path("count");
String firstId  = response.path("rows[0].id");
List<String> allIds = response.path("rows.id");
String ownerName = response.path("owner.name");

// Print them
System.out.println("Total: " + count);
System.out.println("First id: " + firstId);
System.out.println("All ids: " + allIds);`;

const GOTCHAS = `// 🚨 Gotcha A: root is an array
// Response: [{"id":1}, {"id":2}]

// WRONG — NullPointerException
String id = response.path("id");

// CORRECT — use "[0].field" or "$" for the whole list
int firstId = response.path("[0].id");
List<Integer> ids = response.path("id");   // gets all 'id' values

// 🚨 Gotcha B: Integer vs Long
// JSON number 1 might parse as Long in some cases
.body("id", equalTo(1))      // might fail with type mismatch
.body("id", equalTo(1L))     // safer for ids from databases`;

const CHALLENGES = [
  {
    hint: "Get the value of the top-level field 'count'",
    answer: "count",
    why: "Top-level fields are just their name — no prefix.",
    hints: ["No special prefix needed.", "It's just the field name.", 'The answer is "count".'],
  },
  {
    hint: "Get the id of the FIRST row",
    answer: "rows[0].id",
    why: "Arrays use [index] starting from 0; dot to walk into the object.",
    hints: ["Arrays use [0], [1], etc.", "Walk into the array, then dot into the field.", 'Answer: rows[0].id'],
  },
  {
    hint: "Get the email of the owner (nested object)",
    answer: "owner.email",
    why: "Dot navigates into nested objects.",
    hints: ["Walk into 'owner' first.", "Use a dot to walk into nested fields.", 'Answer: owner.email'],
  },
  {
    hint: "Get the LIST of all row ids ([p-001, p-002, p-003])",
    answer: "rows.id",
    why: "Reading a field on an array path collects that field from every element.",
    hints: ["You don't need an index — you want ALL of them.", "RestAssured's GPath collects from arrays automatically.", 'Answer: rows.id'],
  },
  {
    hint: "Get the COUNT of rows (a number)",
    answer: "rows.size()",
    why: "Groovy collection method works in GPath.",
    hints: ["Groovy collection methods work here.", "There's a method that returns the length of any list.", 'Answer: rows.size()'],
  },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function JsonPathModule({ onComplete, onXp }: Props) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [streak, setStreak] = useState(0);

  function check() {
    const a = input.trim().replace(/['"`]/g, "");
    const c = CHALLENGES[idx];
    if (a === c.answer) {
      setFeedback({ kind: "ok", msg: `✅ Right — ${c.why} +40 XP` });
      onXp(40);
      setStreak((s) => s + 1);
      setTimeout(() => {
        const next = idx + 1;
        setFeedback(null);
        setInput("");
        if (next >= CHALLENGES.length) {
          onComplete();
        } else {
          setIdx(next);
        }
      }, 1200);
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite — try the hint." });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">🎯 Lesson 9 — JsonPath Mastery</h2>
      <p className="text-muted mb-6">
        Extract any field from any response — the #1 skill seniors test you on.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Sample response</h3>
        <CodeEditor code={SAMPLE} language="json" height={260} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">All the patterns you&apos;ll use 95% of the time</h3>
        <CodeEditor code={PATTERNS} language="java" height={420} />
        <ConsoleOutput
          lines={[
            "Total: 5",
            "First id: p-001",
            "All ids: [p-001, p-002, p-003]",
            "Owner name: Alice",
          ]}
        />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">⚠️ Two gotchas that bite everyone</h3>
        <CodeEditor code={GOTCHAS} language="java" height={300} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">
          🎮 JsonPath Challenge — {idx + 1} of {CHALLENGES.length} (streak: {streak})
        </h3>
        {idx < CHALLENGES.length ? (
          <>
            <p className="text-sm mb-3">
              <b>Task:</b> {CHALLENGES[idx].hint}
            </p>
            <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
              <span className="text-blue-400">var</span>
              <span>x = response.path(</span>
              <span className="text-amber-400">&quot;</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="..."
                onKeyDown={(e) => e.key === "Enter" && check()}
                className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 flex-1 text-amber-300"
              />
              <span className="text-amber-400">&quot;</span>
              <span>);</span>
            </div>
            <button
              onClick={check}
              className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
            >
              Check
            </button>
            <HintBox key={idx} hints={CHALLENGES[idx].hints} />
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 p-3 rounded-lg font-semibold text-sm ${
                    feedback.kind === "ok"
                      ? "bg-accent2/15 text-accent2 border border-accent2"
                      : "bg-red-400/15 text-red-400 border border-red-400"
                  }`}
                >
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <p className="text-accent2 font-semibold text-lg">🏆 All challenges complete — you can read any JSON like a senior.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>You can extract top-level, nested, and array fields with <code className="text-orange-300">.path()</code></li>
          <li>You know how to collect a field across all array elements (<code className="text-orange-300">rows.id</code>)</li>
          <li>You can count with <code className="text-orange-300">.size()</code></li>
          <li>You know the array-root and Integer/Long gotchas</li>
        </ul>
      </Card>
    </motion.div>
  );
}
