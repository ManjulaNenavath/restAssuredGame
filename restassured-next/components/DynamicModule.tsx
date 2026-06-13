"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const FAKER_DEP = `<!-- pom.xml — add Faker for generating realistic test data -->
<dependency>
    <groupId>net.datafaker</groupId>
    <artifactId>datafaker</artifactId>
    <version>2.1.0</version>
    <scope>test</scope>
</dependency>`;

const FAKER_CODE = `import net.datafaker.Faker;

public class TestData {
    private static final Faker faker = new Faker();

    public static CreateUserRequest randomUser() {
        return CreateUserRequest.builder()
            .name(faker.name().fullName())               // "Alice Johnson"
            .email(faker.internet().emailAddress())      // "alice.j82@example.net"
            .phone(faker.phoneNumber().phoneNumber())    // "+1-555-234-9876"
            .city(faker.address().city())                // "Springfield"
            .build();
    }

    public static CreateOrderRequest randomOrder(String productId) {
        return CreateOrderRequest.builder()
            .productId(productId)
            .quantity(faker.number().numberBetween(1, 10))
            .currency("USD")
            .build();
    }
}

// In your test:
@Test
public void createUser_withRandomData() {
    CreateUserRequest user = TestData.randomUser();
    System.out.println("Creating: " + user.getName() + " / " + user.getEmail());

    given(authSpec)
        .body(user).contentType("application/json")
        .when().post("/users")
        .then().statusCode(201)
        .body("name", equalTo(user.getName()));
}`;

const UUID_CODE = `// Use UUID when you need guaranteed uniqueness (not human-readable)
import java.util.UUID;

String uniqueEmail = "test+" + UUID.randomUUID() + "@example.com";
// → test+3f4a8b9c-2d1e-4f5a-8b9c-3d2e1f5a8b9c@example.com

// Useful for: unique usernames, idempotency keys, order references
String idempotencyKey = UUID.randomUUID().toString();

given(authSpec)
    .header("Idempotency-Key", idempotencyKey)
    .body(orderPayload)
    .when().post("/orders")
    .then().statusCode(201);

// Re-sending with the same key is safe — server deduplicates
given(authSpec)
    .header("Idempotency-Key", idempotencyKey)  // same key
    .body(orderPayload)
    .when().post("/orders")
    .then().statusCode(200);   // server returns the original response`;

const ASSUMPTION_CODE = `// @DisabledIf / assumeTrue — skip a test when a condition isn't met
import org.junit.jupiter.api.Assumptions;

@Test
public void createOrder_requiresInventory() {
    // Skip this test if the inventory service is down
    Response health = given().when().get("/inventory/health");
    Assumptions.assumeTrue(
        health.statusCode() == 200,
        "Skipping — inventory service is not available"
    );

    // Rest of test only runs when inventory is healthy
    given(authSpec).body(orderPayload)
        .when().post("/orders")
        .then().statusCode(201);
}

// Cucumber equivalent — @skip tag + @After hook check
@Before("@needsInventory")
public void checkInventoryService() {
    Response health = given().when().get("/inventory/health");
    Assume.assumeTrue(health.statusCode() == 200);
}`;

