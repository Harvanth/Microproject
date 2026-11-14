// Login guard: only signed-in users can play
const user = JSON.parse(localStorage.getItem("qh-session") || "null");
if (!user) location.href = "signin.html";

// ---------- Question bank (built-in). Your own questions are added from the "Add questions" tab ----------
const BANK = {
  "HTML & CSS": [
    {q:"Which tag defines the largest heading in HTML?",o:["<h6>","<h1>","<head>","<header>"],a:1},
    {q:"Which CSS property changes the text color?",o:["font-color","text-color","color","fg"],a:2},
    {q:"Which HTML element is used for an unordered list?",o:["<ol>","<li>","<ul>","<list>"],a:2},
    {q:"What does CSS stand for?",o:["Creative Style Sheets","Cascading Style Sheets","Computer Style Sheets","Colorful Style Sheets"],a:1},
    {q:"Which attribute gives an image alternative text?",o:["title","src","alt","name"],a:2},
    {q:"Which CSS layout module arranges items in rows and columns?",o:["Grid","Float","Inline","Table-cell only"],a:0},
    {q:"Which tag is used to create a hyperlink?",o:["<link>","<a>","<href>","<url>"],a:1},
    {q:"Which property sets space INSIDE an element's border?",o:["margin","spacing","padding","gap-inner"],a:2},
    {q:"Which HTML5 tag represents navigation links?",o:["<navigate>","<nav>","<menu-bar>","<links>"],a:1},
    {q:"Which CSS unit is relative to the viewport width?",o:["em","px","vw","pt"],a:2}
  ],
  "JavaScript": [
    {q:"Which keyword declares a block-scoped variable?",o:["var","let","define","dim"],a:1},
    {q:"What does typeof null return?",o:["'null'","'undefined'","'object'","'number'"],a:2},
    {q:"Which method adds an element to the end of an array?",o:["push()","pop()","shift()","concat()"],a:0},
    {q:"Which symbol is used for strict equality?",o:["==","=","===","!="],a:2},
    {q:"Which method converts JSON text to a JavaScript object?",o:["JSON.stringify()","JSON.parse()","JSON.object()","JSON.read()"],a:1},
    {q:"Which function runs code after a delay?",o:["setTimeout()","wait()","delay()","pause()"],a:0},
    {q:"How do you select an element by id in the DOM?",o:["getElement('id')","document.getElementById()","document.id()","querySelectorId()"],a:1},
    {q:"What will console.log(2 + '2') print?",o:["4","22","NaN","Error"],a:1},
    {q:"Which array method creates a new array from each item's result?",o:["forEach()","filter()","map()","reduce()"],a:2},
    {q:"Which event fires when a button is clicked?",o:["onpress","onclick","onhit","ontap"],a:1}
  ],
  "Web Basics": [
    {q:"What does HTTP stand for?",o:["HyperText Transfer Protocol","High Transfer Text Protocol","HyperText Transmission Process","Host Transfer Protocol"],a:0},
    {q:"Which HTTP method is normally used to submit form data securely in the body?",o:["GET","POST","HEAD","TRACE"],a:1},
    {q:"Which status code means 'Not Found'?",o:["200","301","404","500"],a:2},
    {q:"Which of these is a client-side language?",o:["PHP","JavaScript","Python (Django)","Java Servlet"],a:1},
    {q:"What does DNS do?",o:["Encrypts traffic","Translates domain names to IP addresses","Stores cookies","Compresses images"],a:1},
    {q:"Which storage keeps data in the browser even after it is closed?",o:["sessionStorage","localStorage","Memory only","Clipboard"],a:1},
    {q:"What does URL stand for?",o:["Uniform Resource Locator","Universal Reference Link","Unified Resource Layer","User Request Line"],a:0},
    {q:"Which protocol adds encryption to HTTP?",o:["FTP","SMTP","HTTPS","SSH-only"],a:2},
    {q:"What format do most web APIs use to exchange data?",o:["JSON","BMP","EXE","MP3"],a:0},
    {q:"Which tool inspects a page's HTML, CSS and network calls in a browser?",o:["DevTools","Notepad","Task Manager","Terminal"],a:0}
  ]
};

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const LS = { get(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const LEVELS = { Easy:{t:30,m:1}, Medium:{t:20,m:1.5}, Hard:{t:10,m:2} };
let custom = LS.get("qh-custom", []);
const bank = () => { const b = JSON.parse(JSON.stringify(BANK)); custom.forEach(c => (b[c.topic] = b[c.topic] || []).push({ q:c.q, o:c.o, a:c.a })); return b; };

// ---------- Theme and tabs ----------
function setTheme(t){ document.documentElement.dataset.theme = t; $("theme").textContent = t === "dark" ? "Light mode" : "Dark mode"; LS.set("qh-theme", t); }
setTheme(LS.get("qh-theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => view(b.dataset.v));
function view(v){
  ["play","add","board"].forEach(x => $("v-" + x).classList.toggle("hidden", x !== v));
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  if (v === "board") drawBoard(); if (v === "add") drawCustom();
}
function fillTopics(){
  const t = Object.keys(bank()), keep = $("topic").value;
  $("topic").innerHTML = t.map(x => `<option>${esc(x)}</option>`).join(""); if (t.includes(keep)) $("topic").value = keep;
  $("topics").innerHTML = t.map(x => `<option value="${esc(x)}">`).join("");
  const f = $("bf").value; $("bf").innerHTML = `<option value="">All topics</option>` + t.map(x => `<option>${esc(x)}</option>`).join(""); $("bf").value = f; drawCards();
}
function miniStats(){
  const s = LS.get("qh-scores", []); drawAch();
  $("mini").textContent = s.length ? `Games played: ${s.length} · Best score: ${Math.max(...s.map(x => x.pts))} points` : "Welcome! Your stats will appear here after your first quiz.";
}

// ---------- Game state ----------
let qs, idx, score, pts, streak, best, answers, tick, left, lvl, player, topic, used, locked, t0;
const show = id => ["start","quiz","result"].forEach(s => $(s).classList.toggle("hidden", s !== id));

$("startBtn").onclick = () => {
  player = $("name").value.trim();
  if (!player) { $("name").focus(); $("name").placeholder = "Please enter your name"; return; }
  topic = $("topic").value; lvl = $("lvl").value;
  const b = shuffle(bank()[topic]), n = $("count").value;
  begin(b.slice(0, n === "All" ? b.length : +n));
};
function begin(list){
  qs = list.map(q => ({ q:q.q, opts:shuffle(q.o.map((t, i) => ({ t, ok:i === q.a }))) }));
  idx = 0; score = 0; pts = 0; streak = 0; best = 0; answers = []; used = { f:false, s:false }; t0 = Date.now();
  $("f5").disabled = false; $("skip").disabled = false; show("quiz"); render();
}
function render(){
  const q = qs[idx]; locked = false;
  $("qnum").textContent = `Q ${idx + 1}/${qs.length}`; $("pts").textContent = `${pts} pts`; $("stk").textContent = `Streak ${streak}`;
  $("prog").style.width = (idx / qs.length * 100) + "%"; $("qtext").textContent = q.q; $("fb").textContent = ""; $("fb").style.color = "";
  $("opts").innerHTML = "";
  q.opts.forEach((o, i) => { const b = document.createElement("button"); b.className = "opt"; b.textContent = `${i + 1}. ${o.t}`; b.onclick = () => choose(i); $("opts").appendChild(b); });
  $("nextBtn").disabled = true; $("nextBtn").textContent = idx === qs.length - 1 ? "Finish quiz" : "Next question";
  $("f5").disabled = used.f || q.opts.length < 3; $("skip").disabled = used.s;
  clearInterval(tick); left = LEVELS[lvl].t; paint();
  tick = setInterval(() => { left--; paint(); if (left <= 0) choose(-1); }, 1000);
}
const paint = () => { $("timer").textContent = left + "s"; $("timer").classList.toggle("low", left <= 5); $("tb").style.width = left / LEVELS[lvl].t * 100 + "%"; $("tb").style.background = left <= 5 ? "var(--bad)" : left <= 10 ? "#e5a100" : "var(--ok)"; };

function choose(i){
  if (locked) return; locked = true; clearInterval(tick);
  const q = qs[idx], btns = [...$("opts").children], L = LEVELS[lvl];
  btns.forEach((b, k) => { b.disabled = true; b.style.visibility = ""; if (q.opts[k].ok) b.classList.add("ok"); });
  const ok = i >= 0 && q.opts[i].ok, right = q.opts.find(o => o.ok).t;
  let picked = i >= 0 ? q.opts[i].t : i === -2 ? "Skipped" : "No answer (time up)", msg = "", col = "var(--bad)";
  if (i >= 0 && !ok) btns[i].classList.add("bad");
  if (ok) {
    streak++; best = Math.max(best, streak); score++;
    const g = Math.round(100 * L.m + left / L.t * 50 + Math.min(streak - 1, 5) * 10); pts += g;
    msg = `Correct! +${g} points` + (streak > 1 ? ` (streak bonus)` : ""); col = "var(--ok)";
  } else if (i === -2) { msg = "Skipped. No points, streak kept."; col = "var(--muted)"; }
  else { streak = 0; msg = i === -1 ? "Time is up. Streak reset." : "Wrong. Streak reset."; }
  snd(ok ? 660 : i === -2 ? 440 : 220);
  $("fb").textContent = msg; $("fb").style.color = col; $("pts").textContent = `${pts} pts`; $("stk").textContent = `Streak ${streak}`;
  answers.push({ q:q.q, picked, right, ok, src:{ q:q.q, o:q.opts.map(o => o.t), a:q.opts.findIndex(o => o.ok) } });
  $("nextBtn").disabled = false; $("nextBtn").focus();
}
$("nextBtn").onclick = () => { idx++; idx < qs.length ? render() : finish(); };
$("f5").onclick = () => {
  if (locked || used.f) return; used.f = true; $("f5").disabled = true; const q = qs[idx];
  shuffle([...$("opts").children].filter((b, k) => !q.opts[k].ok)).slice(0, 2).forEach(b => { b.disabled = true; b.style.visibility = "hidden"; });
};
$("skip").onclick = () => { if (!locked && !used.s) { used.s = true; choose(-2); } };
document.addEventListener("keydown", e => {
  if ($("quiz").classList.contains("hidden") || e.target.tagName === "INPUT") return;
  if (/^[1-4]$/.test(e.key) && !locked) $("opts").children[+e.key - 1]?.click();
  else if (e.key === "Enter" && !$("nextBtn").disabled) $("nextBtn").click();
});

// ---------- Result ----------
function finish(){
  const total = qs.length, acc = Math.round(score / total * 100), secs = Math.round((Date.now() - t0) / 1000);
  $("who").textContent = `${player} · ${topic} · ${lvl}`;
  $("badge").textContent = acc >= 90 ? "🥇 Gold" : acc >= 70 ? "🥈 Silver" : acc >= 50 ? "🥉 Bronze" : "Keep practising";
  $("score").textContent = `${pts} pts`;
  $("stats").innerHTML = `<div><b>${score}/${total}</b>correct</div><div><b>${acc}%</b>accuracy</div><div><b>${best}</b>best streak</div><div><b>${secs}s</b>total time</div><div><b>${answers.filter(a => a.picked === "Skipped").length}</b>skipped</div><div><b>${answers.filter(a => !a.ok).length}</b>to review</div>`;
  $("msg").textContent = acc >= 80 ? "Excellent work!" : acc >= 50 ? "Good effort. Review your answers and try again." : "Review the answers below and give it another go.";
  $("review").innerHTML = answers.map((a, n) => `<div class="rev"><div>${n + 1}. ${esc(a.q)}</div><div>Your answer: <span class="${a.ok ? "ok-t" : "bad-t"}">${esc(a.picked)}</span></div>${a.ok ? "" : `<div>Correct: <span class="ok-t">${esc(a.right)}</span></div>`}</div>`).join("");
  $("review").classList.add("hidden"); $("toggleRev").textContent = "Review answers"; $("retry").classList.toggle("hidden", answers.every(a => a.ok));
  const all = LS.get("qh-scores", []); all.push({ name:player, topic, lvl, pts, score, total, best, date:new Date().toLocaleDateString() });
  LS.set("qh-scores", all.slice(-200)); miniStats(); show("result"); snd(880, .3); if (acc >= 70) confetti(); checkAch();
}
$("toggleRev").onclick = () => { const h = $("review").classList.toggle("hidden"); $("toggleRev").textContent = h ? "Review answers" : "Hide review"; };
$("again").onclick = () => show("start");
$("retry").onclick = () => begin(answers.filter(a => !a.ok).map(a => a.src));
$("copy").onclick = async () => {
  const t = `${player} scored ${pts} points (${score}/${qs.length}) on ${topic} [${lvl}] in QuizHub Pro!`;
  try { await navigator.clipboard.writeText(t); $("copy").textContent = "Copied!"; } catch { $("copy").textContent = "Copy not allowed"; }
  setTimeout(() => $("copy").textContent = "Copy result", 1500);
};

// ---------- Add questions ----------
$("addQ").onclick = () => {
  const t = $("ctopic").value.trim(), q = $("cq").value.trim(), o = [0,1,2,3].map(i => $("o" + i).value.trim());
  if (!t || !q || o.some(x => !x)) { $("addfb").style.color = "var(--bad)"; $("addfb").textContent = "Fill in the topic, question and all 4 options."; return; }
  custom.push({ topic:t, q, o, a:+$("ca").value }); LS.set("qh-custom", custom);
  ["cq","o0","o1","o2","o3"].forEach(i => $(i).value = ""); $("addfb").style.color = "var(--ok)"; $("addfb").textContent = "Question added.";
  fillTopics(); drawCustom();
};
function drawCustom(){
  $("clist").innerHTML = custom.length ? custom.map((c, i) => `<div class="qi"><span><b>${esc(c.topic)}:</b> ${esc(c.q)}</span><button class="btn ghost sm" data-i="${i}">Delete</button></div>`).join("") : `<p class="sub">No custom questions yet. Add one above.</p>`;
  $("clist").querySelectorAll("button").forEach(b => b.onclick = () => { custom.splice(+b.dataset.i, 1); LS.set("qh-custom", custom); fillTopics(); drawCustom(); });
}

// ---------- Leaderboard ----------
const topScores = () => LS.get("qh-scores", []).filter(s => !$("bf").value || s.topic === $("bf").value).sort((a, b) => b.pts - a.pts).slice(0, 10);
function drawBoard(){
  const r = topScores();
  $("board").innerHTML = r.length ? r.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${esc(s.topic)}</td><td>${s.lvl}</td><td>${s.pts}</td></tr>`).join("") : `<tr><td colspan="5">No scores yet.</td></tr>`;
}
$("bf").onchange = drawBoard;
$("clear").onclick = () => { if (confirm("Delete all saved scores?")) { LS.set("qh-scores", []); drawBoard(); miniStats(); } };
$("csv").onclick = () => {
  const rows = [["Name","Topic","Level","Points","Correct","Total","Date"], ...LS.get("qh-scores", []).map(s => [s.name, s.topic, s.lvl, s.pts, s.score, s.total, s.date])];
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type:"text/csv" }));
  a.download = "quizhub-scores.csv"; a.click();
};

// ---------- Extras: sound, confetti, toast, achievements, topic cards, certificate ----------
const snd = (f, d = .12) => { if (!LS.get("qh-snd", true)) return; try { const c = snd.c || (snd.c = new AudioContext()), o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .05; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + d); } catch {} };
$("snd").onclick = () => { const v = !LS.get("qh-snd", true); LS.set("qh-snd", v); $("snd").textContent = "Sound: " + (v ? "on" : "off"); };
$("snd").textContent = "Sound: " + (LS.get("qh-snd", true) ? "on" : "off");
function toast(t){ const e = $("toast"); e.textContent = t; e.classList.add("on"); setTimeout(() => e.classList.remove("on"), 3200); }
function confetti(){ const E = ["🎉","✨","🎊","⭐"]; for (let i = 0; i < 40; i++) { const s = document.createElement("span"); s.className = "cf"; s.textContent = E[i % 4]; s.style.left = Math.random() * 100 + "vw"; s.style.animationDelay = Math.random() * .8 + "s"; document.body.appendChild(s); setTimeout(() => s.remove(), 3600); } }
const ACH = [
  { id:"first", t:"🎯 First quiz", ok:(s) => s.length >= 1 },
  { id:"five", t:"🏅 5 quizzes", ok:(s) => s.length >= 5 },
  { id:"perfect", t:"🌟 Perfect score", ok:(s) => s.some(x => x.score === x.total && x.total >= 5) },
  { id:"streak", t:"🔥 5-answer streak", ok:(s) => s.some(x => x.best >= 5) },
  { id:"hard", t:"💪 Hard mode 70%+", ok:(s) => s.some(x => x.lvl === "Hard" && x.score / x.total >= .7) },
  { id:"all", t:"🧭 All topics", ok:(s) => new Set(s.map(x => x.topic)).size >= 3 },
  { id:"author", t:"✍️ Question author", ok:() => custom.length >= 1 }
];
function drawAch(){ const s = LS.get("qh-scores", []); $("ach").innerHTML = ACH.map(a => `<span class="ap${a.ok(s) ? " on" : ""}">${a.t}</span>`).join(""); }
function checkAch(){
  const s = LS.get("qh-scores", []), had = LS.get("qh-ach", []), now = ACH.filter(a => a.ok(s)).map(a => a.id), fresh = ACH.filter(a => now.includes(a.id) && !had.includes(a.id));
  LS.set("qh-ach", now); if (fresh.length) toast("Achievement unlocked: " + fresh.map(a => a.t).join(", "));
}
const ICON = { "HTML & CSS":"🎨", "JavaScript":"⚡", "Web Basics":"🌐" };
function drawCards(){
  const sel = $("topic"), b = bank();
  $("tc").innerHTML = [...sel.options].map(o => `<button class="tc${o.value === sel.value ? " on" : ""}" data-t="${esc(o.value)}"><span>${ICON[o.value] || "📝"}</span>${esc(o.value)}<small>${b[o.value].length} questions</small></button>`).join("");
  $("tc").querySelectorAll("button").forEach(x => x.onclick = () => { sel.value = x.dataset.t; drawCards(); });
}
$("cert").onclick = () => {
  const c = document.createElement("canvas"); c.width = 900; c.height = 600; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 900, 600); g.addColorStop(0, "#3b4cca"); g.addColorStop(1, "#e0457b"); x.fillStyle = g; x.fillRect(0, 0, 900, 600);
  x.fillStyle = "#fff"; x.fillRect(24, 24, 852, 552); x.strokeStyle = "#3b4cca"; x.lineWidth = 4; x.strokeRect(40, 40, 820, 520); x.textAlign = "center"; x.fillStyle = "#1f2a44";
  x.font = "bold 46px Georgia"; x.fillText("Certificate of Achievement", 450, 150); x.font = "22px Georgia"; x.fillText("This certifies that", 450, 215);
  x.font = "bold 56px Georgia"; x.fillStyle = "#3b4cca"; x.fillText(player, 450, 295); x.fillStyle = "#1f2a44"; x.font = "24px Georgia";
  x.fillText(`scored ${pts} points (${score}/${qs.length} correct)`, 450, 360); x.fillText(`in ${topic} on ${lvl} difficulty`, 450, 400);
  x.font = "italic 20px Georgia"; x.fillText(new Date().toLocaleDateString() + "  ·  QuizHub Pro", 450, 500);
  const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "quiz-certificate.png"; a.click();
};

fillTopics(); miniStats();
if (user) $("name").value = user.name.split(" ")[0];
$("logout").onclick = () => { localStorage.removeItem("qh-session"); location.href = "index.html"; };

