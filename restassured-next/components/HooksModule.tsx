"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const HOOK_TYPES = [
  { name: "@Before", scope: "Before each scenario", use: "Authenticate, reset state, start mock server" },
  { name: "@After", scope: "After each scenario", use: "Cleanup created data, close connections, log on failure" },
  { name: "@BeforeAll (JUnit)", scope: "Once before all tests in the class", use: "Build RequestSpec, fetch auth token" },
  { name: "@AfterAll (JUnit)", scope: "Once after all tests finish", use: "Stop mock servers, flush logs" },
  { name: "@BeforeStep", scope: "Before each Gherkin step", use: "Advanced — logging/tracing" },
  { name: "@AfterStep", scope: "After each Gherkin step", use: "Advanced — screenshot on step failure" },
];

const CUCUMBER_HOOKS = `// src/test/java/hooks/ApiHooks.java
public class ApiHooks {
    private static String token;

    // Runs before EVERY scenario
    @Before(order = 10)
    public void setUp(Scenario scenario) {
        System.out.println("\\n── Starting: " + scenario.getName());
        if (token == null) {
            token = fetchToken();   // fetch once, reuse
        }
        RestAssured.requestSpecification = ApiSpec.withToken(token);
    }

    // Only runs before @needsData scenarios
    @Before(value = "@needsData", order = 20)
    public void seedTestData(Scenario scenario) {
        TestDataService.seed();   // insert fixture rows
    }

    // Runs after EVERY scenario
    @After(order = 10)
    public void tearDown(Scenario scenario) {
        if (scenario.isFailed()) {
            // Log the last response for debugging
            System.out.println("FAILED — last response: " + lastResponse.asString());
        }
    }

    // Only runs after @needsData scenarios
    @After(value = "@needsData", order = 20)
    public void cleanUp() {
        TestDataService.cleanup();   // delete fixture rows
    }
}`;

const JUNIT_HOOKS = `// JUnit 5 lifecycle hooks — no Cucumber needed
public class OrderApiTest {

    private static RequestSpecification spec;
    private String createdOrderId;

    @BeforeAll
    static void globalSetup() {
        // Once per test class
        spec = new RequestSpecBuilder()
            .setBaseUri(ApiConfig.baseUrl())
            .addHeader("Authorization", "Bearer " + fetchToken())
            .build();
    }

    @BeforeEach
    void perTestSetup(TestInfo info) {
        System.out.println("Running: " + info.getDisplayName());
    }

    @Test
    public void createOrder() {
        createdOrderId = given(spec)
            .body(orderPayload).contentType("application/json")
            .when().post("/orders")
            .then().statusCode(201)
            .extract().path("orderId");
    }

    @AfterEach
    void cleanupOrder() {
        // Delete the order created in this test
        if (createdOrderId != null) {
            given(spec).when().delete("/orders/" + createdOrderId);
        }
    }

    @AfterAll
    static void globalTeardown() {
        System.out.println("All tests done.");
    }
}`;

const ORDER_EXAMPLE = `// Hook execution order — knowing this saves hours of debugging
//
// For each scenario:
//
// 1. @BeforeAll (once for the class)
// 2. @Before(order=10) ← lower number runs first
// 3. @Before(order=20)
// 4. [ SCENARIO STEPS EXECUTE ]
// 5. @After(order=20)  ← higher number runs first in @After
// 6. @After(order=10)
// 7. @AfterAll (once for the class)
//
// ⚠️ @After order is REVERSED compared to @Before`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function HooksModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().replace(/['"@]/g, "").toLowerCase();
    if (v === "after" || v === "@after") {
      setFeedback({ kind: "ok", msg: "✅ Right — @After runs after each scenario and is perfect for cleanup. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That's not quite right. Which hook runs AFTER each scenario?" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🪝 Lesson 17 — Hooks (Before / After)</h2>
      <p className="text-muted mb-6">
        Hooks are the glue between scenarios — auth setup, data seeding, cleanup, and failure logging.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Hook types at a glance</h3>
        <div className="space-y-2">
          {HOOK_TYPES.map((h) => (
            <div key={h.name} className="grid grid-cols-[160px_1fr_1fr] gap-2 p-2 bg-panel2 rounded text-xs items-start">
              <code className="text-pink-400 font-bold">{h.name}</code>
              <span className="text-accent2">{h.scope}</span>
              <span className="text-muted">{h.use}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Cucumber hooks — @Before and @After</h3>
        <CodeEditor code={CUCUMBER_HOOKS} language="java" height={500} />
        <ConsoleOutput lines={[
          "── Starting: Get product list returns 200",
          "[BeforeAll] Token fetched (expires in 3600s)",
          "  Step: When I GET /products ... PASSED",
          "  Step: Then the status is 200 ... PASSED",
          "── Scenario PASSED in 0.84s",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">JUnit 5 lifecycle hooks</h3>
        <CodeEditor code={JUNIT_HOOKS} language="java" height={460} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Gold rule:</b> anything you CREATE in a test, you DELETE in <code className="text-orange-300">@AfterEach</code>. Clean tests never leave behind dirty data.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Hook execution order — order parameter</h3>
        <CodeEditor code={ORDER_EXAMPLE} language="java" height={280} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Gotcha:</b> @After hooks run in REVERSE order compared to @Before. @Before(order=10) runs first; @After(order=10) runs LAST. Design cleanup order accordingly.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — which hook for cleanup?</h3>
        <p className="text-sm mb-3">
          You created a user in a test. You want to delete it after the scenario finishes.
          Which Cucumber annotation goes on your cleanup method?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-pink-400">@</span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-32 text-amber-300"
          />
          <span className="text-muted ml-2">public void cleanup() &#123; deleteUser(); &#125;</span>
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "You want the cleanup to run AFTER the scenario steps finish.",
          "There's a mirror of @Before for post-scenario logic.",
          "The annotation is @After.",
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
          <li><code className="text-orange-300">@Before</code> / <code className="text-orange-300">@After</code> run per Cucumber scenario</li>
          <li><code className="text-orange-300">@BeforeAll</code> / <code className="text-orange-300">@AfterAll</code> run once per JUnit test class</li>
          <li>Use <code className="text-orange-300">order</code> parameter to control execution order — @After order is reversed</li>
          <li>Tag-specific hooks: <code className="text-orange-300">@Before(&quot;@needsData&quot;)</code></li>
          <li>Always clean up in @After — never leave dirty test data behind</li>
        </ul>
      </Card>
    </motion.div>
  );
}