const DYNAMIC_CHAIN = `// Real-world pattern: create resource → use its ID in next call
@Test
public void orderCreatesCorrectInventoryDeduction() {
    // 1. Check initial stock
    int before = given(authSpec)
        .when().get("/products/PROD-001")
        .then().statusCode(200)
        .extract().path("stockCount");

    // 2. Place an order for quantity=3
    String orderId = given(authSpec)
        .body(new CreateOrderRequest("PROD-001", 3, "USD"))
        .contentType("application/json")
        .when().post("/orders")
        .then().statusCode(201)
        .extract().path("orderId");

    System.out.println("Order created: " + orderId);

    // 3. Stock should decrease by 3
    int after = given(authSpec)
        .when().get("/products/PROD-001")
        .then().statusCode(200)
        .extract().path("stockCount");

    assertThat(after).isEqualTo(before - 3);
}`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function DynamicModule({ onComplete, onXp }: Props) {
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function check() {
    const v = ans.trim().toLowerCase().replace(/['"]/g, "");
    if (v === "datafaker" || v === "net.datafaker" || v === "faker") {
      setFeedback({ kind: "ok", msg: "✅ Right — DataFaker (net.datafaker) generates realistic test data like names, emails, and phone numbers. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Close — the library used in this lesson is DataFaker (net.datafaker). JavaFaker is the older version." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🎲 Lesson 18 — Random Data &amp; Skip Tags</h2>
      <p className="text-muted mb-6">
        Generate realistic test data, guarantee uniqueness with UUIDs, and skip tests gracefully when preconditions aren&apos;t met.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Why random test data?</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-red-400/10 border border-red-400/30 rounded p-3">
            <div className="font-bold text-red-400 mb-1">Static data causes flakes</div>
            <ul className="text-muted space-y-1 text-xs">
              <li>email: &quot;test@example.com&quot; conflicts if already registered</li>
              <li>Hardcoded IDs break when another test deletes that record</li>
              <li>Parallel tests collide on the same username</li>
            </ul>
          </div>
          <div className="bg-emerald-400/10 border border-emerald-400/30 rounded p-3">
            <div className="font-bold text-emerald-400 mb-1">Dynamic data is safe</div>
            <ul className="text-muted space-y-1 text-xs">
              <li>Each test creates its own unique data</li>
              <li>No collisions — even in parallel runs</li>
              <li>Tests are independent and self-contained</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">DataFaker — realistic random data</h3>
        <CodeEditor code={FAKER_DEP} language="xml" height={140} />
        <CodeEditor code={FAKER_CODE} language="java" height={420} />
        <ConsoleOutput lines={[
          "Creating: Alice Johnson / alice.j82@example.net",
          "[INFO] Tests run: 1, Failures: 0 — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">UUID — guaranteed uniqueness</h3>
        <CodeEditor code={UUID_CODE} language="java" height={380} />
        <p className="text-sm mt-2 text-muted">
          UUID is built into Java — no dependency needed. Use it for fields that must be globally unique per test run.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Skip tests gracefully — Assumptions</h3>
        <CodeEditor code={ASSUMPTION_CODE} language="java" height={380} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>assumeTrue vs @Disabled:</b> <code className="text-orange-300">assumeTrue</code> skips at runtime based on a condition. <code className="text-orange-300">@Disabled</code> is a hard compile-time skip. Use assumeTrue when the reason is environmental (service down, feature flag off).
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Dynamic chaining — use created IDs in next calls</h3>
        <CodeEditor code={DYNAMIC_CHAIN} language="java" height={420} />
        <ConsoleOutput lines={[
          "Order created: ORD-48291",
          "Stock before: 50 → after: 47 (deducted 3)",
          "[INFO] Tests run: 1, Failures: 0 — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — name the test data library</h3>
        <p className="text-sm mb-3">
          What is the name of the Maven library (groupId or artifactId) used in this lesson to generate realistic fake data?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-muted">Library:</span>
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
          "Look at the Maven dependency at the top of this lesson.",
          "The artifactId is 'datafaker', the groupId is 'net.datafaker'.",
          "Either 'datafaker' or 'DataFaker' is accepted.",
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
          <li>Use DataFaker to generate realistic names, emails, phones — never reuse static test data</li>
          <li>Use <code className="text-orange-300">UUID.randomUUID()</code> for guaranteed-unique identifiers</li>
          <li>Use <code className="text-orange-300">Assumptions.assumeTrue()</code> to skip tests when external dependencies are unavailable</li>
          <li>Chain tests by extracting IDs from create calls and passing them to subsequent requests</li>
          <li>Random data + cleanup = tests that never conflict in parallel execution</li>
        </ul>
      </Card>
    </motion.div>
  );
}
