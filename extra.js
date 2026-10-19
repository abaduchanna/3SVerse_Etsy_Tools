/* 3SVerse Etsy Tools v1.0.0 — extra.js
   Fee calculator, listing grader, trend buzz. Original work, MIT. */
"use strict";

/* ================= FEE & PROFIT CALCULATOR ================= */
const PROC = { us: [3, 0.25], uk: [4, 0.20], de: [4, 0.30], au: [4, 0.30], ca: [3, 0.25] };
const ADS = { off: 0, a12: 0.12, a15: 0.15 };

function feeRow(label, val, neg) {
  return '<div class="fr' + (neg ? " neg" : "") + '"><span>' + label + '</span><span>' + (typeof val === "string" ? val : money(val)) + "</span></div>";
}

function calcFees() {
  const P = parseFloat($("#fPrice").value) || 0;
  const S = parseFloat($("#fShip").value) || 0;
  const C = parseFloat($("#fCost").value) || 0;
  const SC = parseFloat($("#fShipCost").value) || 0;
  const region = $("#fRegion").value;
  const custom = region === "custom";
  $("#fPctWrap").classList.toggle("hidden", !custom);
  $("#fFlatWrap").classList.toggle("hidden", !custom);
  const pct = custom ? (parseFloat($("#fPct").value) || 0) : PROC[region][0];
  const flat = custom ? (parseFloat($("#fFlat").value) || 0) : PROC[region][1];
  const adsRate = ADS[$("#fAds").value] || 0;
  const listed = $("#fListed").checked;

  const rev = P + S;
  const listing = listed ? 0 : 0.20;
  const txn = rev * 0.065;
  const proc = rev * (pct / 100) + flat;
  const ads = rev * adsRate;
  const fees = listing + txn + proc + ads;
  const cost = C + SC;
  const profit = rev - fees - cost;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;
  const r = 0.065 + pct / 100 + adsRate;
  const breakeven = 1 - r > 0.001 ? Math.max(0, (cost + flat + listing) / (1 - r) - S) : NaN;

  $("#feeOut").innerHTML =
    '<div class="fee-rows">' +
    feeRow("Revenue (price + shipping)", rev) +
    feeRow("Listing fee", listing, true) +
    feeRow("Transaction fee (6.5%)", txn, true) +
    feeRow("Payment processing (" + pct + "% + " + money(flat) + ")", proc, true) +
    feeRow("Offsite Ads (" + Math.round(adsRate * 100) + "%)", ads, true) +
    feeRow("Total Etsy fees", fees, true) +
    feeRow("Your costs (item + shipping)", cost, true) +
    "</div>" +
    '<div class="big-profit"><span class="amt ' + (profit >= 0 ? "pos" : "neg") + '">' + (profit >= 0 ? "+" : "") + money(profit) + '</span>' +
    '<span class="sub">net profit per sale</span>' +
    '<span class="sub">margin: <b style="color:' + (margin >= 0 ? "var(--good)" : "var(--bad)") + '">' + margin.toFixed(1) + "%</b></span>" +
    '<span class="sub">break-even price: <b>' + (isNaN(breakeven) ? "--" : money(breakeven)) + "</b></span></div>";
}

/* ================= LISTING GRADER ================= */
function ringColor(s) { return s >= 80 ? "var(--good)" : s >= 50 ? "var(--warn)" : "var(--bad)"; }

