// utils.js — helper functions

function getDrinkEmoji(drink) {
  return DRINK_EMOJIS[drink] || DRINK_EMOJIS["default"];
}

function formatDate(dateStr, options = {}) {
  const d = new Date(dateStr + "T00:00:00");
  const defaults = { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString("en-US", { ...defaults, ...options });
}

function formatDateLong(dateStr) {
  return formatDate(dateStr, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function renderStars(rating, size = "small") {
  const fontSize = size === "large" ? "18px" : "13px";
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star ${i < rating ? "filled" : "empty"}" style="font-size:${fontSize}">★</span>`
  ).join("");
}

function renderFlavorBars(flavors) {
  if (!flavors || !Object.keys(flavors).length) return "";
  return Object.entries(flavors).map(([key, val], i) => {
    const color = FLAVOR_COLORS[i % FLAVOR_COLORS.length];
    return `
      <div class="flavor-display-row">
        <span class="flavor-display-label">${key}</span>
        <div class="flavor-bar-track">
          <div class="flavor-bar-fill" style="width:${val}%;background:${color}"></div>
        </div>
        <span class="flavor-display-val">${val}</span>
      </div>`;
  }).join("");
}

function renderMoodTag(mood) {
  if (!mood) return "";
  const m = MOOD_CONFIG[mood];
  if (!m) return "";
  return `<span class="mood-tag mood-${mood}">${m.emoji} ${m.label}</span>`;
}

function renderTags(tags = []) {
  return tags.slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join("");
}

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay();
}

function isToday(day, month, year) {
  const now = new Date();
  return now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
}

function showToast(message, duration = 2400) {
  let toast = document.getElementById("toastEl");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastEl";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
