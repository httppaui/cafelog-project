// modal.js — modal open/close and form handling

/* ── Detail Modal ── */
function openDetailModal(entry) {
  const modal   = document.getElementById("detailModal");
  const content = document.getElementById("detailModalContent");
  content.innerHTML = `
    <button class="modal-close" id="closeDetailModal">✕</button>
    ${renderDetailModal(entry)}`;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  document.getElementById("closeDetailModal")?.addEventListener("click", closeDetailModal);
  modal.addEventListener("click", e => e.target === modal && closeDetailModal());

  // Edit button
  document.getElementById("editEntryBtn")?.addEventListener("click", () => {
    closeDetailModal();
    openNewEntryModal(entry);
  });
}

function closeDetailModal() {
  document.getElementById("detailModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ── New / Edit Entry Modal ── */
function openNewEntryModal(existingEntry = null) {
  const modal = document.getElementById("newEntryModal");
  const isEdit = !!existingEntry;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Store editing id
  State.set("editingEntryId", isEdit ? existingEntry.id : null);

  // Reset or populate state
  State.set("currentRating",  isEdit ? existingEntry.rating  : 0);
  State.set("currentMood",    isEdit ? existingEntry.mood    : "");
  State.set("currentTags",    isEdit ? [...(existingEntry.tags || [])] : []);
  State.set("currentFlavors", isEdit ? { ...(existingEntry.flavors || {}) } : {});
  State.set("currentPhotos",  isEdit ? [...(existingEntry.photos || [])] : []);

  // Update modal title
  document.getElementById("modalTitle").textContent = isEdit ? "Edit Entry ✏️" : "New Entry ☕";
  document.querySelector(".submit-btn").textContent  = isEdit ? "Save Changes ☕" : "Save to Diary ☕";

  // Set date
  const dateInput = document.getElementById("entryDate");
  if (dateInput) dateInput.value = isEdit
    ? existingEntry.date
    : new Date().toISOString().split("T")[0];

  // Populate fields if editing
  const cafeInput  = document.getElementById("cafeName");
  const drinkInput = document.getElementById("drinkName");
  const noteInput  = document.getElementById("entryNote");
  if (cafeInput)  cafeInput.value  = isEdit ? existingEntry.cafe  : "";
  if (drinkInput) drinkInput.value = isEdit ? existingEntry.drink : "";
  if (noteInput)  noteInput.value  = isEdit ? existingEntry.note  : "";

  // Reset star buttons
  document.querySelectorAll(".star-btn").forEach(b => {
    b.classList.toggle("active", isEdit && parseInt(b.dataset.star) <= existingEntry.rating);
  });

  // Reset mood chips
  document.querySelectorAll(".mood-chip").forEach(c => {
    c.classList.toggle("selected", isEdit && c.dataset.mood === existingEntry.mood);
  });

  // Tags
  renderTagsInForm();

  // Flavor sliders
  document.querySelectorAll(".flavor-range").forEach(r => {
    const val = isEdit && existingEntry.flavors ? (existingEntry.flavors[r.dataset.flavor] || 30) : 30;
    r.value = val;
    r.nextElementSibling.textContent = val;
  });

  // Photos
  const grid = document.getElementById("photoPreviewGrid");
  if (grid) {
    grid.innerHTML = "";
    if (isEdit && existingEntry.photos) {
      existingEntry.photos.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "photo-preview";
        grid.appendChild(img);
      });
    }
  }

  // Step UI — show step 1
  showFormStep(1);

  if (!isEdit) setTimeout(() => document.getElementById("cafeName")?.focus(), 100);
}

function closeNewEntryModal() {
  document.getElementById("newEntryModal")?.classList.remove("open");
  document.body.style.overflow = "";
  document.getElementById("entryForm")?.reset();
  State.set("editingEntryId", null);
}

/* ── Stepped Form ── */
function showFormStep(step) {
  document.querySelectorAll(".form-step").forEach(s => {
    s.style.display = s.dataset.step == step ? "" : "none";
  });
  document.getElementById("stepBack").style.display  = step === 1 ? "none" : "";
  document.getElementById("stepNext").style.display  = step === 1 ? "" : "none";
  document.querySelector(".submit-btn").style.display = step === 2 ? "" : "none";

  // Update step indicator
  document.querySelectorAll(".step-dot").forEach(d => {
    d.classList.toggle("active", parseInt(d.dataset.step) === step);
  });
}

/* ── Form: Tags ── */
function renderTagsInForm() {
  const container = document.getElementById("tagsContainer");
  const input     = document.getElementById("tagInput");
  if (!container || !input) return;

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
      State.set("currentTags", State.get("currentTags").filter(t => t !== el.dataset.tag));
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

      // Live flavor preview update
      updateFlavorPreview();
    };
    reader.readAsDataURL(file);
  });
}

/* ── Live Flavor Preview ── */
function updateFlavorPreview() {
  const preview = document.getElementById("flavorPreview");
  if (!preview) return;
  const flavors = {};
  document.querySelectorAll(".flavor-range").forEach(r => {
    flavors[r.dataset.flavor] = parseInt(r.value);
  });
  preview.innerHTML = renderFlavorBars(flavors);
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

  const flavors = {};
  document.querySelectorAll(".flavor-range").forEach(r => {
    flavors[r.dataset.flavor] = parseInt(r.value);
  });

  const editingId = State.get("editingEntryId");

  const entryData = {
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

  if (editingId) {
    State.updateEntry(editingId, entryData);
    showToast("✏️ Entry updated!");
  } else {
    State.addEntry({ id: generateId(), ...entryData });
    showToast("☕ Entry saved to your diary!");
  }

  closeNewEntryModal();
  renderPage(State.get("currentPage"));
}

/* ── Init Modal Event Listeners ── */
function initModalListeners() {
  document.getElementById("newEntryBtn")?.addEventListener("click", () => openNewEntryModal());

  document.getElementById("closeModal")?.addEventListener("click", closeNewEntryModal);
  document.getElementById("newEntryModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("newEntryModal")) closeNewEntryModal();
  });

  // Step navigation
  document.getElementById("stepNext")?.addEventListener("click", () => showFormStep(2));
  document.getElementById("stepBack")?.addEventListener("click", () => showFormStep(1));

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
    const mood    = chip.dataset.mood;
    const current = State.get("currentMood");
    const newMood = current === mood ? "" : mood;
    State.set("currentMood", newMood);
    document.querySelectorAll(".mood-chip").forEach(c => {
      c.classList.toggle("selected", c.dataset.mood === newMood);
    });
  });

  // Tags
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

  // Flavor sliders — live preview
  document.querySelectorAll(".flavor-range").forEach(r => {
    r.addEventListener("input", () => {
      r.nextElementSibling.textContent = r.value;
      updateFlavorPreview();
    });
  });

  // Photo upload
  document.getElementById("photoInput")?.addEventListener("change", e => {
    handlePhotoUpload(e.target.files);
  });

  // Form submit
  document.getElementById("entryForm")?.addEventListener("submit", handleFormSubmit);

  // Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeNewEntryModal();
      closeDetailModal();
    }
  });
}