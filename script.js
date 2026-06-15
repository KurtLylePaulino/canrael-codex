/* =====================================================================
   THE CANRAEL CODEX — Logic
   Draws quotes from the bank, filters by region, and keeps the
   atmosphere alive with drifting embers.
   ===================================================================== */

(function () {
  "use strict";

  // ---- Elements ----
  const regionsEl    = document.getElementById("regions");
  const blurbEl      = document.getElementById("regionBlurb");
  const cardEl       = document.getElementById("quoteCard");
  const textEl       = document.getElementById("quoteText");
  const attrEl       = document.getElementById("quoteAttr");
  const tagEl        = document.getElementById("quoteRegionTag");
  const drawBtn      = document.getElementById("drawBtn");
  const copyBtn      = document.getElementById("copyBtn");
  const copyLabel    = document.getElementById("copyLabel");
  const counterEl    = document.getElementById("counter");
  const totalCountEl = document.getElementById("totalCount");

  // ---- State ----
  let activeCat = "all";
  let lastIndex = -1;
  let current = null;
  let drawCount = 0;

  const labelOf = (id) => {
    const c = CATEGORIES.find((c) => c.id === id);
    return c ? c.label : id;
  };

  // ---- Build region filter chips ----
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "region-chip";
    btn.setAttribute("aria-pressed", cat.id === activeCat ? "true" : "false");
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span class="chip-sigil" aria-hidden="true">${cat.sigil}</span>${cat.label}`;
    btn.addEventListener("click", () => setCategory(cat.id));
    regionsEl.appendChild(btn);
  });

  function setCategory(id) {
    activeCat = id;
    document.querySelectorAll(".region-chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", chip.dataset.cat === id ? "true" : "false");
    });
    const cat = CATEGORIES.find((c) => c.id === id);
    blurbEl.textContent = cat ? cat.blurb : "";
    lastIndex = -1;
    updateCounter();
    draw();
  }

  // ---- Pool for the active category ----
  function pool() {
    if (activeCat === "all") return QUOTES.map((_, i) => i);
    return QUOTES.reduce((acc, q, i) => {
      if (q.cat === activeCat) acc.push(i);
      return acc;
    }, []);
  }

  // ---- Draw a quote (no immediate repeat) ----
  function draw() {
    const indices = pool();
    if (!indices.length) return;

    let idx;
    if (indices.length === 1) {
      idx = indices[0];
    } else {
      do {
        idx = indices[Math.floor(Math.random() * indices.length)];
      } while (idx === lastIndex);
    }
    lastIndex = idx;
    current = QUOTES[idx];
    drawCount++;

    cardEl.classList.add("is-drawing");
    window.setTimeout(() => {
      textEl.textContent = current.text;
      attrEl.textContent = "— " + current.author;
      tagEl.textContent = labelOf(current.cat).replace(/ · /g, " — ");
      cardEl.classList.remove("is-drawing");
      updateCounter();
    }, 260);
  }

  function updateCounter() {
    const n = pool().length;
    const scope = activeCat === "all" ? "the full codex" : labelOf(activeCat);
    counterEl.textContent = `${n} whispers in ${scope}` + (drawCount ? ` · drawn ${drawCount}` : "");
  }

  // ---- Copy / inscribe ----
  async function inscribe() {
    if (!current) return;
    const passage = `“${current.text}”\n— ${current.author}\n\nThe Canrael Codex`;
    try {
      await navigator.clipboard.writeText(passage);
      flashCopy("Inscribed ✓");
    } catch (e) {
      // Fallback for older / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = passage;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); flashCopy("Inscribed ✓"); }
      catch (_) { flashCopy("Copy failed"); }
      document.body.removeChild(ta);
    }
  }

  function flashCopy(msg) {
    copyLabel.textContent = msg;
    copyBtn.classList.add("copied");
    window.setTimeout(() => {
      copyLabel.textContent = "Inscribe";
      copyBtn.classList.remove("copied");
    }, 1400);
  }

  // ---- Events ----
  drawBtn.addEventListener("click", draw);
  copyBtn.addEventListener("click", inscribe);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space" || e.key === "Enter") {
      // Don't hijack Enter on the focused buttons themselves
      if (e.code === "Space") { e.preventDefault(); draw(); }
    } else if (e.key === "c" || e.key === "C") {
      inscribe();
    }
  });

  // ---- Ambient embers ----
  function spawnEmbers() {
    const host = document.getElementById("embers");
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const COUNT = 26;
    for (let i = 0; i < COUNT; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      const dur = 9 + Math.random() * 12;
      e.style.left = Math.random() * 100 + "vw";
      e.style.animationDuration = dur + "s";
      e.style.animationDelay = -Math.random() * dur + "s";
      e.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      const size = 1.5 + Math.random() * 2.5;
      e.style.width = size + "px";
      e.style.height = size + "px";
      if (Math.random() > 0.7) {
        e.style.background = "var(--aether)";
        e.style.boxShadow = "0 0 6px 1px rgba(143,182,201,0.7)";
      }
      host.appendChild(e);
    }
  }

  // ---- Init ----
  totalCountEl.textContent = QUOTES.length;
  blurbEl.textContent = CATEGORIES[0].blurb;
  spawnEmbers();
  updateCounter();
  draw();
})();
