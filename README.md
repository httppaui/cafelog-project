# ☕ The Coffee Diary

A warm, cozy coffee journal app — log cafés, track your taste, discover your flavor story.

## ✨ Features

- **Journal Entries** — café name, drink, rating, notes, mood, tags, photos
- **Mood & Coffee** — pick your mood and get tailored coffee suggestions
- **AI Recommendations** — Claude AI analyzes your journal to suggest new drinks & cafés
- **Sensory Memory Map** — unique flavor fingerprint built from every entry
- **Calendar View** — see your visits across the month
- **Timeline** — your coffee story in chronological order
- **Café Wishlist** — your to-go café bucket list
- **Notepad** — personal space for brewing notes, quotes, ideas
- **Responsive Design** — works beautifully on mobile, tablet, and desktop
- **LocalStorage Persistence** — your data is saved in the browser

## 📁 Project Structure

```
coffee-diary/
├── index.html          # Main HTML shell
├── vercel.json         # Vercel deploy config
├── css/
│   ├── reset.css       # Normalize & base
│   ├── variables.css   # Design tokens / CSS vars
│   ├── layout.css      # Sidebar, topbar, main layout
│   ├── components.css  # Cards, modals, forms, tags
│   ├── pages.css       # Page-specific styles
│   ├── responsive.css  # Mobile-first responsive
│   └── animations.css  # Keyframes & transitions
└── js/
    ├── data.js         # Demo data, constants, mood-coffee map
    ├── state.js        # Centralized state + localStorage
    ├── utils.js        # Helper functions
    ├── render.js       # Component render functions
    ├── pages.js        # Page rendering logic
    ├── modal.js        # Modal open/close + form handling
    ├── ai.js           # Anthropic API call for AI picks
    └── app.js          # Main init, nav, search wiring
```

## 🚀 Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Go into the project folder
cd coffee-diary

# 3. Deploy (follow prompts)
vercel

# 4. For production deploy
vercel --prod
```

### Option B — Vercel Dashboard (drag & drop)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Choose **"Deploy from template"** → select **"Static"**
4. Drag and drop the entire `coffee-diary/` folder
5. Click **Deploy** — done! 🎉

### Option C — GitHub Integration

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
3. Import your GitHub repo
4. Framework Preset: **Other** (static)
5. Root Directory: `./` (or wherever index.html lives)
6. Click **Deploy**

## 🤖 AI Recommendations

The AI Picks page calls the Anthropic API directly from the browser.  
To use it in production, consider proxying through a serverless function to protect your API key.

For a quick demo, the app gracefully falls back to curated recommendations if the API call fails.

## 💻 Local Development

No build step needed — just open `index.html` in a browser or use a local server:

```bash
# Using Python
python3 -m http.server 3000

# Using Node.js npx
npx serve .

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

## 🎨 Design

- **Fonts**: Playfair Display (headings) + Lora (notes/body) + DM Sans (UI)
- **Palette**: Warm espresso, cream, caramel, foam tones
- **Vibe**: Personal leather diary meets specialty café menu
