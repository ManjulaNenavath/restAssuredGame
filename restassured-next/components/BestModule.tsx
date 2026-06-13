"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import ConsoleOutput from "./ConsoleOutput";

const DO_DONT = [
  {
    category: "Test structure",
    good: "One test = one behavior. Test name says WHAT should happen: createOrder_withValidPayload_returns201",
    bad: "One test checking 10 different things. Test name: testOrder()",
  },
  {
    category: "Data",
    good: "Random data via DataFaker. Each test creates and cleans up its own data.",
    bad: "Hardcoded IDs like /users/42 — breaks if that record is deleted.",
  },
  {
    category: "Base URL",
    good: "System.getProperty(\"api.base\") — switch env with -D flag",
    bad: "Hardcoded 'http://localhost:8080' — breaks in CI",
  },
  {
    category: "Auth",
    good: "Fetch token in @BeforeAll, store in RequestSpecification",
    bad: "Call the token endpoint in every single test",
  },
  {
    category: "Assertions",
    good: ".log().ifValidationFails() — log only on failure",
    bad: ".log().all() in every test — megabytes of noise in CI",
  },
  {
    category: "Cleanup",
    good: "@AfterEach deletes anything the test created",
    bad: "Leaving test data — causes 'user already exists' failures next run",
  },
];

const NAMING = `// ── Test naming convention: methodName_condition_expectedResult ──

// ✅ Good
createOrder_withValidPayload_returns201()
createOrder_withMissingProductId_returns400()
getUser_withInvalidId_returns404()
updateUser_whenUnauthorized_returns401()

// ❌ Bad
testCreateOrder()
orderTest1()
testHappyPath()

// ── Why naming matters ──
// When CI fails you see: "createOrder_withMissingProductId_returns400 FAILED"
// You immediately know: what the test does AND what the expected behavior is.
// Good naming = self-documenting failures.`;

const ASSERT_STYLE = `// ── Assert the MINIMUM needed to prove the behavior ──

// ❌ Over-asserting — testing implementation, not behavior
.body("id",        equalTo(101))          // fragile — id changes
.body("createdAt", equalTo("2024-01-15")) // fragile — time-dependent
.body("name",      equalTo("Alice"))       // fine if it's your input

// ✅ Assert behavior
.body("id",        notNullValue())        // id was assigned (we don't care which)
.body("status",    equalTo("PENDING"))    // business state is correct
.body("total",     greaterThan(0.0f))     // total was calculated

// Rule: if the assertion could break due to data or time, it's too specific.`;

const WAIT_CODE = `// Async APIs — polling with Awaitility (never Thread.sleep)
// pom.xml: org.awaitility:awaitility:4.2.1

import static org.awaitility.Awaitility.*;

// Wait up to 10s for order to move to CONFIRMED
await().atMost(10, SECONDS).until(() -> {
    String status = given(authSpec)
        .when().get("/orders/" + orderId)
        .then().statusCode(200)
        .extract().path("status");
    return "CONFIRMED".equals(status);
});

// ✅ Awaitility polls every 100ms — much better than:
// Thread.sleep(5000);  ← wastes time, makes tests slow`;

const TIPS = [
  "Keep tests isolated — a test should not depend on another test's output",
  "Use @BeforeAll for expensive setup (auth, schema init) — @BeforeEach for fast per-test setup",
  "Validate both happy path AND error cases — 200, 400, 401, 404, 500",
  "Test boundary values — empty list, zero, negative, max-length string",
  "Run schema validation before field assertions — catches structural regressions early",
  "Add a response time assertion to every critical endpoint test",
  "Use @Tag or @Severity to mark which tests are critical for the release gate",
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function BestModule({ onComplete, onXp }: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  function toggle(i: number) {
    setChecked((c) => {
      const next = { ...c, [i]: !c[i] };
      const allDone = TIPS.every((_, idx) => next[idx]);
      if (allDone && !done) {
        setDone(true);
        onXp(80);
        onComplete();
      }
      return next;
    });
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">👨‍🏫 Lesson 25 — Senior Best Practices</h2>
      <p className="text-muted mb-6">
        The habits that separate senior test engineers from the rest. One list you should be able to recite in any interview.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Do vs Don&apos;t — the essentials</h3>
        <div className="space-y-3">
          {DO_DONT.map((d) => (
            <div key={d.category} className="grid grid-cols-[100px_1fr_1fr] gap-2 items-start text-xs p-2 bg-panel2 rounded">
              <div className="font-bold text-accent2">{d.category}</div>
              <div className="text-emerald-400/80">✅ {d.good}</div>
              <div className="text-red-400/80">❌ {d.bad}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Test naming convention</h3>
        <CodeEditor code={NAMING} language="java" height={340} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Assert the minimum — no over-asserting</h3>
        <CodeEditor code={ASSERT_STYLE} language="java" height={320} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Fragile tests</b> fail for reasons unrelated to the actual bug. They create noise and teach teams to ignore test failures. Test behavior, not implementation.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Handle async APIs with Awaitility</h3>
        <CodeEditor code={WAIT_CODE} language="java" height={320} />
        <ConsoleOutput lines={[
          "Awaiting order CONFIRMED status ...",
          "  poll 1 (100ms) → PENDING",
          "  poll 2 (200ms) → PENDING",
          "  poll 8 (800ms) → CONFIRMED ✓",
          "Order confirmed in 800ms — test PASSED",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">
          🎮 Senior checklist — tick each one ({checkedCount}/{TIPS.length})
        </h3>
        <p className="text-xs text-muted mb-3">Click each rule to acknowledge it. Complete all 7 to finish the lesson.</p>
        <div className="space-y-2">
          {TIPS.map((tip, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.005 }}
              onClick={() => toggle(i)}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border-2 text-sm transition-colors ${
                checked[i]
                  ? "border-accent2 bg-accent2/10 text-accent2"
                  : "border-border bg-panel hover:border-accent text-muted"
              }`}
            >
              <span className="text-lg leading-none">{checked[i] ? "✅" : "⬜"}</span>
              <span>{tip}</span>
            </motion.div>
          ))}
        </div>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-gradient-to-r from-accent/20 to-accent2/20 border border-accent2 rounded-xl text-center"
          >
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-accent2">Senior mindset unlocked — +80 XP</div>
          </motion.div>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>Test naming: <code className="text-orange-300">method_condition_expectedResult</code></li>
          <li>Assert behavior, not implementation — avoid fragile time/id assertions</li>
          <li>Dynamic test data + cleanup = no flaky parallel failures</li>
          <li>Use Awaitility for async polling — never Thread.sleep</li>
          <li>Log on failure only, not always</li>
        </ul>
      </Card>
    </motion.div>
  );
}
