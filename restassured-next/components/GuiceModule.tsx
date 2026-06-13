"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const PROBLEM = `// Without DI — every step class creates its own ApiClient
// Problem: they don't share state!

public class UserSteps {
    private ApiClient client = new ApiClient();  // ← new object
    private Response lastResponse;
}

public class OrderSteps {
    private ApiClient client = new ApiClient();  // ← different object
    // Can't see UserSteps.lastResponse!
}`;

const GUICE_DEP = `<!-- pom.xml -->
<dependency>
    <groupId>io.cucumber</groupId>
    <artifactId>cucumber-guice</artifactId>
    <version>7.18.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.google.inject</groupId>
    <artifactId>guice</artifactId>
    <version>7.0.0</version>
    <scope>test</scope>
</dependency>`;

const SCENARIO_SCOPE = `// ScenarioScoped — Guice creates ONE instance per scenario,
// shared across ALL step definition classes

@ScenarioScoped
public class ScenarioContext {
    private Response lastResponse;
    private String   authToken;
    private String   lastCreatedId;

    // Getters and setters
    public Response getLastResponse() { return lastResponse; }
    public void setLastResponse(Response r) { lastResponse = r; }

    public String getAuthToken() { return authToken; }
    public void setAuthToken(String t) { authToken = t; }
}`;

const INJECT_STEPS = `// Inject the shared context into every step class
public class UserSteps {
    private final ScenarioContext ctx;

    @Inject
    public UserSteps(ScenarioContext ctx) {
        this.ctx = ctx;
    }

    @When("I GET {string}")
    public void iGet(String path) {
        Response r = given()
            .header("Authorization", "Bearer " + ctx.getAuthToken())
            .when().get(path)
            .then().extract().response();

        ctx.setLastResponse(r);   // shared — visible to OrderSteps!
    }
}

public class OrderSteps {
    private final ScenarioContext ctx;

    @Inject
    public OrderSteps(ScenarioContext ctx) {
        this.ctx = ctx;   // ← SAME instance as in UserSteps
    }

    @Then("the order ID is not null")
    public void orderIdNotNull() {
        // Can read the response set by UserSteps
        assertThat(ctx.getLastResponse().path("orderId")).isNotNull();
    }
}`;

const GUICE_MODULE = `// src/test/java/config/TestModule.java
// Guice module — wire up non-Scenario-scoped singletons
public class TestModule extends AbstractModule {
    @Override
    protected void configure() {
        // Singleton for the whole test run
        bind(ApiClient.class).in(Singleton.class);
        bind(TokenProvider.class).in(Singleton.class);
    }

    @Provides @Singleton
    public RequestSpecification provideSpec(TokenProvider tp) {
        return new RequestSpecBuilder()
            .setBaseUri(ApiConfig.baseUrl())
            .addHeader("Authorization", "Bearer " + tp.getToken())
            .build();
    }
}

// Tell cucumber-guice about your module:
// src/test/resources/cucumber-guice.properties
// guice.injector-source=config.InjectorSource`;

const COMPARE = [
  { aspect: "State sharing across step classes", without: "ThreadLocal (manual)", with: "ScenarioContext injection" },
  { aspect: "Singleton services (ApiClient)", without: "static fields", with: "@Singleton binding in Module" },
  { aspect: "Scope control", without: "manual cleanup in @After", with: "@ScenarioScoped — auto-managed" },
  { aspect: "Test isolation", without: "ThreadLocal.remove() required", with: "Guice destroys scope after each scenario" },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function GuiceModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/[@"']/g, "");
    if (v === "scenarioscoped" || v === "scenario scoped") {
      setFeedback({ kind: "ok", msg: "✅ Correct — @ScenarioScoped tells Guice to create one shared instance per Cucumber scenario. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite. The annotation that creates one Guice instance per Cucumber scenario is @ScenarioScoped." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">💉 Lesson 20 — Guice Dependency Injection</h2>
      <p className="text-muted mb-6">
        Share state between step classes cleanly — no static fields, no ThreadLocal.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The problem Guice solves</h3>
        <CodeEditor code={PROBLEM} language="java" height={240} />
        <p className="text-sm mt-2 text-muted">
          In a multi-class step setup, steps in one class can&apos;t see state set by steps in another class — unless they share an object.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Dependencies</h3>
        <CodeEditor code={GUICE_DEP} language="xml" height={240} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">@ScenarioScoped — one shared instance per scenario</h3>
        <CodeEditor code={SCENARIO_SCOPE} language="java" height={280} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>ScenarioScoped</b> means Guice creates exactly ONE instance per scenario, then destroys it after the scenario ends. Perfect for state that lives for one test flow.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">@Inject — receive the shared context</h3>
        <CodeEditor code={INJECT_STEPS} language="java" height={480} />
        <ConsoleOutput lines={[
          "Scenario: Create order and verify",
          "  [UserSteps] GET /users/1 → stored in ScenarioContext",
          "  [OrderSteps] reading response from same ScenarioContext instance",
          "  Order ID: ORD-48291 — not null ✓",
          "Scenario PASSED — ScenarioContext destroyed",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Guice Module — singleton services</h3>
        <CodeEditor code={GUICE_MODULE} language="java" height={380} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Guice vs ThreadLocal — comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-accent2 border-b border-border">Aspect</th>
                <th className="text-left p-2 text-red-400 border-b border-border">Without Guice</th>
                <th className="text-left p-2 text-emerald-400 border-b border-border">With Guice</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="p-2 text-muted">{r.aspect}</td>
                  <td className="p-2 text-red-400/80 font-mono">{r.without}</td>
                  <td className="p-2 text-emerald-400/80 font-mono">{r.with}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — which annotation?</h3>
        <p className="text-sm mb-3">
          What annotation do you put on a class to tell Guice to create one shared instance per Cucumber scenario?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-pink-400">@</span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-48 text-amber-300"
          />
          <span className="text-muted ml-2">public class ScenarioContext &#123;...&#125;</span>
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "The annotation controls the 'scope' of the object's lifecycle.",
          "It's from the cucumber-guice library, specific to Cucumber scenarios.",
          "The annotation is @ScenarioScoped.",
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
          <li>Guice solves the step-class state-sharing problem without static fields</li>
          <li><code className="text-orange-300">@ScenarioScoped</code> = one instance per scenario, shared across all step classes</li>
          <li><code className="text-orange-300">@Inject</code> on the constructor → Guice provides the shared instance</li>
          <li>Guice destroys @ScenarioScoped objects after each scenario — automatic cleanup</li>
          <li>Use a <code className="text-orange-300">TestModule</code> to bind singletons (ApiClient, TokenProvider)</li>
        </ul>
      </Card>
    </motion.div>
  );
}
