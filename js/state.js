// state.js — async state with Supabase persistence

const State = (() => {
  let _state = {
    currentPage:       'journal',
    viewMode:          'grid',
    searchQuery:       '',
    currentRating:     0,
    currentMood:       '',
    currentTags:       [],
    currentFlavors:    {},
    currentPhotos:     [],
    calendarMonth:     new Date().getMonth(),
    calendarYear:      new Date().getFullYear(),
    selectedMoodPage:  null,
    aiRecommendations: null,
    aiLoading:         false,
    notepadContent:    '',
    notepadId:         null,
    wishlistItems:     [],
    entries:           [],
  };

  async function load() {
   const { data: notepadRows } = await supabase
  .from('notepad')
  .select('*')
  .order('updated_at', { ascending: false });

_state.notepadItems = (notepadRows || []).map(row => {
  try { return { ...JSON.parse(row.content), _dbId: row.id }; }
  catch { return null; }
}).filter(Boolean);
  }

  function get(key)        { return _state[key]; }
  function getAll()        { return { ..._state }; }
  function set(key, value) { _state[key] = value; }

  async function addEntry(entry) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data, error } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        cafe:    entry.cafe,
        drink:   entry.drink,
        rating:  entry.rating,
        note:    entry.note,
        date:    entry.date,
        tags:    entry.tags    || [],
        mood:    entry.mood    || '',
        flavors: entry.flavors || {},
        photos:  entry.photos  || [],
      })
      .select()
      .single();
    if (!error && data) _state.entries = [data, ..._state.entries];
    return { data, error };
  }

  async function deleteEntry(id) {
    const { error } = await supabase
      .from('entries').delete().eq('id', id);
    if (!error) _state.entries = _state.entries.filter((e) => e.id !== id);
    return { error };
  }

  async function addWishlistItem(item) {
    const user = await getCurrentUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id:  user.id,
        name:     item.name,
        location: item.location || '',
        visited:  false,
      })
      .select()
      .single();
    if (!error && data) _state.wishlistItems = [data, ..._state.wishlistItems];
    return { data, error };
  }

  async function toggleWishlistItem(id) {
    const item = _state.wishlistItems.find((w) => w.id === id);
    if (!item) return;
    const { error } = await supabase
      .from('wishlist')
      .update({ visited: !item.visited })
      .eq('id', id);
    if (!error) {
      _state.wishlistItems = _state.wishlistItems.map((w) =>
        w.id === id ? { ...w, visited: !w.visited } : w
      );
    }
    return { error };
  }

  async function deleteWishlistItem(id) {
    const { error } = await supabase
      .from('wishlist').delete().eq('id', id);
    if (!error)
      _state.wishlistItems = _state.wishlistItems.filter((w) => w.id !== id);
    return { error };
  }

  // pages.js — renders each page into #pageContent

function renderPage(page) {
  const container = document.getElementById('pageContent');
  document.getElementById('pageTitle').textContent = {
    journal:  'My Coffee Diary', calendar: 'Calendar',
    timeline: 'Timeline',        mood:     'Mood & Coffee',
    ai:       'AI Picks',        sensory:  'Sensory Map',
    wishlist: 'Café Wishlist',   notepad:  'My Notepad',
  }[page] || 'cafélog';
  const searchBar  = document.getElementById('searchBarWrapper');
  const viewToggle = document.getElementById('viewToggle');
  const showSearch = page === 'journal';
  if (searchBar)  searchBar.style.display  = showSearch ? '' : 'none';
  if (viewToggle) viewToggle.style.display = showSearch ? '' : 'none';
  container.innerHTML = '';
  container.className = 'page-content page-enter';
  void container.offsetWidth;
  switch (page) {
    case 'journal':  renderJournalPage(container);  break;
    case 'calendar': renderCalendarPage(container); break;
    case 'timeline': renderTimelinePage(container); break;
    case 'mood':     renderMoodPage(container);     break;
    case 'ai':       renderAIPage(container);       break;
    case 'sensory':  renderSensoryPage(container);  break;
    case 'wishlist': renderWishlistPage(container); break;
    case 'notepad':  renderNotepadPage(container);  break;
  }
}

