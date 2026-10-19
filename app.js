/* 3SVerse Etsy Tools v1.0.0 — app.js
   Original open-source toolkit (MIT). All scores are LOCAL heuristics.
   No external APIs, no tracking, no data leaves this page. */
"use strict";

/* ---------------- helpers ---------------- */
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
const money = (v) => "$" + (Math.round(v * 100) / 100).toFixed(2);

let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function download(filename, text, type) {
  const blob = new Blob([text], { type: type || "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}

/* ---------------- tabs ---------------- */
$$(".tab").forEach((btn) => btn.addEventListener("click", () => {
  $$(".tab").forEach((b) => b.classList.toggle("on", b === btn));
  $$(".panel").forEach((p) => p.classList.toggle("on", p.id === btn.dataset.panel));
}));

/* ================= KEYWORD RESEARCH ================= */
const AUDIENCE = ["for her", "for him", "for mom", "for dad", "for wife", "for husband", "for kids", "for friend", "for sister", "for brother", "for grandma", "for grandpa"];
const OCCASION = ["birthday gift", "christmas gift", "anniversary gift", "wedding gift", "mothers day gift", "fathers day gift", "valentines day gift", "graduation gift", "baby shower gift", "housewarming gift", "stocking stuffer"];
const STYLE = ["personalized", "custom", "handmade", "vintage", "minimalist", "boho", "funny", "cute", "unique", "matching set", "custom name", "monogram"];
const FORMAT = {
  auto: ["gift", "decor", "accessory"],
  jewelry: ["necklace", "bracelet", "earrings", "ring", "keychain", "anklet"],
  "wall-art": ["wall art", "canvas print", "poster", "framed print", "metal sign", "wood sign"],
  apparel: ["tshirt", "sweatshirt", "hoodie", "tank top", "cap", "socks"],
  digital: ["svg", "png", "printable", "digital download", "clipart", "sublimation design"],
  stickers: ["sticker", "decal", "laptop sticker", "car decal", "vinyl decal"],
  mugs: ["mug", "coffee mug", "tumbler", "glass cup", "travel mug"],
  home: ["doormat", "candle", "throw pillow", "blanket", "ornament", "plant pot"]
};
const BROAD = new Set(["gift", "jewelry", "shirt", "art", "necklace", "printable", "sticker", "mug", "candle", "svg", "decor"]);

function kwScores(kw) {
  const words = kw.split(" ").filter(Boolean);
  const n = words.length;
  let comp = 58 - Math.max(0, n - 2) * 7;
  if (words.some((w) => BROAD.has(w))) comp += 16;
  if (n >= 5) comp -= 8;
  let dem = 50;
  if (/gift/.test(kw)) dem += 12;
  if (/personalized|custom/.test(kw)) dem += 10;
  if (/mothers day|fathers day|christmas|valentine|anniversary|birthday|graduation|baby shower|housewarming/.test(kw)) dem += 8;
  if (/for (her|him|mom|dad|wife|husband|kids|friend|sister|brother|grandma|grandpa)/.test(kw)) dem += 6;
  if (n > 6) dem -= 6;
  comp = clamp(Math.round(comp), 5, 98);
  dem = clamp(Math.round(dem), 5, 98);
  return { words: n, chars: kw.length, taggable: kw.length <= 20, comp, dem, opp: Math.round(dem - comp * 0.6) };
}

function genKeywords() {
  const seed = norm($("#kwSeed").value);
  if (!seed) { toast("Pehle seed keyword likho"); return; }
  const mods = [...AUDIENCE, ...OCCASION, ...STYLE, ...(FORMAT[$("#kwCat").value] || [])];
  const set = new Set([seed]);
  for (const m of mods) { set.add(seed + " " + m); set.add(m + " " + seed); }
  const rows = Array.from(set).map((k) => ({ kw: k, ...kwScores(k) }));
  rows.sort((a, b) => b.opp - a.opp);
  window.__kwRows = rows;
  const bw = (v) => clamp(Math.round(v + 60), 4, 100);
  $("#kwOut").innerHTML =
    '<table class="tbl"><thead><tr><th>Keyword</th><th>W</th><th>Ch</th><th>Taggable</th><th>Comp</th><th>Demand</th><th>Opportunity</th></tr></thead><tbody>' +
    rows.map((r) =>
      "<tr><td>" + esc(r.kw) + "</td><td class=\"num\">" + r.words + "</td><td class=\"num\"" + (r.chars > 20 ? " style=\"color:var(--warn)\"" : "") + ">" + r.chars + "</td>" +
      "<td class=\"" + (r.taggable ? "tag-yes" : "tag-no") + "\">" + (r.taggable ? "yes" : "no") + "</td>" +
      "<td class=\"num\">" + r.comp + "</td><td class=\"num\">" + r.dem + "</td>" +
      "<td><div class=\"mini-bar\"><i style=\"width:" + bw(r.opp) + "%\"></i></div><span class=\"num muted\" style=\"font-size:11px\">" + r.opp + "</span></td></tr>"
    ).join("") + "</tbody></table>";
  $("#kwExport").disabled = false;
  toast(rows.length + " keyword ideas ready");
}

function exportKwCsv() {
  const rows = window.__kwRows || [];
  if (!rows.length) return;
  const csv = ["keyword,words,chars,taggable,competition,demand,opportunity"]
    .concat(rows.map((r) => '"' + r.kw.replace(/"/g, '""') + '",' + r.words + "," + r.chars + "," + (r.taggable ? "yes" : "no") + "," + r.comp + "," + r.dem + "," + r.opp))
    .join("\n");
  download("etsy-keywords.csv", csv, "text/csv");
}

/* ================= TAG GENERATOR ================= */
const STOP = new Set(["the", "and", "with", "for", "a", "an", "of", "my", "your", "by", "in", "on", "or", "to", "is", "it", "that", "this", "from", "at", "as"]);
const BOOST = ["gift", "personalized", "custom", "handmade", "digital", "printable", "svg", "vintage", "boho", "minimalist", "mom", "dad", "wedding", "birthday", "christmas", "ornament"];

function tokenize(t) { return norm(t).split(" ").filter(Boolean); }

function ngrams(words, n) {
  const out = [];
  for (let i = 0; i + n <= words.length; i += 1) out.push(words.slice(i, i + n).join(" "));
  return out;
}

function tagPool() {
  const words = tokenize($("#tagInput").value);
  if (!words.length) return [];
  const head2 = words.slice(0, 2).join(" ");
  const seen = new Set();
  const pool = [];
  for (let n = 1; n <= 3; n += 1) {
    for (const g of ngrams(words, n)) {
      if (g.length < 3 || g.length > 20 || seen.has(g)) continue;
      seen.add(g);
      const gw = g.split(" ");
      let s = 0;
      if (gw.length === 2) s += 10;
      if (gw.length === 3) s += 14;
      if (g.length >= 8 && g.length <= 16) s += 8;
      if (gw.some((w) => BOOST.includes(w))) s += 5;
      if (STOP.has(g)) s -= 100;
      if (STOP.has(gw[0])) s -= 8;
      if (g === head2) s += 6;
      pool.push({ g, s });
    }
  }
  pool.sort((a, b) => b.s - a.s);
  return pool;
}

let tags = [];
let tagPoolCache = [];

function renderTags() {
  $("#tagCount").textContent = tags.length + "/13";
  $("#tagChips").innerHTML = tags.map((t) => {
    const over = t.length > 20;
    return '<span class="tchip" data-t="' + esc(t) + '">' + esc(t) + '<small class="' + (over ? "over" : "") + '">' + t.length + "/20</small></span>";
  }).join("") || '<span class="muted">Koi tags nahi — Generate dabao</span>';
  $$("#tagChips .tchip").forEach((c) => c.addEventListener("click", () => {
    tags = tags.filter((t) => t !== c.dataset.t);
    renderTags();
  }));
}

function buildTags() {
  tagPoolCache = tagPool();
  if (!tagPoolCache.length) { toast("Pehle title ya keywords likho"); return; }
  tags = tagPoolCache.slice(0, 13).map((p) => p.g);
  renderTags();
  toast("13 tags ready — click to remove");
}

function fillTags() {
  if (!tagPoolCache.length) tagPoolCache = tagPool();
  const have = new Set(tags);
  for (const p of tagPoolCache) {
    if (tags.length >= 13) break;
    if (!have.has(p.g)) { tags.push(p.g); have.add(p.g); }
  }
  renderTags();
}

function copyTags() {
  if (!tags.length) { toast("Pehle tags banao"); return; }
  const txt = tags.join(", ");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(() => toast("Copied: 13 tags comma-separated"), () => fallbackCopy(txt));
  } else fallbackCopy(txt);
}

function fallbackCopy(txt) {
  const ta = document.createElement("textarea");
  ta.value = txt;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); toast("Copied"); } catch (e) { toast("Copy fail — manually select karo"); }
  ta.remove();
}

/* wiring (keyword + tags) */
$("#kwGo").addEventListener("click", genKeywords);
$("#kwExport").addEventListener("click", exportKwCsv);
$("#kwSeed").addEventListener("keydown", (e) => { if (e.key === "Enter") genKeywords(); });
$("#tagGo").addEventListener("click", buildTags);
$("#tagFill").addEventListener("click", fillTags);
$("#tagCopy").addEventListener("click", copyTags);
