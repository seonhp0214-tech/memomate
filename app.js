// ===== 1. 저장소: 모든 데이터를 한 곳에서 저장/불러오기 =====
const KEY = "memomate_data";
let state = { memos: [], todos: [], events: [] };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) state = { memos: saved.memos || [], todos: saved.todos || [], events: saved.events || [] };
  } catch (e) { /* 저장 데이터가 깨져 있으면 빈 상태로 시작 */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { alert("저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요."); }
}

// ===== 도우미 함수 =====
const $ = (id) => document.getElementById(id);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function esc(s) { // 입력한 글자를 안전하게 화면에 표시
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ymd(d) { // Date -> "2026-11-26" (내 컴퓨터 시간 기준)
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
const todayStr = () => ymd(new Date());
function fmtTime(ms) {
  const d = new Date(ms);
  return ymd(d) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
const memoDate = (m) => ymd(new Date(m.created));

// ===== 화면 전환 =====
let currentView = "today";
function show(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
}
$("nav").addEventListener("click", (e) => { if (e.target.dataset.view) show(e.target.dataset.view); });

function render() {
  if (currentView === "today") renderToday();
  if (currentView === "memos") renderMemos();
  if (currentView === "todos") renderTodos();
  if (currentView === "calendar") renderCalendar();
}

// ===== 2. 메모 =====
let editingMemoId = null;

function renderMemos() {
  const list = $("memo-list");
  const sorted = [...state.memos].sort((a, b) => b.updated - a.updated);
  list.innerHTML = sorted.length
    ? sorted.map((m) => `<li class="clickable ${m.id === editingMemoId ? "selected" : ""}" data-id="${m.id}">
        <span class="grow">${esc(m.title || "(제목 없음)")}</span></li>`).join("")
    : '<li class="empty">아직 메모가 없어요. 새 메모를 만들어 보세요.</li>';

  const m = state.memos.find((x) => x.id === editingMemoId);
  $("memo-title").value = m ? m.title : $("memo-title").value;
  $("memo-body").value = m ? m.body : $("memo-body").value;
  $("memo-time").textContent = m ? `작성 ${fmtTime(m.created)} · 수정 ${fmtTime(m.updated)}` : "";
  $("memo-delete").hidden = !m;
}
$("memo-list").addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (li) { editingMemoId = li.dataset.id; renderMemos(); }
});
$("memo-new").addEventListener("click", () => {
  editingMemoId = null; $("memo-title").value = ""; $("memo-body").value = ""; renderMemos(); $("memo-title").focus();
});
$("memo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("memo-title").value.trim(), body = $("memo-body").value.trim();
  if (!title && !body) return alert("제목이나 내용을 적어 주세요.");
  const now = Date.now();
  const m = state.memos.find((x) => x.id === editingMemoId);
  if (m) { m.title = title; m.body = body; m.updated = now; }
  else { const n = { id: newId(), title, body, created: now, updated: now }; state.memos.push(n); editingMemoId = n.id; }
  save(); renderMemos();
});
$("memo-delete").addEventListener("click", () => {
  if (!confirm("이 메모를 삭제할까요? 되돌릴 수 없어요.")) return;
  state.memos = state.memos.filter((x) => x.id !== editingMemoId);
  editingMemoId = null; $("memo-title").value = ""; $("memo-body").value = "";
  save(); renderMemos();
});

// ===== 3. 할 일 =====
function todoItemHtml(t, showDue = true) {
  const overdue = t.due && !t.done && t.due < todayStr();
  return `<li class="${t.done ? "done" : ""}">
    <input type="checkbox" data-todo="${t.id}" ${t.done ? "checked" : ""}>
    <span class="grow">${esc(t.text)}</span>
    ${showDue && t.due ? `<span class="muted ${overdue ? "overdue" : ""}">${t.due}</span>` : ""}
    <button class="small danger" data-del-todo="${t.id}">삭제</button></li>`;
}
function renderTodos() {
  const sorted = [...state.todos].sort((a, b) => (a.done - b.done) || (a.due || "9999").localeCompare(b.due || "9999"));
  $("todo-list").innerHTML = sorted.length ? sorted.map((t) => todoItemHtml(t)).join("") : '<li class="empty">할 일이 없어요. 위에서 추가해 보세요.</li>';
}
$("todo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("todo-text").value.trim();
  if (!text) return;
  state.todos.push({ id: newId(), text, done: false, due: $("todo-due").value || "" });
  $("todo-text").value = ""; $("todo-due").value = "";
  save(); renderTodos();
});
// 할 일 체크/삭제는 어느 화면에서든 같은 방식으로 처리
document.addEventListener("click", (e) => {
  const del = e.target.dataset.delTodo;
  if (del) { state.todos = state.todos.filter((t) => t.id !== del); save(); render(); }
  const delEv = e.target.dataset.delEvent;
  if (delEv) { state.events = state.events.filter((x) => x.id !== delEv); save(); render(); }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.todo) {
    const t = state.todos.find((x) => x.id === e.target.dataset.todo);
    if (t) { t.done = e.target.checked; save(); render(); }
  }
});

// ===== 4. 캘린더 =====
let calMonth = new Date(); calMonth.setDate(1);
let selectedDate = todayStr();

function renderCalendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  $("cal-title").textContent = `${y}년 ${m + 1}월`;
  const first = new Date(y, m, 1);
  const start = new Date(y, m, 1 - first.getDay()); // 달력 첫 칸(일요일)
  let html = ["일", "월", "화", "수", "목", "금", "토"].map((d) => `<div class="cal-dow">${d}</div>`).join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const s = ymd(d);
    const hasEv = state.events.some((x) => x.date === s);
    const hasTd = state.todos.some((x) => x.due === s); // 마감일 연결
    const hasMm = state.memos.some((x) => memoDate(x) === s);
    html += `<div class="cal-cell ${d.getMonth() !== m ? "other" : ""} ${s === todayStr() ? "today" : ""} ${s === selectedDate ? "selected" : ""}" data-date="${s}">
      ${d.getDate()}<div class="dots">${hasEv ? '<span class="dot ev"></span>' : ""}${hasTd ? '<span class="dot td"></span>' : ""}${hasMm ? '<span class="dot mm"></span>' : ""}</div></div>`;
  }
  $("cal-grid").innerHTML = html;
  renderDayPanel();
}
function renderDayPanel() {
  const s = selectedDate;
  const evs = state.events.filter((x) => x.date === s);
  const tds = state.todos.filter((x) => x.due === s);
  const mms = state.memos.filter((x) => memoDate(x) === s);
  $("day-panel").innerHTML = `
    <h2>${s}</h2>
    <form id="event-form" class="row">
      <input id="event-text" type="text" placeholder="일정 추가 (예: 면접 15:00)" maxlength="100" required>
      <button class="primary" type="submit">추가</button>
    </form>
    <h3>일정</h3>
    <ul class="list">${evs.length ? evs.map((x) => `<li><span class="grow">${esc(x.text)}</span><button class="small danger" data-del-event="${x.id}">삭제</button></li>`).join("") : '<li class="empty">일정이 없어요.</li>'}</ul>
    <h3>마감인 할 일</h3>
    <ul class="list">${tds.length ? tds.map((t) => todoItemHtml(t, false)).join("") : '<li class="empty">마감인 할 일이 없어요.</li>'}</ul>
    <h3>이 날 쓴 메모</h3>
    <ul class="list">${mms.length ? mms.map((x) => `<li class="clickable" data-open-memo="${x.id}"><span class="grow">${esc(x.title || "(제목 없음)")}</span></li>`).join("") : '<li class="empty">메모가 없어요.</li>'}</ul>
    <p class="legend">달력 점: 주황=일정, 파랑=할 일 마감, 초록=메모</p>`;
  $("event-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("event-text").value.trim();
    if (!text) return;
    state.events.push({ id: newId(), date: selectedDate, text });
    save(); renderCalendar();
  });
}
$("cal-grid").addEventListener("click", (e) => {
  const c = e.target.closest("[data-date]");
  if (c) { selectedDate = c.dataset.date; renderCalendar(); }
});
$("cal-prev").addEventListener("click", () => { calMonth.setMonth(calMonth.getMonth() - 1); renderCalendar(); });
$("cal-next").addEventListener("click", () => { calMonth.setMonth(calMonth.getMonth() + 1); renderCalendar(); });
$("cal-today").addEventListener("click", () => { calMonth = new Date(); calMonth.setDate(1); selectedDate = todayStr(); renderCalendar(); });

// 메모 제목을 누르면 메모 화면으로 이동
document.addEventListener("click", (e) => {
  const li = e.target.closest("[data-open-memo]");
  if (li) { editingMemoId = li.dataset.openMemo; show("memos"); }
});

// ===== 5. 오늘 화면(홈) =====
function renderToday() {
  const t = todayStr();
  const evs = state.events.filter((x) => x.date === t);
  const tds = state.todos.filter((x) => !x.done && (x.due === t || (x.due && x.due < t))); // 오늘 마감 + 지난 마감
  const recent = [...state.memos].sort((a, b) => b.updated - a.updated).slice(0, 5);
  $("view-today").innerHTML = `
    <div class="card"><h2>오늘 (${t})</h2><p class="muted">오늘 일정, 해야 할 일, 최근 메모를 모아 봤어요.</p></div>
    <div class="card"><h2>오늘 일정</h2><ul class="list">${evs.length ? evs.map((x) => `<li><span class="grow">${esc(x.text)}</span></li>`).join("") : '<li class="empty">오늘 일정이 없어요.</li>'}</ul></div>
    <div class="card"><h2>오늘 할 일 (지난 마감 포함)</h2><ul class="list">${tds.length ? tds.map((x) => todoItemHtml(x)).join("") : '<li class="empty">오늘 할 일이 없어요.</li>'}</ul></div>
    <div class="card"><h2>최근 메모</h2><ul class="list">${recent.length ? recent.map((x) => `<li class="clickable" data-open-memo="${x.id}"><span class="grow">${esc(x.title || "(제목 없음)")}</span><span class="muted">${fmtTime(x.updated)}</span></li>`).join("") : '<li class="empty">메모가 없어요.</li>'}</ul></div>`;
}

// ===== 시작 =====
load();
show("today");
