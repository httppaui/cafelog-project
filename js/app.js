// app.js — main init, nav, search wiring

document.addEventListener("DOMContentLoaded", () => {
  State.load();
  renderPage("journal");
  updateStreakBadge();
  initModalListeners();
  initNav();
  initSearch();
  initHamburger();
  initViewToggle();
  initGlobalSearch();
});

function initNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
      document.getElementById("sidebar")?.classList.remove("open");
    });
  });
}

function navigateTo(page) {
  State.set("currentPage", page);
  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  const searchWrapper = document.getElementById("searchBarWrapper");
  const viewToggle    = document.getElementById("viewToggle");
  const showSearch    = page === "journal";
  if (searchWrapper) searchWrapper.style.display = showSearch ? "" : "none";
  if (viewToggle)    viewToggle.style.display    = showSearch ? "" : "none";

  if (page === "ai") {
    // If cached recs exist, render immediately — only fetch fresh if none
    if (!State.get("aiRecommendations")) {
      fetchAIRecommendations();
    } else {
      renderPage("ai");
    }
  } else {
    renderPage(page);
  }
}

/* ── Journal search (existing) ── */
function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", debounce(e => {
    State.set("searchQuery", e.target.value);
    renderPage(State.get("currentPage"));
  }, 280));
}

/* ── Global search overlay ── */
function initGlobalSearch() {
  const btn     = document.getElementById("globalSearchBtn");
  const overlay = document.getElementById("globalSearchOverlay");
  const input   = document.getElementById("globalSearchInput");
  const results = document.getElementById("globalSearchResults");

  if (!btn || !overlay || !input) return;

  btn.addEventListener("click", () => {
    overlay.classList.add("open");
    input.value = "";
    results.innerHTML = `<div style="text-align:center;padding:32px;color:var(--bark);font-size:14px;">Start typing to search entries…</div>`;
    setTimeout(() => input.focus(), 100);
  });

  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeGlobalSearch();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeGlobalSearch();
    // Cmd/Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      overlay.classList.add("open");
      setTimeout(() => input.focus(), 100);
    }
  });

  input.addEventListener("input", debounce(() => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = `<div style="text-align:center;padding:32px;color:var(--bark);font-size:14px;">Start typing to search entries…</div>`;
      return;
    }

    const matches = State.get("entries").filter(e =>
      e.cafe.toLowerCase().includes(q) ||
      e.drink.toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (e.note || "").toLowerCase().includes(q)
    );

    if (!matches.length) {
      results.innerHTML = `<div style="text-align:center;padding:32px;color:var(--bark);font-size:14px;">No entries found for "${escapeHtml(q)}"</div>`;
      return;
    }

    results.innerHTML = matches.map(e => `
      <div class="global-search-result" data-id="${e.id}" role="button" tabindex="0">
        <span style="font-size:22px;">${getDrinkEmoji(e.drink)}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-family:'Playfair Display',serif;font-size:15px;color:var(--espresso);font-weight:700;">${escapeHtml(e.cafe)}</div>
          <div style="font-size:12px;color:var(--caramel);font-style:italic;">${escapeHtml(e.drink)} · ${formatDate(e.date)}</div>
          ${e.note ? `<div style="font-size:12px;color:var(--bark);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(e.note)}</div>` : ""}
        </div>
        <div class="star-row">${renderStars(e.rating)}</div>
      </div>`).join("");

    results.querySelectorAll(".global-search-result").forEach(el => {
      const open = () => {
        closeGlobalSearch();
        const entry = State.get("entries").find(e => e.id === parseInt(el.dataset.id));
        if (entry) {
          navigateTo("journal");
          setTimeout(() => openDetailModal(entry), 150);
        }
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", e => e.key === "Enter" && open());
    });
  }, 200));
}

function closeGlobalSearch() {
  document.getElementById("globalSearchOverlay")?.classList.remove("open");
}

function initHamburger() {
  const btn     = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  btn?.addEventListener("click", () => sidebar?.classList.toggle("open"));
  overlay?.addEventListener("click", () => sidebar?.classList.remove("open"));
}

function initViewToggle() {
  document.getElementById("viewToggle")?.addEventListener("click", e => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;
    const view = btn.dataset.view;
    State.set("viewMode", view);
    document.querySelectorAll(".view-btn").forEach(b =>
      b.classList.toggle("active", b.dataset.view === view)
    );
    renderPage(State.get("currentPage"));
  });
}

function updateStreakBadge() {
  const el = document.getElementById("streakNumber");
  if (el) el.textContent = State.get("entries").length;
}

function deleteEntryFromDetail(id) {
  State.deleteEntry(id);
  closeDetailModal();
  renderPage(State.get("currentPage"));
  updateStreakBadge();
  showToast("Entry deleted.");
}