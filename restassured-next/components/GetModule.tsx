"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import CodeEditor from "./CodeEditor";
import Card from "./Card";
import HintBox from "./HintBox";
import ConsoleOutput from "./ConsoleOutput";

const BASIC_GET = `@Test
public void getUser_returnsLeanneGraham() {
    given()
        .header("Accept", "application/json")
    .when()
        .get("https://jsonplaceholder.typicode.com/users/1")
    .then()
        .statusCode(200)
        .body("name", equalTo("Leanne Graham"))
        .body("email", containsString("@"));
}`;

const EXTRACT = `// Method 1: extract a single field inline
String name = given()
    .when().get("https://jsonplaceholder.typicode.com/users/1")
    .then().statusCode(200)
    .extract().path("name");

System.out.println("Name: " + name);

// Method 2: extract the whole Response — useful when you need multiple fields
Response r = given()
    .when().get("https://jsonplaceholder.typicode.com/users/1")
    .then().statusCode(200)
    .extract().response();

String email   = r.path("email");
String city    = r.path("address.city");
int statusCode = r.getStatusCode();
String rawBody = r.getBody().asString();

System.out.println("Email:  " + email);
System.out.println("City:   " + city);
System.out.println("Status: " + statusCode);`;

const QUERY = `// Query params: ?userId=1&_limit=5
given()
    .queryParam("userId", 1)
    .queryParam("_limit", 5)
.when()
    .get("https://jsonplaceholder.typicode.com/posts")
.then()
    .statusCode(200)
    .body("size()", equalTo(5));

// Path params: /users/{id}
given()
    .pathParam("id", 2)
.when()
    .get("https://jsonplaceholder.typicode.com/users/{id}")
.then()
    .statusCode(200);`;

type Props = { onComplete: () => void; onXp: (n: number) => void };

