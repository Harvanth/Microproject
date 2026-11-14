// QuizBot - a chat assistant for QuizHub Pro (wrapped in a function so it never clashes with other scripts)
(() => {
  // ---------- Optional: connect a real AI ----------
  // Put the address of YOUR OWN backend here (a server that calls an AI API for you).
  // Never put an AI API key in this file: anyone could open it and steal the key.
  const API_URL = "";

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const user = read("qh-session", null), first = user ? user.name.split(" ")[0] : "";
  const CHIPS = ["How do I play?", "Quiz me", "Explain flexbox", "Study tips"];

  // ---------- Knowledge base: first matching rule wins ----------
  const KB = [
    [/\b(hi|hello|hey|hii|good (morning|evening|afternoon))\b/, () => `Hi${first ? " " + first : ""}! 👋 I'm <b>QuizBot</b>. Ask me how the site works, or about HTML, CSS, JavaScript and web basics. You can also say <b>"quiz me"</b>.`],
    [/who are you|your name|what can you do|\bhelp\b/, () => `I'm QuizBot, your study buddy. I can:<ul><li>explain how to play and how scoring works</li><li>explain HTML, CSS, JavaScript and web basics</li><li>quiz you with questions from the app</li><li>give study tips</li></ul>`],
    [/how.*(play|start)|get started|\bbegin\b/, () => `1. Sign in or register.<br>2. Choose a topic, difficulty and number of questions.<br>3. Answer before the timer runs out.<br>4. Check your score, review mistakes and retry them.`],
    [/point|scor|bonus|streak/, () => `Each correct answer gives <b>100 × difficulty multiplier</b> (Easy ×1, Medium ×1.5, Hard ×2), plus up to <b>50 speed points</b> for answering fast and <b>+10 per streak</b> (up to +50). Wrong answers and timeouts reset your streak.`],
    [/life ?line|50.?50|skip/, () => `You get one <b>50/50</b> (removes two wrong options) and one <b>Skip</b> (no points, but your streak is kept) per quiz.`],
    [/difficult|level|easy|hard|timer|time limit|second/, () => `<b>Easy</b>: 30s per question, ×1 points. <b>Medium</b>: 20s, ×1.5. <b>Hard</b>: 10s, ×2. The bar at the top of a question shows the time left.`],
    [/add.*question|custom|own question|create.*question/, () => `Open the <b>Add questions</b> tab, enter a topic, the question, four options and the correct one. Your questions are saved in your browser and appear as a new topic card.`],
    [/leader|rank|top score|csv|export/, () => `The <b>Leaderboard</b> tab shows the top 10 scores. You can filter by topic and export all scores as a CSV file.`],
    [/certificate/, () => `After a quiz, press <b>Certificate</b> on the result screen to download a PNG with your name, score, topic and date.`],
    [/achiev|badge|unlock/, () => `There are 7 achievements, such as First quiz, Perfect score, 5-answer streak and Hard mode 70%+. They light up on the start screen when you unlock them.`],
    [/dark|theme|light mode/, () => `Use the 🌓 / <b>Dark mode</b> button at the top. Your choice is saved and shared across all pages.`],
    [/sound|music|mute/, () => `Use the <b>Sound</b> button in the quiz header to turn the beeps on or off.`],
    [/sign ?in|log ?in|register|sign ?up|account|password|log ?out/, () => `Create an account on the <b>Register</b> page (name, email, a password with 8+ characters including a letter and a number). Then use <b>Sign in</b>. Accounts are stored in this browser only.`],
    [/quiz me|ask me|test me|practice question|give me a question/, () => "__QUIZ__"],
    [/flex/, () => `<b>Flexbox</b> lays items out in one direction. Use <code>display:flex</code> on the parent, then <code>justify-content</code> (main axis) and <code>align-items</code> (cross axis). Add <code>gap</code> for spacing and <code>flex-wrap:wrap</code> to wrap.`],
    [/\bgrid\b/, () => `<b>CSS Grid</b> lays items in rows and columns. Example: <code>display:grid; grid-template-columns:repeat(3,1fr); gap:12px;</code> makes three equal columns.`],
    [/box model|margin|padding|border/, () => `The <b>box model</b> has four layers from inside out: content, <code>padding</code>, <code>border</code> and <code>margin</code>. Use <code>box-sizing:border-box</code> so width includes padding and border.`],
    [/media quer|responsive|mobile/, () => `Make a page responsive with a viewport meta tag and media queries, for example <code>@media (max-width:600px){ ... }</code>. Use flexible units like <code>%</code>, <code>rem</code> and <code>vw</code>.`],
    [/selector|specificity|class|\bid\b/, () => `Selectors pick elements: <code>p</code> (tag), <code>.card</code> (class), <code>#menu</code> (id). Specificity order: inline style, then id, then class, then tag. Prefer classes.`],
    [/semantic|header|footer|\bnav\b|section|article/, () => `<b>Semantic tags</b> describe meaning: <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;footer&gt;</code>. They help accessibility and SEO.`],
    [/\bhtml\b|tag|heading|\bform\b|\blink\b/, () => `<b>HTML</b> gives a page its structure with tags such as <code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;a href&gt;</code>, <code>&lt;img alt&gt;</code>, <code>&lt;ul&gt;</code> and <code>&lt;form&gt;</code>. Every page starts with <code>&lt;!DOCTYPE html&gt;</code>.`],
    [/\bcss\b|style|color/, () => `<b>CSS</b> controls how HTML looks: colors, fonts, spacing and layout. Ask me about the box model, flexbox, grid, selectors or media queries.`],
    [/===|==|equality|strict/, () => `<code>==</code> compares after converting types (<code>2 == "2"</code> is true). <code>===</code> compares value and type (<code>2 === "2"</code> is false). Prefer <code>===</code>.`],
    [/\bvar\b|\blet\b|\bconst\b|variable/, () => `<code>let</code> is block-scoped and can change. <code>const</code> is block-scoped and cannot be reassigned. <code>var</code> is function-scoped and is mostly avoided today.`],
    [/array|\bmap\b|filter|reduce|foreach|push/, () => `Array methods: <code>push()</code> adds to the end, <code>map()</code> transforms every item into a new array, <code>filter()</code> keeps items that pass a test, <code>reduce()</code> combines items into one value, <code>forEach()</code> just loops.`],
    [/\bdom\b|event|queryselector|getelementbyid|addeventlistener|click/, () => `The <b>DOM</b> is the page as objects. Find elements with <code>document.getElementById()</code> or <code>querySelector()</code>, change them with <code>textContent</code> or <code>classList</code>, and react with <code>addEventListener("click", fn)</code>.`],
    [/local ?storage|session ?storage|json|cookie/, () => `<code>localStorage</code> keeps strings in the browser even after it closes (<code>sessionStorage</code> clears when the tab closes). Save objects with <code>JSON.stringify()</code> and read them back with <code>JSON.parse()</code>. This site uses it for scores and accounts.`],
    [/async|await|promise|fetch|\bapi\b/, () => `<code>fetch(url)</code> returns a Promise. Use <code>async/await</code>: <code>const res = await fetch(url); const data = await res.json();</code>. Wrap it in <code>try/catch</code> to handle errors.`],
    [/http|status code|404|\bget\b|\bpost\b|\bdns\b/, () => `<b>HTTP</b> is how browsers talk to servers. <b>GET</b> reads data, <b>POST</b> sends data in the body. Status codes: 200 OK, 301 redirect, 404 not found, 500 server error. <b>DNS</b> turns a domain name into an IP address.`],
    [/tip|advice|revise|study|improve/, () => `Study tips: 1) practise a little every day, 2) use <b>Retry missed</b> to repeat your mistakes, 3) try Hard mode once you pass 70%, 4) write your own questions, since explaining a topic helps you remember it.`],
    [/thank|thx|awesome|great|nice/, () => `You're welcome! 😊 Want me to quiz you?`]
  ];

  // ---------- UI ----------
  const fab = document.createElement("button"); fab.className = "qb-fab"; fab.setAttribute("aria-label", "Open QuizBot chat"); fab.textContent = "💬";
  const panel = document.createElement("section"); panel.className = "qb-panel"; panel.setAttribute("aria-label", "QuizBot chat");
  panel.innerHTML = `<div class="qb-head"><div><b>🤖 QuizBot</b><small>Your study buddy</small></div><div><button id="qbClear" aria-label="Clear chat">Clear</button><button id="qbClose" aria-label="Close chat">✕</button></div></div><div class="qb-msgs" id="qbMsgs" aria-live="polite"></div><div class="qb-chips" id="qbChips"></div><form class="qb-form" id="qbForm"><input id="qbIn" placeholder="Ask me anything..." maxlength="200" autocomplete="off"><button>Send</button></form>`;
  document.body.append(fab, panel);
  const $ = id => panel.querySelector("#" + id), box = $("qbMsgs");
  let log = read("qh-chat", []), pending = null;

  function add(who, html, save = true){
    const d = document.createElement("div"); d.className = "qb-m " + who; d.innerHTML = html; box.appendChild(d); box.scrollTop = box.scrollHeight;
    if (save) { log.push({ who, html }); write("qh-chat", log.slice(-30)); }
  }
  function chips(list){ $("qbChips").innerHTML = ""; list.forEach(t => { const b = document.createElement("button"); b.textContent = t; b.onclick = () => ask(t); $("qbChips").appendChild(b); }); }
  function typing(on){ const t = box.querySelector(".qb-typing"); if (on && !t) { const d = document.createElement("div"); d.className = "qb-m bot qb-typing"; d.innerHTML = "<i></i><i></i><i></i>"; box.appendChild(d); box.scrollTop = box.scrollHeight; } if (!on && t) t.remove(); }
  function open(v){ panel.classList.toggle("open", v); if (v) { $("qbIn").focus(); if (!box.children.length) start(); } }
  function start(){
    if (log.length) log.forEach(m => add(m.who, m.html, false));
    else add("bot", `Hi${first ? " " + first : ""}! 👋 I'm <b>QuizBot</b>. Ask me how the site works, or about HTML, CSS, JavaScript and web basics. Say <b>"quiz me"</b> to test yourself.`);
    chips(CHIPS);
  }

  // ---------- Quiz-me mode (uses the questions from the quiz page) ----------
  function quizMe(){
    if (typeof BANK === "undefined") return add("bot", `Open the <b>quiz page</b> and I can ask you questions from the quiz bank. Meanwhile, ask me about HTML, CSS or JavaScript!`), chips(CHIPS);
    const all = Object.values(BANK).flat(), q = all[Math.floor(Math.random() * all.length)];
    pending = { right: q.o[q.a], opts: q.o };
    add("bot", `🧠 <b>${esc(q.q)}</b>`); chips(q.o.slice().sort(() => Math.random() - .5));
  }
  function grade(text){
    const ok = text === pending.right; add("bot", ok ? "✅ Correct! Well done." : `❌ Not quite. The answer is <b>${esc(pending.right)}</b>.`);
    pending = null; chips(["Another question", "Study tips", "How do I play?"]);
  }

  // ---------- Reply logic ----------
  function local(text){
    const t = text.toLowerCase();
    if (/^another question$/.test(t)) return "__QUIZ__";
    for (const [re, fn] of KB) if (re.test(t)) return fn();
    return `I'm not sure about that yet 🤔. Try asking about scoring, lifelines, HTML, CSS, JavaScript, HTTP, or say <b>"quiz me"</b>.`;
  }
  async function reply(text){
    if (API_URL) { try { const r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) }); const d = await r.json(); if (d.reply) return esc(d.reply); } catch {} }
    return local(text);
  }
  async function ask(text){
    text = text.trim(); if (!text) return;
    add("me", esc(text)); $("qbIn").value = "";
    if (pending && pending.opts.includes(text)) return grade(text);
    pending = null; typing(true); $("qbChips").innerHTML = "";
    const ans = await reply(text); await new Promise(r => setTimeout(r, 450)); typing(false);
    if (ans === "__QUIZ__") return quizMe();
    add("bot", ans); chips(CHIPS);
  }

  fab.onclick = () => open(!panel.classList.contains("open"));
  $("qbClose").onclick = () => open(false);
  $("qbClear").onclick = () => { log = []; write("qh-chat", []); box.innerHTML = ""; pending = null; start(); };
  $("qbForm").onsubmit = e => { e.preventDefault(); ask($("qbIn").value); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") open(false); });
})();