'use strict';

const STORAGE_KEYS = ['localApiData', 'runState', 'lastReport', 'reportHistory', 'competitorTrackers', 'etsyAdsRows'];
let cache = { tables: {}, runState: {}, lastReport: null, reportHistory: [], trackers: [], ads: [] };

const $ = (id) => document.getElementById(id);
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const text = (row, ...keys) => {
  for (const key of keys) if (row && row[key] != null && row[key] !== '') return String(row[key]);
  return '—';
};
const money = (value) => `$${num(value).toFixed(2)}`;

function toast(message, error = false) {
  document.querySelector('.toast')?.remove();
  const node = document.createElement('div');
  node.className = `toast${error ? ' error' : ''}`;
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function cell(value, link = null) {
  const td = document.createElement('td');
  if (link && /^https:\/\//i.test(link)) {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = value == null || value === '' ? 'Open' : String(value);
    td.appendChild(a);
  } else td.textContent = value == null || value === '' ? '—' : String(value);
  return td;
}

function renderTable(tableId, rows, mapper) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.replaceChildren();
  if (!rows.length) {
    const tr = document.createElement('tr');
    tr.className = 'no-rows';
    const td = cell('No saved data yet. Run research first.');
    td.colSpan = document.querySelectorAll(`#${tableId} th`).length;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const td of mapper(row)) tr.appendChild(td);
    tbody.appendChild(tr);
  }
}

async function loadData() {
  const data = await chrome.storage.local.get(STORAGE_KEYS);
  cache = {
    raw: data,
    tables: data.localApiData?.tables || {},
    runState: data.runState || {},
    lastReport: data.lastReport || null,
    reportHistory: Array.isArray(data.reportHistory) ? data.reportHistory : [],
    trackers: Array.isArray(data.competitorTrackers) ? data.competitorTrackers : [],
    ads: Array.isArray(data.etsyAdsRows) ? data.etsyAdsRows : [],
  };
  renderAll();
}

function renderAll() {
  const keywords = cache.tables.keywords || [];
  const products = cache.tables.listings || [];
  const shops = cache.tables.stores || [];
  const audits = cache.tables.listing_audit || [];
  const logs = cache.tables.automation_log || [];

  $('m-keywords').textContent = keywords.length.toLocaleString();
  $('m-products').textContent = products.length.toLocaleString();
  $('m-shops').textContent = shops.length.toLocaleString();
  $('m-audits').textContent = audits.length.toLocaleString();
  renderStatus();
  renderReport();
  renderLogs(logs);

  renderTable('keywords-table', keywords, (row) => [
    cell(text(row, 'keyword_text', 'keyword')),
    cell(text(row, 'avg_searches', 'search_volume', 'searches')),
    cell(text(row, 'avg_clicks', 'clicks')),
    cell(text(row, 'avg_ctr', 'ctr')),
    cell(text(row, 'competition', 'etsy_competition')),
    cell(text(row, 'opportunity_score', 'score')),
    actionCell('Research', 'digKeyword', text(row, 'keyword_text', 'keyword')),
  ]);
  renderTable('products-table', products, (row) => [
    cell(text(row, 'title', 'listing_title'), text(row, 'listing_url', 'url')),
    cell(text(row, 'price', 'price_amount')),
    cell(text(row, 'reviews_count', 'reviews')),
    cell(text(row, 'rating')),
    cell(text(row, 'favorites_count', 'favorites')),
    cell(text(row, 'shop_name', 'shop')),
    cell(text(row, 'position', 'rank')),
  ]);
  renderTable('shops-table', shops, (row) => [
    cell(text(row, 'shop_name', 'name'), text(row, 'shop_url', 'url')),
    cell(text(row, 'sales_count', 'sales')),
    cell(text(row, 'reviews_count', 'reviews')),
    cell(text(row, 'rating')),
    cell(text(row, 'listing_count', 'listings_count')),
    cell(text(row, 'country')),
  ]);
  renderTrackers();
  renderAds();
}

