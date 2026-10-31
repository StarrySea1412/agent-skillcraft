// 本地无头验收（VOL.07）：四枚小样逐状态、错误收集、移动端溢出
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire("D:/project/machine-skill/node_modules/");
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shots = join(root, "shots");
await mkdir(shots, { recursive: true });
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split("?")[0]);
    const file = join(root, p === "/" ? "index.html" : p);
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
console.log("serving", base);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("requestfailed", (r) => errors.push("requestfailed: " + r.url()));
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const font = await page.evaluate(() => document.fonts.check('16px "LXGW WenKai"'));
const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.getAttribute("src"), ok: i.naturalWidth > 0 })));
console.log("font:", font, "| images:", imgs.length, "| broken:", imgs.filter((i) => !i.ok).map((i) => i.src).join(",") || "none");
await page.screenshot({ path: join(shots, "00-hero.png"), clip: { x: 0, y: 0, width: 1440, height: 900 } });

async function shot(sel, name, fn) {
  const el = await page.$(sel);
  await el.scrollIntoViewIfNeeded();
  if (fn) await fn();
  await page.waitForTimeout(150);
  const box = await el.boundingBox();
  await page.screenshot({ path: join(shots, name), clip: { x: Math.max(0, box.x - 6), y: Math.max(0, box.y - 6), width: Math.min(1440, box.width + 12), height: Math.min(2000, box.height + 12) } });
}

/* D1 anatomy */
const anat = async (name, preset) => {
  await page.evaluate((p) => {
    const b = document.querySelector(`#anat-presets button[data-p="${p}"]`); b.click();
  }, preset);
  await page.waitForTimeout(120);
  await shot("#demo-anat", name);
  console.log("anat", preset, await page.evaluate(() => ({
    score: document.querySelector("#anat-num").textContent,
    warn: document.querySelector("#anat-warn").classList.contains("show"),
  })));
};
await anat("01-anat-full.png", "all");
await anat("02-anat-nodesc.png", "nodesc");
await anat("03-anat-noexit.png", "noexit");
await anat("04-anat-nobase.png", "nobase");
await anat("05-anat-noscript.png", "noscript");

/* D2 trigger */
const trig = async (name, q, broad) => {
  await page.evaluate(([q, broad]) => {
    const i = document.querySelector("#trig-q"); i.value = q; i.dispatchEvent(new Event("input", { bubbles: true }));
    const c = document.querySelector("#trig-broad");
    if (c.checked !== broad) { c.checked = broad; c.dispatchEvent(new Event("change", { bubbles: true })); }
  }, [q, broad]);
  await page.waitForTimeout(120);
  await shot("#demo-trigger", name);
  console.log("trig", JSON.stringify(q), "broad=" + broad, await page.evaluate(() => ({
    hit: document.querySelector("#trig-hit").textContent,
    score: document.querySelector("#trig-score").textContent,
    verdict: document.querySelector("#trig-verdict").textContent.slice(0, 60),
  })));
};
await trig("06-trig-generate.png", "帮我生成一张图：一只纸鹤在木桌上", false);
await trig("07-trig-polish.png", "把刚才那张图的提示词润色一下", false);
await trig("08-trig-gallery.png", "找一下上次生成的那张海报", false);
await trig("09-trig-broad-miss.png", "处理一下这张图片", true);

/* D3 pipeline */
const pipe = async (name, fault, wait = true) => {
  await page.evaluate(([fault, wait]) => {
    const b = document.querySelector(`#pipe-faults button[data-f="${fault}"]`); b.click();
    const w = document.querySelector("#pipe-wait");
    if (w.checked !== wait) { w.checked = wait; w.dispatchEvent(new Event("change", { bubbles: true })); }
  }, [fault, wait]);
  await page.waitForTimeout(120);
  await shot("#demo-pipe", name);
  console.log("pipe", fault, await page.evaluate(() => ({
    v: document.querySelector("#pipe-v").textContent,
    w: document.querySelector("#pipe-w").textContent.slice(0, 70),
  })));
};
await pipe("10-pipe-none.png", "none");
await pipe("11-pipe-slug.png", "slug");
await pipe("12-pipe-nowait.png", "none", false);
await pipe("13-pipe-health.png", "health");
await pipe("14-pipe-noapprove.png", "noapprove");

/* D4 supply */
const sup = async (name, toggles) => {
  await page.evaluate((t) => {
    for (const [id, v] of Object.entries(t)) {
      const el = document.querySelector("#" + id);
      if (el.checked !== v) { el.checked = v; el.dispatchEvent(new Event("change", { bubbles: true })); }
    }
  }, toggles);
  await page.waitForTimeout(120);
  await shot("#demo-supply", name);
  console.log("sup", JSON.stringify(toggles), await page.evaluate(() => ({
    pass: document.querySelector("#sup-pass").textContent,
    bs: document.querySelector("#sup-blocked-script").textContent,
    bk: document.querySelector("#sup-blocked-secret").textContent,
    res: document.querySelector("#sup-residual").textContent,
  })));
};
await sup("15-sup-default.png", { "sup-scan": true, "sup-disable": true, "sup-approve": true, "sup-secret": true });
await sup("16-sup-nosecret.png", { "sup-scan": true, "sup-disable": true, "sup-approve": true, "sup-secret": false });
await sup("17-sup-noapprove.png", { "sup-scan": true, "sup-disable": true, "sup-approve": false, "sup-secret": true });

/* mobile */
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
mobile.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
await mobile.goto(base, { waitUntil: "networkidle" });
await mobile.evaluate(() => document.fonts.ready);
await mobile.screenshot({ path: join(shots, "18-mobile-hero.png") });
for (const [sel, name] of [["#demo-anat", "19-mobile-anat.png"], ["#demo-trigger", "20-mobile-trigger.png"], ["#demo-pipe", "21-mobile-pipe.png"], ["#demo-supply", "22-mobile-supply.png"]]) {
  const el = await mobile.$(sel);
  await el.scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(120);
  const box = await el.boundingBox();
  await mobile.screenshot({ path: join(shots, name), clip: { x: 0, y: Math.max(0, box.y), width: 390, height: Math.min(900, box.height) } });
}
console.log("mobile overflow:", await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
console.log("ERRORS:", errors.length ? errors : "none");
await browser.close();
server.close();
