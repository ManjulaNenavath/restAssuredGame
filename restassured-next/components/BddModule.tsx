"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";

const FULL_PATTERN = `@Test
public void getUser_shouldReturnLeanneGraham() {

    given()                                              // ── 1. GIVEN: setup
        .baseUri("https://jsonplaceholder.typicode.com")
        .header("Accept", "application/json")

    .when()                                              // ── 2. WHEN: action
        .get("/users/1")

    .then()                                              // ── 3. THEN: assert
        .statusCode(200)
        .body("name", equalTo("Leanne Graham"))
        .body("email", containsString("@"));
}`;

const LAYERED = `// ── Layer 1: ApiClient.java — the "given()" part
public RequestSpecification baseRequest(String token) {
    return given()
        .baseUri("https://api.example.com")
        .header("Authorization", "Bearer " + token)
        .contentType("application/json");
}

// ── Layer 2: UserService.java — the "when()" part
public Response getUser(int id) {
    return baseRequest(token)
        .when()
        .get("/users/" + id);
}

// ── Layer 3: UserTest.java — the "then()" part
@Test
public void getUser_returns200() {
    Response r = userService.getUser(1);
    assertThat(r.getStatusCode()).isEqualTo(200);
    assertThat(r.path("name")).isEqualTo("Leanne Graham");
}`;

type Clause = { id: string; text: string; layer: 1 | 2 | 3 };

