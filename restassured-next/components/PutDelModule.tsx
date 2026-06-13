"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const PUT_CODE = `// PUT — replace the entire resource
Map<String, Object> updatedUser = new HashMap<>();
updatedUser.put("id", 1);
updatedUser.put("name", "Alice Updated");
updatedUser.put("email", "alice@example.com");
updatedUser.put("role", "ADMIN");   // ALL fields required

given()
    .contentType("application/json")
    .body(updatedUser)
.when()
    .put("https://jsonplaceholder.typicode.com/users/1")
.then()
    .statusCode(200)
    .body("name", equalTo("Alice Updated"));

// ⚠️ Fields you omit in PUT are DELETED on the server.`;

const PATCH_CODE = `// PATCH — update only the fields you send
Map<String, Object> patch = new HashMap<>();
patch.put("email", "newemail@example.com");   // only email changes

given()
    .contentType("application/json")
    .body(patch)
.when()
    .patch("https://jsonplaceholder.typicode.com/users/1")
.then()
    .statusCode(200)
    .body("email", equalTo("newemail@example.com"))
    .body("name", notNullValue());   // name still there — PATCH is safe`;

const DELETE_CODE = `// DELETE — remove the resource
given()
.when()
    .delete("https://jsonplaceholder.typicode.com/posts/1")
.then()
    .statusCode(200);   // some APIs return 204 No Content

// After delete: GET the same ID should return 404
given()
.when()
    .get("https://jsonplaceholder.typicode.com/posts/1")
.then()
    .statusCode(404);   // confirm it is gone`;

const IDEMPOTENCY = `// All three are idempotent — calling them N times = same result
// PUT /users/1 with same body → always same state
// DELETE /users/1 → 200 first time, 404 after, but the resource is gone either way

// POST is NOT idempotent — creates a NEW resource each call:
// POST /users → user 101, POST /users again → user 102  ← two records!`;

const CHAIN_CODE = `// Full CRUD chain — create, read, update, delete
@Test
public void fullCrudChain() {
    // 1. CREATE
    Map<String, Object> body = new HashMap<>();
    body.put("title", "Test Post");
    body.put("userId", 1);

    int newId = given()
        .contentType("application/json").body(body)
        .when().post("/posts")
        .then().statusCode(201)
        .extract().path("id");

    System.out.println("Created id: " + newId);

    // 2. READ
    given().when().get("/posts/" + newId)
        .then().statusCode(200).body("title", equalTo("Test Post"));

    // 3. UPDATE
    body.put("title", "Updated Title");
    given().contentType("application/json").body(body)
        .when().put("/posts/" + newId)
        .then().statusCode(200).body("title", equalTo("Updated Title"));

    // 4. DELETE
    given().when().delete("/posts/" + newId).then().statusCode(200);
}`;

