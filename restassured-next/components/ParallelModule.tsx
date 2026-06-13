"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const WHY_PARALLEL = `// Without parallel: 50 tests × 1 second each = 50 seconds
// With 4 threads:   50 tests ÷ 4 threads   = ~13 seconds

// But parallel has a deadly trap — shared mutable state:
static String token;        // ← SHARED between threads
static Response lastResp;   // ← Thread A can overwrite Thread B's response

// Solution: ThreadLocal — each thread has its own copy`;

const THREADLOCAL = `// ThreadLocal — each thread sees its own value
public class TestContext {

    // Each thread gets its own response object
    private static final ThreadLocal<Response> LAST_RESPONSE =
        ThreadLocal.withInitial(() -> null);

    // Each thread gets its own auth token
    private static final ThreadLocal<String> TOKEN =
        ThreadLocal.withInitial(() -> null);

    public static Response getLastResponse() {
        return LAST_RESPONSE.get();
    }

    public static void setLastResponse(Response r) {
        LAST_RESPONSE.set(r);
    }

    public static String getToken() {
        if (TOKEN.get() == null) {
            TOKEN.set(fetchFreshToken());   // lazy init per thread
        }
        return TOKEN.get();
    }

    // CRITICAL: always clean up after each test
    public static void clear() {
        LAST_RESPONSE.remove();
        TOKEN.remove();
    }
}`;

const USE_THREADLOCAL = `// Step definitions using ThreadLocal context
public class UserSteps {

    @When("I GET {string}")
    public void iGet(String path) {
        Response r = given().when().get(path).then().extract().response();
        TestContext.setLastResponse(r);   // thread-safe storage
    }

    @Then("the response status is {int}")
    public void statusIs(int expected) {
        assertThat(TestContext.getLastResponse().statusCode())
            .isEqualTo(expected);
    }

    @After
    public void cleanup() {
        TestContext.clear();   // ← MUST call this after every scenario
    }
}`;

const JUNIT5_PARALLEL = `// JUnit 5 parallel config: src/test/resources/junit-platform.properties
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.config.strategy = fixed
junit.jupiter.execution.parallel.config.fixed.parallelism = 4`;

const COURGETTE = `<!-- Courgette — parallel Cucumber without ThreadLocal headaches -->
<dependency>
    <groupId>io.github.prashant-ramcharan</groupId>
    <artifactId>courgette-jvm</artifactId>
    <version>5.9.0</version>
    <scope>test</scope>
</dependency>

// Runner
@RunWith(CourgetteJUnitRunner.class)
@CourgetteOptions(
    threads           = 4,
    runLevel          = CourgetteRunLevel.SCENARIO,   // one thread per scenario
    rerunFailedScenarios = true,                      // auto-retry flaky tests
    cucumberOptions   = @CucumberOptions(
        features = "src/test/resources/features",
        glue     = "steps",
        plugin   = { "pretty", "html:target/report.html" }
    )
)
public class ParallelRunner {}`;

const SAFETY_RULES = [
  { icon: "✅", rule: "Use ThreadLocal for any state shared between steps" },
  { icon: "✅", rule: "Call ThreadLocal.remove() in @After — prevent memory leaks" },
  { icon: "✅", rule: "Use random/unique test data — no hardcoded IDs" },
  { icon: "✅", rule: "Each test creates and cleans up its own data" },
  { icon: "❌", rule: "Never use static fields to hold Response, token, or user state" },
  { icon: "❌", rule: "Never rely on test execution order" },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function ParallelModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/['"<>]/g, "");
    if (v === "threadlocal" || v === "threadlocal<response>" || v === "thread local") {
      setFeedback({ kind: "ok", msg: "✅ Right — ThreadLocal gives each thread its own isolated copy of any variable. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite. The Java class that gives each thread its own copy of a variable is ThreadLocal." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">⚡ Lesson 19 — Parallel + ThreadLocal</h2>
      <p className="text-muted mb-6">
        Run 4 threads, finish in a quarter of the time — without your tests stepping on each other.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Why parallel? The time problem</h3>
        <CodeEditor code={WHY_PARALLEL} language="java" height={220} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">ThreadLocal — thread-safe state</h3>
        <CodeEditor code={THREADLOCAL} language="java" height={440} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>The memory leak trap:</b> if you never call <code className="text-orange-300">.remove()</code>, the thread pool holds references forever. Always clean up in <code className="text-orange-300">@After</code>.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Using ThreadLocal in step definitions</h3>
        <CodeEditor code={USE_THREADLOCAL} language="java" height={300} />
        <ConsoleOutput lines={[
          "[Thread-1] GET /users/1 → response stored in TL[Thread-1]",
          "[Thread-2] GET /products/5 → response stored in TL[Thread-2]",
          "[Thread-1] asserting status 200 → reads TL[Thread-1] safely",
          "[Thread-2] asserting status 200 → reads TL[Thread-2] safely",
          "4 scenarios passed in 0.9s (4 threads) — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">JUnit 5 parallel config</h3>
        <CodeEditor code={JUNIT5_PARALLEL} language="properties" height={160} />
        <p className="text-sm mt-2 text-muted">
          Drop this file in <code className="text-orange-300">src/test/resources/</code> — no code changes needed.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Courgette — parallel Cucumber made easy</h3>
        <CodeEditor code={COURGETTE} language="java" height={380} />
        <p className="text-sm mt-2 text-muted">
          Courgette handles thread management for you. Its <code className="text-orange-300">rerunFailedScenarios</code> flag automatically retries flaky tests once — catches network timeouts without marking them as true failures.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Golden rules for parallel safety</h3>
        <div className="space-y-2">
          {SAFETY_RULES.map((r, i) => (
            <div key={i} className={`flex gap-2 text-sm p-2 rounded ${r.icon === "✅" ? "bg-emerald-400/5" : "bg-red-400/5"}`}>
              <span>{r.icon}</span>
              <span className={r.icon === "✅" ? "text-emerald-400" : "text-red-400"}>{r.rule}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — name the Java class</h3>
        <p className="text-sm mb-3">
          What Java class do you use to give each thread its own isolated copy of a variable?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-blue-400">private static final </span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-40 text-amber-300"
          />
          <span className="text-muted">&lt;Response&gt; CTX = ...;</span>
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "It's a built-in Java class, no import needed beyond java.lang.",
          "The class name literally says 'local to the thread'.",
          "The answer is ThreadLocal.",
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
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>Parallel tests share threads — static fields cause race conditions</li>
          <li><code className="text-orange-300">ThreadLocal&lt;T&gt;</code> gives each thread its own isolated copy</li>
          <li>Always call <code className="text-orange-300">ThreadLocal.remove()</code> in <code className="text-orange-300">@After</code> to prevent memory leaks</li>
          <li>Configure JUnit 5 parallelism via <code className="text-orange-300">junit-platform.properties</code></li>
          <li>Courgette adds parallel support to Cucumber with one annotation</li>
        </ul>
      </Card>
    </motion.div>
  );
}
