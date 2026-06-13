"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const REPEAT_BAD = `// ❌ Junior approach — copy-pasting headers in every test
@Test
public void getUser() {
    given()
        .baseUri("https://api.example.com")
        .header("Authorization", "Bearer " + token)
        .header("Accept", "application/json")
        .contentType("application/json")
    .when().get("/users/1").then().statusCode(200);
}

@Test
public void getProduct() {
    given()
        .baseUri("https://api.example.com")          // ← same
        .header("Authorization", "Bearer " + token)  // ← same
        .header("Accept", "application/json")         // ← same
        .contentType("application/json")              // ← same
    .when().get("/products/99").then().statusCode(200);
}`;

const REQ_SPEC = `// ✅ Senior approach — build once, reuse everywhere
import io.restassured.specification.RequestSpecification;
import io.restassured.builder.RequestSpecBuilder;

public class ApiSpec {
    public static RequestSpecification BASE;

    static {
        BASE = new RequestSpecBuilder()
            .setBaseUri("https://jsonplaceholder.typicode.com")
            .addHeader("Accept", "application/json")
            .setContentType("application/json")
            .build();
    }
}

// In your tests:
given(ApiSpec.BASE)
    .when().get("/users/1")
    .then().statusCode(200);

given(ApiSpec.BASE)
    .when().get("/posts/5")
    .then().statusCode(200);`;

const RESP_SPEC = `// ResponseSpecification — reuse assertion rules too
import io.restassured.specification.ResponseSpecification;
import io.restassured.builder.ResponseSpecBuilder;

ResponseSpecification SUCCESS_SPEC = new ResponseSpecBuilder()
    .expectStatusCode(200)
    .expectContentType("application/json")
    .expectResponseTime(lessThan(3000L))   // must respond in <3s
    .build();

// Apply to any test
given(ApiSpec.BASE)
    .when().get("/users/1")
    .then().spec(SUCCESS_SPEC)
    .body("name", equalTo("Leanne Graham"));`;

const WITH_AUTH = `// Auth token injected via RequestSpecBuilder
String token = getToken();   // your auth helper

RequestSpecification authSpec = new RequestSpecBuilder()
    .addRequestSpecification(ApiSpec.BASE)   // inherit base
    .addHeader("Authorization", "Bearer " + token)
    .build();

// Authenticated requests
given(authSpec).when().get("/protected/users").then().statusCode(200);
given(authSpec).when().get("/protected/orders").then().statusCode(200);

// Unauthenticated — uses base spec (no Authorization header)
given(ApiSpec.BASE).when().get("/public/health").then().statusCode(200);`;

const SETUP_CODE = `// Where to initialize specs — @BeforeAll in JUnit 5
@BeforeAll
static void setupSpec() {
    ApiSpec.BASE = new RequestSpecBuilder()
        .setBaseUri(System.getProperty("api.base", "https://jsonplaceholder.typicode.com"))
        .addHeader("Accept", "application/json")
        .setRelaxedHTTPSValidation()   // skip SSL in dev
        .log().ifValidationFails()     // log only on failure
        .build();
}`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function SpecsModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/['"]/g, "");
    if (v === "requestspecbuilder" || v === "new requestspecbuilder()" || v === "requestspecification") {
      setFeedback({ kind: "ok", msg: "✅ Right — RequestSpecBuilder.build() gives you a RequestSpecification you pass to given(). +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite — which Builder class assembles a reusable spec?" });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">📋 Lesson 8 — Request &amp; Response Specs</h2>
      <p className="text-muted mb-6">
        Stop copy-pasting headers. Build them once, inject them everywhere.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The problem — boilerplate in every test</h3>
        <CodeEditor code={REPEAT_BAD} language="java" height={340} />
        <div className="mt-3 p-3 rounded bg-red-400/10 border-l-4 border-red-400 text-sm">
          When the base URL changes or the auth scheme rotates, you update <b>every single test</b>. With 50+ tests that is a half-day refactor.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">RequestSpecification — define once, pass to given()</h3>
        <CodeEditor code={REQ_SPEC} language="java" height={380} />
        <p className="text-sm mt-2 text-muted">
          Change the base URI in one place → all tests automatically use the new one. This is the most important refactor a junior can make.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">ResponseSpecification — assert common rules once</h3>
        <CodeEditor code={RESP_SPEC} language="java" height={300} />
        <ConsoleOutput lines={[
          "All tests using SUCCESS_SPEC automatically verify:",
          "  → Status: 200",
          "  → Content-Type: application/json",
          "  → Response time: < 3000 ms",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Composing specs — add auth on top of base</h3>
        <CodeEditor code={WITH_AUTH} language="java" height={300} />
        <p className="text-sm mt-2 text-muted">
          <code className="text-orange-300">addRequestSpecification()</code> lets you inherit from a base spec and layer extra headers on top. Perfect for authenticated vs public endpoint tests.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Where to initialize — @BeforeAll</h3>
        <CodeEditor code={SETUP_CODE} language="java" height={260} />
        <ConsoleOutput lines={[
          "> mvn test -Dapi.base=https://staging.example.com",
          "[INFO] Base URI = https://staging.example.com (from system property)",
          "[INFO] Specs initialized — running 24 tests ...",
          "[INFO] BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — name the builder class</h3>
        <p className="text-sm mb-3">
          You want to create a reusable <code className="text-orange-300">RequestSpecification</code>.
          What class do you instantiate to build it?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-blue-400">RequestSpecification</span>
          <span>spec = new </span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???()"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-48 text-amber-300"
          />
          <span>.build();</span>
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "RestAssured uses the Builder pattern throughout. The class name mirrors the spec it builds.",
          "Look at the import in the REQ_SPEC example above — the class name is right there.",
          "The answer is RequestSpecBuilder.",
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
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">✅ Checkpoint</h3>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>You can create a <code className="text-orange-300">RequestSpecification</code> with <code className="text-orange-300">RequestSpecBuilder</code></li>
          <li>You pass it to <code className="text-orange-300">given(spec)</code> — not <code className="text-orange-300">given().spec()</code></li>
          <li>You can layer auth headers on top of a base spec</li>
          <li>You can validate common response rules with a <code className="text-orange-300">ResponseSpecification</code></li>
          <li>You initialize specs in <code className="text-orange-300">@BeforeAll</code> so they run once per test class</li>
        </ul>
      </Card>
    </motion.div>
  );
}
