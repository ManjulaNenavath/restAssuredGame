"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";

const POM = `<!-- pom.xml -->
<dependencies>
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.hamcrest</groupId>
    <artifactId>hamcrest</artifactId>
    <version>2.2</version>
    <scope>test</scope>
  </dependency>
</dependencies>`;

const IMPORTS = `import static io.restassured.RestAssured.*;
import static io.restassured.matcher.RestAssuredMatchers.*;
import static org.hamcrest.Matchers.*;`;

const FIRST_TEST = `import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

public class FirstApiTest {

    @Test
    public void getUser_shouldReturnUserDetails() {
        given()
            .baseUri("https://reqres.in")
            .header("x-api-key", "reqres-free-v1")
        .when()
            .get("/api/users/2")
        .then()
            .statusCode(200)
            .body("data.id", equalTo(2))
            .body("data.email", containsString("@reqres.in"));
    }
}`;

const RUN = `# Run the test:
mvn test

# Run just one class:
mvn test -Dtest=FirstApiTest

# Run with detailed output:
mvn test -Dtest=FirstApiTest -X`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function IntroModule({ onComplete, onXp }: Props) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  function checkAnswer() {
    const normalized = answer.trim().replace(/['"]/g, "");
    if (normalized === "io.restassured.RestAssured.*" || normalized === "io.restassured.RestAssured*") {
      setFeedback({ kind: "ok", msg: "✅ Correct! +50 XP — that import unlocks given(), when(), then()" });
      onXp(50);
      onComplete();
    } else {
      setFeedback({ kind: "err", msg: "❌ Hint: it's the static import that gives you given(), when(), then()" });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">📚 Lesson 1 — Your First RestAssured Test</h2>
      <p className="text-muted mb-6">
        By the end of this lesson you&apos;ll have a working API test on your machine.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 1 — Add the Maven dependencies</h3>
        <p className="text-sm mb-3 leading-relaxed">
          RestAssured needs three jars: the core library, schema validation, and Hamcrest for assertions.
          Add this to your <code className="text-orange-300">pom.xml</code>:
        </p>
        <CodeEditor code={POM} language="xml" height={320} />
        <p className="text-sm mt-3 text-muted">
          Run <code className="text-orange-300">mvn clean install</code> once to download them.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 2 — The three magic imports</h3>
        <p className="text-sm mb-3 leading-relaxed">
          Without these three <b>static imports</b>, <code className="text-orange-300">given()</code>,
          <code className="text-orange-300"> equalTo()</code>, and{" "}
          <code className="text-orange-300">matchesJsonSchema()</code> won&apos;t compile. Memorize them:
        </p>
        <CodeEditor code={IMPORTS} language="java" height={100} />
        <div className="mt-3 p-3 rounded bg-accent2/10 border-l-4 border-accent2 text-sm">
          <b>Why static?</b> Static imports let you call <code>given()</code> directly instead of{" "}
          <code>RestAssured.given()</code> — the resulting tests read like English.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 3 — Write your first test</h3>
        <p className="text-sm mb-3 leading-relaxed">
          A complete test that hits a real public API (<code className="text-orange-300">reqres.in</code>)
          and asserts on the response:
        </p>
        <CodeEditor code={FIRST_TEST} language="java" height={340} />
        <p className="text-sm mt-3">Three things are happening here:</p>
        <ul className="text-sm space-y-1 mt-2 ml-4 list-disc">
          <li>
            <code className="text-orange-300">given()</code> — sets up base URL and headers
          </li>
          <li>
            <code className="text-orange-300">when()</code> — fires the HTTP GET
          </li>
          <li>
            <code className="text-orange-300">then()</code> — asserts status code and response body fields
          </li>
        </ul>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 4 — Run it</h3>
        <CodeEditor code={RUN} language="shell" height={140} />
        <p className="text-sm mt-3 text-muted">
          A green tick means: the request succeeded, the status was 200, and the JSON body had the
          expected fields. If any assertion fails, the test fails with a clear message.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Quick check — complete the import</h3>
        <p className="text-sm mb-3">
          Type the static import that gives you <code className="text-orange-300">given()</code>,{" "}
          <code className="text-orange-300">when()</code>, <code className="text-orange-300">then()</code>:
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-pink-400">import static</span>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="io.restassured...."
            className="flex-1 bg-transparent border-b border-border focus:border-accent2 outline-none px-1 text-amber-300"
          />
          <span>;</span>
        </div>
        <button
          onClick={checkAnswer}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg font-semibold ${
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
        <p className="text-sm">After this lesson you can:</p>
        <ul className="text-sm space-y-1 mt-2 ml-4 list-disc">
          <li>Add RestAssured to a Maven project</li>
          <li>Recognize the given / when / then pattern</li>
          <li>Write and run a basic GET test that asserts on the response</li>
        </ul>
        <p className="text-sm mt-3 text-muted">
          Next lesson: HTTP methods in depth — how GET, POST, PUT, PATCH, DELETE map to RestAssured calls.
        </p>
      </Card>
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-panel border border-border rounded-xl p-5 mb-4 shadow-lg"
    >
      {children}
    </motion.div>
  );
}
