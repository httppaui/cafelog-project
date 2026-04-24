// modal.js — modal open/close and form handling

function openDetailModal(entry) {
  const modal   = document.getElementById('detailModal');
  const content = document.getElementById('detailModalContent');
  content.innerHTML = `
    <button class="modal-close" id="closeDetailModal">✕</button>
    ${renderDetailModal(entry)}`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('closeDetailModal')
    ?.addEventListener('click', closeDetailModal);
  modal.addEventListener('click',
    (e) => e.target === modal && closeDetailModal());
}

function closeDetailModal() {
  document.getElementById('detailModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function openNewEntryModal() {
  const modal = document.getElementById('newEntryModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  State.set('currentRating', 0);
  State.set('currentMood', '');
  State.set('currentTags', []);
  State.set('currentFlavors', {});
  State.set('currentPhotos', []);
  const dateInput = document.getElementById('entryDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.star-btn')
    .forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.mood-chip')
    .forEach((c) => c.classList.remove('selected'));
  renderTagsInForm();
  document.querySelectorAll('.flavor-range').forEach((r) => {
    r.value = 30;
    if (r.nextElementSibling) r.nextElementSibling.textContent = 30;
  });
  document.getElementById('photoPreviewGrid').innerHTML = '';
  setTimeout(() => document.getElementById('cafeName')?.focus(), 100);
}

function closeNewEntryModal() {
  document.getElementById('newEntryModal')?.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('entryForm')?.reset();
}

function renderTagsInForm() {
  const container = document.getElementById('tagsContainer');
  const input     = document.getElementById('tagInput');
  if (!container || !input) return;
  container.querySelectorAll('.tag-pill').forEach((el) => el.remove());
  const tags = State.get('currentTags');
  tags.forEach((tag) => {
    const pill       = document.createElement('span');
    pill.className   = 'tag-pill';
    pill.innerHTML   = `${escapeHtml(tag)}
      <span class="tag-remove" data-tag="${escapeHtml(tag)}">×</span>`;
    container.insertBefore(pill, input);
  });
  container.querySelectorAll('.tag-remove').forEach((el) => {
    el.addEventListener('click', () => {
      State.set('currentTags',
        State.get('currentTags').filter((t) => t !== el.dataset.tag));
      renderTagsInForm();
    });
  });
}

function handlePhotoUpload(files) {
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Only image files are allowed.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB.'); return;
    }
    const reader   = new FileReader();
    reader.onload  = (e) => {
      const photos = State.get('currentPhotos');
      photos.push(e.target.result);
      State.set('currentPhotos', photos);
      const grid = document.getElementById('photoPreviewGrid');
      if (grid) {
        const img     = document.createElement('img');
        img.src       = e.target.result;
        img.className = 'photo-preview';
        img.alt       = 'Preview';
        grid.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const cafe  = document.getElementById('cafeName')?.value.trim();
  const drink = document.getElementById('drinkName')?.value.trim();
  if (!cafe || !drink) {
    showToast('Please fill in café name and drink ☕'); return;
  }
  const flavors = {};
  document.querySelectorAll('.flavor-range').forEach((r) => {
    flavors[r.dataset.flavor] = parseInt(r.value);
  });
  const entry = {
    cafe, drink,
    rating:  State.get('currentRating'),
    note:    document.getElementById('entryNote')?.value.trim() || '',
    date:    document.getElementById('entryDate')?.value
               || new Date().toISOString().split('T')[0],
    tags:    State.get('currentTags'),
    mood:    State.get('currentMood'),
    flavors,
    photos:  State.get('currentPhotos'),
  };
  const btn = document.querySelector('#entryForm .submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  const { error } = await State.addEntry(entry);
  if (error) {
    showToast('Error saving entry. Please try again.');
    console.error(error);
    if (btn) { btn.disabled = false; btn.textContent = 'Save to Diary ☕'; }
  } else {
    closeNewEntryModal();
    renderPage(State.get('currentPage'));
    updateStreakBadge();
    showToast('☕ Entry saved to your diary!');
  }
}

function initModalListeners() {
  document.getElementById('newEntryBtn')
    ?.addEventListener('click', openNewEntryModal);
  document.getElementById('closeModal')
    ?.addEventListener('click', closeNewEntryModal);
  document.getElementById('newEntryModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('newEntryModal'))
      closeNewEntryModal();
  });
  document.getElementById('starInput')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    const rating = parseInt(btn.dataset.star);
    State.set('currentRating', rating);
    document.querySelectorAll('.star-btn').forEach((b) =>
      b.classList.toggle('active', parseInt(b.dataset.star) <= rating));
  });
  document.getElementById('starInput')?.addEventListener('mouseover', (e) => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;
    const hover = parseInt(btn.dataset.star);
    document.querySelectorAll('.star-btn').forEach((b) =>
      b.classList.toggle('active', parseInt(b.dataset.star) <= hover));
  });
  document.getElementById('starInput')?.addEventListener('mouseleave', () => {
    const rating = State.get('currentRating');
    document.querySelectorAll('.star-btn').forEach((b) =>
      b.classList.toggle('active', parseInt(b.dataset.star) <= rating));
  });
  document.getElementById('moodGrid')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.mood-chip');
    if (!chip) return;
    const newMood = State.get('currentMood') === chip.dataset.mood
      ? '' : chip.dataset.mood;
    State.set('currentMood', newMood);
    document.querySelectorAll('.mood-chip').forEach((c) =>
      c.classList.toggle('selected', c.dataset.mood === newMood));
  });
  document.getElementById('tagInput')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!val) return;
    const tags = State.get('currentTags');
    if (!tags.includes(val)) State.set('currentTags', [...tags, val]);
    renderTagsInForm();
    e.target.value = '';
  });
  document.querySelectorAll('.flavor-range').forEach((r) => {
    r.addEventListener('input', () => {
      if (r.nextElementSibling) r.nextElementSibling.textContent = r.value;
    });
  });
  document.getElementById('photoInput')?.addEventListener('change', (e) => {
    handlePhotoUpload(e.target.files);
  });
  document.getElementById('entryForm')
    ?.addEventListener('submit', handleFormSubmit);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeNewEntryModal(); closeDetailModal(); }
  });
}