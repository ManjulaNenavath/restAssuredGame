"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";

const SSL_CODE = `// Option A — relax SSL validation (dev/test only, NEVER prod)
given()
    .relaxedHTTPSValidation()    // accept self-signed certs
.when()
    .get("https://dev.example.com/api/users")
.then()
    .statusCode(200);

// Option B — set globally for all tests
@BeforeAll
static void disableSslForDev() {
    RestAssured.useRelaxedHTTPSValidation();
}

// Option C — proper SSL with your own truststore (prod-grade)
given()
    .keyStore("/path/to/keystore.jks", "keystorePassword")
    .trustStore("/path/to/truststore.jks", "truststorePassword")
.when()
    .get("https://api.example.com/secure")
.then()
    .statusCode(200);`;

const HEADERS_CODE = `// Setting request headers
given()
    .header("Accept",          "application/json")
    .header("X-Request-ID",    UUID.randomUUID().toString())
    .header("X-Api-Version",   "2024-01-01")
    .header("Authorization",   "Bearer " + token)
.when()
    .get("/products")
.then()
    .statusCode(200);

// Reading response headers
Response r = given().when().get("/products").then().extract().response();

String contentType  = r.getHeader("Content-Type");
String requestId    = r.getHeader("X-Request-ID");
String rateLimit    = r.getHeader("X-RateLimit-Remaining");

System.out.println("Content-Type : " + contentType);
System.out.println("Rate limit   : " + rateLimit + " remaining");

// Assert a response header exists
.then()
    .header("Content-Type", containsString("application/json"))
    .header("Cache-Control", notNullValue());`;

const COOKIES_CODE = `// Sending cookies
given()
    .cookie("session_id", "abc123xyz")
    .cookie("preferences", "lang=en;theme=dark")
.when()
    .get("/dashboard")
.then()
    .statusCode(200);

// Reading cookies from a login response
Response loginResp = given()
    .body(credentials).contentType("application/json")
    .when().post("/login")
    .then().statusCode(200).extract().response();

String sessionCookie = loginResp.getCookie("session_id");
System.out.println("Got session: " + sessionCookie);

// Reuse the cookie in next requests
given()
    .cookie("session_id", sessionCookie)
.when()
    .get("/profile")
.then()
    .statusCode(200);`;

const BASIC_AUTH = `// Basic Auth (username:password encoded in header)
given()
    .auth().basic("admin", "password123")
.when()
    .get("/admin/users")
.then()
    .statusCode(200);

// Preemptive — sends auth without waiting for 401 challenge
given()
    .auth().preemptive().basic("admin", "password123")
.when()
    .get("/admin/users")
.then()
    .statusCode(200);

// Digest Auth
given()
    .auth().digest("user", "pass")
.when()
    .get("/digest-protected")
.then()
    .statusCode(200);`;

const QUIZ_OPTIONS = [
  { text: ".relaxedHTTPSValidation()", correct: true },
  { text: ".ignoreSSL(true)", correct: false },
  { text: ".trustAll()", correct: false },
];

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function SslModule({ onComplete, onXp }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (QUIZ_OPTIONS[idx].correct) {
      setFeedback({ kind: "ok", msg: "✅ Correct — .relaxedHTTPSValidation() accepts self-signed certs. Only use in dev/test. +50 XP" });
      onXp(50);
      if (!done) { setDone(true); onComplete(); }
    } else {
      setFeedback({ kind: "err", msg: "❌ That method doesn't exist in RestAssured. The real one is .relaxedHTTPSValidation()." });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="text-3xl font-bold gradient-text mb-2">🍪 Lesson 14 — SSL, Headers &amp; Cookies</h2>
      <p className="text-muted mb-6">
        Handle HTTPS, set and assert custom headers, and manage session cookies.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">SSL — dev environments use self-signed certs</h3>
        <CodeEditor code={SSL_CODE} language="java" height={380} />
        <div className="mt-3 p-3 rounded bg-red-400/10 border-l-4 border-red-400 text-sm">
          <b>Never use relaxedHTTPSValidation() against production.</b> It disables certificate verification completely — a man-in-the-middle attack would succeed silently.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Headers — send and assert</h3>
        <CodeEditor code={HEADERS_CODE} language="java" height={440} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Cookies — session management</h3>
        <CodeEditor code={COOKIES_CODE} language="java" height={380} />
        <p className="text-sm mt-2 text-muted">
          This pattern — login → extract cookie → reuse cookie — is how you test authenticated flows without OAuth.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Basic &amp; Digest Auth</h3>
        <CodeEditor code={BASIC_AUTH} language="java" height={300} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Preemptive</b> auth sends the Authorization header with every request. Non-preemptive waits for a 401 challenge first — adds an extra round trip.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — trust self-signed cert</h3>
        <p className="text-sm mb-3">
          Your dev HTTPS endpoint uses a self-signed certificate. Which <code className="text-orange-300">given()</code> method bypasses SSL validation?
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
                given().{o.text}
              </motion.div>
            );
          })}
        </div>
        <HintBox hints={[
          "The method name describes what it does: it makes HTTPS validation 'relaxed'.",
          "Look at the SSL code example — the method is there on the first line.",
          "The answer is .relaxedHTTPSValidation().",
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
          <li>Use <code className="text-orange-300">.relaxedHTTPSValidation()</code> for self-signed certs in dev — never in prod</li>
          <li>Use <code className="text-orange-300">.header(name, value)</code> to set request headers</li>
          <li>Assert response headers with <code className="text-orange-300">.then().header(name, matcher)</code></li>
          <li>Use <code className="text-orange-300">.cookie(name, value)</code> to send cookies and <code className="text-orange-300">getCookie()</code> to extract them</li>
          <li>Use <code className="text-orange-300">.auth().preemptive().basic()</code> for Basic Auth without the extra round-trip</li>
        </ul>
      </Card>
    </motion.div>
  );
}
