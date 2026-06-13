"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const LOG_ALL = `// Log everything — request AND response
given()
    .log().all()           // log request: method, url, headers, body
.when()
    .get("/users/1")
.then()
    .log().all()           // log response: status, headers, body
    .statusCode(200);

// Or log just specific parts:
    .log().headers()       // only headers
    .log().body()          // only body
    .log().status()        // only status line`;

const LOG_IF_FAIL = `// Best practice — log ONLY when a test fails
given()
    .log().ifValidationFails()     // request logged on failure
.when()
    .get("/users/1")
.then()
    .log().ifValidationFails()     // response logged on failure
    .statusCode(200);

// Why? Logging everything generates noise in CI output.
// Log on failure gives you exactly what you need to debug,
// without flooding 50 successful tests with megabytes of logs.`;

const GLOBAL_LOG = `// Set global logging in @BeforeAll — applies to all tests
@BeforeAll
static void configureLogging() {
    // Log request + response on validation failure — globally
    RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();

    // Or be explicit:
    RequestSpecBuilder builder = new RequestSpecBuilder();
    builder.log(LogDetail.ALL);     // LogDetail.HEADERS, BODY, STATUS
    BASE_SPEC = builder.build();
}`;

const FILTER_LOG = `// Custom log filter — route to SLF4J / Log4j instead of stdout
import io.restassured.filter.log.RequestLoggingFilter;
import io.restassured.filter.log.ResponseLoggingFilter;

PrintStream logStream = new PrintStream(new FileOutputStream("target/api.log"));

given()
    .filter(new RequestLoggingFilter(logStream))
    .filter(new ResponseLoggingFilter(logStream))
.when()
    .get("/users/1")
.then()
    .statusCode(200);

// Now the log goes to target/api.log, not the console`;

const DEBUG_TIPS = `// ── Common debugging techniques ──

// 1. Print the response body immediately
Response r = given().when().get("/users/1").then().extract().response();
System.out.println("Body: " + r.asPrettyString());

// 2. Print the status code
System.out.println("Status: " + r.statusCode());

// 3. Print all response headers
r.getHeaders().forEach(h ->
    System.out.println(h.getName() + ": " + h.getValue())
);

// 4. Print a specific field
System.out.println("Name: " + r.path("name"));

// 5. Pretty print directly in then()
.then()
    .log().body(true)    // true = pretty-print JSON`;

const QUIZ_OPTIONS = [
  { text: ".log().all()", correct: false, explain: "logs everything, even on success — noisy in CI" },
  { text: ".log().ifValidationFails()", correct: true, explain: "logs only when an assertion fails — signal without noise" },
  { text: ".log().body()", correct: false, explain: "logs the body always, not conditionally" },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function LoggingModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (QUIZ_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Right — .log().ifValidationFails() gives you debug info exactly when you need it, with zero noise on passing tests. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: `❌ That ${QUIZ_OPTIONS[idx].explain}. You want conditional logging.` });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🔍 Lesson 22 — Logging &amp; Debugging</h2>
      <p className="text-muted mb-6">
        Know exactly what was sent and received — without drowning in noise when tests pass.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">.log().all() — see everything</h3>
        <CodeEditor code={LOG_ALL} language="java" height={280} />
        <ConsoleOutput lines={[
          "Request method: GET",
          "Request URI:    https://jsonplaceholder.typicode.com/users/1",
          "Headers:        Accept=application/json",
          "",
          "HTTP/1.1 200 OK",
          "Content-Type: application/json; charset=utf-8",
          "",
          '{"id":1,"name":"Leanne Graham","email":"Sincere@april.biz",...}',
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">.log().ifValidationFails() — the best practice</h3>
        <CodeEditor code={LOG_IF_FAIL} language="java" height={280} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Senior habit:</b> always use <code className="text-orange-300">ifValidationFails()</code> in specs, never <code className="text-orange-300">.log().all()</code>. Clean CI output unless something breaks.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Set globally in @BeforeAll</h3>
        <CodeEditor code={GLOBAL_LOG} language="java" height={260} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Route logs to a file</h3>
        <CodeEditor code={FILTER_LOG} language="java" height={280} />
        <ConsoleOutput lines={[
          "target/api.log:",
          "  2024-01-15 14:32:01 GET /users/1 → 200 OK",
          "  2024-01-15 14:32:02 POST /orders → 201 Created",
          "  2024-01-15 14:32:03 GET /products/5 → 200 OK",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">5 debugging techniques you use daily</h3>
        <CodeEditor code={DEBUG_TIPS} language="java" height={360} />
        <ConsoleOutput lines={[
          'Body: {',
          '  "id": 1,',
          '  "name": "Leanne Graham",',
          '  "email": "Sincere@april.biz"',
          '}',
          "Status: 200",
          "Content-Type: application/json; charset=utf-8",
          "Name: Leanne Graham",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — best practice log call</h3>
        <p className="text-sm mb-3">
          Which logging call is considered best practice for a CI-friendly test suite?
        </p>
        <div className="space-y-2">
          {QUIZ_OPTIONS.map((o, i) => {
            const state = picked === i ? (o.correct ? "ok" : "err") : "";
            return (
              <motion.div
                key={i}
                whileHover={picked === null ? { scale: 1.01 } : {}}
                onClick={() => pick(i)}
                className={`p-3 rounded-lg cursor-pointer border-2 text-sm font-mono ${
                  state === "ok" ? "border-accent2 bg-accent2/10"
                  : state === "err" ? "border-red-400 bg-red-400/10"
                  : "border-transparent bg-panel hover:border-accent"
                }`}
              >
                {o.text}
              </motion.div>
            );
          })}
        </div>
        <HintBox hints={[
          "You want the log to appear only when the test fails, not always.",
          "Logging everything (.log().all()) floods CI output with passing test logs.",
          "The answer is .log().ifValidationFails() — conditional logging.",
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
          <li><code className="text-orange-300">.log().all()</code> — logs everything (use during development only)</li>
          <li><code className="text-orange-300">.log().ifValidationFails()</code> — logs only on failure (CI best practice)</li>
          <li>Set globally with <code className="text-orange-300">RestAssured.enableLoggingOfRequestAndResponseIfValidationFails()</code></li>
          <li>Route to file with <code className="text-orange-300">RequestLoggingFilter(printStream)</code></li>
          <li>Debug live with <code className="text-orange-300">r.asPrettyString()</code>, <code className="text-orange-300">r.path()</code>, <code className="text-orange-300">r.getHeaders()</code></li>
        </ul>
      </Card>
    </motion.div>
  );
}
