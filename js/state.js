// state.js — centralized app state with localStorage persistence

const State = (() => {
  let _state = {
    currentPage: "journal",
    viewMode: "grid",
    searchQuery: "",
    currentRating: 0,
    currentMood: "",
    currentTags: [],
    currentFlavors: {},
    currentPhotos: [],
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    selectedMoodPage: null,
    aiRecommendations: null,
    aiLoading: false,
    notepadItems: [],
    wishlistItems: [],
    entries: [],
    editingEntryId: null,
  };

  function load() {
    try {
      const saved = localStorage.getItem("coffeeDiary_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        _state.entries           = parsed.entries           || DEMO_ENTRIES;
        _state.wishlistItems     = parsed.wishlistItems     || DEMO_WISHLIST;
        _state.notepadItems      = parsed.notepadItems      || [];
        _state.aiRecommendations = parsed.aiRecommendations || null;
      } else {
        _state.entries       = [...DEMO_ENTRIES];
        _state.wishlistItems = [...DEMO_WISHLIST];
      }
    } catch (e) {
      _state.entries       = [...DEMO_ENTRIES];
      _state.wishlistItems = [...DEMO_WISHLIST];
    }
  }

  function save() {
    try {
      localStorage.setItem("coffeeDiary_v1", JSON.stringify({
        entries:           _state.entries,
        wishlistItems:     _state.wishlistItems,
        notepadItems:      _state.notepadItems,
        aiRecommendations: _state.aiRecommendations,
      }));
    } catch (e) { console.warn("Could not save to localStorage:", e); }
  }

  function get(key) { return _state[key]; }
  function getAll() { return { ..._state }; }

  function set(key, value) {
    _state[key] = value;
    if (["entries","wishlistItems","notepadItems","aiRecommendations"].includes(key)) save();
  }

  // Entry helpers
  function addEntry(entry) {
    _state.entries = [entry, ..._state.entries];
    save();
  }

  function updateEntry(id, updated) {
    _state.entries = _state.entries.map(e => e.id === id ? { ...e, ...updated } : e);
    save();
  }

  function deleteEntry(id) {
    _state.entries = _state.entries.filter(e => e.id !== id);
    save();
  }

  // Wishlist helpers
  function addWishlistItem(item) {
    _state.wishlistItems = [item, ..._state.wishlistItems];
    save();
  }

  function toggleWishlistItem(id) {
    _state.wishlistItems = _state.wishlistItems.map(w =>
      w.id === id ? { ...w, visited: !w.visited } : w
    );
    save();
  }

  function deleteWishlistItem(id) {
    _state.wishlistItems = _state.wishlistItems.filter(w => w.id !== id);
    save();
  }

  // Notepad helpers
  function addNotepadItem(item) {
    _state.notepadItems = [item, ..._state.notepadItems];
    save();
  }

  function updateNotepadItem(id, updated) {
    _state.notepadItems = _state.notepadItems.map(n => n.id === id ? { ...n, ...updated } : n);
    save();
  }

  function deleteNotepadItem(id) {
    _state.notepadItems = _state.notepadItems.filter(n => n.id !== id);
    save();
  }

  // Filtered entries
  function filteredEntries() {
    const q = _state.searchQuery.toLowerCase().trim();
    if (!q) return _state.entries;
    return _state.entries.filter(e =>
      e.cafe.toLowerCase().includes(q) ||
      e.drink.toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (e.note || "").toLowerCase().includes(q)
    );
  }

  // Stats
  function stats() {
    const entries = _state.entries;
    const cafes   = [...new Set(entries.map(e => e.cafe))];
    const drinks  = [...new Set(entries.map(e => e.drink))];
    const avgRating = entries.length
      ? (entries.reduce((a, e) => a + (e.rating || 0), 0) / entries.length).toFixed(1)
      : "—";
    return { count: entries.length, cafes: cafes.length, drinks: drinks.length, avgRating };
  }

  // Average flavors
  function avgFlavors() {
    const withFlavors = _state.entries.filter(e => e.flavors && Object.keys(e.flavors).length > 0);
    if (!withFlavors.length) return {};
    const totals = {};
    withFlavors.forEach(e => {
      Object.entries(e.flavors).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return Object.fromEntries(
      Object.entries(totals).map(([k, v]) => [k, Math.round(v / withFlavors.length)])
    );
  }

  return {
    load, save, get, getAll, set,
    addEntry, updateEntry, deleteEntry,
    addWishlistItem, toggleWishlistItem, deleteWishlistItem,
    addNotepadItem, updateNotepadItem, deleteNotepadItem,
    filteredEntries, stats, avgFlavors,
  };
})();