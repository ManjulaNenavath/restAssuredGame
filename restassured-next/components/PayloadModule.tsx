"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const POJO_CODE = `// ── Model classes (src/main/java/model/)
public class CreateOrderRequest {
    public String productId;
    public int quantity;
    public String currency;

    public CreateOrderRequest(String productId, int qty, String currency) {
        this.productId = productId;
        this.quantity  = qty;
        this.currency  = currency;
    }
}

public class CreateOrderResponse {
    public String orderId;
    public String status;
    public double total;
    public String createdAt;
}

// ── Test using the POJOs
@Test
public void createOrder_returns201WithOrderId() {
    CreateOrderRequest req = new CreateOrderRequest("PROD-001", 3, "USD");

    CreateOrderResponse resp = given(ApiSpec.BASE)
        .contentType("application/json")
        .body(req)
    .when()
        .post("/orders")
    .then()
        .statusCode(201)
        .extract().as(CreateOrderResponse.class);

    assertThat(resp.orderId).isNotBlank();
    assertThat(resp.status).isEqualTo("PENDING");
    System.out.println("Order created: " + resp.orderId + " total=" + resp.total);
}`;

const NESTED_CODE = `// Nested / complex payloads — still just POJOs
public class Address {
    public String street, city, country;
}

public class CreateUserRequest {
    public String name, email;
    public Address address;

    public CreateUserRequest(String name, String email, Address addr) {
        this.name    = name;
        this.email   = email;
        this.address = addr;
    }
}

// Build the nested object:
Address addr = new Address();
addr.street  = "123 Main St";
addr.city    = "London";
addr.country = "UK";

CreateUserRequest req = new CreateUserRequest("Alice", "alice@example.com", addr);

given(ApiSpec.BASE)
    .body(req)
    .contentType("application/json")
.when()
    .post("/users")
.then()
    .statusCode(201)
    .body("address.city", equalTo("London"));`;

const LOMBOK_CODE = `// Optional: Lombok @Builder — eliminates boilerplate constructors
// pom.xml: add lombok dependency + annotationProcessorPaths

@Data @Builder
public class CreateOrderRequest {
    private String productId;
    private int    quantity;
    private String currency;
}

// Test reads like a DSL:
CreateOrderRequest req = CreateOrderRequest.builder()
    .productId("PROD-001")
    .quantity(3)
    .currency("USD")
    .build();

given(ApiSpec.BASE).body(req).contentType("application/json")
    .when().post("/orders")
    .then().statusCode(201);`;

const DESERIALIZE_CODE = `// Deserializing a LIST of items from the response
List<Product> products = given(ApiSpec.BASE)
    .when().get("/products")
    .then().statusCode(200)
    .extract().jsonPath().getList(".", Product.class);

System.out.println("Product count: " + products.size());
products.forEach(p -> System.out.println(p.name + " — $" + p.price));`;

const QUIZ_OPTS = [
  { text: ".extract().body().asString()", correct: false },
  { text: ".extract().as(OrderResponse.class)", correct: true },
  { text: ".path(\"orderId\")", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function PayloadModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (QUIZ_OPTS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Correct — .extract().as(Class) deserializes the whole response body into your POJO. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That gives you text or a single field — you need the whole object deserialized." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🧬 Lesson 10 — JSON Payload Building</h2>
      <p className="text-muted mb-6">
        Send strongly typed request bodies and deserialize responses into real Java objects.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Simple POJO — request &amp; response pair</h3>
        <CodeEditor code={POJO_CODE} language="java" height={500} />
        <ConsoleOutput lines={[
          "Order created: ORD-48291 total=59.97",
          "[INFO] Tests run: 1, Failures: 0 — BUILD SUCCESS",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Nested payloads — POJO inside POJO</h3>
        <CodeEditor code={NESTED_CODE} language="java" height={420} />
        <p className="text-sm mt-2 text-muted">
          Jackson (used internally by RestAssured) serializes nested objects automatically. You never write JSON strings.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Lombok @Builder — senior shorthand</h3>
        <CodeEditor code={LOMBOK_CODE} language="java" height={320} />
        <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
          <b>Why Lombok?</b> No boilerplate getters/setters/constructors. The test code reads like a plain-English description of what you are sending.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Deserializing a list response</h3>
        <CodeEditor code={DESERIALIZE_CODE} language="java" height={200} />
        <ConsoleOutput lines={[
          "Product count: 12",
          "Widget A — $9.99",
          "Widget B — $14.49",
          "Gadget X — $29.99",
          "... (9 more)",
        ]} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — deserialize the response</h3>
        <p className="text-sm mb-3">
          You POST to <code className="text-orange-300">/orders</code> and want to read the response body
          into an <code className="text-orange-300">OrderResponse</code> POJO. Which extract call is correct?
        </p>
        <div className="space-y-2">
          {QUIZ_OPTS.map((o, i) => {
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
          "You need the whole response body as an object, not just one field.",
          ".extract() has an .as() method that takes a Class<T> argument.",
          "The answer is .extract().as(OrderResponse.class).",
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
          <li>Use POJOs for request bodies — Jackson auto-serializes them to JSON</li>
          <li>Use <code className="text-orange-300">.extract().as(Class)</code> to deserialize the response</li>
          <li>Nested objects work automatically — no special setup needed</li>
          <li>Add Lombok <code className="text-orange-300">@Builder</code> to remove constructor boilerplate</li>
          <li>Use <code className="text-orange-300">.jsonPath().getList(".", Class)</code> for array responses</li>
        </ul>
      </Card>
    </motion.div>
  );
}
