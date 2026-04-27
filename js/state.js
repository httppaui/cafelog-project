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
    notepadItems:      [],
    entries:           [],
  };

  async function load() {
    const user = await getCurrentUser();
    if (!user) return;

    const { data: entries } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });

    const { data: wishlist } = await supabase
      .from('wishlist')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: notepadRows } = await supabase
      .from('notepad')
      .select('*')
      .order('created_at', { ascending: false });

    _state.entries       = entries       || [];
    _state.wishlistItems = wishlist      || [];
    _state.notepadItems  = notepadRows   || [];
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

  async function updateEntry(id, updates) {
    const { data, error } = await supabase
      .from('entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      _state.entries = _state.entries.map((e) => e.id === id ? data : e);
    }
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

  async function addNotepadItem(item) {
    const user = await getCurrentUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('notepad')
      .insert({
        user_id: user.id,
        title:   item.title   || 'Untitled Note',
        content: item.content || '',
      })
      .select()
      .single();
    if (!error && data) _state.notepadItems = [data, ..._state.notepadItems];
    return { data, error };
  }

  async function updateNotepadItem(id, updates) {
    const { data, error } = await supabase
      .from('notepad')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      _state.notepadItems = _state.notepadItems.map((n) =>
        n.id === id ? data : n
      );
    }
    return { data, error };
  }

  async function deleteNotepadItem(id) {
    const { error } = await supabase
      .from('notepad').delete().eq('id', id);
    if (!error)
      _state.notepadItems = _state.notepadItems.filter((n) => n.id !== id);
    return { error };
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
    addEntry, updateEntry, deleteEntry,
    addWishlistItem, toggleWishlistItem, deleteWishlistItem,
    addNotepadItem, updateNotepadItem, deleteNotepadItem,
    filteredEntries, stats, avgFlavors,
  };
})();