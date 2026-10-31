/* 四枚确定性小样 + 阅读进度条（VOL.07 · 零依赖，全部原生 DOM）。 */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pct = (v, d = 0) => (v * 100).toFixed(d) + "%";

  const prog = $("#progress");
  if (prog) {
    const paint = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      prog.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    };
    addEventListener("scroll", paint, { passive: true });
    addEventListener("resize", paint, { passive: true });
    paint();
  }

  const tokens = (s) => (String(s).toLowerCase().match(/[\u4e00-\u9fff]|[a-z0-9]+/g) || []);

  /* ══ DEMO 01 · SKILL.md 解剖台 ══ */
  (() => {
    const root = $("#demo-anat"); if (!root) return;
    // part key → {label, html(on), htmlOff, failWhenOff:[checks]}
    const parts = [
      { k: "name", label: "name + slug", on: `<b>name:</b> huajing-image-gen <span class="tag">// 文件夹同名 → slug 对齐</span>`,
        off: `<b>name:</b> huajing-skill <span class="tag">// 与文件夹不一致</span>`, fails: ["install"] },
      { k: "desc", label: "description", on: `<b>description:</b> Generate images through a local Huajing server. <u>Use when the user asks to create or generate an image, polish an image prompt, or look up previously generated images.</u> Requires the local server and Node 18+.`,
        off: `<b>description:</b> Huajing tools. <span class="tag">// 没有触发场景</span>`, fails: ["trigger"] },
      { k: "req", label: "requires.bins", on: `<b>requires:</b> { <b>bins:</b> [node] } <span class="tag">// 市场页明示，缺依赖标灰</span>`,
        off: `<span class="tag">// 无 requires 声明</span>`, fails: ["run"] },
      { k: "setup", label: "Setup", on: `<b>## Setup</b> — 启动画境（start.bat / npm start）→ 加渠道 → 环境变量 HUAJING_BASE_URL / HUAJING_DATA_DIR`,
        off: `<span class="tag">// Setup 段缺失</span>`, fails: [] },
      { k: "usage", label: "Usage", on: `<b>## Usage</b> — node <b>{baseDir}</b>/scripts/huajing.mjs health | generate --prompt … | polish | gallery`,
        off: `<span class="tag">// Usage 段缺失</span>`, fails: ["run"] },
      { k: "exit", label: "退出码", on: `<b>Exit codes:</b> 0 success · 1 generation failed · 2 server unreachable · 3 bad usage`,
        off: `<span class="tag">// 无退出码契约</span>`, fails: ["recover"] },
      { k: "base", label: "{baseDir}", on: `node <b>{baseDir}</b>/scripts/huajing.mjs … <span class="tag">// 安装路径由运行时替换</span>`,
        off: `node scripts/huajing.mjs … <span class="tag">// 相对路径：离开技能目录即 404</span>`, fails: ["portable"] },
      { k: "notes", label: "Notes", on: `<b>## Notes</b> — exit 2 → 转告用户启动服务；exit 1 → 错误原文在 JSON error；画廊可复用，不必重新生成`,
        off: `<span class="tag">// Notes 段缺失</span>`, fails: ["recover"] },
    ];
    const CHECKS = [
      { k: "trigger", label: "可触发" }, { k: "run", label: "可执行" },
      { k: "recover", label: "可恢复" }, { k: "portable", label: "可迁移" },
      { k: "install", label: "可安装（slug 对齐）" },
    ];
    const WARN = {
      trigger: "没有触发场景短语，Agent 永远不会选中这个技能——它装了等于没装。",
      run: "没有命令用法或依赖声明，Agent 只能靠猜：猜对是运气，猜错是 exit 3。",
      recover: "没有退出码与失败指引，失败时 Agent 只能盲目重试或把堆栈甩给用户。",
      portable: "硬编码相对路径在技能目录内能跑，Agent 换了工作目录立刻 404。",
      install: "slug 取文件夹名：name 与文件夹不一致，install 命令永远找不到这个技能。",
    };
    const state = {}; parts.forEach((p) => state[p.k] = true);
    const out = $("#anat-file"), outChk = $("#anat-checks"), outWarn = $("#anat-warn");

    function render() {
      out.innerHTML =
        `<div class="fm">---<br>` +
        parts.filter((p) => ["name", "desc", "req"].includes(p.k))
          .map((p) => `<span class="${state[p.k] ? "" : "off"}">${state[p.k] ? p.on : p.off}</span>`).join("<br>") +
        `<br>---<br></div>` +
        parts.filter((p) => !["name", "desc", "req"].includes(p.k))
          .map((p) => `<div class="sec ${state[p.k] ? "" : "off"}">${state[p.k] ? p.on : p.off}</div>`).join("");
      const failed = CHECKS.filter((c) => parts.some((p) => !state[p.k] && p.fails.includes(c.k)));
      outChk.innerHTML = CHECKS.map((c) => {
        const bad = failed.some((f) => f.k === c.k);
        return `<div class="chk ${bad ? "bad" : "ok"}"><span>${c.label}</span><b>${bad ? "FAIL" : "OK"}</b></div>`;
      }).join("");
      $("#anat-num").textContent = String(CHECKS.length - failed.length);
      const first = failed[0];
      outWarn.classList.toggle("show", !!first);
      if (first) outWarn.textContent = WARN[first.k];
    }
    $$("#anat-presets button").forEach((b) => b.addEventListener("click", () => {
      $$("#anat-presets button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const p = b.dataset.p;
      parts.forEach((x) => state[x.k] = true);
      if (p === "nodesc") state.desc = false;
      if (p === "noexit") state.exit = false;
      if (p === "nobase") state.base = false;
      if (p === "noscript") { state.usage = false; state.req = false; state.notes = false; }
      render();
    }));
    render();
  })();

  /* ══ DEMO 02 · 触发实验台 ══ */
  (() => {
    const root = $("#demo-trigger"); if (!root) return;
    const HUAJING_ON = "通过本地画境（Huajing）服务生成图片。当用户要求创建或生成一张图片、润色图片提示词、或查找之前生成过的图片时使用。支持文生图（内部轮询）、批量数量、尺寸、负向提示词与渠道/模型选择。需要本机画境服务（默认 http://127.0.0.1:4173）与 Node 18+。";
    const HUAJING_BROAD = "强大的图像处理工具，支持多种常见的图片操作，欢迎安装体验。";
    const SKILLS = [
      { name: "huajing-image-gen", get desc() { return $("#trig-broad").checked ? HUAJING_BROAD : HUAJING_ON; } },
      { name: "clip-crop", desc: "裁剪与基础调色：按比例或像素裁剪本地图片，调整亮度与对比度。适用于用户要求简单修图、裁剪照片时。" },
      { name: "style-tag", desc: "识别一张图片的艺术风格并输出风格标签。适用于用户询问某张图是什么画风时。" },
      { name: "bgm-find", desc: "在本地音乐库中检索与视频情绪匹配的背景音乐。适用于剪辑配乐推荐。" },
      { name: "pdf-sum", desc: "总结 PDF 文档要点并生成阅读笔记。适用于长文档快速阅读。" },
      { name: "web-clip", desc: "抓取网页正文并存档为 Markdown。适用于收藏文章与离线阅读。" },
    ];
    const VERBS = ["生成", "创建", "画", "润色", "查找", "检索", "找", "裁剪", "总结", "抓取", "处理", "识别"];
    const outRows = $("#trig-rows"), outHit = $("#trig-hit"), outScore = $("#trig-score"), outV = $("#trig-verdict");

    function score(query, desc) {
      const q = tokens(query), d = new Set(tokens(desc));
      if (!q.length) return 0;
      let cover = 0;
      for (const t of q) if (d.has(t)) cover++;
      const coverage = cover / q.length;
      const ds = new Set(tokens(desc)); const qs = new Set(q);
      let inter = 0; for (const t of qs) if (ds.has(t)) inter++;
      const jac = inter / (qs.size + ds.size - inter);
      let bonus = 0;
      for (const v of VERBS) if (query.includes(v) && desc.includes(v)) bonus += 0.15;
      bonus = Math.min(bonus, 0.3);
      return clamp(coverage * 0.6 + jac * 0.4 + bonus, 0, 1);
    }

    function render() {
      const q = $("#trig-q").value.trim() || "（空）";
      const rows = SKILLS.map((s) => ({ name: s.name, desc: s.desc, sc: score(q, s.desc) }));
      rows.sort((a, b) => b.sc - a.sc);
      const top = rows[0];
      const fire = top.sc >= 0.3;
      outRows.innerHTML = rows.map((r, i) => `
        <div class="trow ${i === 0 && fire ? "fire" : ""}">
          <span class="nm">${r.name}</span>
          <span><span class="ds">${r.desc}</span>
            <span class="bar"><i style="width:${(r.sc * 100).toFixed(0)}%"></i></span></span>
          <span class="sc"><b>${r.sc.toFixed(2)}</b></span>
        </div>`).join("");
      outHit.textContent = fire ? top.name : "（无）";
      outScore.textContent = fire ? top.sc.toFixed(2) : "—";
      const broad = $("#trig-broad").checked;
      let verdict;
      if (!fire) verdict = "没有任何技能过 0.30 阈值：Agent 会退回通用能力（自己写代码/直接回答）。描述太窄的代价是「永不被用」。";
      else if (top.name === "huajing-image-gen") verdict = broad
        ? "泛化描述仍命中了这次——但「图像处理工具」同时覆盖裁剪/调色/风格类请求，误触发只是时间问题。"
        : "原版三段式描述命中：生成、润色、画廊三个场景都被「Use when …」短语接住。";
      else verdict = "被「" + top.name + "」接住——更贴近用户原话的技能赢了。这是好事：description 的竞争本来就是语义重合度的竞争。";
      outV.textContent = verdict;
    }
    $("#trig-presets").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-q]"); if (!b) return;
      $$("#trig-presets button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $("#trig-q").value = b.dataset.q;
      render();
    });
    $("#trig-q").addEventListener("input", () => { $$("#trig-presets button").forEach((x) => x.setAttribute("aria-pressed", "false")); render(); });
    $("#trig-broad").addEventListener("change", render);
    render();
  })();

  /* ══ DEMO 03 · 安装验收流水线 ══ */
  (() => {
    const root = $("#demo-pipe"); if (!root) return;
    const STEPS = [
      { k: "publish", no: "01", b: "publish", s: "clawhub skill publish huajing-image-gen/（slug = 文件夹名）" },
      { k: "scan", no: "02", b: "安全扫描等待", s: "≈60s 后技能才公开；轮询 /skills/{slug} 至 200" },
      { k: "install", no: "03", b: "install", s: "clawhub install @starrysea1412/huajing-image-gen" },
      { k: "files", no: "04", b: "落盘技能目录", s: "SKILL.md + scripts/ 到本地技能目录" },
      { k: "health", no: "05", b: "health 探活", s: "node {baseDir}/scripts/huajing.mjs health" },
      { k: "enable", no: "06", b: "启用确认", s: "script-bearing 默认停用；审批后才能被 Agent 调用" },
    ];
    const state = { fault: "none", wait: true };
    const outPipe = $("#pipe"), outV = $("#pipe-v"), outW = $("#pipe-w");

    function render() {
      let stop = -1, why = "", verdict = "GO", notes = [];
      const st = STEPS.map((s) => ({ ...s, status: "ok", msg: "" }));
      const mark = (i, status, msg) => { st[i].status = status; st[i].msg = msg; if (status === "fail" && stop < 0) { stop = i; } };

      if (state.fault === "slug") { mark(0, "warn", "publish 成功，但 name 与文件夹名不一致——slug 取的是文件夹名"); mark(2, "fail", "install @…/huajing-image-gen → 404：技能的 slug 其实是文件夹名"); }
      else if (state.fault === "scan") { mark(1, "fail", "官方扫描未通过：修复包体后重新 publish，别试图绕过"); }
      else if (state.fault === "health") { mark(4, "fail", "exit 2：cannot reach 127.0.0.1:4173 — Start it with start.bat / npm start"); }
      else if (state.fault === "noapprove") { mark(5, "fail", "script-bearing 默认停用：未经审批的脚本调用被拒绝"); }
      if (state.fault === "none" && !state.wait) { mark(1, "warn", "跳过等待：立即 install 会 404 —— 这是扫描延迟（≈60s），不是发布失败"); mark(2, "fail", "404：技能还在扫描队列里。先轮询 /skills/{slug} 至 200，别当成失败重发"); }

      if (stop < 0) { verdict = "GO"; why = "六步全绿：可搜索、可安装、可调用、失败有指引、启用经过审批。"; }
      else { verdict = "STOP"; why = st[stop].msg; }
      if (state.fault === "none" && !state.wait && stop >= 0) {
        notes.push("这条 404 骗过过作者本人：publish 成功后立刻去搜，搜不到——差点当成失败重发。");
      }
      if (state.fault === "health") notes.push("exit 2 的设计意图：让重试在「不可达」这一类失败上停止——重试一个没启动的服务，五次和零次没有区别。");
      if (state.fault === "noapprove") notes.push("审批把「外来代码在我机器上执行」这个决定，从安装时的顺手一点，推迟到每次实际发生的时刻。");

      outPipe.innerHTML = st.map((s, i) => {
        const cls = s.status === "ok" ? "ok" : s.status === "warn" ? "" : "bad";
        const label = s.status === "ok" ? "PASS" : s.status === "warn" ? "WARN" : "FAIL";
        return `<div class="step ${cls}"><span class="no">${s.no}</span>
          <span class="lbl"><b>${s.b}</b><small>${s.s}${s.msg ? " — " + s.msg : ""}</small></span>
          <span class="st">${i > stop && stop >= 0 ? "PENDING" : label}</span></div>`;
      }).join("");
      outV.textContent = verdict;
      outV.className = "v " + (verdict === "GO" ? "go" : "stop");
      outW.textContent = why + (notes.length ? " " + notes.join(" ") : "");
    }
    $("#pipe-faults").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-f]"); if (!b) return;
      $$("#pipe-faults button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      state.fault = b.dataset.f; render();
    });
    $("#pipe-wait").addEventListener("change", (e) => { state.wait = e.target.checked; render(); });
    render();
  })();

  /* ══ DEMO 04 · 供应链体检 ══ */
  (() => {
    const root = $("#demo-supply"); if (!root) return;
    const SAMPLES = [
      { name: "prompt-polish", script: 0, net: 0, secret: 0, auto: 0, scan: 1 },
      { name: "doc-sum", script: 0, net: 0, secret: 0, auto: 0, scan: 1 },
      { name: "gallery-export", script: 0, net: 0, secret: 0, auto: 0, scan: 1 },
      { name: "huajing-image-gen", script: 1, net: 0, secret: 0, auto: 0, scan: 1 },
      { name: "repo-audit", script: 1, net: 1, secret: 0, auto: 0, scan: 1 },
      { name: "shell-helper", script: 1, net: 1, secret: 0, auto: 0, scan: 0 },
      { name: "api-wrapper", script: 1, net: 1, secret: 1, auto: 0, scan: 1 },
      { name: "auto-updater", script: 1, net: 1, secret: 0, auto: 1, scan: 1 },
      { name: "keyfetch", script: 0, net: 0, secret: 1, auto: 0, scan: 0 },
      { name: "poison-update", script: 1, net: 1, secret: 0, auto: 1, scan: 1 },
    ];
    const outT = $("#sup-table"), outPass = $("#sup-pass"), outBS = $("#sup-blocked-script"),
      outBK = $("#sup-blocked-secret"), outRes = $("#sup-residual"), outNote = $("#sup-note");

    function render() {
      const pol = {
        scan: $("#sup-scan").checked, disable: $("#sup-disable").checked,
        approve: $("#sup-approve").checked, secret: $("#sup-secret").checked,
      };
      let pass = 0, blockedScript = 0, blockedSecret = 0, residual = 0;
      const rows = SAMPLES.map((s) => {
        let status = "可启用", why = "";
        if (pol.secret && s.secret) { status = "拦截：包内含密钥"; blockedSecret++; }
        else if (pol.scan && !s.scan) { status = "拦截：无扫描记录"; }
        else if (s.script && pol.disable && !(pol.approve)) { status = "需审批（默认停用）"; blockedScript++; }
        else if (s.script && !pol.approve) { status = "拦截：脚本未审批"; blockedScript++; }
        else if (s.script) { status = "可启用（每次过审批）"; residual++; }
        if (status === "可启用" || status.startsWith("可启用")) pass++;
        const risk = s.secret || s.auto;
        return { s, status, risk };
      });
      outT.innerHTML = `<thead><tr><th>样本</th><th>脚本</th><th>联网</th><th>密钥</th><th>自动更新</th><th>状态</th></tr></thead><tbody>` +
        rows.map((r) => `<tr class="${r.status.startsWith("拦截") ? "risk" : ""}">
          <td><b>${r.s.name}</b></td>
          <td class="${r.s.script ? "yes" : "no"}">${r.s.script ? "yes" : "—"}</td>
          <td class="${r.s.net ? "yes" : "no"}">${r.s.net ? "yes" : "—"}</td>
          <td class="${r.s.secret ? "yes" : "no"}">${r.s.secret ? "yes" : "—"}</td>
          <td class="${r.s.auto ? "yes" : "no"}">${r.s.auto ? "yes" : "—"}</td>
          <td>${r.status}${r.s.auto && !r.status.startsWith("拦截") ? " ⚠更新投毒面" : ""}</td>
        </tr>`).join("") + "</tbody>";
      outPass.textContent = String(pass);
      outBS.textContent = String(blockedScript);
      outBK.textContent = String(blockedSecret);
      outRes.textContent = String(residual);
      let n = [];
      if (!pol.secret) n.push("关掉「拦截密钥」后，#07（API wrapper 夹带 key）与 #09（keyfetch 在文档里贴了 key）都被放行——7.1% 的泄漏率正是这么来的。");
      if (!pol.approve && pol.disable) n.push("停用策略拦下了全部脚本样本，但「启用后每次执行」仍无审批——#10 的投毒更新靠审批兜底。");
      if (!pol.disable) n.push("没有默认停用时，脚本样本装完即可被 Agent 调用：审批是唯一的闸，而闸只在执行时出现。");
      if (pol.scan && pol.disable && pol.approve && pol.secret) n.push("四层全开：只剩「作者账号被盗 + 用户批准」的复合风险——这是治理的下限，不是零风险。");
      outNote.textContent = n.join(" ") || "调整策略开关，观察每份样本的判定变化。";
    }
    ["sup-scan", "sup-disable", "sup-approve", "sup-secret"].forEach((id) =>
      $("#" + id).addEventListener("change", render));
    render();
  })();
})();