export default function GetModule({ onComplete, onXp }: Props) {
  const [respText, setRespText] = useState<string>("Click 'Send request' to make a real call to jsonplaceholder.typicode.com");
  const [respMeta, setRespMeta] = useState<{ status?: number; time?: number; size?: number; error?: string }>({});
  const [loading, setLoading] = useState(false);
  const [extractedName, setExtractedName] = useState<string>("");

  // Exercise state
  const [titleAns, setTitleAns] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [done, setDone] = useState(false);

  async function sendLiveRequest() {
    setLoading(true);
    setRespMeta({});
    const t0 = performance.now();
    try {
      const r = await fetch("https://jsonplaceholder.typicode.com/users/1", {
        headers: { Accept: "application/json" },
      });
      const text = await r.text();
      const ms = Math.round(performance.now() - t0);
      let pretty = text;
      try {
        const parsed = JSON.parse(text);
        pretty = JSON.stringify(parsed, null, 2);
        setExtractedName(parsed.name || "");
      } catch {}
      setRespText(pretty);
      setRespMeta({ status: r.status, time: ms, size: text.length });
      onXp(20);
    } catch (e) {
      setRespText("");
      setRespMeta({ error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  function checkExercise() {
    const v = titleAns.trim().replace(/['"]/g, "");
    if (v === "title") {
      setFeedback({ kind: "ok", msg: "✅ Right — response.path(\"title\") extracts the title. +50 XP" });
      onXp(50);
      if (!done) {
        setDone(true);
        onComplete();
      }
    } else {
      setFeedback({
        kind: "err",
        msg: "❌ Not quite — what does the JSON field key look like for the title field?",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-2">📥 Lesson 5 — GET Requests</h2>
      <p className="text-muted mb-6">
        The most common test you&apos;ll ever write — fetch a resource and assert on it.
      </p>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">A basic GET test</h3>
        <CodeEditor code={BASIC_GET} language="java" height={220} />
        <ConsoleOutput
          lines={[
            "> mvn test -Dtest=getUser_returnsLeanneGraham",
            "[INFO] -------------------------------------------------------",
            "[INFO]  T E S T S",
            "[INFO] -------------------------------------------------------",
            "[INFO] Running com.example.UserTests",
            "[INFO] Tests run: 1, Failures: 0, Errors: 0, Time elapsed: 0.842 s",
            "[INFO] BUILD SUCCESS",
          ]}
        />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">📺 Live API call — click to fire a real request</h3>
        <p className="text-sm mb-3">
          Same endpoint your Java test would hit. This runs in your browser, but the request and response
          are identical to what RestAssured would send.
        </p>
        <button
          onClick={sendLiveRequest}
          disabled={loading}
          className="bg-gradient-to-br from-accent to-purple-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50 hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          {loading ? "Sending..." : "🚀 Send GET /users/1"}
        </button>
        {(respMeta.status || respMeta.error) && (
          <div className="flex gap-4 text-xs mt-3 text-muted">
            {respMeta.status && (
              <span>
                <b className={respMeta.status < 400 ? "text-emerald-400" : "text-red-400"}>Status:</b>{" "}
                {respMeta.status}
              </span>
            )}
            {respMeta.time !== undefined && <span><b className="text-accent2">Time:</b> {respMeta.time}ms</span>}
            {respMeta.size !== undefined && <span><b className="text-accent2">Size:</b> {respMeta.size}B</span>}
            {respMeta.error && <span className="text-red-400">{respMeta.error}</span>}
          </div>
        )}
        <pre className="bg-black border border-border rounded-lg p-3 mt-3 font-mono text-xs text-emerald-400 max-h-72 overflow-y-auto whitespace-pre-wrap break-all">
          {respText}
        </pre>
        {extractedName && (
          <div className="mt-3 p-3 rounded bg-emerald-400/10 border-l-4 border-emerald-400 text-sm">
            🎯 If you were running this as a Java test:{" "}
            <code className="text-orange-300">response.path(&quot;name&quot;)</code> would equal{" "}
            <code className="text-emerald-400">&quot;{extractedName}&quot;</code>.
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Extracting data — single field vs full response</h3>
        <p className="text-sm mb-3">
          Once you have a Response, you can read any field with{" "}
          <code className="text-orange-300">.path(&quot;field.subfield&quot;)</code>:
        </p>
        <CodeEditor code={EXTRACT} language="java" height={360} />
        <ConsoleOutput
          lines={[
            "Name: Leanne Graham",
            "Email:  Sincere@april.biz",
            "City:   Gwenborough",
            "Status: 200",
          ]}
        />
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">Query and path parameters</h3>
        <p className="text-sm mb-3">
          Two ways to add data to the URL — let RestAssured build the URL for you:
        </p>
        <CodeEditor code={QUERY} language="java" height={300} />
        <div className="mt-3 p-3 rounded bg-amber-400/10 border-l-4 border-amber-400 text-sm">
          <b>Why not just hardcode the URL?</b> RestAssured URL-encodes the values for you. If a query
          value has a space, an ampersand, or non-ASCII chars, manual concatenation breaks. Always use{" "}
          <code className="text-orange-300">.queryParam()</code>.
        </div>
      </Card>

      <Card>
        <h3 className="text-accent2 font-bold mb-3">🎮 Exercise — Extract the title</h3>
        <p className="text-sm mb-3">
          The endpoint <code className="text-orange-300">GET /posts/5</code> returns:
        </p>
        <pre className="bg-black rounded p-3 text-xs font-mono text-emerald-400 mb-3">
{`{
  "userId": 1,
  "id": 5,
  "title": "nesciunt quas odio",
  "body": "repudiandae veniam..."
}`}
        </pre>
        <p className="text-sm mb-2">
          What argument do you pass to <code className="text-orange-300">.path(...)</code> to extract
          the <code>title</code> string?
        </p>
        <div className="flex items-center gap-2 font-mono text-sm bg-[#0a0f24] border border-border rounded-lg p-3">
          <span className="text-blue-400">String</span>
          <span>title = response.path(</span>
          <input
            value={titleAns}
            onChange={(e) => setTitleAns(e.target.value)}
            placeholder="?"
            className="bg-transparent border-b border-border focus:border-accent2 outline-none px-1 w-32 text-amber-300"
          />
          <span>);</span>
        </div>
        <button
          onClick={checkExercise}
          className="mt-3 bg-gradient-to-br from-accent to-purple-700 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-accent/40 transition-shadow"
        >
          Check
        </button>
        <HintBox
          hints={[
            "Path expressions use the JSON field names directly — no $ prefix needed.",
            "The field is called \"title\" in the JSON. You pass it as a string literal.",
            'The answer is "title" (with the quotes).',
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
          <li>You can write a basic GET test with status and body assertions</li>
          <li>You can extract single fields with <code className="text-orange-300">.path(&quot;field&quot;)</code></li>
          <li>You can use <code className="text-orange-300">.queryParam()</code> and <code className="text-orange-300">.pathParam()</code></li>
          <li>You can print the extracted values to debug with <code className="text-orange-300">System.out.println</code></li>
        </ul>
      </Card>
    </motion.div>
  );
}
