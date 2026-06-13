"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const SCHEMA_FILE = `// src/test/resources/schemas/user-schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": {
    "id":    { "type": "integer" },
    "name":  { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "phone": { "type": "string" },
    "address": {
      "type": "object",
      "properties": {
        "city":    { "type": "string" },
        "country": { "type": "string" }
      }
    }
  }
}`;

const USAGE_CODE = `// Import the validator
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchema;

// Option A — load from classpath (preferred)
given(ApiSpec.BASE)
    .when().get("/users/1")
    .then()
        .statusCode(200)
        .body(matchesJsonSchema(
            getClass().getResourceAsStream("/schemas/user-schema.json")
        ));

// Option B — load from File
import java.io.File;
.body(matchesJsonSchema(new File("src/test/resources/schemas/user-schema.json")));

// Option C — inline schema string (good for tiny schemas in tests)
String schema = "{ \\"type\\": \\"object\\", \\"required\\": [\\"id\\"]}";
.body(matchesJsonSchema(schema));`;

const FAIL_CODE = `// What the failure looks like
// ── response body (server accidentally removed 'email') ──
{
  "id": 1,
  "name": "Alice"
}

// ── test output ──
com.github.fge.jsonschema.core.exceptions.ProcessingException:
  FATAL: instance failed to match exactly one schema (matched 0 out of 1)
  [instance pointer: "/"]
  Required key "email" not found

// ← catches API regressions automatically, before your assertions even run`;

const GENERATE_CODE = `// Generate a JSON schema from an existing response (IntelliJ / online tool)
// 1. Run: GET /users/1  →  copy the response JSON
// 2. Paste into: https://www.jsonschema.net/
// 3. Download the schema → save in src/test/resources/schemas/

// Or use the 'json-schema-generator' Maven plugin in your pom.xml
// to generate schemas from your POJO classes at compile time.`;

const POM_DEP = `<!-- Required Maven dependency -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>json-schema-validator</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
</dependency>`;

const OPTIONS = [
  { text: "matchesJsonSchema(new File(\"path/to/schema.json\"))", correct: true },
  { text: "validateSchema(\"path/to/schema.json\")", correct: false },
  { text: "body(equalTo(schemaFile))", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function SchemaModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Correct — matchesJsonSchema() is the RestAssured static method from json-schema-validator. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That method doesn't exist. RestAssured uses matchesJsonSchema() from the json-schema-validator artifact." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">✅ Lesson 11 — Schema Validation</h2>
      <p className="text-muted mb-6">
        Validate the entire response structure — catch missing fields and wrong types before they reach production.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Why schema validation?</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-red-400/10 border border-red-400/30 rounded p-3">
            <div className="font-bold text-red-400 mb-1">Field assertions miss structure bugs</div>
            <ul className="text-muted space-y-1 text-xs">
              <li>.body("name", equalTo("X")) only checks one field</li>
              <li>Missing fields you didn&apos;t assert on slip through</li>
              <li>Type changes (int → string) go undetected</li>
            </ul>
          </div>
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded p-3">
            <div className="font-bold text-emerald-400 mb-1">Schema validation catches everything</div>
            <ul className="text-muted space-y-1 text-xs">
              <li>All required fields present</li>
              <li>Correct types (integer, string, boolean)</li>
              <li>Format constraints (email, date-time, uri)</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 1 — the Maven dependency</h3>
        <CodeEditor code={POM_DEP} language="xml" height={160} />
        <p className="text-sm mt-2 text-muted">
          This is separate from <code className="text-orange-300">rest-assured</code> — it must be added explicitly.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 2 — write the schema file</h3>
        <CodeEditor code={SCHEMA_FILE} language="json" height={340} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>File location:</b> <code className="text-orange-300">src/test/resources/schemas/</code> — Maven puts this on the classpath automatically.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 3 — use matchesJsonSchema() in your test</h3>
        <CodeEditor code={USAGE_CODE} language="java" height={320} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">What a schema failure looks like</h3>
        <CodeEditor code={FAIL_CODE} language="java" height={260} />
        <ConsoleOutput lines={[
          "FATAL: Required key 'email' not found",
          "Schema validation FAILED — test aborted before .body() assertions",
          "[ERROR] Tests run: 1, Failures: 1 — BUILD FAILURE",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Tip — generate schemas from existing responses</h3>
        <CodeEditor code={GENERATE_CODE} language="java" height={220} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — pick the correct call</h3>
        <p className="text-sm mb-3">
          Which line correctly validates the response body against a JSON schema file?
        </p>
        <div className="space-y-2">
          {OPTIONS.map((o, i) => {
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
                .body({o.text})
              </motion.div>
            );
          })}
        </div>
        <HintBox hints={[
          "The method is a static import from io.restassured.module.jsv.JsonSchemaValidator.",
          "It's called matchesJsonSchema() — like an equalTo() but for schemas.",
          "The correct answer uses matchesJsonSchema(new File(...)).",
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
          <li>Add <code className="text-orange-300">json-schema-validator</code> dependency to pom.xml</li>
          <li>Store schemas in <code className="text-orange-300">src/test/resources/schemas/</code></li>
          <li>Import <code className="text-orange-300">matchesJsonSchema</code> statically and pass a File or InputStream</li>
          <li>Schema validation runs before your .body() assertions — fail fast</li>
          <li>Use online tools or IntelliJ to generate schemas from real responses</li>
        </ul>
      </Card>
    </motion.div>
  );
}