function actionCell(label, action, value) {
  const td = document.createElement('td');
  const button = document.createElement('button');
  button.className = 'secondary';
  button.textContent = label;
  button.dataset[action] = value;
  td.appendChild(button);
  return td;
}

function renderStatus() {
  const state = cache.runState;
  const running = !!(state.running || state.stopping);
  $('status-dot').className = running ? 'running' : '';
  $('status-text').textContent = running ? (state.currentStep || 'Research running') : 'Ready';
  const progress = $('run-progress');
  if (!running) { progress.hidden = true; return; }
  progress.hidden = false;
  const current = num(state.progressCur);
  const total = num(state.progressTotal);
  const pct = total ? Math.max(5, Math.min(100, current / total * 100)) : 15;
  progress.querySelector('i').style.width = `${pct}%`;
  progress.querySelector('span').textContent = state.progress || state.currentStep || 'Working…';
}

function renderReport() {
  const box = $('latest-report');
  box.replaceChildren();
  if (!cache.lastReport) { box.className = 'empty'; box.textContent = 'No report yet.'; return; }
  box.className = '';
  const title = document.createElement('strong');
  title.textContent = cache.lastReport.seedKeyword || cache.lastReport.title || 'Latest niche report';
  const meta = document.createElement('p');
  const when = cache.lastReport.createdAt || cache.lastReport.generatedAt || cache.lastReport.timestamp;
  meta.textContent = when ? `Generated ${new Date(when).toLocaleString()}` : 'Saved locally';
  box.append(title, meta);
}

function renderLogs(rows) {
  const box = $('recent-log');
  box.replaceChildren();
  const latest = [...rows].sort((a, b) => String(b.completed_at || b.started_at).localeCompare(String(a.completed_at || a.started_at))).slice(0, 8);
  if (!latest.length) { box.className = 'activity empty'; box.textContent = 'No activity yet.'; return; }
  box.className = 'activity';
  for (const row of latest) {
    const item = document.createElement('div'); item.className = 'activity-row';
    const time = document.createElement('time'); time.textContent = text(row, 'completed_at', 'started_at');
    const status = document.createElement('span'); status.className = `badge${String(row.status).toLowerCase() === 'failed' ? ' failed' : ''}`; status.textContent = text(row, 'status');
    const label = document.createElement('span'); label.textContent = `${text(row, 'task_name')} · ${text(row, 'items_success')} saved`;
    item.append(time, status, label); box.appendChild(item);
  }
}

function send(action) {
  return chrome.runtime.sendMessage(action);
}

async function startResearch(seed) {
  const value = String(seed || '').trim();
  if (!value) return;
  try {
    const response = await send({ action: 'startPipeline', mode: 'full', seedKeyword: value });
    if (!response?.started) throw new Error(response?.reason || 'Research did not start');
    toast(`Research started for “${value}”`);
    await loadData();
  } catch (error) { toast(error.message, true); }
}

