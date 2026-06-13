"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const TAG_FEATURE = `@regression
Feature: Product API

  @smoke @critical
  Scenario: Get product list returns 200
    When I GET "/products"
    Then the response status is 200

  @smoke
  Scenario: Create product returns 201
    When I POST to "/products" with valid payload
    Then the response status is 201

  @slow @regression
  Scenario: Bulk import 500 products
    Given 500 products in the import payload
    When I POST to "/products/bulk"
    Then the response status is 202

  @skip
  Scenario: Delete product (not implemented yet)
    When I DELETE "/products/1"
    Then the response status is 200`;

const RUN_BY_TAG = `# Run only @smoke tests (fast, CI gate)
mvn test -Dcucumber.filter.tags="@smoke"

# Run @regression but NOT @slow (nightly build)
mvn test -Dcucumber.filter.tags="@regression and not @slow"

# Run @critical OR @smoke (broad safety net)
mvn test -Dcucumber.filter.tags="@critical or @smoke"

# Skip anything tagged @skip
mvn test -Dcucumber.filter.tags="not @skip"

# Run a specific scenario by tag (debugging)
mvn test -Dcucumber.filter.tags="@JIRA-4521"`;

const RUNNER_TAGS = `// Bake a default tag filter into the runner
@ConfigurationParameter(
    key   = FILTER_TAGS_PROPERTY_NAME,
    value = "not @skip and not @wip"   // ← default for every run
)
public class CucumberRunner {}

// Override from command line:
// mvn test -Dcucumber.filter.tags="@smoke"
// The -D flag overrides the @ConfigurationParameter value`;

const CI_PIPELINE = `# GitHub Actions — three jobs, three tag filters
jobs:
  smoke:
    name: Smoke Tests (every push)
    runs-on: ubuntu-latest
    steps:
      - run: mvn test -Dcucumber.filter.tags="@smoke"

  regression:
    name: Regression (nightly)
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: mvn test -Dcucumber.filter.tags="@regression and not @slow"

  full:
    name: Full Suite (release branch)
    if: startsWith(github.ref, 'refs/heads/release/')
    runs-on: ubuntu-latest
    steps:
      - run: mvn test -Dcucumber.filter.tags="not @skip"`;

const TAG_STRATEGY = [
  { tag: "@smoke", when: "Every PR push — must pass in < 2 min", color: "text-emerald-400" },
  { tag: "@regression", when: "Nightly build — full business flow coverage", color: "text-accent2" },
  { tag: "@critical", when: "Production deployment gate — highest risk areas", color: "text-red-400" },
  { tag: "@slow", when: "Excluded from smoke/regression — run on demand", color: "text-amber-400" },
  { tag: "@skip / @wip", when: "Permanently excluded — broken or unimplemented", color: "text-muted" },
];

const ANS_OPTIONS = [
  { text: 'mvn test -Dcucumber.filter.tags="@smoke"', correct: true },
  { text: 'mvn test --tags=@smoke', correct: false },
  { text: 'mvn test -Dtags=smoke', correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function TagsModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (ANS_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Correct — the system property is cucumber.filter.tags, passed with -D. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That flag doesn't exist. The correct system property is -Dcucumber.filter.tags." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🏷️ Lesson 16 — Tags &amp; CI Filtering</h2>
      <p className="text-muted mb-6">
        Tags let you run exactly the tests you need — smoke on every PR, full regression at night.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Tags in feature files</h3>
        <CodeEditor code={TAG_FEATURE} language="gherkin" height={360} />
        <p className="text-sm mt-2 text-muted">
          Tags go directly above <code className="text-orange-300">Feature:</code> or <code className="text-orange-300">Scenario:</code>. A scenario inherits its Feature&apos;s tags.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Filtering by tags from the CLI</h3>
        <CodeEditor code={RUN_BY_TAG} language="bash" height={280} />
        <ConsoleOutput lines={[
          '> mvn test -Dcucumber.filter.tags="@smoke"',
          "Feature: Product API",
          "  [smoke] Get product list returns 200 ........... PASSED",
          "  [smoke] Create product returns 201 ............. PASSED",
          "2 scenarios (2 passed) — skipped 2 — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Set a default filter in the runner</h3>
        <CodeEditor code={RUNNER_TAGS} language="java" height={240} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Tag strategy — what goes where</h3>
        <div className="space-y-2">
          {TAG_STRATEGY.map((t) => (
            <div key={t.tag} className="flex items-start gap-3 p-2 bg-panel2 rounded text-sm">
              <code className={`font-bold shrink-0 ${t.color}`}>{t.tag}</code>
              <span className="text-muted">{t.when}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">CI pipeline — three jobs, three filters</h3>
        <CodeEditor code={CI_PIPELINE} language="yaml" height={380} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>The goal:</b> fast feedback on every commit (@smoke), thorough coverage every night (@regression), zero surprises on release (@not @skip).
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — run only @smoke tests</h3>
        <p className="text-sm mb-3">Which Maven command runs only scenarios tagged <code className="text-orange-300">@smoke</code>?</p>
        <div className="space-y-2">
          {ANS_OPTIONS.map((o, i) => {
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
          "System properties in Maven are set with -Dkey=value.",
          "The Cucumber property for tag filtering is named cucumber.filter.tags.",
          'The answer is: mvn test -Dcucumber.filter.tags="@smoke"',
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
          <li>Tags go above Feature or Scenario — scenarios inherit feature-level tags</li>
          <li>Filter with <code className="text-orange-300">-Dcucumber.filter.tags="@tag"</code></li>
          <li>Boolean logic: <code className="text-orange-300">and</code>, <code className="text-orange-300">or</code>, <code className="text-orange-300">not</code></li>
          <li>Set a default filter in the runner — override from CLI</li>
          <li>@smoke = fast gate, @regression = nightly, @skip = excluded</li>
        </ul>
      </Card>
    </motion.div>
  );
}
