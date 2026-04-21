// pages.js — renders each page into #pageContent

function renderPage(page) {
  const container = document.getElementById("pageContent");

  document.getElementById("pageTitle").textContent = {
    journal:  "cafélog",
    calendar: "Calendar View",
    timeline: "My Timeline",
    mood:     "Mood & Coffee",
    ai:       "Recommendations",
    sensory:  "Sensory Memory Map",
    wishlist: "Café Wishlist",
    notepad:  "My Notepad",
  }[page] || "cafélog";

  const searchBar  = document.getElementById("searchBarWrapper");
  const viewToggle = document.getElementById("viewToggle");
  const showSearch = page === "journal";
  searchBar.style.display  = showSearch ? "" : "none";
  viewToggle.style.display = showSearch ? "" : "none";

  container.innerHTML = "";
  container.className = "page-content page-enter";
  void container.offsetWidth;

  switch (page) {
    case "journal":  renderJournalPage(container);  break;
    case "calendar": renderCalendarPage(container); break;
    case "timeline": renderTimelinePage(container); break;
    case "mood":     renderMoodPage(container);     break;
    case "ai":       renderAIPage(container);       break;
    case "sensory":  renderSensoryPage(container);  break;
    case "wishlist": renderWishlistPage(container); break;
    case "notepad":  renderNotepadPage(container);  break;
  }
}

/* ── Journal ── */
function renderJournalPage(container) {
  const stats    = State.stats();
  const entries  = State.filteredEntries();
  const listMode = State.get("viewMode") === "list";

  let html = renderStatCards(stats);

  if (!entries.length) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">☕</div>
        <div class="empty-state-title">Your diary is empty</div>
        <p>Start your coffee journey — add your first entry!</p>
      </div>`;
  } else {
    const gridClass = listMode ? "entries-list" : "entries-grid";
    html += `<div class="${gridClass}">` + entries.map(e => renderEntryCard(e, listMode)).join("") + `</div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll(".entry-card").forEach(card => {
    const handler = () => {
      const id    = parseInt(card.dataset.id);
      const entry = State.get("entries").find(e => e.id === id);
      if (entry) openDetailModal(entry);
    };
    card.addEventListener("click", handler);
    card.addEventListener("keydown", e => e.key === "Enter" && handler());
  });

  document.getElementById("streakNumber").textContent = State.get("entries").length;
}

/* ── Calendar ── */
function renderCalendarPage(container) {
  const month   = State.get("calendarMonth");
  const year    = State.get("calendarYear");
  const entries = State.get("entries");

  let html = renderCalendar(month, year, entries);

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date + "T00:00:00");
    return d.getMonth() === month && d.getFullYear() === year;
  });

  html += `<div class="month-visits" style="margin-top:28px">
    <div class="section-label">${MONTHS[month]} visits</div>`;

  if (!monthEntries.length) {
    html += `<div style="text-align:center;padding:32px;color:var(--bark)">No entries this month yet ☕</div>`;
  } else {
    html += monthEntries.map(e => `
      <div class="top-cafe-row entry-card-link" data-id="${e.id}" style="cursor:pointer" tabindex="0">
        <div>
          <div class="top-cafe-name">${escapeHtml(e.cafe)}</div>
          <div class="top-cafe-meta">${escapeHtml(e.drink)} · ${formatDate(e.date, { month: "long", day: "numeric" })}</div>
        </div>
        <div class="star-row">${renderStars(e.rating)}</div>
      </div>`).join("");
  }
  html += `</div>`;

  container.innerHTML = html;

  // Calendar nav
  document.getElementById("calPrev")?.addEventListener("click", () => {
    let m = State.get("calendarMonth") - 1;
    let y = State.get("calendarYear");
    if (m < 0) { m = 11; y--; }
    State.set("calendarMonth", m);
    State.set("calendarYear", y);
    renderPage("calendar");
  });

  document.getElementById("calNext")?.addEventListener("click", () => {
    let m = State.get("calendarMonth") + 1;
    let y = State.get("calendarYear");
    if (m > 11) { m = 0; y++; }
    State.set("calendarMonth", m);
    State.set("calendarYear", y);
    renderPage("calendar");
  });

  // Clickable calendar days with entries
  container.querySelectorAll(".cal-day.has-entry").forEach(day => {
    day.addEventListener("click", () => {
      const dayNum = parseInt(day.dataset.day);
      const match  = entries.find(e => {
        const d = new Date(e.date + "T00:00:00");
        return d.getMonth() === month && d.getFullYear() === year && d.getDate() === dayNum;
      });
      if (match) openDetailModal(match);
    });
    day.addEventListener("keydown", e => e.key === "Enter" && day.click());
  });

  // Entry row links
  container.querySelectorAll(".entry-card-link").forEach(el => {
    el.addEventListener("click", () => {
      const id    = parseInt(el.dataset.id);
      const entry = State.get("entries").find(e => e.id === id);
      if (entry) openDetailModal(entry);
    });
  });
}