function runAudit() {
  const title = $('listing-title').value.trim();
  const description = $('listing-description').value.trim();
  const tags = $('listing-tags').value.split(',').map((v) => v.trim()).filter(Boolean);
  const unique = new Set(tags.map((v) => v.toLowerCase()));
  const checks = [
    [title.length > 0, 10, 'Add a title.', 'Title added.'],
    [title.length >= 70 && title.length <= 140, 15, 'Use 70–140 title characters.', 'Title length is strong.'],
    [description.length >= 250, 15, 'Write at least 250 description characters.', 'Description has useful depth.'],
    [tags.length === 13, 20, 'Use all 13 Etsy tags.', 'All 13 tags used.'],
    [unique.size === tags.length, 10, 'Remove duplicate tags.', 'Tags are unique.'],
    [tags.every((tag) => tag.length <= 20), 10, 'Keep every tag at 20 characters or less.', 'Every tag fits Etsy limits.'],
    [tags.some((tag) => tag.includes(' ')), 10, 'Add descriptive multi-word tags.', 'Multi-word tags included.'],
    [tags.some((tag) => title.toLowerCase().includes(tag.toLowerCase())), 5, 'Match a tag phrase in the title.', 'Title matches a tag phrase.'],
    [description.length && /(gift|perfect|ideal|designed|made|includes|you will)/i.test(description), 5, 'State a buyer benefit or use case.', 'Buyer benefit or use case found.'],
  ];
  const score = checks.reduce((sum, check) => sum + (check[0] ? check[1] : 0), 0);
  const ring = $('optimization-score');
  ring.textContent = score;
  ring.style.background = `conic-gradient(var(--green) ${score}%, #e9eeeb ${score}%)`;
  const list = $('optimization-findings'); list.className = 'findings'; list.replaceChildren();
  for (const check of checks) {
    const row = document.createElement('div'); row.className = `finding${check[0] ? ' ok' : ''}`; row.textContent = `${check[0] ? '✓' : '→'} ${check[0] ? check[3] : check[2]}`; list.appendChild(row);
  }
}

function generateTags() {
  const seed = $('tag-seed').value.trim().toLowerCase();
  const audience = $('tag-audience').value.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  const styles = $('tag-style').value.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  const words = seed.split(/\s+/).filter(Boolean);
  const pool = [seed, ...audience.map((v) => `${seed} ${v}`), ...styles.map((v) => `${v} ${seed}`), `${seed} gift`, `custom ${seed}`, `personalized ${seed}`, `handmade ${seed}`, ...words.map((v) => `${v} gift`), ...audience.map((v) => `gift for ${v}`), ...styles];
  const tags = [];
  for (let raw of pool) {
    raw = raw.replace(/\s+/g, ' ').trim();
    if (raw.length > 20) raw = raw.split(' ').filter((_, index, all) => all.slice(0, index + 1).join(' ').length <= 20).join(' ');
    if (raw && raw.length <= 20 && !tags.includes(raw)) tags.push(raw);
    if (tags.length === 13) break;
  }
  let i = 0;
  const fallbacks = ['unique gift', 'etsy find', 'small business', 'gift idea', 'made to order', 'special occasion'];
  while (tags.length < 13 && i < fallbacks.length) { if (!tags.includes(fallbacks[i])) tags.push(fallbacks[i]); i++; }
  const box = $('tag-results'); box.className = 'tag-cloud'; box.replaceChildren();
  for (const tag of tags.slice(0, 13)) { const span = document.createElement('span'); span.className = 'tag'; span.textContent = tag; box.appendChild(span); }
}

function calculateProfit() {
  const sale = num($('sale-price').value), materials = num($('material-cost').value), shipping = num($('shipping-cost').value), ads = num($('ad-cost').value), paymentRate = num($('payment-rate').value) / 100;
  const listingFee = 0.20, transactionFee = sale * 0.065, paymentFee = sale * paymentRate;
  const fees = listingFee + transactionFee + paymentFee;
  const net = sale - materials - shipping - ads - fees;
  const margin = sale > 0 ? net / sale * 100 : 0;
  $('net-profit').textContent = money(net);
  const lines = [['Revenue', money(sale)], ['Materials', `−${money(materials)}`], ['Shipping', `−${money(shipping)}`], ['Ads', `−${money(ads)}`], ['Listing fee', `−${money(listingFee)}`], ['Transaction fee (6.5%)', `−${money(transactionFee)}`], [`Payment fee (${(paymentRate * 100).toFixed(1)}%)`, `−${money(paymentFee)}`], ['Net margin', `${margin.toFixed(1)}%`]];
  const box = $('profit-breakdown'); box.replaceChildren();
  for (const [label, value] of lines) { const row = document.createElement('div'); const left = document.createElement('span'); left.textContent = label; const right = document.createElement('strong'); right.textContent = value; row.append(left, right); box.appendChild(row); }
}

