"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const RAW = `// Approach 1: raw JSON string — fast but ugly to maintain
String body = "{ \\"title\\": \\"My Post\\", \\"userId\\": 42 }";

given()
    .contentType("application/json")  // ← MUST set this on POST
    .body(body)
.when()
    .post("https://jsonplaceholder.typicode.com/posts")
.then()
    .statusCode(201)
    .body("userId", equalTo(42));`;

const MAP = `// Approach 2: Map<String, Object> — RestAssured auto-serializes to JSON
Map<String, Object> body = new HashMap<>();
body.put("title", "My Post");
body.put("body", "Learning RestAssured");
body.put("userId", 42);

given()
    .contentType("application/json")
    .body(body)
.when()
    .post("https://jsonplaceholder.typicode.com/posts")
.then()
    .statusCode(201)
    .body("title", equalTo("My Post"))
    .body("userId", equalTo(42));`;

const POJO = `// Approach 3: POJO — type-safe, what real frameworks use
public class CreatePostRequest {
    public String title;
    public String body;
    public int userId;
    public CreatePostRequest(String title, String body, int userId) {
        this.title = title; this.body = body; this.userId = userId;
    }
}

// In the test:
CreatePostRequest req = new CreatePostRequest("My Post", "Hello", 42);

CreatePostResponse resp = given()
    .contentType("application/json")
    .body(req)
.when()
    .post("https://jsonplaceholder.typicode.com/posts")
.then()
    .statusCode(201)
    .extract().as(CreatePostResponse.class);

System.out.println("Created post id: " + resp.id);`;

const FORM = `// OAuth token request — NOT JSON, uses form-encoded
given()
    .contentType("application/x-www-form-urlencoded")
    .formParam("grant_type", "password")
    .formParam("username", "user@example.com")
    .formParam("password", "secret")
    .formParam("client_id", "my-client")
.when()
    .post("https://auth.example.com/token")
