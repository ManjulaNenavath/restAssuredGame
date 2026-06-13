"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const FLOW_STEPS = [
  { n: 1, title: "POST /token", desc: "Exchange credentials for a Bearer token (password grant)", color: "text-pink-400" },
  { n: 2, title: "Extract token", desc: "Pull access_token from the response body", color: "text-amber-400" },
  { n: 3, title: "Use token", desc: "Add Authorization: Bearer <token> to all protected requests", color: "text-accent2" },
  { n: 4, title: "Refresh / re-auth", desc: "Token expires — re-fetch in @BeforeAll or on 401", color: "text-blue-400" },
];

const TOKEN_CODE = `// Step 1: fetch a token (password grant)
// ── this is form-encoded, NOT JSON ──
String token = given()
    .contentType("application/x-www-form-urlencoded")
    .formParam("grant_type", "password")
    .formParam("username",   System.getProperty("api.user", "test@example.com"))
    .formParam("password",   System.getProperty("api.pass", "secret"))
    .formParam("client_id",  "my-app")
    .formParam("scope",      "read write")
.when()
    .post("https://auth.example.com/oauth/token")
.then()
    .statusCode(200)
    .extract().path("access_token");

System.out.println("Token length: " + token.length());   // usually 200-500 chars`;

const USE_TOKEN = `// Step 2: store the token in a @BeforeAll, use in every test
private static String token;

@BeforeAll
static void authenticate() {
    token = given()
        .contentType("application/x-www-form-urlencoded")
        .formParam("grant_type", "client_credentials")
        .formParam("client_id",  "test-client")
        .formParam("client_secret", "secret")
    .when()
        .post("https://auth.example.com/oauth/token")
    .then().statusCode(200)
    .extract().path("access_token");
}

@Test
public void getProtectedUser() {
    given()
        .header("Authorization", "Bearer " + token)
    .when()
        .get("https://api.example.com/users/1")
    .then()
        .statusCode(200);
}`;

const SPEC_WITH_AUTH = `// Better: bake the token into a RequestSpecification
private static RequestSpecification authSpec;

@BeforeAll
static void authenticate() {
    String token = fetchToken();   // your helper

    authSpec = new RequestSpecBuilder()
        .setBaseUri("https://api.example.com")
        .addHeader("Authorization", "Bearer " + token)
        .addHeader("Accept", "application/json")
        .setContentType("application/json")
        .build();
}

@Test
public void getProducts() {
    given(authSpec).when().get("/products").then().statusCode(200);
}

@Test
public void createOrder() {
    given(authSpec)
        .body(orderPayload)
        .when().post("/orders")
        .then().statusCode(201);
}`;

const HANDLE_401 = `// Handle expired tokens gracefully
@Test
public void retryOn401() {
    Response r = given(authSpec).when().get("/protected");

    if (r.statusCode() == 401) {
        // Token expired — re-authenticate
        authSpec = buildSpec(fetchToken());
        r = given(authSpec).when().get("/protected");
    }

    r.then().statusCode(200);
}

// Even better: use a RequestFilter to auto-refresh
// (advanced pattern — covered in the Architecture module)`;

const QUIZ_OPTIONS = [
  { text: "application/json", correct: false },
  { text: "application/x-www-form-urlencoded", correct: true },
  { text: "multipart/form-data", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function OAuthModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (QUIZ_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Correct — OAuth2 token endpoints expect form-encoded body, not JSON. +60 XP" });
      onXp(60);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ Token endpoints use form params, not JSON. The Content-Type must be application/x-www-form-urlencoded." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🔐 Lesson 12 — OAuth2 Bearer Token</h2>
      <p className="text-muted mb-6">
        Most real APIs are protected. Get the token once, inject it everywhere.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">The 4-step OAuth2 password flow</h3>
        <div className="space-y-2">
          {FLOW_STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3 p-3 bg-panel2 rounded-lg">
              <div className={`font-bold text-lg ${s.color} w-6 shrink-0`}>{s.n}</div>
              <div>
                <div className={`font-mono font-bold text-sm ${s.color}`}>{s.title}</div>
                <div className="text-muted text-xs mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 1 — fetch the token</h3>
        <CodeEditor code={TOKEN_CODE} language="java" height={320} />
        <ConsoleOutput lines={[
          "Token length: 312",
          "(eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...)",
        ]} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Never hardcode credentials.</b> Use <code className="text-orange-300">System.getProperty()</code> or environment variables. Pass secrets via <code className="text-orange-300">mvn test -Dapi.pass=secret</code>.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 2 — use the token in tests</h3>
        <CodeEditor code={USE_TOKEN} language="java" height={360} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Step 3 — bake into RequestSpecification (best practice)</h3>
        <CodeEditor code={SPEC_WITH_AUTH} language="java" height={380} />
        <p className="text-sm mt-2 text-muted">
          Now every test gets auth automatically. Rotate the token by updating <code className="text-orange-300">authSpec</code> in one place.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Handling token expiry</h3>
        <CodeEditor code={HANDLE_401} language="java" height={280} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — correct Content-Type for token request</h3>
        <p className="text-sm mb-3">
          What <code className="text-orange-300">contentType</code> must you use when POSTing to an OAuth2 token endpoint?
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
          "OAuth2 token endpoints do NOT accept JSON — they are old-school HTML form style.",
          "The grant_type, username, and password are sent as form params, not a JSON body.",
          "Content-Type: application/x-www-form-urlencoded — the same format browsers use for login forms.",
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
          <li>Token endpoints use <code className="text-orange-300">application/x-www-form-urlencoded</code> — not JSON</li>
          <li>Use <code className="text-orange-300">.formParam()</code> for the grant params</li>
          <li>Fetch the token in <code className="text-orange-300">@BeforeAll</code> — once per test class</li>
          <li>Store the token in a <code className="text-orange-300">RequestSpecification</code> so all tests inherit it</li>
          <li>Pass credentials via system properties, never hardcode them</li>
        </ul>
      </Card>
    </motion.div>
  );
}
