// render.js — component rendering functions

function renderEntryCard(entry, listMode = false) {
  const emoji = getDrinkEmoji(entry.drink);
  const modeClass = listMode ? "list-mode" : "";

  const photoHtml = entry.photos && entry.photos.length > 0
    ? `<img src="${entry.photos[0]}" alt="${escapeHtml(entry.cafe)}" class="entry-photo" loading="lazy"/>`
    : `<div class="entry-photo-placeholder">${emoji}</div>`;

  return `
    <div class="entry-card ${modeClass}" data-id="${entry.id}" role="button" tabindex="0" aria-label="View ${escapeHtml(entry.cafe)} entry">
      ${listMode ? "" : photoHtml}
      ${listMode ? `<div class="entry-photo-placeholder">${emoji}</div>` : ""}
      <div class="entry-body">
        <div class="entry-cafe">${escapeHtml(entry.cafe)}</div>
        <div class="entry-drink">${escapeHtml(entry.drink)}</div>
        <div class="star-row">${renderStars(entry.rating)}</div>
        ${entry.note ? `<p class="entry-note">${escapeHtml(entry.note)}</p>` : ""}
        <div class="entry-footer">
          <span class="entry-date">${formatDate(entry.date)}</span>
          <div class="entry-tags">
            ${renderMoodTag(entry.mood)}
            ${renderTags(entry.tags)}
          </div>
        </div>
      </div>
    </div>`;
}

function renderDetailModal(entry) {
  const emoji = getDrinkEmoji(entry.drink);
  const moodCfg = entry.mood ? MOOD_CONFIG[entry.mood] : null;
  const hasFlavors = entry.flavors && Object.keys(entry.flavors).length > 0;

  return `
    <div class="detail-emoji">${emoji}</div>
    <div class="detail-cafe">${escapeHtml(entry.cafe)}</div>
    <div class="detail-drink">${escapeHtml(entry.drink)}</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;flex-wrap:wrap;">
      <div class="star-row">${renderStars(entry.rating, "large")}</div>
      <span class="entry-date">${formatDateLong(entry.date)}</span>
    </div>
    ${entry.note ? `<div class="detail-note">"${escapeHtml(entry.note)}"</div>` : ""}
    <div class="detail-meta-row">
      ${renderMoodTag(entry.mood)}
      ${renderTags(entry.tags)}
    </div>
    ${hasFlavors ? `
      <div style="margin-top:20px">
        <div class="section-label" style="font-size:15px;margin-bottom:12px;">Flavor Profile</div>
        ${renderFlavorBars(entry.flavors)}
      </div>` : ""}
    <div style="margin-top:20px;display:flex;gap:10px;">
      <button class="submit-btn" style="background:var(--mist);color:var(--espresso);font-family:'DM Sans',sans-serif;font-style:normal;font-size:14px;font-weight:600;" 
        onclick="deleteEntryFromDetail(${entry.id})">🗑 Delete Entry</button>
    </div>`;
}

function renderStatCards(stats) {
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">📖</div><div class="stat-number">${stats.count}</div><div class="stat-label">Entries</div></div>
      <div class="stat-card"><div class="stat-icon">🏠</div><div class="stat-number">${stats.cafes}</div><div class="stat-label">Cafés</div></div>
      <div class="stat-card"><div class="stat-icon">☕</div><div class="stat-number">${stats.drinks}</div><div class="stat-label">Drinks</div></div>
      <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-number">${stats.avgRating}</div><div class="stat-label">Avg Rating</div></div>
    </div>`;
}

function renderCalendar(month, year, entries) {
  const days = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);

  const entryDays = new Set(
    entries
      .filter(e => {
        const d = new Date(e.date + "T00:00:00");
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .map(e => new Date(e.date + "T00:00:00").getDate())
  );

  const headerCells = DAYS.map(d => `<div class="cal-header">${d}</div>`).join("");
  const emptyCells  = Array(firstDay).fill(`<div class="cal-day empty"></div>`).join("");
  const dayCells    = Array.from({ length: days }, (_, i) => {
    const day = i + 1;
    const today     = isToday(day, month, year);
    const hasEntry  = entryDays.has(day);
    const classes   = ["cal-day", today ? "today" : "", hasEntry ? "has-entry" : ""].filter(Boolean).join(" ");
    const dot       = hasEntry ? `<div class="cal-dot"></div>` : "";
    return `<div class="${classes}" data-day="${day}">${day}${dot}</div>`;
  }).join("");

  return `
    <div class="calendar-wrapper">
      <div class="calendar-nav">
        <button class="cal-nav-btn" id="calPrev">←</button>
        <span class="cal-month">${MONTHS[month]} ${year}</span>
        <button class="cal-nav-btn" id="calNext">→</button>
      </div>
      <div class="calendar-grid">
        ${headerCells}${emptyCells}${dayCells}
      </div>
    </div>`;
}

function renderWishlistItem(item) {
  return `
    <div class="wishlist-item" data-wishlist-id="${item.id}">
      <div class="wishlist-check ${item.visited ? "checked" : ""}" data-toggle-id="${item.id}" role="checkbox" aria-checked="${item.visited}" tabindex="0">
        ${item.visited ? "✓" : ""}
      </div>
      <div style="flex:1">
        <div class="wishlist-name ${item.visited ? "visited" : ""}">${escapeHtml(item.name)}</div>
        ${item.location ? `<div class="wishlist-location">📍 ${escapeHtml(item.location)}</div>` : ""}
      </div>
      <button class="wishlist-delete" data-delete-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">✕</button>
    </div>`;
}
