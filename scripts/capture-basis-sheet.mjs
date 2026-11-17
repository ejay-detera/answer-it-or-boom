#!/usr/bin/env node
/**
 * Captures all 8 live Next.js routes at 1280x720 with realistic sample state
 * and compiles them into one 2x4 presentation PNG at public/designs/basis-8-pages-sheet.png.
 */
import { createHash, createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = 3107;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_PATH = path.join(ROOT, "public", "designs", "basis-8-pages-sheet.png");

function readEnvFile() {
  const envPath = path.join(ROOT, ".env");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function makeAdminCookieValue(passcode) {
  const secret = createHash("sha256")
    .update(`boom-admin:${passcode}`)
    .digest("hex");
  const expiresAt = String(Date.now() + 60 * 60 * 1000);
  const sig = createHmac("sha256", secret).update(expiresAt).digest("base64url");
  return `${expiresAt}.${sig}`;
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

const now = Date.now();
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

const SAMPLE_SESSION = {
  id: "00000000-0000-4000-8000-000000000001",
  status: "running",
  lobby_locked: false,
  started_at: iso(-55000),
  ended_at: null,
  base_time_seconds: 120,
  bonus_time_seconds: 30,
  wrong_answer_penalty_seconds: 0,
  created_at: iso(-300000),
};

const SAMPLE_PLAYERS = [
  {
    id: "p1",
    session_id: SAMPLE_SESSION.id,
    name: "Ada",
    status: "completed",
    score: 125,
    streak: 6,
    best_streak: 6,
    correct_count: 10,
    wrong_count: 1,
    deadline: iso(45000),
    finished_at: iso(-8000),
    joined_at: iso(-200000),
  },
  {
    id: "p2",
    session_id: SAMPLE_SESSION.id,
    name: "Linus",
    status: "playing",
    score: 90,
    streak: 4,
    best_streak: 5,
    correct_count: 8,
    wrong_count: 2,
    deadline: iso(84000),
    finished_at: null,
    joined_at: iso(-190000),
  },
  {
    id: "p3",
    session_id: SAMPLE_SESSION.id,
    name: "Grace",
    status: "playing",
    score: 75,
    streak: 2,
    best_streak: 3,
    correct_count: 7,
    wrong_count: 1,
    deadline: iso(62000),
    finished_at: null,
    joined_at: iso(-180000),
  },
  {
    id: "p4",
    session_id: SAMPLE_SESSION.id,
    name: "Ken",
    status: "exploded",
    score: 40,
    streak: 0,
    best_streak: 2,
    correct_count: 4,
    wrong_count: 3,
    deadline: iso(-12000),
    finished_at: iso(-12000),
    joined_at: iso(-170000),
  },
  {
    id: "p5",
    session_id: SAMPLE_SESSION.id,
    name: "Maya",
    status: "waiting",
    score: 0,
    streak: 0,
    best_streak: 0,
    correct_count: 0,
    wrong_count: 0,
    deadline: null,
    finished_at: null,
    joined_at: iso(-160000),
  },
];

const SAMPLE_QUESTIONS = [
  {
    id: "q1",
    question: "Which HTTP status code means 'Not Found'?",
    options: ["200 OK", "301 Moved Permanently", "404 Not Found", "500 Internal Error"],
    correct_index: 2,
    category: "software",
    difficulty: "easy",
    is_active: true,
    created_at: iso(-400000),
  },
  {
    id: "q2",
    question: "Which Git command creates and switches to a new branch?",
    options: ["git commit -m", "git checkout -b", "git merge --no-ff", "git status"],
    correct_index: 1,
    category: "software",
    difficulty: "easy",
    is_active: true,
    created_at: iso(-390000),
  },
  {
    id: "q3",
    question: "What does CSS 'tabular-nums' keep aligned?",
    options: ["Line height", "Digit widths", "Heading weights", "Border radii"],
    correct_index: 1,
    category: "general",
    difficulty: "easy",
    is_active: true,
    created_at: iso(-380000),
  },
  {
    id: "q4",
    question: "Which snack fuels most midnight deploys?",
    options: ["Coffee & chips", "Plain ice cubes", "Raw flour", "Empty mugs"],
    correct_index: 0,
    category: "fun",
    difficulty: "easy",
    is_active: false,
    created_at: iso(-370000),
  },
];

async function main() {
  const fileEnv = readEnvFile();
  const adminPasscode = process.env.ADMIN_PASSCODE ?? fileEnv.ADMIN_PASSCODE;

  const server = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"],
    {
      cwd: ROOT,
      env: { ...fileEnv, ...process.env },
      stdio: "ignore",
      shell: process.platform === "win32",
    }
  );

  try {
    await waitForServer(`${BASE_URL}/`);

    const browser = await chromium.launch();
    try {
      const routes = [
        { path: "/", label: "/ · Join Session", mode: "join" },
        { path: "/lobby", label: "/lobby · Waiting Lobby", mode: "lobby" },
        { path: "/play", label: "/play · Bomb & Quiz", mode: "play" },
        { path: "/result", label: "/result · Run Summary", mode: "result" },
        { path: "/scoreboard", label: "/scoreboard · Live Projector", mode: "scoreboard" },
        { path: "/admin", label: "/admin · Facilitator Login", mode: "admin-login" },
        { path: "/admin/dashboard", label: "/admin/dashboard · Session Control", mode: "admin-dash" },
        { path: "/admin/questions", label: "/admin/questions · Question Pool", mode: "admin-questions" },
      ];

      const captures = [];

      for (const route of routes) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          reducedMotion: "reduce",
        });

        if (
          (route.mode === "admin-dash" || route.mode === "admin-questions") &&
          adminPasscode
        ) {
          await context.addCookies([
            {
              name: "boom_admin_token",
              value: makeAdminCookieValue(adminPasscode),
              domain: "127.0.0.1",
              path: "/",
              httpOnly: true,
              sameSite: "Lax",
            },
          ]);
        }

        const page = await context.newPage();

        await page.route("**/api/session/me", async (reqRoute) => {
          let payload;
          if (route.mode === "join") {
            payload = {
              serverNow: iso(0),
              session: { ...SAMPLE_SESSION, status: "waiting" },
              player: null,
            };
          } else if (route.mode === "lobby") {
            payload = {
              serverNow: iso(0),
              session: { ...SAMPLE_SESSION, status: "waiting" },
              player: SAMPLE_PLAYERS[4],
            };
          } else if (route.mode === "play") {
            payload = {
              serverNow: iso(0),
              session: SAMPLE_SESSION,
              player: SAMPLE_PLAYERS[1],
            };
          } else {
            payload = {
              serverNow: iso(0),
              session: { ...SAMPLE_SESSION, status: "finished" },
              player: SAMPLE_PLAYERS[0],
            };
          }
          await reqRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(payload),
          });
        });

        await page.route("**/api/play/question", async (reqRoute) => {
          const q = SAMPLE_QUESTIONS[0];
          await reqRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              status: "playing",
              serverNow: iso(0),
              deadline: iso(84000),
              score: 90,
              streak: 4,
              answeredCount: 8,
              question: {
                id: q.id,
                question: q.question,
                options: q.options,
                category: q.category,
                difficulty: q.difficulty,
              },
            }),
          });
        });

        await page.route("**/api/admin/questions", async (reqRoute) => {
          await reqRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ questions: SAMPLE_QUESTIONS }),
          });
        });

        await page.route("**/rest/v1/sessions*", async (reqRoute) => {
          const sessionForRoute =
            route.mode === "lobby"
              ? { ...SAMPLE_SESSION, status: "waiting" }
              : SAMPLE_SESSION;
          const accept = reqRoute.request().headers()["accept"] ?? "";
          const isSingle = accept.includes("vnd.pgrst.object+json");
          await reqRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(isSingle ? sessionForRoute : [sessionForRoute]),
          });
        });

        await page.route("**/rest/v1/players*", async (reqRoute) => {
          const list =
            route.mode === "lobby"
              ? SAMPLE_PLAYERS.map((p) => ({ ...p, status: "waiting", score: 0 }))
              : SAMPLE_PLAYERS;
          await reqRoute.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(list),
          });
        });

        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(350);

        const buf = await page.screenshot({ type: "png" });
        captures.push({ label: route.label, b64: buf.toString("base64") });
        await context.close();
      }

      // Stitch all 8 slides into one 2x4 presentation sheet matching reference layout
      const boardPage = await browser.newPage({
        viewport: { width: 1760, height: 2120 },
      });

      const cardsHtml = captures
        .map(
          (c) => `
          <figure class="slide">
            <img src="data:image/png;base64,${c.b64}" alt="${c.label}" />
          </figure>`
        )
        .join("\n");

      await boardPage.setContent(`
        <!doctype html>
        <html lang="en">
          <head>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                background: #23252d;
                padding: 56px;
                width: 1760px;
                height: 2120px;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(4, 1fr);
                gap: 40px;
                align-items: center;
                justify-items: center;
              }
              .slide {
                width: 100%;
                height: 100%;
                background: #14161F;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55);
                border: 2px solid #363C50;
              }
              .slide img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              }
            </style>
          </head>
          <body>
            ${cardsHtml}
          </body>
        </html>
      `);

      await boardPage.waitForTimeout(200);
      fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
      await boardPage.screenshot({ path: OUT_PATH, type: "png" });
      console.log(`Saved compiled 8-page basis sheet: ${OUT_PATH}`);
    } finally {
      await browser.close();
    }
  } finally {
    if (process.platform === "win32" && server.pid) {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], {
        stdio: "ignore",
      });
    } else {
      server.kill("SIGTERM");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
