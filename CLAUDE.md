# outfit-ai-chooser

Hackathon project. **Due August 25, 2026.** Ship over polish.

AI stylist: user describes a vibe ("rainy day errands"), an LLM picks one item
per category (hat/top/bottom/shoes). Locked slots are kept, unlocked ones reroll.

## Run it

```
pip install -r requirements.txt && pip install google-genai   # see gotcha below
set GEMINI_API_KEY=...                                        # PowerShell: $env:GEMINI_API_KEY="..."
python app.py                                                 # :5000

cd frontend && npm install && npm run dev                     # :5173, proxies /api -> :5000
```

Use the Vite dev server, not `localhost:5000`. Flask's `/` renders the legacy
`templates/index.html` + `static/`, which predate the React rewrite.

## Layout

- `app.py` — Flask. One real endpoint: `POST /api/generate-outfit`.
- `frontend/` — React + Vite. The actual UI.
- `templates/`, `static/` — legacy pre-React version. Dead except `/`. Delete when nothing needs it.

## Things that will bite you

**Two catalogs.** `app.py:OPTIONS` and `frontend/src/catalog.js:OPTIONS` are
different item lists. This is currently harmless: the frontend POSTs its own
`pools`, the backend answers with *indices only*, so `catalog.js` is the source
of truth for anything displayed. `app.py:OPTIONS` is unused dead data. Don't
"fix" this by making the backend return item objects without picking one owner
for the catalog first.

**The LLM SDK isn't in requirements.txt.** `app.py` imports `google.genai`, but
`requirements.txt` deliberately leaves the SDK out — provider (Gemini vs Claude)
was never settled. Either add the dep or swap the provider; don't leave it split.

**`frontend/src/style.css`** is the migrated legacy stylesheet, imported by
`main.jsx` alongside `index.css`. It carries the `.slot-card` rules `App.jsx`
depends on. Untracked so far — commit it.

## Conventions

- Backend validates indices against the pool it was sent; keep that guard when
  changing the endpoint — the model returns whatever it wants.
- No test framework here. If logic gets non-trivial, one `test_*.py` with plain
  asserts, nothing more.
- Deadline is close. Prefer the smallest change that works; skip abstractions
  until a second caller exists.
