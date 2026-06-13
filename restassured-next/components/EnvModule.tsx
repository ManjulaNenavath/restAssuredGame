"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const CONFIG_CLASS = `// src/test/java/config/ApiConfig.java
public class ApiConfig {

    public static String baseUrl() {
        String env = System.getProperty("env", "dev");
        return switch (env) {
            case "prod"    -> "https://api.example.com";
            case "staging" -> "https://staging.api.example.com";
            default        -> "https://dev.api.example.com";
        };
    }

    public static String apiKey() {
        return System.getProperty("api.key",
            System.getenv().getOrDefault("API_KEY", "dev-key-123"));
    }
}

// Usage — mvn test -Denv=staging -Dapi.key=abc123
// BaseUri  → https://staging.api.example.com
// API key  → abc123`;

const SPEC_SETUP = `// @BeforeAll — reads config once per test run
@BeforeAll
static void buildSpec() {
    RestAssured.baseURI  = ApiConfig.baseUrl();
    RestAssured.basePath = "/api/v1";

    BASE_SPEC = new RequestSpecBuilder()
        .addHeader("X-API-Key", ApiConfig.apiKey())
        .addHeader("Accept", "application/json")
        .setContentType("application/json")
        .log().ifValidationFails()
        .build();
}`;

const SUREFIRE_PROFILE = `<!-- pom.xml — Maven profiles for each environment -->
<profiles>
    <profile>
        <id>dev</id>
        <activation><activeByDefault>true</activeByDefault></activation>
        <properties>
            <env>dev</env>
            <api.base>https://dev.api.example.com</api.base>
        </properties>
    </profile>
    <profile>
        <id>staging</id>
        <properties>
            <env>staging</env>
            <api.base>https://staging.api.example.com</api.base>
        </properties>
    </profile>
    <profile>
        <id>prod</id>
        <properties>
            <env>prod</env>
            <api.base>https://api.example.com</api.base>
        </properties>
    </profile>
</profiles>

<!-- Run staging tests: mvn test -Pstaging -->`;

const SUREFIRE_PASS = `<!-- Pass system properties from Maven to JUnit via Surefire -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <systemPropertyVariables>
            <env>\${env}</env>
            <api.base>\${api.base}</api.base>
        </systemPropertyVariables>
    </configuration>
</plugin>`;

const CI_ENV = `# GitHub Actions — pass secrets as env vars
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run API tests (staging)
        env:
          API_KEY: \${{ secrets.STAGING_API_KEY }}
        run: mvn test -Pstaging -Dapi.key=\$API_KEY`;

const QUIZ_OPTIONS = [
  { text: "System.getProperty(\"env\", \"dev\")", correct: true },
  { text: "env.getProperty(\"env\")", correct: false },
  { text: "System.getEnv(\"env\", \"dev\")", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function EnvModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (QUIZ_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Right — System.getProperty() reads JVM properties set with -D flags. The second arg is the fallback default. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That doesn't exist or has wrong syntax. The Java standard library method is System.getProperty(key, defaultValue)." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🌍 Lesson 13 — Multi-Environment Config</h2>
      <p className="text-muted mb-6">
        One test suite, three environments — dev, staging, prod — without changing a single line of test code.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The goal</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {["dev", "staging", "prod"].map((env) => (
            <div key={env} className="bg-panel2 border border-border rounded p-3 text-center">
              <div className="font-mono text-accent2 font-bold mb-1">-P{env}</div>
              <div className="text-muted">{env}.api.example.com</div>
            </div>
          ))}
        </div>
        <p className="text-sm mt-3 text-muted">
          Same tests, different base URLs and credentials. Toggle with a Maven profile flag — no code changes.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">ApiConfig — read from system properties</h3>
        <CodeEditor code={CONFIG_CLASS} language="java" height={360} />
        <ConsoleOutput lines={[
          "> mvn test -Denv=staging -Dapi.key=abc123",
          "[INFO] env=staging → base URL: https://staging.api.example.com",
          "[INFO] api.key=abc123 (from -D flag)",
          "[INFO] Tests running against STAGING ...",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Wire config into RequestSpecification</h3>
        <CodeEditor code={SPEC_SETUP} language="java" height={260} />
        <p className="text-sm mt-2 text-muted">
          Setting <code className="text-orange-300">RestAssured.baseURI</code> is a global default — you can still override per-test with <code className="text-orange-300">given().baseUri()</code>.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Maven profiles — one flag switches everything</h3>
        <CodeEditor code={SUREFIRE_PROFILE} language="xml" height={380} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Pass profile properties to JUnit via Surefire</h3>
        <CodeEditor code={SUREFIRE_PASS} language="xml" height={260} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">CI/CD — secrets as environment variables</h3>
        <CodeEditor code={CI_ENV} language="yaml" height={240} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Security:</b> never commit API keys to the repo. Store them as CI secrets and read via <code className="text-orange-300">System.getenv("API_KEY")</code>.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — read a system property</h3>
        <p className="text-sm mb-3">
          Which Java call reads the <code className="text-orange-300">env</code> system property with <code className="text-orange-300">&quot;dev&quot;</code> as default?
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
          "Java system properties are set with -D flags: mvn test -Denv=staging",
          "The standard library class is java.lang.System.",
          "System.getProperty(key, defaultValue) — two args for a fallback.",
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
          <li>Use <code className="text-orange-300">System.getProperty(key, default)</code> to read -D flags</li>
          <li>Create an <code className="text-orange-300">ApiConfig</code> class to centralize env logic</li>
          <li>Define Maven profiles in pom.xml; switch with <code className="text-orange-300">-P&lt;profile&gt;</code></li>
          <li>Use Surefire&apos;s <code className="text-orange-300">systemPropertyVariables</code> to forward profile props to tests</li>
          <li>Read secrets from <code className="text-orange-300">System.getenv()</code> — never hardcode in source</li>
        </ul>
      </Card>
    </motion.div>
  );
}
