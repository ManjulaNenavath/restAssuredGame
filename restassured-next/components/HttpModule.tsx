"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";

const GET_CODE = `// GET — fetch a resource (no body)
given()
    .baseUri("https://reqres.in/api")
.when()
    .get("/users/2")
.then()
    .statusCode(200)
    .body("data.email", equalTo("janet.weaver@reqres.in"));`;

const POST_CODE = `// POST — create a new resource
given()
    .contentType(ContentType.JSON)
    .body("{ \\"name\\": \\"John\\", \\"job\\": \\"QA Lead\\" }")
.when()
    .post("/users")
.then()
    .statusCode(201)
    .body("name", equalTo("John"))
    .body("id", notNullValue());`;

const PUT_CODE = `// PUT — replace the resource entirely (full payload required)
given()
    .contentType(ContentType.JSON)
    .body("{ \\"name\\": \\"Jane\\", \\"job\\": \\"Architect\\" }")
.when()
    .put("/users/2")
.then()
    .statusCode(200);`;

const PATCH_CODE = `// PATCH — update part of the resource
given()
    .contentType(ContentType.JSON)
    .body("{ \\"job\\": \\"Senior QA\\" }")  // only the changed field
.when()
    .patch("/users/2")
.then()
    .statusCode(200);`;

const DELETE_CODE = `// DELETE — remove a resource
given()
    .header("Authorization", "Bearer " + token)
.when()
    .delete("/users/2")
.then()
    .statusCode(204);  // 204 = success, no body`;

const STATUS_CODES = [
  { code: "200", label: "OK", desc: "GET, PUT, PATCH succeeded — body returned", color: "text-emerald-400" },
  { code: "201", label: "Created", desc: "POST succeeded — new resource was created", color: "text-emerald-400" },
  { code: "204", label: "No Content", desc: "DELETE succeeded — nothing to return", color: "text-emerald-400" },
  { code: "400", label: "Bad Request", desc: "Client sent malformed payload or missing required fields", color: "text-amber-400" },
  { code: "401", label: "Unauthorized", desc: "Missing or invalid auth token", color: "text-amber-400" },
  { code: "403", label: "Forbidden", desc: "Token valid, but user lacks permission for this resource", color: "text-amber-400" },
  { code: "404", label: "Not Found", desc: "Endpoint or resource doesn't exist", color: "text-amber-400" },
  { code: "429", label: "Too Many Requests", desc: "Rate limit exceeded", color: "text-amber-400" },
  { code: "500", label: "Server Error", desc: "Backend bug — your test caught a real issue", color: "text-red-400" },
];

type Verb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHODS: { v: Verb; purpose: string; idem: string; body: string; code: string; expected: number }[] = [
  { v: "GET", purpose: "Read", idem: "Yes", body: "No", code: GET_CODE, expected: 200 },
  { v: "POST", purpose: "Create", idem: "No", body: "Yes", code: POST_CODE, expected: 201 },
  { v: "PUT", purpose: "Replace fully", idem: "Yes", body: "Yes", code: PUT_CODE, expected: 200 },
  { v: "PATCH", purpose: "Update partially", idem: "No", body: "Yes", code: PATCH_CODE, expected: 200 },
  { v: "DELETE", purpose: "Remove", idem: "Yes", body: "Usually no", code: DELETE_CODE, expected: 204 },
];