/* ── Timeline ── */
function renderTimelinePage(container) {
  const entries = State.get("entries");

  let html = `<div class="section-label">Your coffee story, one cup at a time</div>`;

  if (!entries.length) {
    html += `<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-title">No entries yet</div><p>Log your first café visit to begin your timeline.</p></div>`;
  } else {
    html += `<div class="timeline">` + entries.map(e => `
      <div class="timeline-item" data-id="${e.id}" tabindex="0">
        <div class="timeline-dot"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:6px">
          <div>
            <div class="entry-cafe" style="font-size:16px">${escapeHtml(e.cafe)}</div>
            <div class="entry-drink">${escapeHtml(e.drink)}</div>
          </div>
          <div style="text-align:right">
            <div class="star-row" style="justify-content:flex-end">${renderStars(e.rating)}</div>
            <div class="entry-date">${formatDate(e.date, { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>
        ${e.note ? `<p class="entry-note" style="display:block;-webkit-line-clamp:3">${escapeHtml(e.note)}</p>` : ""}
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          ${renderMoodTag(e.mood)}${renderTags(e.tags)}
        </div>
      </div>`).join("") + `</div>`;
  }

  container.innerHTML = html;
  container.querySelectorAll(".timeline-item").forEach(el => {
    const open = () => {
      const id    = parseInt(el.dataset.id);
      const entry = State.get("entries").find(e => e.id === id);
      if (entry) openDetailModal(entry);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => e.key === "Enter" && open());
  });
}

