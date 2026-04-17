// data.js — demo data, constants, mood-coffee mappings

const DRINK_EMOJIS = {
  "Latte":        "☕",
  "Espresso":     "⚫",
  "Cappuccino":   "🫧",
  "Pour Over":    "🫗",
  "Cold Brew":    "🧊",
  "Flat White":   "🥛",
  "Cortado":      "🌰",
  "Americano":    "💧",
  "Mocha":        "🍫",
  "Matcha Latte": "🍵",
  "Iced Latte":   "🧋",
  "default":      "☕",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MOOD_CONFIG = {
  cozy:       { emoji: "🧸", label: "Cozy",       bg: "#FCE7F3", text: "#9D174D" },
  energized:  { emoji: "⚡", label: "Energized",  bg: "#D1FAE5", text: "#065F46" },
  reflective: { emoji: "🌙", label: "Reflective", bg: "#EDE9FE", text: "#4C1D95" },
  social:     { emoji: "💬", label: "Social",     bg: "#FEE2E2", text: "#991B1B" },
  peaceful:   { emoji: "🌿", label: "Peaceful",   bg: "#E0F2FE", text: "#075985" },
  curious:    { emoji: "✨", label: "Curious",    bg: "#FEF3C7", text: "#92400E" },
};

const MOOD_COFFEE_MAP = {
  cozy: {
    title: "Warm & Comforting Picks",
    subtitle: "For your cozy mood — drinks that feel like a hug in a mug 🧸",
    suggestions: [
      { emoji: "☕", name: "Oat Milk Latte", reason: "Creamy, gentle, and soul-warming. The oat milk adds a natural sweetness that feels like home.", bg: "#FDF2F8", accent: "#BE185D" },
      { emoji: "🍫", name: "Café Mocha",     reason: "Chocolate + espresso = the ultimate comfort combo. Best enjoyed with a good book and a blanket.", bg: "#FEF3C7", accent: "#92400E" },
      { emoji: "🍵", name: "Dirty Chai Latte", reason: "Warm spices, a shot of espresso, steamed milk — cozy in every single sip.", bg: "#FCE7F3", accent: "#9D174D" },
      { emoji: "🧁", name: "Vanilla Flat White", reason: "Silky espresso with a hint of vanilla — understated, familiar, perfect.", bg: "#FDF6EC", accent: "#D4955A" },
    ]
  },
  energized: {
    title: "Power-Up Picks",
    subtitle: "For your energized mood — drinks that match your vibe ⚡",
    suggestions: [
      { emoji: "⚫", name: "Double Espresso",   reason: "No-nonsense, straight-up caffeine. The classic rocket fuel for a productive day.", bg: "#D1FAE5", accent: "#065F46" },
      { emoji: "🧊", name: "Iced Americano",    reason: "Bold espresso over ice — refreshing and energizing without being heavy.", bg: "#E0F2FE", accent: "#075985" },
      { emoji: "🌿", name: "Matcha Espresso",   reason: "Dual caffeine sources, stunning green — sustained energy with no jitters.", bg: "#D1FAE5", accent: "#065F46" },
      { emoji: "🍋", name: "Espresso Tonic",    reason: "Fizzy, citrusy, caffeinated — surprising and invigorating.", bg: "#FEF3C7", accent: "#92400E" },
    ]
  },
  reflective: {
    title: "Contemplative Cups",
    subtitle: "For your reflective mood — slow brews for slow thoughts 🌙",
    suggestions: [
      { emoji: "🫗", name: "Single-Origin Pour Over", reason: "Each cup is a meditation. Slow brewing, complex flavors, something to ponder.", bg: "#EDE9FE", accent: "#4C1D95" },
      { emoji: "🫖", name: "Cold Brew Concentrate",   reason: "Smooth and rich — perfect for long, quiet afternoons lost in thought.", bg: "#F5F3FF", accent: "#5B21B6" },
      { emoji: "🍵", name: "Hojicha Latte",           reason: "Roasted green tea — earthy, calming, and surprisingly grounding.", bg: "#FEF3C7", accent: "#92400E" },
      { emoji: "☕", name: "Lungo",                   reason: "Extended espresso pull — more nuanced flavors emerge when you slow down.", bg: "#EDE9FE", accent: "#4C1D95" },
    ]
  },
  social: {
    title: "Social Sips",
    subtitle: "For your social mood — drinks made for sharing 💬",
    suggestions: [
      { emoji: "🥛", name: "Café con Leche",    reason: "The drink of conversation. Bold coffee, warm milk — made for slow mornings with friends.", bg: "#FEE2E2", accent: "#991B1B" },
      { emoji: "🧋", name: "Iced Oat Latte",    reason: "Instagrammable, crowd-pleasing, and endlessly customizable — great for café meetups.", bg: "#FCE7F3", accent: "#9D174D" },
      { emoji: "🍫", name: "Mocha Frappuccino", reason: "Dessert in a cup — a crowd-pleaser everyone around the table will want to try.", bg: "#FEE2E2", accent: "#991B1B" },
      { emoji: "☕", name: "Cortado Round",     reason: "Order a round of cortados — equal parts espresso and milk, perfectly balanced.", bg: "#FFF7ED", accent: "#C2410C" },
    ]
  },
  peaceful: {
    title: "Calm & Serene Brews",
    subtitle: "For your peaceful mood — gentle flavors for a gentle mind 🌿",
    suggestions: [
      { emoji: "🍵", name: "Matcha Latte",     reason: "L-theanine in matcha promotes calm focus — alert but peaceful, present and serene.", bg: "#E0F2FE", accent: "#075985" },
      { emoji: "🌸", name: "Lavender Latte",   reason: "Floral, subtly sweet — a cup that feels like a deep breath on a spring morning.", bg: "#F0FDF4", accent: "#166534" },
      { emoji: "🫗", name: "Light Roast Pour Over", reason: "Delicate, nuanced, unhurried — pour over at its most peaceful.", bg: "#E0F2FE", accent: "#075985" },
      { emoji: "🌿", name: "Chamomile Flat White", reason: "Chamomile-infused milk with espresso — unexpectedly calming and beautifully fragrant.", bg: "#F0FDF4", accent: "#166534" },
    ]
  },
  curious: {
    title: "Explorer's Picks",
    subtitle: "For your curious mood — adventurous flavors waiting to be discovered ✨",
    suggestions: [
      { emoji: "🍋", name: "Espresso Tonic",        reason: "Coffee meets sparkling water and citrus — an unexpected, effervescent adventure.", bg: "#FEF3C7", accent: "#92400E" },
      { emoji: "🌺", name: "Ethiopian Natural Pour Over", reason: "Berry, blueberry, wine-like complexity — a flavor journey in a single cup.", bg: "#FEF9C3", accent: "#713F12" },
      { emoji: "🥥", name: "Coconut Cold Brew",     reason: "Tropical meets roasted — refreshing, unexpected, and deeply interesting.", bg: "#ECFDF5", accent: "#065F46" },
      { emoji: "🫚", name: "Butter Coffee",         reason: "Keto-style, velvety smooth — a completely different coffee experience worth trying.", bg: "#FEF3C7", accent: "#92400E" },
    ]
  }
};

const FLAVOR_COLORS = [
  "#D4955A", "#8A9A7B", "#C8A882", "#6B3A2A", "#E8C4B0", "#C9935A"
];

const DEMO_ENTRIES = [
  {
    id: 1,
    cafe: "Ritual Coffee Roasters",
    drink: "Pour Over",
    rating: 5,
    note: "The single-origin Ethiopian was absolutely divine. Notes of jasmine and blueberry. The barista walked me through the entire process with such passion.",
    date: "2025-04-10",
    tags: ["specialty", "single-origin", "floral"],
    mood: "reflective",
    photos: [],
    flavors: { Nutty: 20, Fruity: 80, Floral: 90, Chocolaty: 15, Sweet: 60, Bitter: 25 }
  },
  {
    id: 2,
    cafe: "Blue Bottle Coffee",
    drink: "Latte",
    rating: 4,
    note: "Perfect milk texture. The oat milk pairing was surprisingly rich and creamy. Great spot for a productive work session.",
    date: "2025-04-07",
    tags: ["work-spot", "oat-milk", "creamy"],
    mood: "energized",
    photos: [],
    flavors: { Nutty: 50, Fruity: 20, Floral: 30, Chocolaty: 40, Sweet: 70, Bitter: 20 }
  },
  {
    id: 3,
    cafe: "Intelligentsia",
    drink: "Cappuccino",
    rating: 5,
    note: "They perfectly nailed the ratio here. The roast had deep caramel undertones. Third time visiting and still completely blown away.",
    date: "2025-04-03",
    tags: ["classic", "must-revisit", "perfect-ratio"],
    mood: "cozy",
    photos: [],
    flavors: { Nutty: 60, Fruity: 10, Floral: 20, Chocolaty: 80, Sweet: 65, Bitter: 35 }
  },
  {
    id: 4,
    cafe: "Stumptown Coffee",
    drink: "Cold Brew",
    rating: 4,
    note: "Smooth and bold — exactly what I needed on a warm afternoon. The chocolate finish lingered pleasantly for minutes.",
    date: "2025-03-29",
    tags: ["cold-brew", "afternoon", "bold"],
    mood: "peaceful",
    photos: [],
    flavors: { Nutty: 40, Fruity: 15, Floral: 10, Chocolaty: 75, Sweet: 45, Bitter: 50 }
  },
];

const DEMO_WISHLIST = [
  { id: 1, name: "Onyx Coffee Lab",     location: "Bentonville, AR", visited: false },
  { id: 2, name: "George Howell Coffee", location: "Boston, MA",    visited: false },
  { id: 3, name: "Sightglass Coffee",   location: "San Francisco",  visited: true  },
];