// Match-the-method game scenarios
const SCENARIOS = [
  { desc: "You want to fetch a user's profile to display on a page.", correct: "GET" as Verb },
  { desc: "A signup form was submitted — create the user in the database.", correct: "POST" as Verb },
  { desc: "The user changed their entire address — replace the whole address record.", correct: "PUT" as Verb },
  { desc: "The user changed only their phone number — leave everything else as-is.", correct: "PATCH" as Verb },
  { desc: "The user clicked 'Delete account'.", correct: "DELETE" as Verb },
  { desc: "You're checking which products are in stock.", correct: "GET" as Verb },
  { desc: "Admin needs to flip a single feature flag from off to on.", correct: "PATCH" as Verb },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function HttpModule({ onComplete, onXp }: Props) {
  const [selectedVerb, setSelectedVerb] = useState<Verb>("GET");
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  function pickVerbForScenario(v: Verb) {
    if (round >= SCENARIOS.length) return;
    const r = SCENARIOS[round];
    if (v === r.correct) {
      onXp(30);
      setFeedback({ kind: "ok", msg: `✅ Right — ${v} is the correct verb. +30 XP` });
      setTimeout(() => {
        const next = round + 1;
        setRound(next);
        setFeedback(null);
        if (next >= SCENARIOS.length) onComplete();
      }, 900);
    } else {
      setFeedback({
        kind: "err",
        msg: `❌ Not quite — the correct verb is ${r.correct}. Try the next one.`,
      });
      setTimeout(() => {
        const next = round + 1;
        setRound(next);
        setFeedback(null);
        if (next >= SCENARIOS.length) onComplete();
      }, 1500);
    }
  }

  const active = METHODS.find((m) => m.v === selectedVerb)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">🌐 Lesson 2 — HTTP Methods in RestAssured</h2>
      <p className="text-muted mb-6">
        Every test you write maps to one of five HTTP methods. Here&apos;s how each looks in RestAssured.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The five methods at a glance</h3>
        <p className="text-sm mb-3 leading-relaxed">
          Click a method to see how it looks in RestAssured code. The pattern is always the same — only
          the verb after <code className="text-orange-300">.when()</code> changes.
        </p>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5 mb-4">
          {METHODS.map((m) => (
            <motion.button
              key={m.v}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedVerb(m.v)}
              className={`py-3 px-4 rounded-lg font-mono font-bold border-2 transition-all ${
                selectedVerb === m.v
                  ? "border-accent2 bg-accent2/10 text-accent2"
                  : "border-border bg-panel2 text-muted hover:border-accent"
              }`}
            >
              {m.v}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedVerb}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div className="bg-panel2 rounded p-3">
                <div className="text-xs text-muted">Purpose</div>
                <div className="font-semibold">{active.purpose}</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-xs text-muted">Idempotent?</div>
                <div className="font-semibold">{active.idem}</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-xs text-muted">Sends a body?</div>
                <div className="font-semibold">{active.body}</div>
              </div>
            </div>
            <CodeEditor code={active.code} language="java" height={240} />
            <p className="text-sm mt-3 text-muted">
              Typical success status: <code className="text-emerald-400">{active.expected}</code>
            </p>
          </motion.div>
        </AnimatePresence>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">What &quot;idempotent&quot; means (interview question)</h3>
        <p className="text-sm leading-relaxed">
          An idempotent method gives the <b>same result no matter how many times you call it</b>.
        </p>
        <ul className="text-sm space-y-2 mt-3">
          <li>
            <code className="text-orange-300">GET /users/2</code> — call it 100 times, the database doesn&apos;t change. <b className="text-emerald-400">Idempotent</b>.
          </li>
          <li>
            <code className="text-orange-300">DELETE /users/2</code> — once deleted, deleting again is a no-op. <b className="text-emerald-400">Idempotent</b>.
          </li>
          <li>
            <code className="text-orange-300">POST /users</code> — call it twice, you get two users.{" "}
            <b className="text-red-400">NOT idempotent</b>.
          </li>
          <li>
            <code className="text-orange-300">PATCH</code> — depends on the operation (e.g. &quot;increment counter by 1&quot; is not idempotent).
          </li>
        </ul>
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Why testers care:</b> idempotent operations are safe to retry on flaky networks. Your test
          framework can re-run them without polluting state.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Status codes you&apos;ll assert on</h3>
        <p className="text-sm mb-3">
          Every <code className="text-orange-300">.then()</code> block starts with a status code
          assertion. Memorize these — they&apos;re the most common assertions in any API test suite.
        </p>
        <div className="grid gap-2 md:grid-cols-3 sm:grid-cols-2">
          {STATUS_CODES.map((s) => (
            <motion.div
              key={s.code}
              whileHover={{ scale: 1.02 }}
              className="bg-panel2 border border-border rounded-lg p-3"
            >
              <div className={`font-mono font-bold text-xl ${s.color}`}>{s.code}</div>
              <div className="text-xs font-semibold mb-1">{s.label}</div>
              <div className="text-xs text-muted">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Match the verb to the action</h3>
        {round < SCENARIOS.length ? (
          <>
            <p className="mb-3 text-sm">
              <b>Scenario {round + 1}/{SCENARIOS.length}:</b> {SCENARIOS[round].desc}
            </p>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-5 mb-3">
              {METHODS.map((m) => (
                <motion.button
                  key={m.v}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!!feedback}
                  onClick={() => pickVerbForScenario(m.v)}
                  className="font-mono font-bold py-3 rounded-lg bg-panel border-2 border-border hover:border-accent transition-colors disabled:opacity-50"
                >
                  {m.v}
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-3 rounded-lg font-semibold ${
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
          <p className="text-accent2 font-semibold">🏆 Lesson complete — you can pick the right verb for any scenario.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>You know the five HTTP methods and what each is used for</li>
          <li>You can write a RestAssured call for each verb</li>
          <li>You know which methods are idempotent and why testers care</li>
          <li>You can pick the right verb for a given scenario</li>
        </ul>
        <p className="text-sm mt-3 text-muted">
          Next lesson: Setup & Dependencies — wiring up a real Maven project from scratch.
        </p>
      </Card>
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
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
