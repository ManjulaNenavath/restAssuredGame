"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const HAMCREST = `// Hamcrest matchers — used inside .then().body()
import static org.hamcrest.Matchers.*;

given().when().get("/users/1").then()
    .body("name",   equalTo("Leanne Graham"))
    .body("email",  containsString("@"))
    .body("id",     greaterThan(0))
    .body("id",     lessThanOrEqualTo(100))
    .body("posts",  hasSize(greaterThan(0)))
    .body("active", is(true))
    .body("phone",  notNullValue())
    .body("secret", nullValue());

// Hamcrest on lists:
.body("rows.id", hasItem("p-001"))            // list contains value
.body("rows.id", hasItems("p-001", "p-002"))  // list contains both
.body("rows.id", everyItem(notNullValue()))   // all elements match`;

const ASSERTJ = `// AssertJ — used AFTER .extract(), on plain Java values
import static org.assertj.core.api.Assertions.assertThat;

Response r = given().when().get("/users/1").then()
    .statusCode(200).extract().response();

String name  = r.path("name");
int    id    = r.path("id");
List<String> tags = r.path("tags");

// AssertJ reads like a sentence
assertThat(name).isEqualTo("Leanne Graham");
assertThat(name).startsWith("Leanne").endsWith("Graham");
assertThat(id).isPositive().isLessThanOrEqualTo(1000);
assertThat(tags).isNotEmpty().containsExactly("admin", "user");
assertThat(tags).hasSizeGreaterThan(1).doesNotContain("banned");

// Soft assertions — collect ALL failures before reporting
SoftAssertions soft = new SoftAssertions();
soft.assertThat(name).isEqualTo("Alice");   // wrong — recorded
soft.assertThat(id).isPositive();           // right — passes
soft.assertAll();    // throws ONE error listing all failures`;

const JUNIT_ASSERT = `// JUnit assertEquals — use sparingly, error messages are poor
import static org.junit.jupiter.api.Assertions.*;

assertEquals(200, r.statusCode());           // generic failure message
assertEquals("Leanne Graham", r.path("name"));

// vs AssertJ — same check, 10× better failure message:
assertThat(r.path("name")).isEqualTo("Leanne Graham");
// AssertJ output: expected: "Leanne Graham" but was: "leanne graham"
// JUnit output:   expected: <Leanne Graham> but was: <leanne graham>  ← less context`;

const WHEN_WHICH = [
  { lib: "Hamcrest", use: "Inside .then().body() — inline assertion on path", example: '.body("name", equalTo("Alice"))' },
  { lib: "AssertJ", use: "After .extract() — on Java variables with readable chain", example: 'assertThat(name).startsWith("Al")' },
  { lib: "JUnit assertEquals", use: "Simple primitive checks — acceptable but verbose on failure", example: 'assertEquals(201, r.statusCode())' },
];

const SOFT = `// Soft assertions — check EVERYTHING, report all failures at once
SoftAssertions soft = new SoftAssertions();

soft.assertThat(r.statusCode()).isEqualTo(200);
soft.assertThat(r.<String>path("name")).isEqualTo("Leanne Graham");
soft.assertThat(r.<String>path("email")).containsIgnoringCase("@");
soft.assertThat(r.<Integer>path("id")).isPositive();

soft.assertAll();   // ← throws one exception listing ALL failures
// Without soft assertions, the first failure stops checking the rest`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

const QUIZ = [
  { q: "You're asserting a field value inside .then().body() — which library?", answer: "hamcrest", opts: ["Hamcrest", "AssertJ", "JUnit assertEquals"] },
  { q: "You extracted a List<String> and want to check it contains 'admin' — which library gives the best readability?", answer: "assertj", opts: ["Hamcrest", "AssertJ", "JUnit assertEquals"] },
  { q: "You want one failure report listing ALL failed assertions (not just the first) — which feature?", answer: "soft", opts: ["Hamcrest hasItems()", "AssertJ SoftAssertions", "JUnit assertAll()"] },
];

