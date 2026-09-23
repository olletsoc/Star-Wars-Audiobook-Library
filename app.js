// ===== Unified library: navigation + rendering =====
const homeView = document.getElementById('home-view');
const eraView = document.getElementById('era-view');
const listEl = document.getElementById('list');
const filtersEl = document.getElementById('filters');
const toggleBtn = document.getElementById('toggleAll');
const ACCENTS = { gold: { a:'#f2c14e', d:'#b8923a' }, purple: { a:'#c98bdb', d:'#8f5fa8' } };

let activeEra = null;   // era metadata object
let currentCat = 'all';

// ---------- Landing grid ----------
function buildHome() {
  const canonGrid = document.getElementById('canon-grid');
  const legendsGrid = document.getElementById('legends-grid');
  ERAS.forEach(e => {
    if (e.empty) {
      const d = document.createElement('div');
      d.className = 'empty';
      d.innerHTML = `<div class="card-inner"><div class="era-no">${e.no}</div><h2>${e.name}</h2><div class="yrs">${e.yrs}</div><div class="desc">${e.desc}</div></div>`;
      canonGrid.appendChild(d);
    } else {
      canonGrid.appendChild(makeCard(e, false));
    }
  });
  legendsGrid.appendChild(makeCard(LEGENDS_ERA, true));
}

function makeCard(e, isLegends) {
  const count = (BOOKS[e.key] || []).length;
  const btn = document.createElement('button');
  btn.className = 'card' + (isLegends ? ' legends' : '');
  btn.innerHTML = `
    <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
    <div class="era-no">${e.no}</div>
    <h2>${e.name}</h2>
    <div class="yrs">${e.yrs}</div>
    <div class="desc">${e.desc}</div>
    <span class="count">${count} titles</span>`;
  btn.addEventListener('click', () => openEra(e, isLegends));
  return btn;
}

// ---------- Era view ----------
function openEra(e, isLegends) {
  activeEra = e;
  currentCat = 'all';
  const ac = ACCENTS[e.accent] || ACCENTS.gold;
  document.documentElement.style.setProperty('--accent', ac.a);
  document.documentElement.style.setProperty('--accent-dim', ac.d);
  document.body.classList.toggle('legends-active', !!isLegends);

  document.getElementById('era-title').innerHTML = e.name;
  document.getElementById('era-sub').textContent = e.sub;
  document.getElementById('era-band').innerHTML = e.band.replace(/^(.*?) · (.*)$/, (m, a, b) => {
    // bold the leading segment
    return `<strong>${a}</strong> <span style="opacity:.4">·</span> ${b}`;
  });

  // filters
  filtersEl.innerHTML = '';
  const cats = ['all'].concat(e.filters);
  cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'filter-btn' + (c === 'all' ? ' active' : '');
    b.dataset.cat = c;
    b.textContent = c === 'all' ? `All ${(BOOKS[e.key] || []).length}` : filterLabel(c);
    b.addEventListener('click', () => {
      currentCat = c;
      [...filtersEl.children].forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderList();
    });
    filtersEl.appendChild(b);
  });

  document.getElementById('era-footer').innerHTML = footerFor(e, isLegends);
  renderList();
  homeView.classList.add('hidden');
  eraView.classList.remove('hidden');
  window.scrollTo(0, 0);
}

function filterLabel(c) {
  return { Adult:'Adult novels', YA:'Young adult', Junior:'Junior', 'Audio Drama':'Audio dramas', Anthology:'Anthologies', Unabridged:'Unabridged', Aftermath:'Aftermath', AlphabetSquadron:'Alphabet Squadron'} [c] || c;
}

