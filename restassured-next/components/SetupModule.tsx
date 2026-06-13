"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const POM = `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>api-tests</artifactId>
  <version>1.0.0</version>

  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <rest-assured.version>5.4.0</rest-assured.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>rest-assured</artifactId>
      <version>\${rest-assured.version}</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>json-schema-validator</artifactId>
      <version>\${rest-assured.version}</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.hamcrest</groupId>
      <artifactId>hamcrest</artifactId>
      <version>2.2</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.assertj</groupId>
      <artifactId>assertj-core</artifactId>
      <version>3.25.3</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`;

const STRUCTURE = `my-api-tests/
├── pom.xml
└── src/
    ├── main/java/
    │   └── com/example/
    │       ├── client/        ← reusable API client wrappers
    │       └── models/        ← POJOs for request/response
    └── test/
        ├── java/com/example/
        │   └── tests/         ← actual @Test classes
        └── resources/
            └── schemas/       ← JSON schema files</plaintext>`;

const IMPORTS_FULL = `// 🔑 The five imports you'll use over and over:
import static io.restassured.RestAssured.*;                          // given(), when(), then()
import static io.restassured.module.jsv.JsonSchemaValidator.*;       // matchesJsonSchema
import static org.hamcrest.Matchers.*;                               // equalTo, hasItem, notNullValue
import static org.assertj.core.api.Assertions.assertThat;            // AssertJ assertions
import io.restassured.response.Response;                             // the Response type`;

const LOG_DEMO = `// Print the entire response (status, headers, body) to the console:
given()
    .when()
        .get("https://jsonplaceholder.typicode.com/users/1")
    .then()
        .log().all();      // ← this dumps everything to System.out`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function SetupModule({ onComplete, onXp }: Props) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const a = answer.toLowerCase().trim();
    // accept several variations
    if (
      a.includes("hamcrest") ||
      a.includes("org.hamcrest") ||
      a.includes("matchers")
    ) {
      setFeedback({
        kind: "ok",
        msg: "✅ Correct — without org.hamcrest, equalTo() and notNullValue() won't compile. +50 XP",
      });
      onXp(50);
      if (!done) {
        setDone(true);
        onComplete();
      }
    } else {
      setFeedback({
        kind: "err",
        msg: "❌ Not quite — think about which import gives you equalTo() and notNullValue().",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">⚙️ Lesson 3 — Setup & Dependencies</h2>
      <p className="text-muted mb-6">Wire up a Maven project from scratch in under 5 minutes.</p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The full pom.xml</h3>
        <p className="text-sm mb-3">
          A real project needs <b>five</b> dependencies, not just RestAssured. Here&apos;s the complete file
          you can copy into any new Maven project:
        </p>
        <CodeEditor code={POM} language="xml" height={420} />
        <div className="grid gap-2 mt-3 text-sm">
          <Detail name="rest-assured" purpose="core library — given/when/then" />
          <Detail name="json-schema-validator" purpose="matchesJsonSchema() for contract validation" />
          <Detail name="junit-jupiter" purpose="@Test annotation and test runner" />
          <Detail name="hamcrest" purpose="equalTo(), hasItem(), notNullValue() matchers" />
          <Detail name="assertj-core" purpose="modern fluent assertions like assertThat(x).isEqualTo(y)" />
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Recommended project structure</h3>
        <p className="text-sm mb-3">
          Three layers — <b>client</b> wraps RestAssured calls, <b>models</b> are POJOs,{" "}
          <b>tests</b> are thin and only contain assertions:
        </p>
        <CodeEditor code={STRUCTURE} language="plaintext" height={220} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The five static imports</h3>
        <p className="text-sm mb-3">
          Most compile errors in your first week come from missing static imports. Paste these at the top
          of every test class:
        </p>
        <CodeEditor code={IMPORTS_FULL} language="java" height={150} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">📺 How to see what&apos;s happening — console logging</h3>
        <p className="text-sm mb-3">
          When a test fails and you don&apos;t know why, add{" "}
          <code className="text-orange-300">.log().all()</code>. It prints the full request and response
          to <b>System.out</b>:
        </p>
        <CodeEditor code={LOG_DEMO} language="java" height={140} />
        <ConsoleOutput
          lines={[
            "Request method: GET",
            "Request URI: https://jsonplaceholder.typicode.com/users/1",
            "Headers: Accept=*/*",
            "",
            "HTTP/1.1 200 OK",
            "Content-Type: application/json; charset=utf-8",
            "",
            "{",
            "  \"id\": 1,",
            "  \"name\": \"Leanne Graham\",",
            "  \"username\": \"Bret\",",
            "  \"email\": \"Sincere@april.biz\"",
            "}",
          ]}
        />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Pro tip:</b> use <code className="text-orange-300">.log().ifValidationFails()</code> in CI —
          it only prints when something breaks, keeping logs clean.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Quick check — which dependency is missing?</h3>
        <p className="text-sm mb-2">
          A teammate&apos;s code won&apos;t compile. They&apos;re calling{" "}
          <code className="text-orange-300">equalTo(&quot;John&quot;)</code> and{" "}
          <code className="text-orange-300">notNullValue()</code> but the IDE shows red squiggles. Which
          dependency or import are they missing?
        </p>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type the library name..."
          className="w-full bg-[#0a0f24] border border-border focus:border-accent2 outline-none px-3 py-2 rounded-lg text-amber-300 font-mono text-sm"
        />
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox
          hints={[
            "equalTo() and notNullValue() are not part of RestAssured itself — they're matchers from a separate library.",
            "The library starts with 'h'. You import it via `import static org.____.Matchers.*;`",
            "It's Hamcrest — add `org.hamcrest:hamcrest` to pom.xml and the static import.",
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
          <li>You can create a Maven project with all 5 required dependencies</li>
          <li>You know which import gives you which functions</li>
          <li>You can debug with <code className="text-orange-300">.log().all()</code> and{" "}
          <code className="text-orange-300">.log().ifValidationFails()</code></li>
        </ul>
      </Card>
    </motion.div>
  );
}

function Detail({ name, purpose }: { name: string; purpose: string }) {
  return (
    <div className="flex items-start gap-3 bg-panel2 rounded p-2">
      <code className="text-orange-300 text-xs whitespace-nowrap">{name}</code>
      <span className="text-muted text-xs">→ {purpose}</span>
    </div>
  );
}