export default function AssertsModule({ onComplete, onXp }: Props) {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  const CORRECT_IDX = [0, 1, 1];

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === CORRECT_IDX[qi]) {
      setFeedback({ kind: "ok", msg: "✅ Correct! +35 XP" });
      onXp(35);
      setTimeout(() => {
        const next = qi + 1;
        setPicked(null);
        setFeedback(null);
        if (next >= QUIZ.length) {
          if (!done) { setDone(true); onComplete(); }
        } else {
          setQi(next);
        }
      }, 1200);
    } else {
      setFeedback({ kind: "err", msg: "❌ Not the best choice for this situation." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">⚖️ Lesson 23 — AssertJ vs JUnit vs Hamcrest</h2>
      <p className="text-muted mb-6">
        Three assertion libraries, each with its place. Know which to reach for and why.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Hamcrest — inline assertions inside .body()</h3>
        <CodeEditor code={HAMCREST} language="java" height={360} />
        <p className="text-sm mt-2 text-muted">
          Hamcrest matchers live inside <code className="text-orange-300">.then().body()</code>. They run before you extract anything — the fastest failure path.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">AssertJ — fluent assertions on extracted values</h3>
        <CodeEditor code={ASSERTJ} language="java" height={440} />
        <ConsoleOutput lines={[
          "org.opentest4j.AssertionFailedError:",
          "expected: 'Alice'",
          "but was:  'Leanne Graham'",
          "at AssertsTest.getUser_returnsCorrectName(AssertsTest.java:34)",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">JUnit assertEquals — when to use</h3>
        <CodeEditor code={JUNIT_ASSERT} language="java" height={260} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          Prefer AssertJ over JUnit assertEquals. AssertJ&apos;s failure messages show expected vs actual clearly; JUnit&apos;s are more cryptic for complex objects.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">When to use which</h3>
        <div className="space-y-2">
          {WHEN_WHICH.map((w) => (
            <div key={w.lib} className="p-3 bg-panel2 rounded text-sm">
              <div className="font-bold text-accent2 mb-1">{w.lib}</div>
              <div className="text-muted text-xs mb-1">{w.use}</div>
              <code className="text-orange-300 text-xs">{w.example}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Soft assertions — check everything, fail once</h3>
        <CodeEditor code={SOFT} language="java" height={280} />
        <ConsoleOutput lines={[
          "SoftAssertionError: 2 assertion(s) failed:",
          "  1) expected: 'Alice'      but was: 'Leanne Graham'",
          "  2) expected: positive int but was: -1",
          "(Other 2 assertions passed)",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">
          🎮 Quiz — {qi + 1} of {QUIZ.length}
        </h3>
        {qi < QUIZ.length ? (
          <>
            <p className="text-sm mb-3 font-semibold">{QUIZ[qi].q}</p>
            <div className="space-y-2">
              {QUIZ[qi].opts.map((opt, i) => {
                const state = picked === i ? (i === CORRECT_IDX[qi] ? "ok" : "err") : "";
                return (
                  <motion.div
                    key={i}
                    whileHover={picked === null ? { scale: 1.01 } : {}}
                    onClick={() => pick(i)}
                    className={`p-3 rounded-lg cursor-pointer border-2 text-sm ${
                      state === "ok" ? "border-accent2 bg-accent2/10"
                      : state === "err" ? "border-red-400 bg-red-400/10"
                      : "border-transparent bg-panel hover:border-accent"
                    }`}
                  >
                    {opt}
                  </motion.div>
                );
              })}
            </div>
            <HintBox hints={[
              "Think about WHERE the assertion runs — inside .body() or after .extract().",
              "AssertJ excels on Java objects; Hamcrest excels inside the RestAssured chain.",
              "Soft assertions are an AssertJ feature — SoftAssertions class.",
            ]} />
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-3 rounded-lg font-semibold text-sm ${
                  feedback.kind === "ok" ? "bg-accent2/15 text-accent2 border border-accent2"
                  : "bg-red-400/15 text-red-400 border border-red-400"
                }`}
              >
                {feedback.msg}
              </motion.div>
            )}
          </>
        ) : (
          <p className="text-accent2 font-semibold text-lg">🏆 You know your assertion libraries — a clear differentiator in interviews.</p>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>Hamcrest: used inside <code className="text-orange-300">.body(field, matcher)</code></li>
          <li>AssertJ: used after <code className="text-orange-300">.extract()</code> on Java variables — better error messages</li>
          <li>JUnit assertEquals: acceptable for simple checks, poor messages for complex objects</li>
          <li>AssertJ <code className="text-orange-300">SoftAssertions</code>: collect all failures before reporting — use for multi-field validation</li>
          <li>The rule: Hamcrest in-chain, AssertJ post-extract</li>
        </ul>
      </Card>
    </motion.div>
  );
}