function gradeListing() {
  const title = $("#gTitle").value;
  const tagsIn = $("#gTags").value.split(/[\n,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!title.trim() && !tagsIn.length) { toast("Title ya tags kuch to likho"); return; }

  const words = tokenize(title);
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const stuffed = Object.keys(freq).some((w) => freq[w] > 3);

  const phrases = tagsIn.filter((t) => t.split(" ").length >= 2);
  const strong = phrases.sort((a, b) => b.length - a.length)[0] || "";
  const head40 = norm(title.slice(0, 40));
  const early = !!strong && strong.split(" ").some((w) => w.length > 3 && head40.includes(w));

  const dup = new Set(tagsIn).size !== tagsIn.length;
  const overLen = tagsIn.filter((t) => t.length > 20).length;
  const tWords = new Set(words);
  const tagWordSet = new Set(tagsIn.flatMap((t) => t.split(" ")));
  let cover = 0;
  tagWordSet.forEach((w) => { if (tWords.has(w)) cover += 1; });
  const coverPct = tagWordSet.size ? Math.round((cover / tagWordSet.size) * 100) : 0;

  const checks = [
    { w: 20, ok: title.length >= 70 && title.length <= 140, label: "Title length " + title.length + "/140 (aim 70-140)", tip: "Poora 140-char budget use karo — pehle 40 chars sab se heavy hote hain." },
    { w: 20, ok: early, label: "Main keyword title ke first 40 chars me", tip: strong ? 'Strong phrase ("' + strong + '") title ke start me rakho.' : "2-3 word strong phrase wala tag banao, phir wo title ke start me daalo." },
    { w: 10, ok: !stuffed, label: "Koi word 3+ dafa repeat nahi hota", tip: "Keyword stuffing Etsy ranking hurt karta hai — synonyms use karo." },
    { w: 15, ok: tagsIn.length === 13, label: "Tags: " + tagsIn.length + "/13", tip: "Poore 13 tags use karo — har tag ek extra search darwaza hai." },
    { w: 10, ok: overLen === 0, label: "Sab tags 20 chars ke andar", tip: overLen ? overLen + " tag(s) lambay hain — Etsy inhe reject kar deta hai." : "20-char limit respected." },
    { w: 5, ok: !dup, label: "Koi duplicate tag nahi", tip: "Repeat tags wasted slots hain — har slot unique phrase do." },
    { w: 10, ok: phrases.length >= 9, label: "Multi-word phrases: " + phrases.length + " (aim 9+)", tip: "2-3 word phrases broad single words se behtar rank karte hain." },
    { w: 10, ok: coverPct >= 50, label: "Tag-title overlap " + coverPct + "% (aim 50%+)", tip: "Tags aur title mil kar ek consistent story sunate hain — Etsy dono index karta hai." }
  ];
  const score = checks.reduce((a, c) => a + (c.ok ? c.w : 0), 0);

  const ring = $("#gradeRing");
  ring.style.setProperty("--p", String(score));
  ring.style.setProperty("--ring-c", ringColor(score));
  $("#gradeScore").textContent = String(score);
  $("#gradeChecks").innerHTML = checks.map((c) =>
    '<div class="chk ' + (c.ok ? "ok" : "no") + '"><span class="mark">' + (c.ok ? "&#10003;" : "&#10007;") + "</span><span>" + esc(c.label) + '<span class="tip">' + esc(c.tip) + "</span></span></div>"
  ).join("");
}

/* ================= TREND BUZZ ================= */
const Y = new Date().getFullYear();
const MONTH = new Date().getMonth();
const SEASONS = {
  christmas: [9, 10, 11],
  valentines: [0, 1],
  halloween: [7, 8, 9],
  "mothers day": [2, 3, 4],
  "fathers day": [4, 5],
  graduation: [3, 4, 5],
  wedding: [1, 2, 3, 7, 8, 9],
  thanksgiving: [8, 9, 10],
  "back to school": [6, 7],
  easter: [2, 3],
  "baby shower": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

function buzzOne(raw) {
  const k = norm(raw);
  let s = 42;
  let season = null;
  for (const [name, months] of Object.entries(SEASONS)) {
    if (k.includes(name)) {
      season = name;
      s += months.includes(MONTH) ? 18 : -8;
      break;
    }
  }
  if (/gift/.test(k)) s += 10;
  if (/personalized|custom/.test(k)) s += 8;
  if (/digital|printable|svg|download/.test(k)) s += 6;
  if (k.includes(String(Y))) s += 12;
  if (/for (her|him|mom|dad)/.test(k)) s += 6;
  if (k.split(" ").filter(Boolean).length > 4) s -= 6;
  return { kw: raw.trim(), score: clamp(Math.round(s), 3, 99), season, inSeason: season ? SEASONS[season].includes(MONTH) : null };
}

function scoreBuzz() {
  const lines = $("#bKw").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  if (!lines.length) { toast("Kam az kam 1 keyword per line likho"); return; }
  const rows = lines.map(buzzOne).sort((a, b) => b.score - a.score);
  $("#buzzOut").innerHTML = rows.map((r) => {
    const chip = r.season
      ? '<span class="bz-season ' + (r.inSeason ? "in" : "off") + '">' + esc(r.season) + (r.inSeason ? " · in season" : " · off-season") + "</span>"
      : '<span class="bz-season">no season</span>';
    return '<div class="bz"><div class="bz-top"><span class="kw">' + esc(r.kw) + "</span>" + chip + '<span class="num"><b>' + r.score + "</b>/99</span></div>" +
      '<div class="bar"><i style="width:' + r.score + '%"></i></div></div>';
  }).join("");
}

/* ================= wiring ================= */
$("#feeGo").addEventListener("click", calcFees);
$("#fRegion").addEventListener("change", () => {
  const custom = $("#fRegion").value === "custom";
  $("#fPctWrap").classList.toggle("hidden", !custom);
  $("#fFlatWrap").classList.toggle("hidden", !custom);
});
$("#gGo").addEventListener("click", gradeListing);
$("#bGo").addEventListener("click", scoreBuzz);
