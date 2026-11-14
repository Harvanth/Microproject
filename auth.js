// QuizHub Pro - shared script: theme, navigation, registration and sign in (demo, stored in the browser)
const $ = id => document.getElementById(id);
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const session = () => read("qh-session", null);
const page = document.body.dataset.page;

// ----- theme (shared with the quiz page) -----
document.documentElement.dataset.theme = read("qh-theme", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
if ($("theme")) $("theme").onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = t; write("qh-theme", t); };

// ----- helpers -----
async function hash(s){
  try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  catch { return btoa(unescape(encodeURIComponent(s))); }
}
const users = () => read("qh-users", []);
function fieldErr(id, text){ $(id).classList.toggle("bad", !!text); $(id + "Err").textContent = text || ""; return !text; }
function setMsg(text, ok){ const m = $("msg"); m.textContent = text; m.className = "msg " + (ok ? "ok" : "bad"); }
function go(url){ setTimeout(() => location.href = url, 700); }
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
function togglePw(btn, input){ btn.onclick = () => { const h = input.type === "password"; input.type = h ? "text" : "password"; btn.textContent = h ? "Hide" : "Show"; }; }

// ----- navigation (landing page) -----
if ($("navAuth")) {
  const s = session();
  $("navAuth").innerHTML = s
    ? `Hi, ${esc(s.name.split(" ")[0])} <a class="btn sm" href="quiz.html">Play quiz</a><button class="btn ghost sm" id="logout">Log out</button>`
    : `<a class="btn ghost sm" href="signin.html">Sign in</a><a class="btn sm" href="register.html">Register</a>`;
  if ($("logout")) $("logout").onclick = () => { localStorage.removeItem("qh-session"); location.reload(); };
}

// ----- scroll reveal (landing page) -----
if (page === "landing" && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
  document.querySelectorAll(".rv").forEach(el => io.observe(el));
} else document.querySelectorAll(".rv").forEach(el => el.classList.add("in"));

// ----- registration -----
if (page === "register") {
  if (session()) location.href = "quiz.html";
  togglePw($("t1"), $("pw")); togglePw($("t2"), $("pw2"));
  $("pw").oninput = () => {
    const p = $("pw").value, sc = [p.length >= 8, /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    $("bar").style.width = (p ? sc * 25 : 0) + "%"; $("bar").style.background = ["var(--bad)","var(--bad)","#e5a100","var(--ok)","var(--ok)"][sc];
    $("strength").textContent = p ? ["Very weak","Weak","Fair","Good","Strong"][sc] : "";
  };
  $("regForm").onsubmit = async e => {
    e.preventDefault();
    const name = $("name").value.trim(), email = $("email").value.trim().toLowerCase(), pw = $("pw").value;
    const a = fieldErr("name", name.length < 2 ? "Enter your full name (at least 2 characters)." : "");
    const b = fieldErr("email", !emailOk(email) ? "Enter a valid email address." : users().some(u => u.email === email) ? "This email is already registered. Please sign in." : "");
    const c = fieldErr("pw", pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Use at least 8 characters with a letter and a number." : "");
    const d = fieldErr("pw2", $("pw2").value !== pw ? "Passwords do not match." : "");
    $("termsErr").textContent = $("terms").checked ? "" : "Please accept the terms to continue.";
    if (!(a && b && c && d) || !$("terms").checked) return setMsg("Please fix the highlighted fields.", false);
    const list = users(); list.push({ name, email, pass: await hash(pw), joined: new Date().toLocaleDateString() }); write("qh-users", list);
    write("qh-session", { name, email }); setMsg("Account created! Taking you to the quiz...", true); go("quiz.html");
  };
}

// ----- sign in -----
if (page === "signin") {
  if (session()) location.href = "quiz.html";
  togglePw($("t1"), $("pw"));
  $("loginForm").onsubmit = async e => {
    e.preventDefault();
    const email = $("email").value.trim().toLowerCase(), pw = $("pw").value;
    const a = fieldErr("email", !emailOk(email) ? "Enter a valid email address." : ""), b = fieldErr("pw", !pw ? "Enter your password." : "");
    if (!(a && b)) return setMsg("Please fix the highlighted fields.", false);
    const u = users().find(x => x.email === email);
    if (!u || u.pass !== await hash(pw)) return setMsg("Incorrect email or password.", false);
    write("qh-session", { name: u.name, email: u.email }); setMsg("Welcome back, " + u.name.split(" ")[0] + "! Loading...", true); go("quiz.html");
  };
}
