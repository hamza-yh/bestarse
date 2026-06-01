"use strict";

(function () {

  // ── Config ──────────────────────────────────────────────────────────────────

  const SECTIONS = [
    { id: "location",    label: "Location & Orientation" },
    { id: "structure",   label: "Structure" },
    { id: "crop",        label: "Crop" },
    { id: "environment", label: "Environment" },
    { id: "results",     label: "Results" },
  ];

  const SUBSECTION_LABELS = {
    coordinates: "Coordinates",
    orientation: "Orientation",
    geometry:    "Geometry",
    covering:    "Covering",
    walls:       "Walls & Insulation",
    plant:       "Plant",
    soil:        "Soil",
    climate:     "Climate",
    equipment:   "Equipment",
    co2:         "CO₂",
    constants:   "Physical Constants",
  };

  // ── State ───────────────────────────────────────────────────────────────────

  let activeSection = "location";
  let allRows = null;

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  const app = document.getElementById("app");
  renderTabs();
  renderSection(activeSection);

  // ── Tabs ────────────────────────────────────────────────────────────────────

  function renderTabs() {
    const nav = document.createElement("nav");
    nav.id = "tabs";

    SECTIONS.forEach(({ id, label }) => {
      const btn = document.createElement("button");
      btn.className = "tab-btn" + (id === activeSection ? " active" : "");
      btn.dataset.section = id;
      btn.textContent = label;
      btn.addEventListener("click", () => switchSection(id));
      nav.appendChild(btn);
    });

    app.appendChild(nav);
  }

  function switchSection(id) {
    activeSection = id;
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.section === id);
    });
    const panel = document.getElementById("panel");
    if (panel) panel.remove();
    renderSection(id);
  }

  // ── Section panel ───────────────────────────────────────────────────────────

  function renderSection(sectionId) {
    const panel = document.createElement("div");
    panel.id = "panel";

    if (sectionId === "results") {
      renderResults(panel);
    } else {
      renderInputSection(panel, sectionId);
    }

    app.appendChild(panel);
  }

  // ── Input sections ──────────────────────────────────────────────────────────

  function renderInputSection(panel, sectionId) {
    const fields = GREENHOUSE_INPUTS.filter(f => f.section === sectionId);

    // Group by subsection preserving order
    const subsections = [];
    const seen = {};
    fields.forEach(f => {
      if (!seen[f.subsection]) {
        seen[f.subsection] = true;
        subsections.push(f.subsection);
      }
    });

    const isConstants = (sub) => sub === "constants";

    subsections.forEach(sub => {
      const group = fields.filter(f => f.subsection === sub);
      const card = document.createElement("div");
      card.className = "card" + (isConstants(sub) ? " card-collapsed" : "");

      const header = document.createElement("div");
      header.className = "card-header";

      const title = document.createElement("h3");
      title.textContent = SUBSECTION_LABELS[sub] || sub;
      header.appendChild(title);

      if (isConstants(sub)) {
        const toggle = document.createElement("button");
        toggle.className = "toggle-btn";
        toggle.textContent = "Show";
        toggle.addEventListener("click", () => {
          const isCollapsed = card.classList.toggle("card-collapsed");
          toggle.textContent = isCollapsed ? "Show" : "Hide";
        });
        header.appendChild(toggle);
      }

      card.appendChild(header);

      const body = document.createElement("div");
      body.className = "card-body";

      const grid = document.createElement("div");
      grid.className = "fields-grid";

      group.forEach(field => {
        const fieldEl = document.createElement("div");
        fieldEl.className = "field";

        const label = document.createElement("label");
        label.htmlFor = `inp_${field.id}`;
        label.textContent = field.label;

        const inputRow = document.createElement("div");
        inputRow.className = "input-row";

        const input = document.createElement("input");
        input.type = "number";
        input.id = `inp_${field.id}`;
        input.value = field.default;
        input.step = "any";

        inputRow.appendChild(input);

        if (field.unit) {
          const unit = document.createElement("span");
          unit.className = "unit";
          unit.textContent = field.unit;
          inputRow.appendChild(unit);
        }

        fieldEl.appendChild(label);
        fieldEl.appendChild(inputRow);
        grid.appendChild(fieldEl);
      });

      body.appendChild(grid);
      card.appendChild(body);
      panel.appendChild(card);
    });
  }

  // ── Results section ─────────────────────────────────────────────────────────

  function renderResults(panel) {
    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";
    const title = document.createElement("h3");
    title.textContent = "Run calculation";
    header.appendChild(title);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "card-body";

    // File input
    const fileLabel = document.createElement("label");
    fileLabel.className = "file-label";
    fileLabel.textContent = "Import weather CSV";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.className = "file-input";
    fileLabel.appendChild(fileInput);
    body.appendChild(fileLabel);

    const status = document.createElement("p");
    status.className = "status";
    body.appendChild(status);

    // Download button
    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn-primary";
    downloadBtn.textContent = "Download results CSV";
    downloadBtn.disabled = true;
    body.appendChild(downloadBtn);

    card.appendChild(body);
    panel.appendChild(card);

    // Events
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const inputs = readInputs();
          allRows = calcAllRows(e.target.result, inputs);
          status.textContent = `✓ Loaded ${allRows.length} rows from "${file.name}"`;
          status.className = "status success";
          downloadBtn.disabled = false;
        } catch (err) {
          status.textContent = "Error: " + err.message;
          status.className = "status error";
          downloadBtn.disabled = true;
        }
      };
      reader.readAsText(file);
    });

    downloadBtn.addEventListener("click", () => {
      if (!allRows) return;
      triggerDownload(buildCSV(allRows), "greenhouse_results.csv");
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function readInputs() {
    const primary = {};
    GREENHOUSE_INPUTS.forEach(f => {
      primary[f.id] = Number(document.getElementById(`inp_${f.id}`)?.value ?? f.default);
    });
    return { ...primary, ...INPUTS(primary) };
  }

  function calcAllRows(csvText, inputs) {
    const [headerLine, ...lines] = csvText.trim().split("\n");
    const headers = headerLine.replace(/^\uFEFF/, "").split(",").map(h => h.trim());
    const rows = lines.filter(l => l.trim()).map(line => {
      const vals = line.split(",");
      return Object.fromEntries(
        headers.map((h, i) => [h, isNaN(vals[i]) ? vals[i].trim() : Number(vals[i])])
      );
    });
    return rows.map(primary => {
      const w     = { ...primary, ...WEATHER(primary, inputs) };
      const sRoof = ROOF(inputs, w, inputs.azimuthSouthRoof);
      const nRoof = ROOF(inputs, w, inputs.azimuthNorthRoof);
      const transp = TRANSPIRATION(inputs, w);
      const calc  = CALCULATION(inputs, w, sRoof.it, nRoof.it, transp.transpiration);
      return { weather: w, calculation: calc };
    });
  }

  function buildCSV(rows) {
    const wCols    = WEATHER_INPUTS.map(f => f.id);
    const wDerived = WEATHER_DERIVED.map(f => f.id);
    const cCols    = CALCULATION_DERIVED.map(f => f.id);
    const all      = [...wCols, ...wDerived, ...cCols];
    const esc = v => { const s = String(v ?? ""); return s.includes(",") ? `"${s}"` : s; };
    const header = all.join(",");
    const lines = rows.map(r =>
      all.map(c => esc(r.weather[c] ?? r.calculation[c] ?? "")).join(",")
    );
    return [header, ...lines].join("\n");
  }

  function triggerDownload(content, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    a.download = filename;
    a.click();
  }

})();