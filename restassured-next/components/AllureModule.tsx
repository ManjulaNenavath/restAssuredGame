"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const ALLURE_DEP = `<!-- pom.xml — Allure for RestAssured + JUnit 5 -->
<dependency>
    <groupId>io.qameta.allure</groupId>
    <artifactId>allure-rest-assured</artifactId>
    <version>2.27.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>io.qameta.allure</groupId>
    <artifactId>allure-junit5</artifactId>
    <version>2.27.0</version>
    <scope>test</scope>
</dependency>

<!-- Surefire — tell it where to find the Allure agent -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <argLine>
            -javaagent:\${settings.localRepository}/org/aspectj/aspectjweaver/1.9.22/aspectjweaver-1.9.22.jar
        </argLine>
    </configuration>
</plugin>`;

const FILTER_CODE = `// Attach all HTTP traffic to Allure — one line in @BeforeAll
import io.qameta.allure.restassured.AllureRestAssured;

@BeforeAll
static void configureAllure() {
    RestAssured.filters(new AllureRestAssured());
    // Every request and response is now captured in the report
}`;

const ANNOTATIONS = `// Enrich your tests with Allure metadata
@Test
@Epic("Order Management")
@Feature("Order Creation")
@Story("Happy path — valid product and quantity")
@Description("POST /orders with a valid payload should return 201 and an orderId")
@Severity(SeverityLevel.CRITICAL)
@Owner("Manjula")
public void createOrder_happyPath() {
    Allure.step("Prepare order payload", () -> {
        // code here logged as a sub-step in the report
    });

    Allure.step("Send POST /orders", () -> {
        given(authSpec)
            .body(orderPayload)
            .when().post("/orders")
            .then().statusCode(201)
            .body("orderId", notNullValue());
    });
}`;

const ATTACH_CODE = `// Attach custom data to the report
@After
public void attachResponseOnFailure(Scenario scenario) {
    if (scenario.isFailed()) {
        // Attach the raw response body to the failed scenario
        Response r = TestContext.getLastResponse();
        if (r != null) {
            Allure.addAttachment(
                "Failed Response",
                "application/json",
                r.asString()
            );
        }
    }
}

// Attach a screenshot, log, or any file:
Allure.addAttachment("Request payload", "application/json", requestBody);
Allure.addAttachment("Error log", "text/plain", errorLog);`;

const GENERATE_CMDS = `# Run tests and generate Allure report
mvn test

# Serve the interactive report (auto-opens browser)
allure serve target/allure-results

# Or generate static HTML
allure generate target/allure-results -o target/allure-report --clean
open target/allure-report/index.html`;

const CUCUMBER_PLUGIN = `// Cucumber runner — add Allure plugin
@ConfigurationParameter(
    key   = PLUGIN_PROPERTY_NAME,
    value = "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm, " +
            "pretty, " +
            "html:target/cucumber-report.html"
)
public class CucumberRunner {}

// That's it — every Gherkin step appears as a step in Allure`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function AllureModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/['"().]/g, "").replace("new ", "").replace("allurerestassured", "allurerestassured");
    if (v === "allurerestassured" || v.includes("allurerestassured")) {
      setFeedback({ kind: "ok", msg: "✅ Right — new AllureRestAssured() is the filter that captures all HTTP traffic for Allure reports. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not quite. The class is AllureRestAssured — add it via RestAssured.filters(new AllureRestAssured())." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">📊 Lesson 21 — Allure Reports</h2>
      <p className="text-muted mb-6">
        Turn raw JUnit output into a visual, interactive report your whole team can read.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">What Allure gives you</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: "📈", title: "Timeline view", desc: "See which tests ran in parallel and for how long" },
            { icon: "🔍", title: "Request/response logs", desc: "Full HTTP traffic attached to each test" },
            { icon: "🏷️", title: "Epic/Feature/Story", desc: "Organize tests by business area" },
            { icon: "🔁", title: "History & trends", desc: "Pass rate over time across runs" },
          ].map((f) => (
            <div key={f.icon} className="bg-panel2 rounded p-3">
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="font-bold text-accent2 text-xs mb-1">{f.title}</div>
              <div className="text-muted text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 1 — add dependencies</h3>
        <CodeEditor code={ALLURE_DEP} language="xml" height={400} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 2 — attach HTTP traffic automatically</h3>
        <CodeEditor code={FILTER_CODE} language="java" height={180} />
        <ConsoleOutput lines={[
          "AllureRestAssured filter active — capturing all requests",
          "POST /orders → 201 — attached to test #3",
          "GET  /users/1 → 200 — attached to test #7",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 3 — annotate tests for rich reporting</h3>
        <CodeEditor code={ANNOTATIONS} language="java" height={400} />
        <p className="text-sm mt-2 text-muted">
          @Epic → @Feature → @Story creates a hierarchy in the report. @Severity tells Allure which failures to highlight red.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Attach custom data on failure</h3>
        <CodeEditor code={ATTACH_CODE} language="java" height={300} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Cucumber integration — one plugin line</h3>
        <CodeEditor code={CUCUMBER_PLUGIN} language="java" height={240} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Generate the report</h3>
        <CodeEditor code={GENERATE_CMDS} language="bash" height={200} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — name the filter class</h3>
        <p className="text-sm mb-3">
          What class do you pass to <code className="text-orange-300">RestAssured.filters()</code> to capture all HTTP traffic for Allure?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-muted">RestAssured.filters(new </span>
          <input
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="???"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-48 text-amber-300"
          />
          <span className="text-muted">());</span>
        </div>
        <button
          onClick={check}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox hints={[
          "The class is in the allure-rest-assured artifact.",
          "Its name combines 'Allure' and 'RestAssured'.",
          "The answer is AllureRestAssured.",
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
          <li>Add <code className="text-orange-300">allure-rest-assured</code> and <code className="text-orange-300">allure-junit5</code> to pom.xml</li>
          <li>Register <code className="text-orange-300">new AllureRestAssured()</code> via <code className="text-orange-300">RestAssured.filters()</code> in @BeforeAll</li>
          <li>Annotate tests with <code className="text-orange-300">@Epic/@Feature/@Story/@Severity</code> for rich reports</li>
          <li>Use <code className="text-orange-300">Allure.addAttachment()</code> to attach responses on failure</li>
          <li>Run <code className="text-orange-300">allure serve target/allure-results</code> to view the report</li>
        </ul>
      </Card>
    </motion.div>
  );
}
