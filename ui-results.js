"use strict";

// ── Results section ─────────────────────────────────────────────────────────
// Upload a weather CSV, run the calculation across every row, chart it, and
// let the user download the computed results as a CSV.

let allRows = null;

function renderResults(panel) {
  // ── Upload card ──
  const uploadCard = document.createElement("div");
  uploadCard.className = "card";
  uploadCard.innerHTML = `
    <div class="card-header"><h3>Run calculation</h3></div>
    <div class="card-body">
      <label class="file-label">Import weather CSV
        <input type="file" id="res-file" accept=".csv" class="file-input">
      </label>
      <p id="res-status" class="status"></p>
      <button id="res-download" class="btn-primary" disabled>Download results CSV</button>
    </div>`;
  panel.appendChild(uploadCard);

  // ── Charts container (hidden until data loads) ──
  const chartsDiv = document.createElement("div");
  chartsDiv.id = "charts-container";
  chartsDiv.style.display = "none";
  panel.appendChild(chartsDiv);

  // ── Events ──
  panel.querySelector("#res-file").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const inputs = readInputs();
        allRows = calcAllRows(e.target.result, inputs);
        panel.querySelector("#res-status").textContent = `✓ Loaded ${allRows.length} rows from "${file.name}"`;
        panel.querySelector("#res-status").className = "status success";
        panel.querySelector("#res-download").disabled = false;
        renderCharts(chartsDiv, allRows);
        chartsDiv.style.display = "block";
      } catch (err) {
        panel.querySelector("#res-status").textContent = "Error: " + err.message;
        panel.querySelector("#res-status").className = "status error";
      }
    };
    reader.readAsText(file);
  });

  panel.querySelector("#res-download").addEventListener("click", () => {
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