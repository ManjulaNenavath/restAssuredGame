"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const FEATURE_FILE = `# src/test/resources/features/user_management.feature

Feature: User Management API
  As a client application
  I want to manage users via REST
  So that I can create and retrieve user records

  Background:
    Given the API is authenticated with a valid token

  Scenario: Get existing user
    When I GET "/users/1"
    Then the response status is 200
    And the response contains field "name" with value "Leanne Graham"

  Scenario: Create a new user
    Given I have the request body:
      """
      {
        "name": "Bob Smith",
        "email": "bob@example.com"
      }
      """
    When I POST to "/users"
    Then the response status is 201
    And the response contains field "id"

  Scenario Outline: Get user by ID returns correct name
    When I GET "/users/<id>"
    Then the response status is 200
    And the field "id" equals <id>

    Examples:
      | id |
      | 1  |
      | 2  |
      | 3  |`;

const STEP_DEFS = `// src/test/java/steps/UserSteps.java
@CucumberContextConfiguration
@ContextConfiguration(classes = TestConfig.class)
public class UserSteps {

    private Response lastResponse;

    @Given("the API is authenticated with a valid token")
    public void authenticate() {
        RestAssured.requestSpecification = ApiSpec.buildAuthSpec();
    }

    @When("I GET {string}")
    public void iGet(String path) {
        lastResponse = given().when().get(path).then().extract().response();
    }

    @When("I POST to {string}")
    public void iPost(String path) {
        lastResponse = given()
            .contentType("application/json")
            .body(requestBody)
            .when().post(path)
            .then().extract().response();
    }

    @Then("the response status is {int}")
    public void statusIs(int expectedStatus) {
        assertThat(lastResponse.statusCode()).isEqualTo(expectedStatus);
    }

    @Then("the response contains field {string} with value {string}")
    public void fieldEquals(String field, String value) {
        assertThat(lastResponse.<String>path(field)).isEqualTo(value);
    }

    @Then("the response contains field {string}")
    public void fieldExists(String field) {
        assertThat(lastResponse.path(field)).isNotNull();
    }
}`;

const RUNNER = `// src/test/java/runner/CucumberRunner.java
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "steps,config")
@ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value = "not @skip")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME,
    value = "pretty, html:target/cucumber-report.html, " +
            "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm")
public class CucumberRunner {}`;

const OUTLINE_EXPLAINED = `# Scenario Outline — parameterized test
Scenario Outline: Verify product price
  When I GET "/products/<productId>"
  Then the price should be <expectedPrice>

  Examples:
    | productId | expectedPrice |
    | PROD-001  | 9.99          |
    | PROD-002  | 24.99         |
    | PROD-003  | 4.49          |

# This generates 3 separate test scenarios automatically.
# Each row in Examples becomes one test case.`;

const FILL_OPTIONS = [
  { text: "Scenario Outline", correct: true },
  { text: "Scenario Template", correct: false },
  { text: "Data Scenario", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function FeatureModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (FILL_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Right — Scenario Outline with an Examples table generates one test per row. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Not a Gherkin keyword. The correct keyword is 'Scenario Outline' paired with an 'Examples' table." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">📝 Lesson 15 — Feature Files &amp; Outlines</h2>
      <p className="text-muted mb-6">
        Write tests in plain English with Cucumber — business stakeholders can read them, developers can run them.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Anatomy of a Feature file</h3>
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          {[
            { kw: "Feature:", desc: "The capability being tested — one per file" },
            { kw: "Background:", desc: "Steps that run before every Scenario in this file" },
            { kw: "Scenario:", desc: "One test case — a specific behavior" },
            { kw: "Scenario Outline:", desc: "Parameterized scenario — one row = one test" },
            { kw: "Given/When/Then:", desc: "BDD steps — setup, action, assertion" },
            { kw: "Examples:", desc: "Data table paired with Scenario Outline" },
          ].map((r) => (
            <div key={r.kw} className="bg-panel2 rounded p-2">
              <code className="text-pink-400 font-bold">{r.kw}</code>
              <div className="text-muted mt-1">{r.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">A real feature file</h3>
        <CodeEditor code={FEATURE_FILE} language="gherkin" height={520} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step definitions — connecting Gherkin to RestAssured</h3>
        <CodeEditor code={STEP_DEFS} language="java" height={500} />
        <ConsoleOutput lines={[
          "> mvn test -Dcucumber.filter.tags=\"@smoke\"",
          "Feature: User Management API",
          "  Scenario: Get existing user ............. PASSED (0.84s)",
          "  Scenario: Create a new user ............. PASSED (1.12s)",
          "  Scenario Outline [1] id=1 .............. PASSED",
          "  Scenario Outline [2] id=2 .............. PASSED",
          "  Scenario Outline [3] id=3 .............. PASSED",
          "5 scenarios (5 passed) — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Scenario Outline — data-driven testing</h3>
        <CodeEditor code={OUTLINE_EXPLAINED} language="gherkin" height={260} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Rule of thumb:</b> if you need to test the same flow with different inputs, use Scenario Outline. If each scenario has different steps, write separate Scenarios.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The Cucumber runner</h3>
        <CodeEditor code={RUNNER} language="java" height={260} />
        <p className="text-sm mt-2 text-muted">
          This is the JUnit 5 Platform runner. It discovers all <code className="text-orange-300">.feature</code> files and pairs them with step definitions in the <code className="text-orange-300">glue</code> packages.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — parameterized scenario keyword</h3>
        <p className="text-sm mb-3">
          Which Gherkin keyword do you use to run the same scenario with multiple sets of data?
        </p>
        <div className="space-y-2">
          {FILL_OPTIONS.map((o, i) => {
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
          "The keyword has two words and replaces 'Scenario' in the feature file.",
          "It's always paired with an 'Examples:' table below it.",
          "The answer is 'Scenario Outline'.",
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
          <li>Feature files live in <code className="text-orange-300">src/test/resources/features/</code></li>
          <li>Step definitions are Java classes with <code className="text-orange-300">@Given/@When/@Then</code> annotations</li>
          <li><code className="text-orange-300">Background</code> steps run before every Scenario in the file</li>
          <li><code className="text-orange-300">Scenario Outline</code> + <code className="text-orange-300">Examples</code> = data-driven testing</li>
          <li>The Cucumber runner auto-discovers features and glue packages</li>
        </ul>
      </Card>
    </motion.div>
  );
}