function estimateSales() {
  const price = num($('estimate-price').value);
  const reviews = num($('estimate-reviews').value);
  const days = Math.max(1, num($('estimate-days').value));
  const multiplier = Math.max(1, num($('estimate-multiplier').value));
  const monthlyReviews = reviews / days * 30.4375;
  const sales = monthlyReviews * multiplier;
  const revenue = sales * price;
  $('estimated-sales').textContent = Math.round(sales).toLocaleString();
  $('estimated-revenue').textContent = money(revenue);
  $('estimate-formula').textContent = `(${reviews} reviews ÷ ${days} days × 30.44) × ${multiplier} = ${sales.toFixed(1)} estimated monthly sales`;
}

function listingIdFrom(value) {
  const match = String(value || '').match(/(?:listing\/)?(\d{6,})/i);
  return match ? match[1] : String(value || '').trim();
}

function reverseLookup(value) {
  const id = listingIdFrom(value);
  const listings = cache.tables.listings || [];
  const keywords = cache.tables.keywords || [];
  const matches = listings.filter((row) => String(row.listing_id || '').includes(id) || String(row.listing_url || row.url || '').includes(id));
  const keywordIds = new Set(matches.map((row) => String(row.keyword_id || '')));
  const terms = keywords.filter((row) => keywordIds.has(String(row.keyword_id || ''))).map((row) => text(row, 'keyword_text', 'keyword')).filter((term) => term !== '—');
  const box = $('reverse-results');
  box.replaceChildren();
  if (!matches.length) { box.className = 'lookup-result empty'; box.textContent = 'Listing was not found in saved research. Run its niche keyword first.'; return; }
  box.className = 'lookup-result';
  const heading = document.createElement('strong'); heading.textContent = text(matches[0], 'title', 'listing_title');
  const meta = document.createElement('p'); meta.textContent = terms.length ? `Saved keywords: ${[...new Set(terms)].join(', ')}` : 'Listing saved, but no linked keyword was found.';
  box.append(heading, meta);
}

function parseCsv(input) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field); if (row.some((value) => value.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ''])));
}

function csvValue(row, candidates) {
  for (const key of candidates) if (row[key] != null && row[key] !== '') return row[key];
  return '';
}