/* ── Journal ── */
function renderJournalPage(container) {
  const stats    = State.stats();
  const entries  = State.filteredEntries();
  const listMode = State.get('viewMode') === 'list';
  let html = renderStatCards(stats);
  if (!entries.length) {
    html += `<div class="empty-state">
      <div class="empty-state-icon">☕</div>
      <div class="empty-state-title">Your diary is empty</div>
      <p>Start your coffee journey — add your first entry!</p>
    </div>`;
  } else {
    const gridClass = listMode ? 'entries-list' : 'entries-grid';
    html += `<div class="${gridClass}">` +
      entries.map((e) => renderEntryCard(e, listMode)).join('') +
      `</div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.entry-card').forEach((card) => {
    const handler = () => {
      const id    = parseInt(card.dataset.id);
      const entry = State.get('entries').find((e) => e.id === id);
      if (entry) openDetailModal(entry);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => e.key === 'Enter' && handler());
  });
  document.getElementById('streakNumber').textContent =
    State.get('entries').length;
}

/* ── Calendar ── */
function renderCalendarPage(container) {
  const month   = State.get('calendarMonth');
  const year    = State.get('calendarYear');
  const entries = State.get('entries');
  let html = renderCalendar(month, year, entries);
  const monthEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });
  html += `<div class="month-visits" style="margin-top:28px">
    <div class="section-label">${MONTHS[month]} visits</div>`;
  if (!monthEntries.length) {
    html += `<div style="text-align:center;padding:32px;color:var(--bark)">
      No entries this month yet ☕</div>`;
  } else {
    html += monthEntries.map((e) => `
      <div class="top-cafe-row entry-card-link" data-id="${e.id}"
        style="cursor:pointer" tabindex="0">
        <div>
          <div class="top-cafe-name">${escapeHtml(e.cafe)}</div>
          <div class="top-cafe-meta">${escapeHtml(e.drink)} ·
            ${formatDate(e.date, { month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="star-row">${renderStars(e.rating)}</div>
      </div>`).join('');
  }
  html += `</div>`;
  container.innerHTML = html;
  document.getElementById('calPrev')?.addEventListener('click', () => {
    let m = State.get('calendarMonth') - 1;
    let y = State.get('calendarYear');
    if (m < 0) { m = 11; y--; }
    State.set('calendarMonth', m);
    State.set('calendarYear', y);
    renderPage('calendar');
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    let m = State.get('calendarMonth') + 1;
    let y = State.get('calendarYear');
    if (m > 11) { m = 0; y++; }
    State.set('calendarMonth', m);
    State.set('calendarYear', y);
    renderPage('calendar');
  });
  container.querySelectorAll('.entry-card-link').forEach((el) => {
    el.addEventListener('click', () => {
      const id    = parseInt(el.dataset.id);
      const entry = State.get('entries').find((e) => e.id === id);
      if (entry) openDetailModal(entry);
    });
  });
}

/* ── Timeline ── */
function renderTimelinePage(container) {
  const entries = State.get('entries');
  let html = `<div class="section-label">
    Your coffee story, one cup at a time</div>`;
  if (!entries.length) {
    html += `<div class="empty-state">
      <div class="empty-state-icon">📜</div>
      <div class="empty-state-title">No entries yet</div>
      <p>Log your first café visit to begin your timeline.</p>
    </div>`;
  } else {
    html += `<div class="timeline">` + entries.map((e) => `
      <div class="timeline-item" data-id="${e.id}" tabindex="0">
        <div class="timeline-dot"></div>
        <div style="display:flex;justify-content:space-between;
          align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div>
            <div class="entry-cafe" style="font-size:16px">
              ${escapeHtml(e.cafe)}</div>
            <div class="entry-drink">${escapeHtml(e.drink)}</div>
          </div>
          <div style="text-align:right">
            <div class="star-row" style="justify-content:flex-end">
              ${renderStars(e.rating)}</div>
            <div class="entry-date">
              ${formatDate(e.date,
                { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        ${e.note
          ? `<p class="entry-note" style="display:block;-webkit-line-clamp:3">
              ${escapeHtml(e.note)}</p>`
          : ''}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          ${renderMoodTag(e.mood)}${renderTags(e.tags)}
        </div>
      </div>`).join('') + `</div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('.timeline-item').forEach((el) => {
    el.addEventListener('click', () => {
      const id    = parseInt(el.dataset.id);
      const entry = State.get('entries').find((e) => e.id === id);
      if (entry) openDetailModal(entry);
    });
  });
}

/* ── Mood & Coffee ── */
function renderMoodPage(container) {
  const selectedMood = State.get('selectedMoodPage');
  let html = `
    <div class="mood-hero">
      <div class="mood-hero-title">☕ What's your vibe today?</div>
      <div class="mood-hero-sub">Pick your current mood and we'll suggest
        the perfect coffee to match.</div>
      <div class="mood-selector-grid">
        ${Object.entries(MOOD_CONFIG).map(([id, m]) => `
          <button class="mood-selector-btn mood-${id}
            ${selectedMood === id ? 'selected' : ''}"
            data-mood-select="${id}">
            <span class="mood-selector-emoji">${m.emoji}</span>
            ${m.label}
          </button>`).join('')}
      </div>
    </div>`;
  if (selectedMood && MOOD_COFFEE_MAP[selectedMood]) {
    const data = MOOD_COFFEE_MAP[selectedMood];
    html += `
      <div class="mood-result">
        <div class="mood-result-title">${data.title}</div>
        <div class="mood-result-sub">${data.subtitle}</div>
        <div class="coffee-suggestions-grid">
          ${data.suggestions.map((s) => `
            <div class="coffee-suggestion-card" style="background:${s.bg}">
              <div class="suggestion-drink-emoji">${s.emoji}</div>
              <div class="suggestion-drink-name">${escapeHtml(s.name)}</div>
              <div class="suggestion-reason">${escapeHtml(s.reason)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }
  container.innerHTML = html;
  container.querySelectorAll('[data-mood-select]').forEach((btn) => {
    btn.addEventListener('click', () => {
      State.set('selectedMoodPage', btn.dataset.moodSelect);
      renderPage('mood');
    });
  });
}

/* ── AI Picks ── */
function renderAIPage(container) {
  const recs    = State.get('aiRecommendations');
  const loading = State.get('aiLoading');
  const entries = State.get('entries');
  let html = `
    <div class="ai-panel">
      <div class="ai-panel-title">✨ Your Personal Coffee Sommelier</div>
      <div class="ai-panel-subtitle">Powered by AI — based on your
        ${entries.length} journal entries and flavor preferences</div>
      <button class="ai-generate-btn" id="generateAIBtn"
        ${loading ? 'disabled' : ''}>
        ${loading
          ? `<span class="spinner"></span> Brewing recommendations…`
          : `<span>✨</span> Generate Recommendations`}
      </button>
      ${recs ? `<div class="ai-recs">
        ${recs.map((r) => `
          <div class="ai-rec-card">
            <div class="rec-emoji">${r.emoji || '☕'}</div>
            <div class="rec-name">${escapeHtml(r.name)}</div>
            <div class="rec-type">${escapeHtml(r.type || '')}</div>
            <div class="rec-desc">${escapeHtml(r.reason)}</div>
          </div>`).join('')}
      </div>` : ''}
    </div>`;
  const cafeCounts = {};
  entries.forEach((e) => {
    if (!cafeCounts[e.cafe])
      cafeCounts[e.cafe] = { count: 0, totalRating: 0 };
    cafeCounts[e.cafe].count++;
    cafeCounts[e.cafe].totalRating += e.rating || 0;
  });
  const cafeList = Object.entries(cafeCounts)
    .sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  html += `
    <div style="background:white;border-radius:var(--radius-xl);
      padding:26px;border:1px solid var(--mist)">
      <div class="section-label">Your Top Cafés</div>
      ${cafeList.length
        ? cafeList.map(([cafe, d]) => `
          <div class="top-cafe-row">
            <div>
              <div class="top-cafe-name">${escapeHtml(cafe)}</div>
              <div class="top-cafe-meta">
                ${d.count} visit${d.count !== 1 ? 's' : ''}</div>
            </div>
            <div class="star-row">
              ${renderStars(Math.round(d.totalRating / d.count))}</div>
          </div>`).join('')
        : `<p style="color:var(--bark);font-size:14px">No entries yet.</p>`}
    </div>`;
  container.innerHTML = html;
  document.getElementById('generateAIBtn')?.addEventListener('click', () => {
    fetchAIRecommendations();
  });
}

/* ── Sensory Map ── */
function renderSensoryPage(container) {
  const entries    = State.get('entries').filter(
    (e) => e.flavors && Object.keys(e.flavors).length > 0);
  const avgFlavors = State.avgFlavors();
  let html = `
    <div class="sensory-header-card">
      <div class="sensory-header-title">🎨 Sensory Memory Map</div>
      <div class="sensory-header-sub">
        Your personalized flavor fingerprint — built from every entry you log.
      </div>
    </div>`;
  if (Object.keys(avgFlavors).length > 0) {
    html += `
      <div style="background:white;border-radius:var(--radius-xl);
        padding:26px;border:1px solid var(--mist);
        margin-bottom:var(--gap-xl)">
        <div class="section-label">Your Average Flavor Profile</div>
        <div style="font-size:13px;color:var(--bark);margin-bottom:18px">
          Aggregated across ${entries.length} rated entries</div>
        ${renderFlavorBars(avgFlavors)}
      </div>`;
  }
  if (!entries.length) {
    html += `<div class="empty-state">
      <div class="empty-state-icon">🎨</div>
      <div class="empty-state-title">No flavor data yet</div>
      <p>Add flavor sliders when creating entries to see your
        sensory map grow.</p>
    </div>`;
  } else {
    html += `<div class="sensory-grid">` + entries.map((e) => `
      <div class="sensory-card">
        <div class="sensory-card-cafe">${escapeHtml(e.cafe)}</div>
        <div class="sensory-card-drink">${escapeHtml(e.drink)}</div>
        ${renderFlavorBars(e.flavors)}
      </div>`).join('') + `</div>`;
  }
  container.innerHTML = html;
}

/* ── Wishlist ── */
function renderWishlistPage(container) {
  const items = State.get('wishlistItems');
  let html = `
    <div class="section-label">Your to-go café list ☕</div>
    <div style="background:white;border-radius:var(--radius-xl);
      padding:26px;border:1px solid var(--mist)">
      <div class="wishlist-add-row">
        <input class="wishlist-add-input" id="wishlistCafeName"
          type="text" placeholder="Café name…" maxlength="200" />
        <input class="wishlist-add-input" id="wishlistCafeLocation"
          type="text" placeholder="Location (optional)"
          style="max-width:200px" maxlength="200" />
        <button class="wishlist-add-btn" id="wishlistAddBtn">＋ Add</button>
      </div>
      <div class="wishlist-list" id="wishlistList">
        ${!items.length
          ? `<div style="text-align:center;padding:32px;color:var(--bark)">
              Your wishlist is empty — add cafés you want to visit!</div>`
          : items.map(renderWishlistItem).join('')}
      </div>
    </div>
    <div style="margin-top:18px;font-size:13px;color:var(--bark);
      text-align:right">
      ✓ ${items.filter((i) => i.visited).length} of ${items.length} visited
    </div>`;
  container.innerHTML = html;
  const addFn = async () => {
    const name = document.getElementById('wishlistCafeName')?.value.trim();
    const loc  = document.getElementById('wishlistCafeLocation')?.value.trim();
    if (!name) return;
    const { error } = await State.addWishlistItem({ name, location: loc });
    if (error) showToast('Error adding to wishlist. Please try again.');
    else { renderPage('wishlist'); showToast('📍 Added to your wishlist!'); }
  };
  document.getElementById('wishlistAddBtn')
    ?.addEventListener('click', addFn);
  document.getElementById('wishlistCafeName')
    ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addFn(); });
  container.querySelectorAll('[data-toggle-id]').forEach((el) => {
    el.addEventListener('click', async () => {
      await State.toggleWishlistItem(parseInt(el.dataset.toggleId));
      renderPage('wishlist');
    });
  });
  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await State.deleteWishlistItem(parseInt(btn.dataset.deleteId));
      renderPage('wishlist');
    });
  });
}

/* ── Notepad ── */
function renderNotepadPage(container) {
  const items = State.get('notepadItems') || [];

  container.innerHTML = `
    <!-- Compose area -->
    <div style="background:white;border-radius:var(--radius-xl);
      border:1.5px solid var(--mist);overflow:hidden;
      box-shadow:var(--shadow-sm);margin-bottom:28px;">

      <!-- Title input -->
      <input
        id="notepadTitle"
        type="text"
        placeholder="Note title…"
        maxlength="100"
        style="width:100%;padding:18px 20px 0;border:none;outline:none;
          font-family:'Playfair Display',serif;font-size:18px;
          font-style:italic;color:var(--espresso);background:transparent;
          display:block;box-sizing:border-box;"
      />

      <!-- Divider -->
      <div style="height:1px;background:var(--mist);margin:12px 20px 0;"></div>

      <!-- Body textarea -->
      <textarea
        class="notepad-area"
        id="notepadTextarea"
        placeholder="Start writing your note…"
        style="border:none;border-radius:0;min-height:180px;
          font-size:14px;padding:14px 20px;width:100%;box-sizing:border-box;"
      ></textarea>

      <!-- Footer -->
      <div style="display:flex;justify-content:space-between;
        align-items:center;padding:12px 20px;
        border-top:1px solid var(--mist);background:var(--foam);
        flex-wrap:wrap;gap:8px;">
        <span style="font-size:12px;color:var(--latte);"
          id="notepadWordCount">0 words</span>
        <div style="display:flex;gap:8px;">
          <button id="clearNotepad"
            style="background:none;border:1.5px solid var(--mist);
              border-radius:var(--radius-full);color:var(--bark);
              padding:8px 16px;font-size:13px;font-weight:600;
              cursor:pointer;transition:all 0.15s ease;">
            Clear
          </button>
          <button id="saveNotepad"
            style="background:var(--espresso);color:var(--foam);
              border:none;border-radius:var(--radius-full);
              padding:8px 20px;font-size:13px;font-weight:600;
              cursor:pointer;transition:all 0.15s ease;">
            Save Note ☕
          </button>
        </div>
      </div>
    </div>

    <!-- Saved notes section -->
    <div id="savedNotesSection">
      ${items.length ? `
        <div style="display:flex;align-items:center;
          justify-content:space-between;margin-bottom:16px;">
          <div class="section-label" style="margin-bottom:0;">
            Saved Notes
            <span style="font-size:13px;font-style:normal;
              font-family:'DM Sans',sans-serif;
              color:var(--latte);margin-left:8px;">
              ${items.length} note${items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;" id="notesList">
          ${items.map(item => renderNoteCard(item)).join('')}
        </div>
      ` : `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:40px;margin-bottom:10px;opacity:0.3;">📝</div>
          <div style="font-size:14px;color:var(--latte);">
            Your saved notes will appear here
          </div>
        </div>
      `}
    </div>`;

  const textarea  = document.getElementById('notepadTextarea');
  const wordCount = document.getElementById('notepadWordCount');

  textarea?.addEventListener('input', () => {
    wordCount.textContent = `${countWords(textarea.value)} words`;
  });

  document.getElementById('saveNotepad')?.addEventListener('click', async () => {
    const title   = document.getElementById('notepadTitle')?.value.trim();
    const content = textarea?.value.trim();
    if (!content) { showToast('Write something before saving! ☕'); return; }

    const btn = document.getElementById('saveNotepad');
    btn.disabled    = true;
    btn.textContent = 'Saving…';

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });

    await State.addNotepadItem({
      id:      generateId(),
      title:   title || 'Untitled Note',
      content,
      date:    dateStr,
      time:    timeStr,
    });

    document.getElementById('notepadTitle').value = '';
    textarea.value = '';
    wordCount.textContent = '0 words';
    showToast('📝 Note saved!');
    renderNotepadPage(container);
  });

  document.getElementById('clearNotepad')?.addEventListener('click', () => {
    const title   = document.getElementById('notepadTitle')?.value;
    const content = textarea?.value;
    if (!title && !content) return;
    if (confirm('Clear the current draft?')) {
      document.getElementById('notepadTitle').value = '';
      textarea.value = '';
      wordCount.textContent = '0 words';
    }
  });

  bindNoteCardListeners(container);
}

function renderNoteCard(item, editMode = false) {
  if (editMode) {
    return `
      <div class="note-card" data-note-id="${item.id}"
        style="background:white;border-radius:var(--radius-lg);
          padding:22px 24px;border:1.5px solid var(--caramel);
          box-shadow:var(--shadow-sm);">
        <input class="note-edit-title" type="text"
          value="${escapeHtml(item.title || '')}"
          placeholder="Note title…" maxlength="100"
          style="width:100%;border:none;outline:none;
            font-family:'Playfair Display',serif;font-size:17px;
            font-style:italic;color:var(--espresso);background:transparent;
            margin-bottom:10px;font-weight:700;display:block;
            box-sizing:border-box;" />
        <div style="height:1px;background:var(--mist);margin-bottom:12px;"></div>
        <textarea class="note-edit-body notepad-area"
          style="min-height:140px;border:none;border-radius:0;
            font-size:14px;padding:0;background:transparent;
            width:100%;box-sizing:border-box;"
        >${escapeHtml(item.content)}</textarea>
        <div style="display:flex;gap:8px;margin-top:14px;
          justify-content:flex-end;padding-top:12px;
          border-top:1px solid var(--mist);">
          <button class="note-cancel-edit" data-note-id="${item.id}"
            style="background:none;border:1.5px solid var(--mist);
              border-radius:var(--radius-full);color:var(--bark);
              padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;">
            Cancel
          </button>
          <button class="note-save-edit" data-note-id="${item.id}"
            style="background:var(--espresso);color:var(--foam);border:none;
              border-radius:var(--radius-full);padding:7px 18px;
              font-size:13px;font-weight:600;cursor:pointer;">
            Save Changes
          </button>
        </div>
      </div>`;
  }

  return `
    <div class="note-card" data-note-id="${item.id}"
      style="background:white;border-radius:var(--radius-lg);
        padding:22px 24px;border:1px solid var(--mist);
        transition:box-shadow 0.2s ease;">
      <div style="display:flex;align-items:flex-start;
        justify-content:space-between;gap:12px;margin-bottom:10px;">
        <div style="min-width:0;flex:1;">
          <div style="font-family:'Playfair Display',serif;font-size:17px;
            font-style:italic;color:var(--espresso);font-weight:700;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(item.title || 'Untitled Note')}
          </div>
          <div style="font-size:11px;color:var(--latte);margin-top:3px;
            text-transform:uppercase;letter-spacing:0.5px;">
            ${item.date}${item.time ? ' · ' + item.time : ''}
            · ${countWords(item.content)} words
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button data-edit-note="${item.id}"
            style="background:var(--foam);border:1px solid var(--mist);
              border-radius:var(--radius-full);color:var(--bark);
              font-size:12px;padding:5px 12px;cursor:pointer;
              font-weight:600;white-space:nowrap;transition:all 0.15s ease;">
            ✏️ Edit
          </button>
          <button data-delete-note="${item.id}"
            style="background:none;border:1px solid var(--mist);
              border-radius:var(--radius-full);color:var(--latte);
              font-size:12px;padding:5px 12px;cursor:pointer;
              font-weight:600;transition:all 0.15s ease;">
            🗑 Delete
          </button>
        </div>
      </div>
      <p style="font-family:'Be Vietnam Pro',sans-serif;font-style:italic;
        font-size:14px;color:var(--ink);line-height:1.8;
        white-space:pre-wrap;margin:0;
        display:-webkit-box;-webkit-line-clamp:3;
        -webkit-box-orient:vertical;overflow:hidden;">
        ${escapeHtml(item.content)}
      </p>
    </div>`;
}

function bindNoteCardListeners(container) {
  container.querySelectorAll('[data-edit-note]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = parseInt(btn.dataset.editNote);
      const item = (State.get('notepadItems') || []).find(n => n.id === id);
      if (!item) return;
      const card = container.querySelector(`.note-card[data-note-id="${id}"]`);
      if (card) {
        card.insertAdjacentHTML('afterend', renderNoteCard(item, true));
        card.remove();
        bindNoteCardListeners(container);
      }
    });
  });

  container.querySelectorAll('.note-save-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id      = parseInt(btn.dataset.noteId);
      const card    = container.querySelector(`.note-card[data-note-id="${id}"]`);
      const title   = card?.querySelector('.note-edit-title')?.value.trim();
      const content = card?.querySelector('.note-edit-body')?.value.trim();
      if (!content) { showToast('Note cannot be empty!'); return; }
      btn.disabled    = true;
      btn.textContent = 'Saving…';
      await State.updateNotepadItem(id, { title: title || 'Untitled Note', content });
      showToast('📝 Note updated!');
      renderNotepadPage(container);
    });
  });

  container.querySelectorAll('.note-cancel-edit').forEach(btn => {
    btn.addEventListener('click', () => renderNotepadPage(container));
  });

  container.querySelectorAll('[data-delete-note]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this note? This cannot be undone.')) return;
      await State.deleteNotepadItem(parseInt(btn.dataset.deleteNote));
      showToast('Note deleted.');
      renderNotepadPage(container);
    });
  });
}