function footerFor(e, isLegends) {
  if (isLegends) {
    return `Narrators and dates verified against Wookieepedia's List of Legends audio productions.<br>Legends coverage extends further (New Republic, New Jedi Order, Legacy eras), but most of those older EU novels were never recorded as audiobooks. Covers via <a href="https://starwars.fandom.com" target="_blank" rel="noopener">Wookieepedia</a>.`;
  }
  let extra = '';
  if (e.key === 'reign-of-the-empire') extra = `<br>Note: Lucasfilm sometimes folds this window into "Age of Rebellion." BBY dates are the practical guide to placement.`;
  if (e.key === 'new-jedi-order') extra = `<br>Lucasfilm's "New Jedi Order" era is the <em>sequel-trilogy</em> era — not the older Legends book series of the same name.`;
  return `Audiobook narrators and dates verified against Wookieepedia and publisher listings.${extra}<br>Publisher summaries © Del Rey / Random House Worlds / Disney–Lucasfilm Press. Covers via <a href="https://starwars.fandom.com" target="_blank" rel="noopener">Wookieepedia</a>.`;
}

function renderList() {
  const books = BOOKS[activeEra.key] || [];
  listEl.innerHTML = '';
  let lastPhase = null, idx = 0;
  books.forEach(b => {
    if (currentCat !== 'all' && b.cat !== currentCat) return;
    if (b.phase !== lastPhase) {
      const ph = document.createElement('div');
      ph.className = 'phase-head';
      ph.innerHTML = `<h3>${b.phase}</h3>`;
      listEl.appendChild(ph);
      lastPhase = b.phase;
    }
    idx++;
    listEl.appendChild(makeItem(b, idx));
  });
  syncToggleLabel();
}

function makeItem(b, idx) {
  const el = document.createElement('div');
  el.className = 'item';
  const dateFact = b.pubdate && b.pubdate !== '—' ? `<span class="fact"><b>Published</b> ${b.pubdate}</span>` : '';
  const runFact = b.runtime && b.runtime !== '—' ? `<span class="fact"><b>Audio</b> ${b.runtime}</span>` : '';
  el.innerHTML = `
    <button class="item-head" aria-expanded="false">
      <span class="idx">${String(idx).padStart(2,'0')}</span>
      <span class="head-main">
        <span class="title-row"><span class="title">${b.title}</span><span class="cat">${b.cat}</span></span>
        <span class="meta">${b.author}<span class="dot">·</span>Narr. ${b.narrator}<span class="dot">·</span>${b.timeline}</span>
      </span>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </button>
    <div class="ibody"><div class="body-inner">
      <span class="cover-wrap">
        <span class="cover-ph">${b.title}</span>
        <img class="cover" src="${b.cover}" alt="Cover of ${b.title}" loading="lazy" onerror="this.classList.add('failed')">
      </span>
      <div class="desc2">
        <div class="facts">${dateFact}<span class="fact"><b>Publisher</b> ${b.publisher}</span>${runFact}</div>
        <div class="summary"><span class="lead">${b.lead}</span>${b.summary}</div>
      </div>
    </div></div>`;
  const head = el.querySelector('.item-head');
  head.addEventListener('click', () => {
    const open = el.classList.toggle('open');
    head.setAttribute('aria-expanded', open);
    syncToggleLabel();
  });
  return el;
}

function syncToggleLabel() {
  const items = [...listEl.querySelectorAll('.item')];
  const allOpen = items.length && items.every(it => it.classList.contains('open'));
  toggleBtn.textContent = allOpen ? 'Collapse all' : 'Expand all';
}

toggleBtn.addEventListener('click', () => {
  const items = [...listEl.querySelectorAll('.item')];
  const allOpen = items.every(it => it.classList.contains('open'));
  items.forEach(it => {
    it.classList.toggle('open', !allOpen);
    it.querySelector('.item-head').setAttribute('aria-expanded', !allOpen);
  });
  syncToggleLabel();
});

document.getElementById('backBtn').addEventListener('click', () => {
  eraView.classList.add('hidden');
  homeView.classList.remove('hidden');
  document.body.classList.remove('legends-active');
  document.documentElement.style.setProperty('--accent', ACCENTS.gold.a);
  document.documentElement.style.setProperty('--accent-dim', ACCENTS.gold.d);
  window.scrollTo(0, 0);
});

buildHome();
