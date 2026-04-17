// modal.js — modal open/close and form handling

/* ── Detail Modal ── */
function openDetailModal(entry) {
  const modal = document.getElementById("detailModal");
  const content = document.getElementById("detailModalContent");
  content.innerHTML = `
    <button class="modal-close" id="closeDetailModal">✕</button>
    ${renderDetailModal(entry)}`;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  document.getElementById("closeDetailModal")?.addEventListener("click", closeDetailModal);
  modal.addEventListener("click", e => e.target === modal && closeDetailModal());
}

function closeDetailModal() {
  document.getElementById("detailModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ── New Entry Modal ── */
function openNewEntryModal() {
  const modal = document.getElementById("newEntryModal");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Reset form state
  State.set("currentRating", 0);
  State.set("currentMood", "");
  State.set("currentTags", []);
  State.set("currentFlavors", {});
  State.set("currentPhotos", []);

  // Set today's date
  const dateInput = document.getElementById("entryDate");
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];

  // Reset star buttons
  document.querySelectorAll(".star-btn").forEach(b => b.classList.remove("active"));

  // Reset mood chips
  document.querySelectorAll(".mood-chip").forEach(c => c.classList.remove("selected"));

  // Reset tags display
  renderTagsInForm();

  // Reset flavor sliders to 30
  document.querySelectorAll(".flavor-range").forEach(r => {
    r.value = 30;
    r.nextElementSibling.textContent = 30;
  });

  // Clear photo previews
  document.getElementById("photoPreviewGrid").innerHTML = "";

  // Focus first input
  setTimeout(() => document.getElementById("cafeName")?.focus(), 100);
}

function closeNewEntryModal() {
  document.getElementById("newEntryModal")?.classList.remove("open");
  document.body.style.overflow = "";
  document.getElementById("entryForm")?.reset();
}

/* ── Form: Tags ── */
function renderTagsInForm() {
  const container = document.getElementById("tagsContainer");
  const input     = document.getElementById("tagInput");
  if (!container || !input) return;

  // Remove existing pills (keep input)
  container.querySelectorAll(".tag-pill").forEach(el => el.remove());

  const tags = State.get("currentTags");
  tags.forEach(tag => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.innerHTML = `${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span>`;
    container.insertBefore(pill, input);
  });

  container.querySelectorAll(".tag-remove").forEach(el => {
    el.addEventListener("click", () => {
      const newTags = State.get("currentTags").filter(t => t !== el.dataset.tag);
      State.set("currentTags", newTags);
      renderTagsInForm();
    });
  });
}

/* ── Form: Photos ── */
function handlePhotoUpload(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const photos = State.get("currentPhotos");
      photos.push(e.target.result);
      State.set("currentPhotos", photos);

      const grid = document.getElementById("photoPreviewGrid");
      if (grid) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.className = "photo-preview";
        img.alt = "Preview";
        grid.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
  });
}

/* ── Form Submission ── */
function handleFormSubmit(e) {
  e.preventDefault();

  const cafe  = document.getElementById("cafeName")?.value.trim();
  const drink = document.getElementById("drinkName")?.value.trim();
  if (!cafe || !drink) {
    showToast("Please fill in café name and drink ☕");
    return;
  }

  // Collect flavors from sliders
  const flavors = {};
  document.querySelectorAll(".flavor-range").forEach(r => {
    flavors[r.dataset.flavor] = parseInt(r.value);
  });

  const entry = {
    id:      generateId(),
    cafe,
    drink,
    rating:  State.get("currentRating"),
    note:    document.getElementById("entryNote")?.value.trim() || "",
    date:    document.getElementById("entryDate")?.value || new Date().toISOString().split("T")[0],
    tags:    State.get("currentTags"),
    mood:    State.get("currentMood"),
    flavors,
    photos:  State.get("currentPhotos"),
  };

  State.addEntry(entry);
  closeNewEntryModal();
  renderPage(State.get("currentPage"));
  showToast("☕ Entry saved to your diary!");
}

/* ── Init Modal Event Listeners ── */
function initModalListeners() {
  // Open
  document.getElementById("newEntryBtn")?.addEventListener("click", openNewEntryModal);

  // Close
  document.getElementById("closeModal")?.addEventListener("click", closeNewEntryModal);
  document.getElementById("newEntryModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("newEntryModal")) closeNewEntryModal();
  });

  // Star rating
  document.getElementById("starInput")?.addEventListener("click", e => {
    const btn = e.target.closest(".star-btn");
    if (!btn) return;
    const rating = parseInt(btn.dataset.star);
    State.set("currentRating", rating);
    document.querySelectorAll(".star-btn").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.star) <= rating);
    });
  });

  // Hover stars
  document.getElementById("starInput")?.addEventListener("mouseover", e => {
    const btn = e.target.closest(".star-btn");
    if (!btn) return;
    const hover = parseInt(btn.dataset.star);
    document.querySelectorAll(".star-btn").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.star) <= hover);
    });
  });

  document.getElementById("starInput")?.addEventListener("mouseleave", () => {
    const rating = State.get("currentRating");
    document.querySelectorAll(".star-btn").forEach(b => {
      b.classList.toggle("active", parseInt(b.dataset.star) <= rating);
    });
  });

  // Mood chips
  document.getElementById("moodGrid")?.addEventListener("click", e => {
    const chip = e.target.closest(".mood-chip");
    if (!chip) return;
    const mood = chip.dataset.mood;
    const current = State.get("currentMood");
    const newMood = current === mood ? "" : mood;
    State.set("currentMood", newMood);
    document.querySelectorAll(".mood-chip").forEach(c => {
      c.classList.toggle("selected", c.dataset.mood === newMood);
    });
  });

  // Tags input
  document.getElementById("tagInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = e.target.value.trim().toLowerCase().replace(/\s+/g, "-");
      if (!val) return;
      const tags = State.get("currentTags");
      if (!tags.includes(val)) {
        State.set("currentTags", [...tags, val]);
        renderTagsInForm();
      }
      e.target.value = "";
    }
  });

  // Flavor sliders
  document.querySelectorAll(".flavor-range").forEach(r => {
    r.addEventListener("input", () => {
      const valEl = r.nextElementSibling;
      if (valEl) valEl.textContent = r.value;
    });
  });

  // Photo upload
  document.getElementById("photoInput")?.addEventListener("change", e => {
    handlePhotoUpload(e.target.files);
  });

  // Form submit
  document.getElementById("entryForm")?.addEventListener("submit", handleFormSubmit);

  // Keyboard escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeNewEntryModal();
      closeDetailModal();
    }
  });
}
