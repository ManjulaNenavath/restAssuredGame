"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Card from "./Card";
import HintBox from "./HintBox";

type QA = {
  q: string;
  a: string;
  level: "junior" | "mid" | "senior";
  hint: string;
};

const QAS: QA[] = [
  {
    q: "What is RestAssured? Why use it over plain HttpClient?",
    a: "RestAssured is a Java DSL for testing REST APIs. It adds fluent given/when/then syntax, built-in matchers (Hamcrest), automatic JSON/XML serialization, schema validation, logging, and auth helpers on top of HttpClient. Writing the equivalent test in plain HttpClient takes 10× the code.",
    level: "junior",
    hint: "Focus on the DSL aspect and what it removes — the boilerplate of HttpClient.",
  },
  {
    q: "What is the difference between PUT and PATCH?",
    a: "PUT replaces the entire resource — you must send ALL fields or they get wiped. PATCH sends only the changed fields — existing fields stay. Use PATCH when you want a partial update. Most REST APIs prefer PATCH for updates.",
    level: "junior",
    hint: "Full replacement vs partial update.",
  },
  {
    q: "What are the three imports every RestAssured test needs?",
    a: "import static io.restassured.RestAssured.*; (for given/when/then) | import static org.hamcrest.Matchers.*; (for equalTo, containsString, etc.) | import static io.restassured.module.jsv.JsonSchemaValidator.*; (for matchesJsonSchema — optional but common)",
    level: "junior",
    hint: "The core DSL, the matchers, and the schema validator.",
  },
  {
    q: "How do you reuse headers across all tests without copy-pasting?",
    a: "Create a RequestSpecification using RequestSpecBuilder — set base URI, headers, auth, logging. Pass it to given(spec). Store it as a static field initialized in @BeforeAll. All tests automatically inherit the common setup.",
    level: "mid",
    hint: "RequestSpecBuilder + @BeforeAll.",
  },
  {
    q: "How do you make tests run in parallel safely?",
    a: "Avoid static mutable state. Use ThreadLocal<T> for any value shared across step classes (last response, user data). Always call ThreadLocal.remove() in @After. Use unique random test data (DataFaker/UUID) so tests don't collide. Configure parallelism via junit-platform.properties or Courgette.",
    level: "mid",
    hint: "ThreadLocal + random data + cleanup.",
  },
  {
    q: "What is schema validation and when would you use it?",
    a: "matchesJsonSchema() validates the entire response structure against a JSON schema file — required fields, data types, formats. Use it when you need to catch structural regressions (missing fields, type changes) that field-level assertions might miss.",
    level: "mid",
    hint: "Structure validation, not just value validation.",
  },
  {
    q: "What is the difference between @Before (Cucumber) and @BeforeAll (JUnit)?",
    a: "@Before runs before EACH Cucumber scenario — use for per-scenario setup like resetting state or seeding data. @BeforeAll runs ONCE per JUnit test class — use for expensive setup like fetching an auth token or building a RequestSpecification.",
    level: "mid",
    hint: "Per-scenario vs once per class.",
  },
  {
    q: "How do you test an OAuth2-protected API?",
    a: "POST to the token endpoint with Content-Type: application/x-www-form-urlencoded and the grant params (grant_type, client_id, client_secret). Extract the access_token from the response. Store it in a RequestSpecification with Authorization: Bearer <token>. Fetch once in @BeforeAll.",
    level: "mid",
    hint: "form-encoded POST → extract access_token → inject into spec.",
  },
  {
    q: "What is the role of @ScenarioScoped in a Guice DI setup?",
    a: "@ScenarioScoped tells Guice to create exactly one instance of a class per Cucumber scenario, shared across all step definition classes. It replaces ThreadLocal for sharing state (last response, test data) between step classes. Guice automatically destroys the instance after each scenario.",
    level: "senior",
    hint: "One instance per scenario, shared across step classes, auto-cleaned.",
  },
  {
    q: "How would you handle a flaky test that fails ~10% of the time due to network latency?",
    a: "First, use Awaitility to poll asynchronous state instead of sleeping. Second, add response time assertions to catch slowdowns. Third, configure Courgette's rerunFailedScenarios to retry once automatically. Fourth, log the failure with Allure attachments so you can see exactly what was slow.",
    level: "senior",
    hint: "Awaitility + retry + structured logging.",
  },
  {
    q: "Explain the 3-layer test framework architecture.",
    a: "Layer 1 — API layer: classes like UserApi.java that hold HTTP calls (given/when/extract). No assertions. Layer 2 — Model layer: POJOs for request/response serialization. Layer 3 — Test/Step layer: JUnit tests or Cucumber step definitions that call the API layer and assert. This separation means you can change the base URL, auth, or serializer in one place.",
    level: "senior",
    hint: "API (HTTP) → Model (POJOs) → Test (assertions). Separation of concerns.",
  },
  {
    q: "How do you test error scenarios? What status codes should you cover?",
    a: "At minimum: 200 (happy path), 201 (creation), 204 (no content), 400 (bad request — missing/invalid field), 401 (unauthorized — no token), 403 (forbidden — wrong role), 404 (not found — bad ID), 409 (conflict — duplicate), 500 (server error — test the error response structure). Use @Tag to mark critical-path scenarios.",
    level: "senior",
    hint: "Don't just test 200. Test auth failures, validation failures, and not-found cases.",
  },
];