function numericCsv(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAdRow(row) {
  return {
    term: csvValue(row, ['search_term', 'query', 'keyword', 'search_query', 'term']),
    impressions: numericCsv(csvValue(row, ['impressions', 'impression'])),
    clicks: numericCsv(csvValue(row, ['clicks', 'click'])),
    orders: numericCsv(csvValue(row, ['orders', 'order', 'purchases', 'sales'])),
    spend: numericCsv(csvValue(row, ['spend', 'cost', 'ad_spend', 'amount_spent'])),
    revenue: numericCsv(csvValue(row, ['revenue', 'sales_revenue', 'order_value', 'sales_value'])),
  };
}

function renderAds() {
  const totals = cache.ads.reduce((out, row) => {
    for (const key of ['impressions', 'clicks', 'orders', 'spend', 'revenue']) out[key] += num(row[key]);
    return out;
  }, { impressions: 0, clicks: 0, orders: 0, spend: 0, revenue: 0 });
  $('ads-impressions').textContent = totals.impressions.toLocaleString();
  $('ads-clicks').textContent = totals.clicks.toLocaleString();
  $('ads-orders').textContent = totals.orders.toLocaleString();
  $('ads-spend').textContent = money(totals.spend);
  renderTable('ads-table', cache.ads, (row) => {
    const roas = num(row.spend) > 0 ? num(row.revenue) / num(row.spend) : 0;
    const gap = num(row.orders) === 0 && (num(row.impressions) > 0 || num(row.clicks) > 0);
    return [cell(row.term || '—'), cell(num(row.impressions)), cell(num(row.clicks)), cell(num(row.orders)), cell(money(row.spend)), cell(money(row.revenue)), cell(roas.toFixed(2)), cell(gap ? 'Gap' : 'Converting')];
  });
}

async function saveTrackers() { await chrome.storage.local.set({ competitorTrackers: cache.trackers }); }
function renderTrackers() {
  renderTable('tracker-table', cache.trackers, (row) => {
    const snapshot = document.createElement('button'); snapshot.className = 'secondary'; snapshot.textContent = 'Snapshot'; snapshot.dataset.snapshotId = row.id;
    const remove = document.createElement('button'); remove.className = 'secondary'; remove.textContent = 'Remove'; remove.dataset.trackerId = row.id;
    const td = document.createElement('td'); td.className = 'button-row'; td.append(snapshot, remove);
    const latest = row.snapshots?.at(-1);
    const signal = latest ? [latest.price && `Price ${latest.price}`, latest.reviews && `${latest.reviews} reviews`, latest.favorites && `${latest.favorites} favorites`].filter(Boolean).join(' · ') : 'No snapshot';
    return [cell(row.name), cell(row.url, row.url), cell(new Date(row.addedAt).toLocaleDateString()), cell(row.snapshots?.length || 0), cell(signal), td];
  });
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csv(rows, columns) {
  const quote = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [columns.map(([label]) => quote(label)).join(','), ...rows.map((row) => columns.map(([, key]) => quote(row[key])).join(','))].join('\r\n');
}

function bindEvents() {
  const pageMeta = {
    overview: ['Overview', 'Your Etsy research workspace'], keywords: ['Keyword Research', 'Discover and compare buyer phrases'], products: ['Product Research', 'Inspect captured public listings'], shops: ['Shop Research', 'Compare captured seller signals'], optimizer: ['Listing Optimizer', 'Improve listing completeness'], tags: ['Tag Generator', 'Build Etsy-compatible phrase tags'], profit: ['Profit Calculator', 'Estimate fees, cost, and margin'], estimator: ['Sales Estimator', 'Transparent directional estimates from review velocity'], ads: ['Ads Analyzer', 'Analyze your own Etsy Ads CSV locally'], tracker: ['Competitor Tracker', 'Save Etsy shops and listings locally'], data: ['Data & Export', 'Own and export your research'],
  };
  $('nav').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-view]'); if (!btn) return;
    document.querySelectorAll('#nav button').forEach((node) => node.classList.toggle('active', node === btn));
    document.querySelectorAll('.view').forEach((node) => node.classList.toggle('active', node.id === `view-${btn.dataset.view}`));
    [$('page-title').textContent, $('page-subtitle').textContent] = pageMeta[btn.dataset.view];
  });
  $('quick-research').addEventListener('submit', (e) => { e.preventDefault(); startResearch($('quick-seed').value); });
  $('keyword-form').addEventListener('submit', (e) => { e.preventDefault(); startResearch($('keyword-seed').value); });
  $('keywords-table').addEventListener('click', (e) => { const btn = e.target.closest('[data-dig-keyword]'); if (btn) startResearch(btn.dataset.digKeyword); });
  $('refresh-all').addEventListener('click', loadData);
  $('open-report').addEventListener('click', async () => { try { await send({ action: 'openReport' }); } catch (e) { toast(e.message, true); } });
  $('optimizer-form').addEventListener('submit', (e) => { e.preventDefault(); runAudit(); });
  $('listing-title').addEventListener('input', (e) => $('title-count').textContent = `${e.target.value.length}/140`);
  $('listing-description').addEventListener('input', (e) => $('description-count').textContent = String(e.target.value.length));
  $('tag-form').addEventListener('submit', (e) => { e.preventDefault(); generateTags(); });
  $('copy-tags').addEventListener('click', async () => { const value = [...document.querySelectorAll('#tag-results .tag')].map((n) => n.textContent).join(', '); if (!value) return; await navigator.clipboard.writeText(value); toast('Tags copied'); });
  $('profit-form').addEventListener('submit', (e) => { e.preventDefault(); calculateProfit(); });
  $('estimator-form').addEventListener('submit', (e) => { e.preventDefault(); estimateSales(); });
  $('reverse-form').addEventListener('submit', (e) => { e.preventDefault(); reverseLookup($('reverse-listing').value); });
  $('ads-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const parsed = parseCsv(await file.text()).map(normalizeAdRow).filter((row) => row.term || row.impressions || row.clicks || row.orders);
      if (!parsed.length) throw new Error('No usable Etsy Ads rows found. Check the CSV headers.');
      cache.ads = parsed;
      await chrome.storage.local.set({ etsyAdsRows: parsed });
      renderAds();
      toast(`${parsed.length} ad search terms imported`);
    } catch (error) { toast(error.message, true); }
  });
  $('clear-ads').addEventListener('click', async () => { cache.ads = []; await chrome.storage.local.remove('etsyAdsRows'); renderAds(); });
  $('tracker-form').addEventListener('submit', async (e) => { e.preventDefault(); cache.trackers.unshift({ id: crypto.randomUUID(), name: $('tracker-name').value.trim(), url: $('tracker-url').value.trim(), notes: '', addedAt: new Date().toISOString() }); await saveTrackers(); e.target.reset(); renderTrackers(); toast('Tracker saved locally'); });
  $('tracker-table').addEventListener('click', async (e) => {
    const snapshotBtn = e.target.closest('[data-snapshot-id]');
    if (snapshotBtn) {
      const tracker = cache.trackers.find((row) => row.id === snapshotBtn.dataset.snapshotId);
      if (!tracker) return;
      const id = listingIdFrom(tracker.url);
      const listing = (cache.tables.listings || []).find((row) => String(row.listing_id || '').includes(id) || String(row.listing_url || row.url || '').includes(id));
      if (!listing) { toast('Run research that captures this listing first.', true); return; }
      tracker.snapshots ||= [];
      tracker.snapshots.push({ capturedAt: new Date().toISOString(), price: text(listing, 'price', 'price_amount'), reviews: text(listing, 'reviews_count', 'reviews'), rating: text(listing, 'rating'), favorites: text(listing, 'favorites_count', 'favorites') });
      await saveTrackers(); renderTrackers(); toast('Competitor snapshot saved');
      return;
    }
    const removeBtn = e.target.closest('[data-tracker-id]');
    if (!removeBtn) return;
    cache.trackers = cache.trackers.filter((row) => row.id !== removeBtn.dataset.trackerId);
    await saveTrackers(); renderTrackers();
  });
  document.querySelectorAll('.table-filter').forEach((input) => input.addEventListener('input', () => { const q = input.value.toLowerCase(); document.querySelectorAll(`#${input.dataset.table} tbody tr`).forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(q); }); }));
  $('export-json').addEventListener('click', () => download(`3sverse-etsy-tools-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(cache.raw, null, 2), 'application/json'));
  $('export-products').addEventListener('click', () => download('etsy-products.csv', csv(cache.tables.listings || [], [['Title', 'title'], ['URL', 'listing_url'], ['Price', 'price'], ['Reviews', 'reviews_count'], ['Shop', 'shop_name']]), 'text/csv'));
  $('export-keywords').addEventListener('click', () => download('etsy-keywords.csv', csv(cache.tables.keywords || [], [['Keyword', 'keyword_text'], ['Searches', 'avg_searches'], ['Clicks', 'avg_clicks'], ['CTR', 'avg_ctr'], ['Competition', 'competition'], ['Score', 'opportunity_score']]), 'text/csv'));
  $('clear-data').addEventListener('click', async () => { if (!confirm('Clear all locally stored Etsy research and reports? Export first.')) return; try { await send({ action: 'clearAllData' }); await loadData(); toast('Research data cleared'); } catch (e) { toast(e.message, true); } });
}

document.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  calculateProfit();
  estimateSales();
  await loadData();
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && STORAGE_KEYS.some((key) => changes[key])) loadData(); });
});
