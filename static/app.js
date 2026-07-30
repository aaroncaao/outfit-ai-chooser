(function () {
  "use strict";

  var CATEGORIES = [
    { key: "hat", label: "Hat" },
    { key: "top", label: "Top" },
    { key: "bottom", label: "Bottom" },
    { key: "shoes", label: "Shoes" },
  ];

  var OPTIONS = JSON.parse(document.getElementById("options-data").textContent);
  var STORAGE_KEY = "outfit-roulette-state-v1";

  /* ---------------- icons ---------------- */

  var ICONS = {
    lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h4l7 12h5"/><path d="M14 6h5v5"/><path d="M3 18h4l3-5"/><path d="M17 15l3 3-3 3"/><path d="M17 3l3 3-3 3"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>',
    hanger: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a1.7 1.7 0 1 1 1.8 1.7c-.5.05-.8.4-.8.9V7"/><path d="M12 7c-3.2 0-9.5 2.1-9.5 6.1a1 1 0 0 0 1.45.9L12 10.3l8.05 3.7a1 1 0 0 0 1.45-.9c0-4-6.3-6.1-9.5-6.1Z"/><path d="M5 17.5h14"/></svg>',
  };

  function garmentSvg(cat, color) {
    var shapes = {
      hat:
        '<path d="M18,62 Q50,18 82,62 L86,68 Q50,84 14,68 Z" fill="' + color + '"/>' +
        '<rect x="14" y="60" width="72" height="9" rx="4.5" fill="' + color + '" opacity="0.65"/>',
      top:
        '<path d="M32,14 L46,9 L50,17 L54,9 L68,14 L86,30 L73,44 L65,36 L65,91 L35,91 L35,36 L27,44 L14,30 Z" fill="' + color + '"/>',
      bottom:
        '<path d="M24,9 L76,9 L79,91 L58,91 L52,44 L48,44 L42,91 L21,91 Z" fill="' + color + '"/>',
      shoes:
        '<path d="M8,72 Q8,56 24,56 L44,56 L44,39 L60,39 L76,55 L91,58 Q97,60 97,69 L97,76 L8,76 Z" fill="' + color + '"/>',
    };
    return '<svg viewBox="0 0 100 100" width="100%" height="100%">' + shapes[cat] + "</svg>";
  }

  /* ---------------- state ---------------- */

  function randInt(n) { return Math.floor(Math.random() * n); }

  function defaultState() {
    var current = {};
    CATEGORIES.forEach(function (c) {
      current[c.key] = { source: "base", index: randInt(OPTIONS[c.key].length) };
    });
    return {
      current: current,
      locked: { hat: false, top: false, bottom: false, shoes: false },
      customItems: { hat: [], top: [], bottom: [], shoes: [] },
      savedOutfits: [],
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      var base = defaultState();
      return Object.assign(base, parsed);
    } catch (e) {
      return defaultState();
    }
  }

  var state = loadState();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable, ignore */ }
  }

  function getItem(cat, ref) {
    if (ref.source === "custom") return state.customItems[cat][ref.index];
    return OPTIONS[cat][ref.index];
  }

  function combinedPool(cat) {
    return OPTIONS[cat].concat(state.customItems[cat]);
  }

  function refFromCombinedIndex(cat, idx) {
    var baseLen = OPTIONS[cat].length;
    if (idx < baseLen) return { source: "base", index: idx };
    return { source: "custom", index: idx - baseLen };
  }

  /* ---------------- DOM refs ---------------- */

  var slotsEl = document.getElementById("slots");
  var receiptItemsEl = document.getElementById("receipt-items");
  var totalAmountEl = document.getElementById("total-amount");

  /* ---------------- rendering ---------------- */

  function render() {
    renderSlots();
    renderReceipt();
  }

  function renderSlots() {
    slotsEl.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var ref = state.current[c.key];
      var item = getItem(c.key, ref);
      var isLocked = state.locked[c.key];

      var card = document.createElement("div");
      card.className = "slot-card";
      card.innerHTML =
        '<div class="slot-icon-wrap" data-cat="' + c.key + '">' + garmentSvg(c.key, item.color) + "</div>" +
        '<div class="slot-info">' +
        '<div class="slot-label">' + c.label + (item.isCustom ? ' <span class="custom-tag">&middot; yours</span>' : "") + "</div>" +
        '<div class="slot-name">' + escapeHtml(item.name) + "</div>" +
        '<div class="slot-price">$' + item.price + "</div>" +
        "</div>" +
        '<div class="slot-actions">' +
        '<button class="icon-btn lock-btn' + (isLocked ? " locked" : "") + '" data-cat="' + c.key + '" aria-label="Lock ' + c.label + '">' + (isLocked ? ICONS.lock : ICONS.unlock) + "</button>" +
        '<button class="icon-btn reroll-btn" data-cat="' + c.key + '" aria-label="Reroll ' + c.label + '"' + (isLocked ? " disabled" : "") + '><span class="reroll-icon">' + ICONS.refresh + "</span></button>" +
        "</div>";
      slotsEl.appendChild(card);
    });

    slotsEl.querySelectorAll(".lock-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { toggleLock(btn.getAttribute("data-cat")); });
    });
    slotsEl.querySelectorAll(".reroll-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { reroll(btn.getAttribute("data-cat")); });
    });
  }

  function renderReceipt() {
    receiptItemsEl.innerHTML = "";
    var total = 0;
    CATEGORIES.forEach(function (c) {
      var item = getItem(c.key, state.current[c.key]);
      total += item.price;
      var row = document.createElement("div");
      row.className = "receipt-item";
      row.innerHTML =
        '<div class="receipt-item-top">' +
        '<span class="receipt-item-label">' + c.label + "</span>" +
        '<span class="receipt-item-price">$' + item.price.toFixed(2) + "</span>" +
        "</div>" +
        '<div class="receipt-item-name">' + escapeHtml(item.name) + "</div>" +
        '<p class="receipt-item-desc">' + escapeHtml(item.description) + "</p>" +
        '<div class="receipt-item-store">Buy at ' + escapeHtml(item.store) + "</div>";
      receiptItemsEl.appendChild(row);
    });
    totalAmountEl.textContent = "$" + total.toFixed(2);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------- actions ---------------- */

  function toggleLock(cat) {
    state.locked[cat] = !state.locked[cat];
    persist();
    renderSlots();
  }

  function reroll(cat, delay) {
    if (state.locked[cat]) return;
    setTimeout(function () {
      var wrap = slotsEl.querySelector('.slot-icon-wrap[data-cat="' + cat + '"]');
      if (wrap) wrap.classList.add("tumbling");
      setTimeout(function () {
        var pool = combinedPool(cat);
        if (pool.length > 1) {
          var currentItem = getItem(cat, state.current[cat]);
          var idx;
          do { idx = randInt(pool.length); } while (pool[idx] === currentItem);
          state.current[cat] = refFromCombinedIndex(cat, idx);
        }
        persist();
        renderSlots();
        renderReceipt();
      }, 380);
    }, delay || 0);
  }

  function rerollAll() {
    CATEGORIES.forEach(function (c, i) {
      if (!state.locked[c.key]) reroll(c.key, i * 90);
    });
  }

  function saveCurrentOutfit() {
    state.savedOutfits.unshift({
      id: Date.now(),
      label: "Look " + (state.savedOutfits.length + 1),
      items: JSON.parse(JSON.stringify(state.current)),
    });
    persist();
  }

  function loadSavedOutfit(entry) {
    state.current = JSON.parse(JSON.stringify(entry.items));
    persist();
    render();
    closeModal("library-modal");
  }

  function deleteSavedOutfit(id) {
    state.savedOutfits = state.savedOutfits.filter(function (o) { return o.id !== id; });
    persist();
    renderLibrary();
  }

  function addCustomItem(cat, data) {
    state.customItems[cat].push(data);
    state.current[cat] = { source: "custom", index: state.customItems[cat].length - 1 };
    state.locked[cat] = false;
    persist();
    render();
  }

  /* ---------------- library modal ---------------- */

  var libraryModal = document.getElementById("library-modal");
  var libraryList = document.getElementById("library-list");
  var libraryEmpty = document.getElementById("library-empty");

  function renderLibrary() {
    libraryList.innerHTML = "";
    if (state.savedOutfits.length === 0) {
      libraryEmpty.classList.remove("hidden");
      libraryList.classList.add("hidden");
      return;
    }
    libraryEmpty.classList.add("hidden");
    libraryList.classList.remove("hidden");

    state.savedOutfits.forEach(function (entry) {
      var total = CATEGORIES.reduce(function (sum, c) {
        return sum + getItem(c.key, entry.items[c.key]).price;
      }, 0);

      var iconsHtml = CATEGORIES.map(function (c) {
        var item = getItem(c.key, entry.items[c.key]);
        return '<div class="mini-icon">' + garmentSvg(c.key, item.color) + "</div>";
      }).join("");

      var row = document.createElement("div");
      row.className = "library-row";
      row.innerHTML =
        '<div class="library-icons">' + iconsHtml + "</div>" +
        '<div class="library-info">' +
        '<div class="library-name">' + escapeHtml(entry.label) + "</div>" +
        '<div class="library-price">$' + total.toFixed(2) + "</div>" +
        "</div>" +
        '<button class="wear-btn">Wear</button>' +
        '<button class="delete-btn" aria-label="Delete saved outfit">' + ICONS.trash + "</button>";

      row.querySelector(".wear-btn").addEventListener("click", function () { loadSavedOutfit(entry); });
      row.querySelector(".delete-btn").addEventListener("click", function () { deleteSavedOutfit(entry.id); });
      libraryList.appendChild(row);
    });
  }

  /* ---------------- modal helpers ---------------- */

  function openModal(id) { document.getElementById(id).classList.remove("hidden"); }
  function closeModal(id) { document.getElementById(id).classList.add("hidden"); }

  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.querySelectorAll(".close-modal").forEach(function (btn) {
    btn.addEventListener("click", function () { closeModal(btn.getAttribute("data-close")); });
  });

  /* ---------------- icon injection ---------------- */

  document.querySelectorAll(".icon[data-icon]").forEach(function (el) {
    el.innerHTML = ICONS[el.getAttribute("data-icon")];
  });

  /* ---------------- header buttons ---------------- */

  document.getElementById("save-btn").addEventListener("click", saveCurrentOutfit);
  document.getElementById("reroll-all-btn").addEventListener("click", rerollAll);

  document.getElementById("library-btn").addEventListener("click", function () {
    renderLibrary();
    openModal("library-modal");
  });
  document.getElementById("add-btn").addEventListener("click", function () { openModal("add-modal"); });

  /* ---------------- add-piece form ---------------- */

  document.getElementById("add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var cat = document.getElementById("add-cat").value;
    var name = document.getElementById("add-name").value.trim();
    if (!name) return;
    var data = {
      name: name,
      store: document.getElementById("add-store").value.trim() || "Your closet",
      price: Number(document.getElementById("add-price").value) || 0,
      color: document.getElementById("add-color").value,
      description: document.getElementById("add-desc").value.trim() || "Added by you.",
      isCustom: true,
    };
    addCustomItem(cat, data);
    e.target.reset();
    document.getElementById("add-color").value = "#8A6E4B";
    closeModal("add-modal");
  });

  /* ---------------- AI generate ---------------- */

  var aiForm = document.getElementById("ai-form");
  var aiPromptInput = document.getElementById("ai-prompt");
  var aiSubmitBtn = document.getElementById("ai-submit");
  var aiSubmitIcon = document.getElementById("ai-submit-icon");
  var aiSubmitLabel = document.getElementById("ai-submit-label");
  var aiError = document.getElementById("ai-error");
  var isGenerating = false;

  aiForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var prompt = aiPromptInput.value.trim();
    if (!prompt || isGenerating) return;

    isGenerating = true;
    aiError.classList.add("hidden");
    aiSubmitBtn.disabled = true;
    aiSubmitIcon.classList.add("spin");
    aiSubmitLabel.textContent = "Styling\u2026";

    var pools = {};
    CATEGORIES.forEach(function (c) {
      pools[c.key] = combinedPool(c.key).map(function (item, i) {
        return { index: i, name: item.name, description: item.description };
      });
    });

    fetch("/api/generate-outfit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt, pools: pools }),
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) throw new Error(result.data.error || "Something went wrong.");
        var picks = result.data.picks || {};
        CATEGORIES.forEach(function (c, i) {
          if (state.locked[c.key]) return;
          var idx = picks[c.key];
          if (typeof idx === "number") {
            setTimeout(function () {
              var wrap = slotsEl.querySelector('.slot-icon-wrap[data-cat="' + c.key + '"]');
              if (wrap) wrap.classList.add("tumbling");
              setTimeout(function () {
                state.current[c.key] = refFromCombinedIndex(c.key, idx);
                persist();
                renderSlots();
                renderReceipt();
              }, 380);
            }, i * 90);
          }
        });
      })
      .catch(function (err) {
        aiError.textContent = err.message || "Couldn't generate an outfit just now \u2014 try again.";
        aiError.classList.remove("hidden");
      })
      .finally(function () {
        setTimeout(function () {
          isGenerating = false;
          aiSubmitBtn.disabled = false;
          aiSubmitIcon.classList.remove("spin");
          aiSubmitLabel.textContent = "Generate";
        }, CATEGORIES.length * 90 + 420);
      });
  });

  /* ---------------- init ---------------- */

  render();
})();