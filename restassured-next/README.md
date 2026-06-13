# RestAssured Mastery — Next.js POC

Proof-of-concept rebuild of the RestAssured learning site using **Next.js 14 + React + Tailwind + framer-motion + Monaco**.

## Run locally

```bash
cd restassured-next
npm install
npm run dev
```

Open http://localhost:3000.

## What's ported in this POC

- **Module 1: What is RestAssured?** — content, code editor, interactive quiz
- **Module 2: HTTP & REST Basics** — animated cheat sheet, status code game
- **Sidebar navigation** — all 26 modules listed (others show placeholder)
- **Progress + XP** — persisted to localStorage
- **Confetti** — fires on module completion
- **Framer Motion** — page transitions, hover effects, animations

## Architecture

```
restassured-next/
├── app/
│   ├── layout.tsx        # root layout
│   ├── page.tsx          # main app (header, sidebar wiring, module switcher)
│   └── globals.css       # tailwind + base styles
├── components/
│   ├── Sidebar.tsx       # left navigation
│   ├── CodeEditor.tsx    # Monaco editor wrapper
│   ├── IntroModule.tsx   # one module = one component
│   ├── HttpModule.tsx
│   └── PlaceholderModule.tsx
├── lib/
│   ├── curriculum.ts     # module list
│   └── useProgress.ts    # localStorage state hook
└── tailwind.config.ts
```

## To port the remaining 24 modules

Each module becomes a file in `components/`. Copy `HttpModule.tsx` as a template — it shows the patterns for cards, interactive games, motion, and completion callbacks.

## Deploy to Vercel

Push to a GitHub repo, import it in Vercel — Next.js is auto-detected, zero config.
