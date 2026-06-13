export type Module = {
  id: string;
  title: string;
  icon: string;
};

export type Phase = {
  phase: string;
  items: Module[];
};

export const CURRICULUM: Phase[] = [
  {
    phase: "Phase 1 — Foundations",
    items: [
      { id: "intro", title: "1. What is RestAssured?", icon: "📚" },
      { id: "http", title: "2. HTTP & REST Basics", icon: "🌐" },
      { id: "setup", title: "3. Setup & Dependencies", icon: "⚙️" },
      { id: "bdd", title: "4. Given / When / Then", icon: "🎭" },
    ],
  },
  {
    phase: "Phase 2 — Core API Testing",
    items: [
      { id: "get", title: "5. GET Requests (Live API)", icon: "📥" },
      { id: "post", title: "6. POST Requests (Live API)", icon: "📤" },
      { id: "putdel", title: "7. PUT, PATCH, DELETE", icon: "🔄" },
      { id: "specs", title: "8. Request/Response Specs", icon: "📋" },
    ],
  },
  {
    phase: "Phase 3 — Data Handling",
    items: [
      { id: "jsonpath", title: "9. JsonPath Mastery", icon: "🎯" },
      { id: "payload", title: "10. JSON Payload Building", icon: "🧬" },
      { id: "schema", title: "11. Schema Validation", icon: "✅" },
    ],
  },
  {
    phase: "Phase 4 — Auth & Env",
    items: [
      { id: "oauth", title: "12. OAuth2 Bearer Token", icon: "🔐" },
      { id: "env", title: "13. Multi-Environment Config", icon: "🌍" },
      { id: "ssl", title: "14. SSL, Headers, Cookies", icon: "🍪" },
    ],
  },
  {
    phase: "Phase 5 — Cucumber/BDD",
    items: [
      { id: "feature", title: "15. Feature Files & Outlines", icon: "📝" },
      { id: "tags", title: "16. Tags & CI Filtering", icon: "🏷️" },
      { id: "hooks", title: "17. Hooks (Before/After)", icon: "🪝" },
      { id: "dynamic", title: "18. Random Data & Skip Tags", icon: "🎲" },
    ],
  },
  {
    phase: "Phase 6 — Advanced",
    items: [
      { id: "parallel", title: "19. Parallel + ThreadLocal", icon: "⚡" },
      { id: "guice", title: "20. Guice DI", icon: "💉" },
      { id: "allure", title: "21. Allure Reports", icon: "📊" },
      { id: "logging", title: "22. Logging & Debugging", icon: "🔍" },
    ],
  },
  {
    phase: "Phase 7 — Senior Tier",
    items: [
      { id: "asserts", title: "23. AssertJ vs JUnit", icon: "⚖️" },
      { id: "arch", title: "24. Framework Architecture", icon: "🏗️" },
      { id: "best", title: "25. Senior Best Practices", icon: "👨‍🏫" },
      { id: "interview", title: "26. Interview Boss Battle", icon: "👑" },
    ],
  },
];

export const TOTAL_MODULES = CURRICULUM.flatMap((p) => p.items).length;
