import { useState } from 'react';
import { CATEGORIES, OPTIONS } from './catalog.js';
import './index.css';

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const [locked, setLocked] = useState({ hat: false, top: false, bottom: false, shoes: false });
  const [current, setCurrent] = useState({
    hat: { index: 0 },
    top: { index: 0 },
    bottom: { index: 0 },
    shoes: { index: 0 }
  });

  const toggleLock = (cat) => {
    setLocked(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, pools: OPTIONS })
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || "Something went wrong.");

      setCurrent(prev => {
        const nextState = { ...prev };
        CATEGORIES.forEach(c => {
          if (!locked[c.key] && result.picks[c.key] !== undefined) {
            nextState[c.key] = { index: result.picks[c.key] };
          }
        });
        return nextState;
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="header-row">
        <div>
          <h1 className="title">OUTFIT ROULETTE</h1>
          <p className="subtitle">Lock what you love. Reroll the rest.</p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="ai-form">
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a look... e.g. 'rainy day errands'" 
        />
        <button type="submit" className="dark-btn" disabled={isGenerating}>
          {isGenerating ? "Styling..." : "Generate"}
        </button>
      </form>
      {error && <p className="ai-error">{error}</p>}

      <div className="content">
        <div className="left-col" id="slots">
          {CATEGORIES.map(c => {
            const item = OPTIONS[c.key][current[c.key].index];
            const isLocked = locked[c.key];

            return (
              <div key={c.key} className="slot-card">
                <div className="slot-info">
                  <div className="slot-label">{c.label}</div>
                  <div className="slot-name">{item.name}</div>
                  <div className="slot-price">${item.price}</div>
                </div>
                <div className="slot-actions">
                  <button 
                    onClick={() => toggleLock(c.key)}
                    className={`icon-btn ${isLocked ? 'locked' : ''}`}
                  >
                    {isLocked ? "🔒" : "🔓"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}