.then()
    .statusCode(200)
    .body("access_token", notNullValue());`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function PostModule({ onComplete, onXp }: Props) {
  const [body, setBody] = useState('{\n  "title": "My First Test",\n  "body": "Learning RestAssured",\n  "userId": 42\n}');
  const [respText, setRespText] = useState("Click Send to fire a real POST request.");
  const [meta, setMeta] = useState<{ status?: number; time?: number; error?: string }>({});
  const [loading, setLoading] = useState(false);

  // Exercise: identify the missing line
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  async function sendPost() {
    setLoading(true);
    setMeta({});
    const t0 = performance.now();
    try {
      const r = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const text = await r.text();
      const ms = Math.round(performance.now() - t0);
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setRespText(pretty);
      setMeta({ status: r.status, time: ms });
      onXp(20);
    } catch (e) {
      setMeta({ error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const choices = [
    { id: "a", text: '.header("Accept", "application/json")', correct: false },
    { id: "b", text: '.contentType("application/json")', correct: true },
    { id: "c", text: '.auth().basic("user","pass")', correct: false },
  ];

  function pick(c: typeof choices[number]) {
    setPicked(c.id);
    if (c.correct) {
      setFeedback({
        kind: "ok",
        msg: "✅ Right — without .contentType, the server gets text/plain and ignores your JSON body. +50 XP",
      });
      onXp(50);
      if (!done) {
        setDone(true);
        onComplete();
      }
    } else {
      setFeedback({
        kind: "err",
        msg: "❌ Try again — the server has no idea how to parse the body without this header.",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">📤 Lesson 6 — POST Requests</h2>
      <p className="text-muted mb-6">
        Creating resources — there are three ways to build the body, ranked from rough to senior.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Approach 1 — Raw JSON string</h3>
        <CodeEditor code={RAW} language="java" height={240} />
        <div className="mt-3 p-3 rounded bg-red-400/10 border-l-4 border-red-400 text-sm">
          <b>Don&apos;t do this in real projects.</b> Quotes need escaping, no compile-time validation,
          painful to refactor. Fine for a one-line script, terrible at scale.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Approach 2 — Map (good middle ground)</h3>
        <CodeEditor code={MAP} language="java" height={300} />
        <p className="text-sm mt-2 text-muted">
          RestAssured + Jackson auto-serialize the Map to JSON. No escaping, refactor-friendly.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Approach 3 — POJOs (what seniors use)</h3>
        <CodeEditor code={POJO} language="java" height={360} />
        <p className="text-sm mt-2">
          Type-safe both ways: request payload AND response deserialization. Refactor a field name
          and the compiler tells you every broken test.
        </p>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Special case — form-encoded POST (OAuth)</h3>
        <p className="text-sm mb-3">
          OAuth token endpoints don&apos;t accept JSON. They want{" "}
          <code className="text-orange-300">application/x-www-form-urlencoded</code> — use{" "}
          <code className="text-orange-300">.formParam()</code> instead of <code className="text-orange-300">.body()</code>:
        </p>
        <CodeEditor code={FORM} language="java" height={240} />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">📺 Live POST — edit the body, click send</h3>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full bg-[#0a0f24] border border-border focus:border-accent2 outline-none p-3 rounded-lg font-mono text-xs text-amber-300 min-h-[120px]"
        />
        <button
          onClick={sendPost}
          disabled={loading}
          className="mt-2 bg-gradient-to-br from-accent to-purple-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          {loading ? "Sending..." : "🚀 Send POST /posts"}
        </button>
        {(meta.status || meta.error) && (
          <div className="flex gap-4 text-xs mt-3 text-muted">
            {meta.status && (
              <span>
                <b className={meta.status < 400 ? "text-emerald-400" : "text-red-400"}>Status:</b>{" "}
                {meta.status}
              </span>
            )}
            {meta.time !== undefined && <span><b className="text-accent2">Time:</b> {meta.time}ms</span>}
            {meta.error && <span className="text-red-400">{meta.error}</span>}
          </div>
        )}
        <pre className="bg-black border border-border rounded-lg p-3 mt-3 font-mono text-xs text-emerald-400 max-h-72 overflow-y-auto whitespace-pre-wrap">
          {respText}
        </pre>
        <div className="text-xs mt-2 text-muted">
          💡 jsonplaceholder echoes your body back with a fresh <code className="text-orange-300">id</code>.
          Real APIs return whatever they create.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Spot the missing line</h3>
        <p className="text-sm mb-3">
          This POST returns 400 with an empty error response. The body looks fine. What&apos;s missing?
        </p>
        <pre className="bg-black rounded p-3 text-xs font-mono text-slate-300 mb-3 whitespace-pre">
{`Map<String, Object> body = new HashMap<>();
body.put("title", "X");

given()
    .body(body)                   // ← we set the body
.when()
    .post("/posts")
.then()
    .statusCode(201);             // ← but get 400 instead`}
        </pre>
        <div className="space-y-2">
          {choices.map((c) => {
            const state = picked === c.id ? (c.correct ? "ok" : "err") : "";
            return (
              <motion.div
                key={c.id}
                whileHover={!picked ? { scale: 1.01 } : {}}
                onClick={() => !picked && pick(c)}
                className={`p-3 rounded-lg cursor-pointer border-2 text-sm font-mono ${
                  state === "ok"
                    ? "border-accent2 bg-accent2/10"
                    : state === "err"
                    ? "border-red-400 bg-red-400/10"
                    : "border-transparent bg-panel2 hover:border-accent"
                }`}
              >
                <span className="font-bold mr-2 text-amber-300">{c.id.toUpperCase()})</span>
                {c.text}
              </motion.div>
            );
          })}
        </div>
        <HintBox
          hints={[
            "When you POST a body, the server needs to know HOW to parse it.",
            "Servers default to text/plain when no header tells them otherwise. JSON parsers won't touch text/plain.",
            "There's a one-liner shorthand for setting the Content-Type to application/json — what's it called?",
          ]}
        />
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg font-semibold text-sm ${
              feedback.kind === "ok"
                ? "bg-accent2/15 text-accent2 border border-accent2"
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
          <li>You can POST with a raw string, a Map, or a POJO — and know when to use each</li>
          <li>You always set <code className="text-orange-300">.contentType()</code> on POSTs</li>
          <li>You know form-encoded POSTs use <code className="text-orange-300">.formParam()</code>, not <code className="text-orange-300">.body()</code></li>
          <li>You can extract the response into a POJO with <code className="text-orange-300">.extract().as(Class)</code></li>
        </ul>
      </Card>
    </motion.div>
  );
}