const QUIZ = [
  {
    q: "You want to change ONLY a user's email — which method?",
    options: ["PUT", "PATCH", "DELETE"],
    correct: 1,
    why: "PATCH sends only the fields you want to change. PUT would wipe all other fields.",
  },
  {
    q: "You're replacing a product record entirely with a new version — which method?",
    options: ["POST", "PUT", "PATCH"],
    correct: 1,
    why: "PUT replaces the entire resource. All fields must be included.",
  },
  {
    q: "POST /orders is called 3 times with the same payload. How many orders are created?",
    options: ["1 (idempotent)", "3 (not idempotent)", "0 (it fails)"],
    correct: 1,
    why: "POST is NOT idempotent — each call creates a new resource.",
  },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function PutDelModule({ onComplete, onXp }: Props) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    const q = QUIZ[qi];
    if (idx === q.correct) {
      setFeedback({ kind: "ok", msg: `✅ Correct — ${q.why} +30 XP` });
      onXp(30);
      setTimeout(() => {
        const next = qi + 1;
        setPicked(null);
        setFeedback(null);
        if (next >= QUIZ.length) {
          if (!done) { setDone(true); onComplete(); }
        } else {
          setQi(next);
        }
      }, 1300);
    } else {
      setFeedback({ kind: "err", msg: `❌ Not quite — ${q.why}` });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🔄 Lesson 7 — PUT, PATCH &amp; DELETE</h2>
      <p className="text-muted mb-6">The write methods — know when to use each and you will never corrupt a resource again.</p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">PUT — full replacement</h3>
        <CodeEditor code={PUT_CODE} language="java" height={300} />
        <div className="mt-3 p-3 rounded bg-red-400/10 border-l-4 border-red-400 text-sm">
          <b>PUT rule:</b> you must send ALL fields, not just the ones you changed. Missing fields are set to null or deleted on the server.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">PATCH — partial update (safer)</h3>
        <CodeEditor code={PATCH_CODE} language="java" height={280} />
        <p className="text-sm mt-2 text-muted">
          PATCH is what most modern APIs prefer for updates — send only what changed.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">DELETE — remove a resource</h3>
        <CodeEditor code={DELETE_CODE} language="java" height={280} />
        <ConsoleOutput lines={[
          "> DELETE /posts/1 → 200 OK",
          "> GET /posts/1   → 404 Not Found",
          "Resource successfully deleted and confirmed gone.",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Idempotency — the concept that trips up juniors</h3>
        <CodeEditor code={IDEMPOTENCY} language="java" height={220} />
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded p-3">
            <div className="font-bold text-emerald-400 mb-1">Idempotent (safe to retry)</div>
            <div className="space-y-1 text-muted">
              <div>GET — always reads, never changes</div>
              <div>PUT — sets to same state each time</div>
              <div>DELETE — resource is gone after 1st call</div>
              <div>PATCH — depends on implementation</div>
            </div>
          </div>
          <div className="bg-red-400/10 border border-red-400/30 rounded p-3">
            <div className="font-bold text-red-400 mb-1">Not idempotent (danger on retry)</div>
            <div className="space-y-1 text-muted">
              <div>POST — creates a NEW resource each call</div>
              <div>Retry on timeout = duplicate records</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Senior pattern — full CRUD chain test</h3>
        <CodeEditor code={CHAIN_CODE} language="java" height={380} />
        <ConsoleOutput lines={[
          "> Running fullCrudChain ...",
          "Created id: 101",
          "[INFO] Tests run: 1, Failures: 0 — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">
          🎮 Quick Quiz — {qi + 1} of {QUIZ.length}
        </h3>
        {qi < QUIZ.length ? (
          <>
            <p className="text-sm mb-3 font-semibold">{QUIZ[qi].q}</p>
            <div className="space-y-2">
              {QUIZ[qi].options.map((opt, i) => {
                const state = picked === i ? (i === QUIZ[qi].correct ? "ok" : "err") : "";
                return (
                  <motion.div
                    key={i}
                    whileHover={picked === null ? { scale: 1.01 } : {}}
                    onClick={() => pick(i)}
                    className={`p-3 rounded-lg cursor-pointer border-2 text-sm font-mono ${
                      state === "ok" ? "border-accent2 bg-accent2/10" :
                      state === "err" ? "border-red-400 bg-red-400/10" :
                      "border-transparent bg-panel hover:border-accent"
                    }`}
                  >
                    {opt}
                  </motion.div>
                );
              })}
            </div>
            <HintBox hints={[
              "Think about whether you want to change one field or all fields.",
              "PUT = full replace, PATCH = partial update, DELETE = remove.",
              "POST creates; GET reads; PUT/PATCH update; DELETE removes.",
            ]} />
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`mt-3 p-3 rounded-lg font-semibold text-sm ${
                    feedback.kind === "ok" ? "bg-accent2/15 text-accent2 border border-accent2"
                    : "bg-red-400/15 text-red-400 border border-red-400"
                  }`}
                >
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <p className="text-accent2 font-semibold text-lg">🏆 All questions correct — you know your HTTP verbs cold.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>PUT replaces the whole resource — always send all fields</li>
          <li>PATCH updates only sent fields — safer for partial changes</li>
          <li>DELETE removes; verify with a follow-up GET → 404</li>
          <li>POST is the only common verb that is NOT idempotent</li>
          <li>You can chain CREATE → READ → UPDATE → DELETE in one test</li>
        </ul>
      </Card>
    </motion.div>
  );
}