const LEVEL_COLORS = {
  junior: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  mid: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  senior: "text-accent border-accent/30 bg-accent/10",
};

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function InterviewModule({ onComplete, onXp }: Props) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  function reveal(i: number) {
    if (revealed[i]) return;
    setRevealed((r) => {
      const next = { ...r, [i]: true };
      onXp(20);
      const allRevealed = QAS.every((_, idx) => next[idx]);
      if (allRevealed && !done) {
        setDone(true);
        onComplete();
      }
      return next;
    });
  }

  const revealedCount = Object.values(revealed).filter(Boolean).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">👑 Lesson 26 — Interview Boss Battle</h2>
      <p className="text-muted mb-6">
        12 real interview questions from junior to senior. Read the question, form your answer, then reveal to compare. {revealedCount}/{QAS.length} revealed.
      </p>

      <div className="mb-6 h-2 bg-panel rounded overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent2"
          animate={{ width: `${(revealedCount / QAS.length) * 100}%` }}
        />
      </div>

      {["junior", "mid", "senior"].map((level) => (
        <div key={level} className="mb-6">
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${
            level === "junior" ? "text-emerald-400" : level === "mid" ? "text-amber-400" : "text-accent"
          }`}>
            {level === "junior" ? "🟢 Junior Level" : level === "mid" ? "🟡 Mid Level" : "🔴 Senior Level"}
          </h3>

          <div className="space-y-4">
            {QAS.filter((q) => q.level === level).map((qa, i) => {
              const gi = QAS.indexOf(qa);
              const isOpen = revealed[gi];
              return (
                <Card key={gi}>
                  <div className={`inline-block text-xs font-bold px-2 py-0.5 rounded border mb-2 ${LEVEL_COLORS[qa.level]}`}>
                    {qa.level}
                  </div>
                  <p className="font-semibold text-sm mb-3">{qa.q}</p>

                  {!isOpen ? (
                    <>
                      <HintBox hints={[qa.hint]} />
                      <button
                        onClick={() => reveal(gi)}
                        className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
                      >
                        Reveal model answer (+20 XP)
                      </button>
                    </>
                  ) : (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-panel2 rounded-lg border border-accent2/30 text-sm leading-relaxed"
                      >
                        <div className="text-accent2 font-bold text-xs mb-2">Model Answer:</div>
                        <p className="text-slate-300 whitespace-pre-wrap">{qa.a}</p>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {done && (
        <Card>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-2xl font-bold gradient-text mb-2">Mastery Achieved</h3>
            <p className="text-muted mb-4">
              You&apos;ve completed all 26 modules of the RestAssured Mastery curriculum.
              You can now design, build, and defend a senior API test framework.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              <div className="bg-panel2 rounded p-3">
                <div className="text-2xl mb-1">🧪</div>
                <div className="text-accent2 font-bold">26 Modules</div>
                <div className="text-muted text-xs">completed</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-accent2 font-bold">12 Interview Q&amp;As</div>
                <div className="text-muted text-xs">ready to answer</div>
              </div>
              <div className="bg-panel2 rounded p-3">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-accent2 font-bold">Senior ready</div>
                <div className="text-muted text-xs">architecture + patterns</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
