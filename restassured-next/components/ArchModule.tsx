"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const FOLDER_STRUCTURE = `src/
└── test/
    ├── java/
    │   ├── api/              ← HTTP layer
    │   │   ├── ApiClient.java       (RequestSpec, base headers)
    │   │   ├── UserApi.java         (one class per domain)
    │   │   ├── OrderApi.java
    │   │   └── ProductApi.java
    │   ├── model/            ← POJOs
    │   │   ├── request/
    │   │   │   ├── CreateUserRequest.java
    │   │   │   └── CreateOrderRequest.java
    │   │   └── response/
    │   │       ├── UserResponse.java
    │   │       └── OrderResponse.java
    │   ├── config/           ← Setup
    │   │   ├── ApiConfig.java       (env / base URL)
    │   │   └── TestModule.java      (Guice bindings)
    │   ├── steps/            ← Cucumber step definitions
    │   │   ├── UserSteps.java
    │   │   └── OrderSteps.java
    │   ├── hooks/
    │   │   └── ApiHooks.java
    │   └── runner/
    │       └── CucumberRunner.java
    └── resources/
        ├── features/         ← Gherkin files
        │   ├── users.feature
        │   └── orders.feature
        ├── schemas/          ← JSON schemas
        │   ├── user-schema.json
        │   └── order-schema.json
        └── junit-platform.properties`;

const API_LAYER = `// api/UserApi.java — one class per domain area
// Only knows how to call HTTP. Zero assertions here.
public class UserApi {
    private final RequestSpecification spec;

    @Inject
    public UserApi(RequestSpecification spec) {
        this.spec = spec;
    }

    public Response getUser(int id) {
        return given(spec)
            .when().get("/users/" + id)
            .then().extract().response();
    }

    public Response createUser(CreateUserRequest body) {
        return given(spec)
            .body(body).contentType("application/json")
            .when().post("/users")
            .then().extract().response();
    }

    public Response updateUser(int id, CreateUserRequest body) {
        return given(spec)
            .body(body).contentType("application/json")
            .when().put("/users/" + id)
            .then().extract().response();
    }
}`;

const TEST_LAYER = `// Test layer — uses UserApi, makes all assertions
public class UserApiTest {
    @Inject private UserApi userApi;
    @Inject private ScenarioContext ctx;

    @Test
    void getUser_returns200WithCorrectName() {
        Response r = userApi.getUser(1);

        assertThat(r.statusCode()).isEqualTo(200);
        assertThat(r.<String>path("name")).isEqualTo("Leanne Graham");
        assertThat(r.<String>path("email")).containsIgnoringCase("@");
    }

    @Test
    void createUser_returns201WithId() {
        CreateUserRequest req = TestData.randomUser();
        Response r = userApi.createUser(req);

        assertThat(r.statusCode()).isEqualTo(201);
        assertThat(r.<Integer>path("id")).isPositive();
        assertThat(r.<String>path("name")).isEqualTo(req.getName());
    }
}`;

const CUCUMBER_LAYER = `// steps/UserSteps.java — Cucumber glue using the API layer
public class UserSteps {
    private final UserApi userApi;
    private final ScenarioContext ctx;

    @Inject
    public UserSteps(UserApi userApi, ScenarioContext ctx) {
        this.userApi = userApi;
        this.ctx     = ctx;
    }

    @When("I GET user {int}")
    public void getUser(int id) {
        ctx.setLastResponse(userApi.getUser(id));
    }

    @Then("the user name is {string}")
    public void userNameIs(String expected) {
        assertThat(ctx.getLastResponse().<String>path("name"))
            .isEqualTo(expected);
    }
}`;

const THREE_LAYER_SUMMARY = [
  {
    layer: "API Layer",
    file: "api/UserApi.java",
    does: "HTTP calls — given/when/extract",
    doesnt: "No assertions, no test logic",
    color: "text-pink-400",
  },
  {
    layer: "Model Layer",
    file: "model/request|response/",
    does: "POJOs for serialization/deserialization",
    doesnt: "No logic — just fields",
    color: "text-amber-400",
  },
  {
    layer: "Test / Step Layer",
    file: "steps/ or *Test.java",
    does: "Calls API layer, asserts responses",
    doesnt: "No HTTP calls directly",
    color: "text-accent2",
  },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function ArchModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/['"]/g, "");
    if (v === "api" || v === "api layer" || v === "apilayer" || v === "userapi" || v === "http layer") {
      setFeedback({ kind: "ok", msg: "✅ Right — the API layer holds all HTTP calls. Tests call it; they don't call given() directly. +70 XP" });
      onXp(70);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite. Which layer holds HTTP calls and has no assertions? Look at the 3-layer table." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🏗️ Lesson 24 — Framework Architecture</h2>
      <p className="text-muted mb-6">
        How senior engineers structure a test framework that scales to hundreds of tests without becoming unmaintainable.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The 3-layer architecture</h3>
        <div className="space-y-3">
          {THREE_LAYER_SUMMARY.map((l) => (
            <div key={l.layer} className="p-3 bg-panel2 rounded-lg">
              <div className={`font-bold ${l.color} mb-1`}>{l.layer} — <code className="text-xs">{l.file}</code></div>
              <div className="text-sm text-muted">
                <span className="text-emerald-400">✅ Does: </span>{l.does}
              </div>
              <div className="text-sm text-muted">
                <span className="text-red-400">❌ Not: </span>{l.doesnt}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Full folder structure</h3>
        <CodeEditor code={FOLDER_STRUCTURE} language="bash" height={540} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">API layer — HTTP calls only</h3>
        <CodeEditor code={API_LAYER} language="java" height={400} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Rule:</b> if you see <code className="text-orange-300">assertThat</code> or <code className="text-orange-300">.body(matcher)</code> in a file under <code className="text-orange-300">api/</code>, it&apos;s in the wrong layer.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Test layer — assertions only</h3>
        <CodeEditor code={TEST_LAYER} language="java" height={360} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Cucumber step layer — calls API layer, asserts</h3>
        <CodeEditor code={CUCUMBER_LAYER} language="java" height={340} />
        <ConsoleOutput lines={[
          "Scenario: Get user and verify name",
          "  When I GET user 1 → UserApi.getUser(1) called",
          "  Then the user name is 'Leanne Graham' → assertThat passed",
          "Scenario PASSED",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — which layer?</h3>
        <p className="text-sm mb-3">
          You are adding a method that calls <code className="text-orange-300">given(spec).when().get(&quot;/orders&quot;)</code>.
          Which layer does this belong in?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-muted">Layer:</span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 flex-1 text-amber-300"
          />
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "HTTP calls (given/when) belong in a dedicated layer, separate from assertions.",
          "The layer that contains UserApi.java, OrderApi.java is called the API layer.",
          "The answer is: API layer (or HTTP layer).",
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
          <li>3 layers: API (HTTP), Model (POJOs), Test/Step (assertions)</li>
          <li>API layer — no assertions; Test layer — no HTTP calls directly</li>
          <li>Schemas in <code className="text-orange-300">src/test/resources/schemas/</code></li>
          <li>Features in <code className="text-orange-300">src/test/resources/features/</code></li>
          <li>Separation lets you swap the assertion library or HTTP client without touching the other layers</li>
        </ul>
      </Card>
    </motion.div>
  );
}