const CLAUSES: Clause[] = [
  { id: "a", text: '.then().statusCode(200)', layer: 3 },
  { id: "b", text: 'given().header("X-Auth","abc")', layer: 1 },
  { id: "c", text: '.when().get("/users/1")', layer: 2 },
  { id: "d", text: '.body(payload).contentType(JSON)', layer: 1 },
  { id: "e", text: '.body("name", equalTo("John"))', layer: 3 },
  { id: "f", text: '.when().post("/users")', layer: 2 },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function BddModule({ onComplete, onXp }: Props) {
  const [placed, setPlaced] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function assign(clauseId: string, layer: number) {
    setPlaced((p) => ({ ...p, [clauseId]: layer }));
    setFeedback(null);
  }

  function check() {
    const allCorrect = CLAUSES.every((c) => placed[c.id] === c.layer);
    const totalPlaced = Object.keys(placed).length;
    if (totalPlaced < CLAUSES.length) {
      setFeedback({ kind: "err", msg: `❌ Place all ${CLAUSES.length} clauses first (${totalPlaced} done).` });
      return;
    }
    if (allCorrect) {
      setFeedback({ kind: "ok", msg: "✅ All 6 clauses in the right layer! +75 XP" });
      onXp(75);
      if (!done) {
        setDone(true);
        onComplete();
      }
    } else {
      const wrong = CLAUSES.filter((c) => placed[c.id] !== c.layer).length;
      setFeedback({ kind: "err", msg: `❌ ${wrong} clause${wrong > 1 ? "s are" : " is"} in the wrong layer.` });
    }
  }

  function layerOf(id: string) {
    return placed[id];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">🎭 Lesson 4 — Given / When / Then</h2>
      <p className="text-muted mb-6">The pattern that makes every RestAssured test self-documenting.</p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The three clauses, in plain English</h3>
        <ul className="text-sm space-y-2">
          <li>
            <span className="font-mono text-pink-400">given()</span> — the <b>setup</b>: base URL,
            headers, auth, body. Everything the server needs before it sees your request.
          </li>
          <li>
            <span className="font-mono text-pink-400">.when()</span> — the <b>action</b>: which HTTP
            verb and endpoint. There&apos;s exactly one verb per test.
          </li>
          <li>
            <span className="font-mono text-pink-400">.then()</span> — the <b>verification</b>: status
            code, body fields, headers, response time. As many assertions as you need.
          </li>
        </ul>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">A full annotated test</h3>
        <CodeEditor code={FULL_PATTERN} language="java" height={360} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Read this aloud:</b> &quot;<i>Given</i> a request to jsonplaceholder, <i>when</i> I GET
          /users/1, <i>then</i> the status is 200 and the name equals Leanne Graham.&quot; That&apos;s
          why we call this BDD-style — it reads like English.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Senior pattern — split across layers</h3>
        <p className="text-sm mb-3">
          Junior tests put all three clauses inline. Senior frameworks split them across <b>3 classes</b>{" "}
          so you can change auth or base URL once and have it apply everywhere:
        </p>
        <CodeEditor code={LAYERED} language="java" height={360} />
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-panel2 rounded p-2">
            <div className="text-pink-400 font-mono mb-1">given()</div>
            <div className="text-muted">ApiClient — reusable request builder</div>
          </div>
          <div className="bg-panel2 rounded p-2">
            <div className="text-pink-400 font-mono mb-1">.when()</div>
            <div className="text-muted">Service — one method per endpoint</div>
          </div>
          <div className="bg-panel2 rounded p-2">
            <div className="text-pink-400 font-mono mb-1">.then()</div>
            <div className="text-muted">Test — assertions only</div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">
          🎮 Sort each clause into the right layer
        </h3>
        <p className="text-sm mb-3">
          Click a clause, then click the column it belongs in. Click again to unset.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((layer) => {
            const labels = ["Given (setup)", "When (action)", "Then (assert)"];
            return (
              <div
                key={layer}
                className="bg-panel2 border border-border rounded-lg p-3 min-h-[120px]"
              >
                <div className="text-xs font-bold text-accent2 mb-2">{labels[layer - 1]}</div>
                {CLAUSES.filter((c) => layerOf(c.id) === layer).map((c) => (
                  <motion.div
                    layout
                    key={c.id}
                    onClick={() => assign(c.id, 0)}
                    className="text-xs font-mono bg-panel border border-border rounded px-2 py-1 mb-1 cursor-pointer hover:border-accent"
                  >
                    {c.text}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-muted mb-2">Click an unplaced clause, then click a column above:</div>
        <ClauseTray
          clauses={CLAUSES.filter((c) => !layerOf(c.id))}
          onPick={(c) => {
            // pick the first empty layer? Better: ask user. Simple UX: cycle 1→2→3
            const next = ((Math.max(...Object.values(placed).filter(Boolean), 0) % 3) + 1);
            assign(c.id, next);
          }}
        />

        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map((l) => (
            <button
              key={l}
              onClick={() => {
                // assign last unplaced clause to chosen layer
                const next = CLAUSES.find((c) => !placed[c.id]);
                if (next) assign(next.id, l);
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-panel2 border border-border hover:border-accent"
            >
              Move next clause to layer {l}
            </button>
          ))}
        </div>

        <button
          onClick={check}
          className="mt-4 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check my sort
        </button>

        <HintBox
          hints={[
            "Anything that PREPARES the request (headers, body, contentType) belongs in Given.",
            "Anything that FIRES the request (.get(), .post(), .put()) belongs in When.",
            "Anything that VERIFIES the response (.statusCode(), .body(...)) belongs in Then.",
          ]}
        />

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg font-semibold text-sm ${
              feedback.kind === "ok"
                ? "bg-accent2/15 text-accent2 border border-accent2"
                : "bg-red-400/15 text-red-400 border border-red-400"
            }`}
          >
            {feedback.msg}
          </motion.div>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>You can read a RestAssured test aloud in plain English</li>
          <li>You know what code belongs in given / when / then</li>
          <li>You understand why senior frameworks split the pattern across three classes</li>
        </ul>
      </Card>
    </motion.div>
  );
}

function ClauseTray({ clauses, onPick }: { clauses: Clause[]; onPick: (c: Clause) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {clauses.map((c) => (
        <motion.div
          key={c.id}
          layout
          whileHover={{ scale: 1.04 }}
          onClick={() => onPick(c)}
          className="font-mono text-xs bg-panel2 border-2 border-border rounded-lg px-3 py-2 cursor-pointer hover:border-accent"
        >
          {c.text}
        </motion.div>
      ))}
      {clauses.length === 0 && <span className="text-muted text-xs italic">All placed — check your answer.</span>}
    </div>
  );
}
