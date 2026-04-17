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
});

function initNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
      // Close mobile sidebar
      document.getElementById("sidebar")?.classList.remove("open");
    });
  });
}

function navigateTo(page) {
  State.set("currentPage", page);
  document.querySelectorAll(".nav-item[data-page]").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });
  const titles = {
    journal: "My Coffee Diary", calendar: "Calendar", timeline: "Timeline",
    mood: "Mood & Coffee", ai: "AI Picks", sensory: "Sensory Map",
    wishlist: "Café Wishlist", notepad: "My Notepad"
  };
  document.getElementById("pageTitle").textContent = titles[page] || "The Coffee Diary";

  const searchWrapper = document.getElementById("searchBarWrapper");
  const viewToggle    = document.getElementById("viewToggle");
  const showSearch    = ["journal"].includes(page);
  if (searchWrapper) searchWrapper.style.display = showSearch ? "" : "none";
  if (viewToggle)    viewToggle.style.display    = showSearch ? "" : "none";

  if (page === "ai") {
    fetchAIRecommendations();
  } else {
    renderPage(page);
  }
}

function initSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", debounce(e => {
    State.set("searchQuery", e.target.value);
    renderPage(State.get("currentPage"));
  }, 280));
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