/* ── Helpers ── */
function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

async function deleteEntryFromDetail(id) {
  if (!confirm('Delete this entry?')) return;
  const { error } = await State.deleteEntry(id);
  if (error) { showToast('Error deleting entry. Please try again.'); return; }
  closeDetailModal();
  renderPage('journal');
  updateStreakBadge();
  showToast('Entry deleted.');
}

  function filteredEntries() {
    const q = _state.searchQuery.toLowerCase().trim();
    if (!q) return _state.entries;
    return _state.entries.filter((e) =>
      e.cafe.toLowerCase().includes(q)  ||
      e.drink.toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (e.note || '').toLowerCase().includes(q)
    );
  }

  function stats() {
    const entries   = _state.entries;
    const cafes     = [...new Set(entries.map((e) => e.cafe))];
    const drinks    = [...new Set(entries.map((e) => e.drink))];
    const avgRating = entries.length
      ? (entries.reduce((a, e) => a + (e.rating || 0), 0)
          / entries.length).toFixed(1)
      : '—';
    return {
      count: entries.length, cafes: cafes.length,
      drinks: drinks.length, avgRating,
    };
  }

  function avgFlavors() {
    const withFlavors = _state.entries.filter(
      (e) => e.flavors && Object.keys(e.flavors).length > 0
    );
    if (!withFlavors.length) return {};
    const totals = {};
    withFlavors.forEach((e) => {
      Object.entries(e.flavors).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return Object.fromEntries(
      Object.entries(totals).map(([k, v]) =>
        [k, Math.round(v / withFlavors.length)]
      )
    );
  }

  return {
    load, get, getAll, set,
    addEntry, deleteEntry,
    addWishlistItem, toggleWishlistItem, deleteWishlistItem,
    addNotepadItem, updateNotepadItem, deleteNotepadItem,  filteredEntries, stats, avgFlavors,
  };
})();