/* ── Mood & Coffee ── */
function renderMoodPage(container) {
  const selectedMood = State.get("selectedMoodPage");

  let html = `
    <div class="mood-hero">
      <div class="mood-hero-title">☕ What's your vibe today?</div>
      <div class="mood-hero-sub">Pick your current mood and we'll suggest the perfect coffee to match.</div>
      <div class="mood-selector-grid">
        ${Object.entries(MOOD_CONFIG).map(([id, m]) => `
          <button class="mood-selector-btn mood-${id} ${selectedMood === id ? "selected" : ""}" data-mood-select="${id}">
            <span class="mood-selector-emoji">${m.emoji}</span>
            ${m.label}
          </button>`).join("")}
      </div>
    </div>`;

  if (selectedMood && MOOD_COFFEE_MAP[selectedMood]) {
    const data = MOOD_COFFEE_MAP[selectedMood];
    html += `
      <div class="mood-result">
        <div class="mood-result-title">${data.title}</div>
        <div class="mood-result-sub">${data.subtitle}</div>
        <div class="coffee-suggestions-grid">
          ${data.suggestions.map(s => `
            <div class="coffee-suggestion-card" style="background:${s.bg}">
              <div class="suggestion-drink-emoji">${s.emoji}</div>
              <div class="suggestion-drink-name">${escapeHtml(s.name)}</div>
              <div class="suggestion-reason">${escapeHtml(s.reason)}</div>
            </div>`).join("")}
        </div>
      </div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll("[data-mood-select]").forEach(btn => {
    btn.addEventListener("click", () => {
      State.set("selectedMoodPage", btn.dataset.moodSelect);
      renderPage("mood");
    });
  });
}

/* ── AI / Recommendations ── */
function renderAIPage(container) {
  const recs    = State.get("aiRecommendations");
  const loading = State.get("aiLoading");
  const entries = State.get("entries");

  let html = `
    <div class="ai-panel">
      <div class="ai-panel-title">✨ Your Personal Coffee Sommelier</div>
      <div class="ai-panel-subtitle">Powered by AI — based on your ${entries.length} journal entries and flavor preferences</div>
      <button class="ai-generate-btn" id="generateAIBtn" ${loading ? "disabled" : ""}>
        ${loading
          ? `<span class="spinner"></span> Brewing recommendations…`
          : `<span>✨</span> ${recs ? "Refresh Recommendations" : "Generate Recommendations"}`}
      </button>
      ${recs ? `<div class="ai-recs">
        ${recs.map(r => `
          <div class="ai-rec-card">
            <div class="rec-emoji">${r.emoji || "☕"}</div>
            <div class="rec-name">${escapeHtml(r.name)}</div>
            <div class="rec-type">${escapeHtml(r.type || "")}</div>
            <div class="rec-desc">${escapeHtml(r.reason)}</div>
          </div>`).join("")}
      </div>` : `
        <div style="margin-top:16px;font-size:13px;opacity:0.65;">
          Hit Generate to get personalized picks based on your journal.
        </div>`}
    </div>`;

  const cafeCounts = {};
  entries.forEach(e => {
    if (!cafeCounts[e.cafe]) cafeCounts[e.cafe] = { count: 0, totalRating: 0 };
    cafeCounts[e.cafe].count++;
    cafeCounts[e.cafe].totalRating += e.rating || 0;
  });

  const cafeList = Object.entries(cafeCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  html += `
    <div style="background:white;border-radius:var(--radius-xl);padding:26px;border:1px solid var(--mist)">
      <div class="section-label">Your Top Cafés</div>
      ${cafeList.length
        ? cafeList.map(([cafe, d]) => `
          <div class="top-cafe-row">
            <div>
              <div class="top-cafe-name">${escapeHtml(cafe)}</div>
              <div class="top-cafe-meta">${d.count} visit${d.count !== 1 ? "s" : ""}</div>
            </div>
            <div class="star-row">${renderStars(Math.round(d.totalRating / d.count))}</div>
          </div>`).join("")
        : `<p style="color:var(--bark);font-size:14px">No entries yet.</p>`}
    </div>`;

  container.innerHTML = html;

  document.getElementById("generateAIBtn")?.addEventListener("click", fetchAIRecommendations);
}

/* ── Sensory Map ── */
function renderSensoryPage(container) {
  const entries    = State.get("entries").filter(e => e.flavors && Object.keys(e.flavors).length > 0);
  const avgFlavors = State.avgFlavors();

  let html = `
    <div class="sensory-header-card">
      <div class="sensory-header-title">🎨 Sensory Memory Map</div>
      <div class="sensory-header-sub">
        Your personalized flavor fingerprint — built from every entry you log.
        Track how your palate evolves and use this map to communicate your taste to baristas.
      </div>
    </div>`;

  if (Object.keys(avgFlavors).length > 0) {
    html += `
      <div style="background:white;border-radius:var(--radius-xl);padding:26px;border:1px solid var(--mist);margin-bottom:var(--gap-xl)">
        <div class="section-label">Your Average Flavor Profile</div>
        <div style="font-size:13px;color:var(--bark);margin-bottom:18px">Aggregated across ${entries.length} rated entries</div>
        ${renderFlavorBars(avgFlavors)}
      </div>`;
  }

  if (!entries.length) {
    html += `<div class="empty-state"><div class="empty-state-icon">🎨</div><div class="empty-state-title">No flavor data yet</div><p>Add flavor sliders when creating entries to build your sensory map.</p></div>`;
  } else {
    html += `<div class="sensory-grid">` + entries.map(e => `
      <div class="sensory-card">
        <div class="sensory-card-cafe">${escapeHtml(e.cafe)}</div>
        <div class="sensory-card-drink">${escapeHtml(e.drink)}</div>
        ${renderFlavorBars(e.flavors)}
      </div>`).join("") + `</div>`;
  }

  container.innerHTML = html;
}

/* ── Wishlist ── */
function renderWishlistPage(container) {
  const items = State.get("wishlistItems");

  let html = `
    <div class="section-label">Your to-go café list ☕</div>
    <div style="background:white;border-radius:var(--radius-xl);padding:26px;border:1px solid var(--mist)">
      <div class="wishlist-add-row">
        <input class="wishlist-add-input" id="wishlistCafeName" type="text" placeholder="Café name…" />
        <input class="wishlist-add-input" id="wishlistCafeLocation" type="text" placeholder="Location (optional)" style="max-width:200px"/>
        <button class="wishlist-add-btn" id="wishlistAddBtn">＋ Add</button>
      </div>
      <div class="wishlist-list" id="wishlistList">
        ${!items.length
          ? `<div style="text-align:center;padding:32px;color:var(--bark)">Your wishlist is empty — add cafés you want to visit!</div>`
          : items.map(renderWishlistItem).join("")}
      </div>
    </div>
    <div style="margin-top:18px;font-size:13px;color:var(--bark);text-align:right">
      ✓ ${items.filter(i => i.visited).length} of ${items.length} visited
    </div>`;

  container.innerHTML = html;

  const addFn = () => {
    const name = document.getElementById("wishlistCafeName")?.value.trim();
    const loc  = document.getElementById("wishlistCafeLocation")?.value.trim();
    if (!name) return;
    State.addWishlistItem({ id: generateId(), name, location: loc, visited: false });
    renderPage("wishlist");
    showToast("📍 Added to your wishlist!");
  };

  document.getElementById("wishlistAddBtn")?.addEventListener("click", addFn);
  document.getElementById("wishlistCafeName")?.addEventListener("keydown", e => {
    if (e.key === "Enter") addFn();
  });

  container.querySelectorAll("[data-toggle-id]").forEach(el => {
    el.addEventListener("click", () => {
      State.toggleWishlistItem(parseInt(el.dataset.toggleId));
      renderPage("wishlist");
    });
    el.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        State.toggleWishlistItem(parseInt(el.dataset.toggleId));
        renderPage("wishlist");
      }
    });
  });

  container.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      State.deleteWishlistItem(parseInt(btn.dataset.deleteId));
      renderPage("wishlist");
    });
  });
}

/* ── Notepad ── */
function renderNotepadPage(container) {
  const items = State.get("notepadItems") || [];

  container.innerHTML = `
    <p style="font-size:13px;color:var(--bark);margin-bottom:14px">
      Jot down brewing ratios, café recommendations, coffee quotes — anything you want to remember.
    </p>
    <div style="background:white;border-radius:var(--radius-xl);border:1.5px solid var(--mist);overflow:hidden;">
      <input
        id="notepadTitle"
        type="text"
        placeholder="Title"
        style="width:100%;padding:18px 20px 0;border:none;outline:none;font-family:'Playfair Display',serif;font-size:18px;font-style:italic;color:var(--espresso);background:transparent;"
      />
      <textarea
        class="notepad-area"
        id="notepadTextarea"
        placeholder="Start writing…"
        style="border:none;border-radius:0;border-top:1px solid var(--mist);margin-top:10px;"
      ></textarea>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
      <span style="font-size:12px;color:var(--latte)" id="notepadWordCount">0 words</span>
      <div style="display:flex;gap:8px;">
        <button class="new-entry-btn" style="background:var(--caramel);padding:8px 18px;font-size:13px" id="saveNotepad">Save Note</button>
        <button class="new-entry-btn" style="background:var(--sage);padding:8px 18px;font-size:13px" id="clearNotepad">Clear</button>
      </div>
    </div>

    ${items.length ? `
    <div style="margin-top:32px">
      <div class="section-label">Saved Notes</div>
      <div style="display:flex;flex-direction:column;gap:12px;" id="notesList">
        ${items.map(item => renderNoteCard(item)).join("")}
      </div>
    </div>` : ""}`;

  const textarea  = document.getElementById("notepadTextarea");
  const wordCount = document.getElementById("notepadWordCount");

  textarea?.addEventListener("input", () => {
    wordCount.textContent = `${countWords(textarea.value)} words`;
  });

  document.getElementById("saveNotepad")?.addEventListener("click", () => {
    const title   = document.getElementById("notepadTitle")?.value.trim();
    const content = textarea.value.trim();
    if (!content) { showToast("Nothing to save!"); return; }

    State.addNotepadItem({
      id:      generateId(),
      title,
      content,
      date:    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });

    showToast("📝 Note saved!");
    renderPage("notepad");
  });

  document.getElementById("clearNotepad")?.addEventListener("click", () => {
    if (document.getElementById("notepadTitle")?.value || textarea?.value) {
      if (confirm("Clear the current draft?")) renderPage("notepad");
    }
  });

  bindNoteCardListeners(container);
}

function renderNoteCard(item, editMode = false) {
  if (editMode) {
    return `
      <div class="note-card" data-note-id="${item.id}">
        <input class="note-edit-title" type="text" value="${escapeHtml(item.title || "")}"
          placeholder="Title"
          style="width:100%;border:none;outline:none;font-family:'Playfair Display',serif;font-size:16px;font-style:italic;color:var(--espresso);background:transparent;margin-bottom:8px;font-weight:700;" />
        <textarea class="note-edit-body notepad-area"
          style="min-height:120px;border:1px solid var(--mist);border-radius:var(--radius-md);font-size:13px;padding:12px;"
        >${escapeHtml(item.content)}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end;">
          <button class="new-entry-btn note-cancel-edit" data-note-id="${item.id}"
            style="background:var(--mist);color:var(--espresso);padding:7px 16px;font-size:13px;">Cancel</button>
          <button class="new-entry-btn note-save-edit" data-note-id="${item.id}"
            style="background:var(--caramel);padding:7px 16px;font-size:13px;">Save</button>
        </div>
      </div>`;
  }

  return `
    <div class="note-card" data-note-id="${item.id}" style="background:white;border-radius:var(--radius-lg);padding:22px 24px;border:1px solid var(--mist);">
      ${item.title ? `<div style="font-family:'Playfair Display',serif;font-size:16px;font-style:italic;color:var(--espresso);margin-bottom:8px;font-weight:700;">${escapeHtml(item.title)}</div>` : ""}
      <p style="font-family:'Be Vietnam Pro',sans-serif;font-style:italic;font-size:14px;color:var(--ink);line-height:1.9;white-space:pre-wrap;">${escapeHtml(item.content)}</p>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--mist);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <span style="font-size:11px;color:var(--latte);text-transform:uppercase;letter-spacing:0.5px;">${item.date} · ${countWords(item.content)} words</span>
        <div style="display:flex;gap:8px;">
          <button style="background:none;border:1px solid var(--mist);border-radius:var(--radius-full);color:var(--bark);font-size:12px;padding:4px 12px;cursor:pointer;" data-edit-note="${item.id}">✏️ Edit</button>
          <button style="background:none;border:none;color:var(--latte);font-size:13px;cursor:pointer;" data-delete-note="${item.id}">🗑 Delete</button>
        </div>
      </div>
    </div>`;
}

function bindNoteCardListeners(container) {
  // Edit button — swap card to edit mode
  container.querySelectorAll("[data-edit-note]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id   = parseInt(btn.dataset.editNote);
      const item = State.get("notepadItems").find(n => n.id === id);
      if (!item) return;
      const card = container.querySelector(`.note-card[data-note-id="${id}"]`);
      if (card) {
        card.outerHTML; // read before replace
        card.insertAdjacentHTML("afterend", renderNoteCard(item, true));
        card.remove();
        bindNoteCardListeners(container);
      }
    });
  });

  // Save edit
  container.querySelectorAll(".note-save-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const id    = parseInt(btn.dataset.noteId);
      const card  = container.querySelector(`.note-card[data-note-id="${id}"]`);
      const title = card?.querySelector(".note-edit-title")?.value.trim();
      const content = card?.querySelector(".note-edit-body")?.value.trim();
      if (!content) { showToast("Note can't be empty!"); return; }
      State.updateNotepadItem(id, { title, content });
      showToast("📝 Note updated!");
      renderPage("notepad");
    });
  });

  // Cancel edit
  container.querySelectorAll(".note-cancel-edit").forEach(btn => {
    btn.addEventListener("click", () => renderPage("notepad"));
  });

  // Delete
  container.querySelectorAll("[data-delete-note]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this note?")) {
        State.deleteNotepadItem(parseInt(btn.dataset.deleteNote));
        renderPage("notepad");
        showToast("Note deleted.");
      }
    });
  });
}

function countWords(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function deleteEntryFromDetail(id) {
  if (!confirm("Delete this entry?")) return;
  State.deleteEntry(id);
  closeDetailModal();
  renderPage(State.get("currentPage"));
  showToast("Entry deleted");
}