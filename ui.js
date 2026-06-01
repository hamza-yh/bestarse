"use strict";

(function () {
  const app = document.getElementById("app");

  // --- Build grouped sections from GREENHOUSE_INPUTS ---
  const sectionMap = {};
  for (const field of GREENHOUSE_INPUTS) {
    if (!sectionMap[field.section]) sectionMap[field.section] = [];
    sectionMap[field.section].push(field);
  }

  for (const [sectionName, fields] of Object.entries(sectionMap)) {
    const h2 = document.createElement("h2");
    h2.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    app.appendChild(h2);

    for (const field of fields) {
      const row = document.createElement("div");

      const label = document.createElement("label");
      label.htmlFor = `inp_${field.id}`;
      label.textContent = `${field.label}${field.unit ? " (" + field.unit + ")" : ""}:`;

      const input = document.createElement("input");
      input.type = "number";
      input.id = `inp_${field.id}`;
      input.value = field.default;
      input.step = "any";

      row.appendChild(label);
      row.appendChild(document.createTextNode(" "));
      row.appendChild(input);
      app.appendChild(row);
    }
  }

  // --- Single-row calculate section ---
  app.appendChild(document.createElement("hr"));

  const calcBtn = document.createElement("button");
  calcBtn.textContent = "Calculate (single row, default weather)";
  app.appendChild(calcBtn);

  const singleResultsDiv = document.createElement("div");
  app.appendChild(singleResultsDiv);

  calcBtn.addEventListener("click", () => {
    const calc = runSingleCalc();
    renderSingleResults(singleResultsDiv, calc);
  });

  // --- CSV import / export section ---
  app.appendChild(document.createElement("hr"));

  const fileLabel = document.createElement("label");
  fileLabel.textContent = "Import Weather CSV: ";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv";
  fileLabel.appendChild(fileInput);
  app.appendChild(fileLabel);

  const csvStatus  = document.createElement("p");
  app.appendChild(csvStatus);

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Results CSV";
  downloadBtn.disabled = true;
  app.appendChild(downloadBtn);

  let allRows = null;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const inputs = readInputs();
        allRows = calcAllRows(e.target.result, inputs);
        csvStatus.textContent = `Loaded ${allRows.length} rows from "${file.name}".`;
        downloadBtn.disabled = false;
      } catch (err) {
        csvStatus.textContent = "Error processing CSV: " + err.message;
        downloadBtn.disabled = true;
      }
    };
    reader.readAsText(file);
  });

  downloadBtn.addEventListener("click", () => {
    if (!allRows) return;
    const csv = buildCSV(allRows);
    triggerDownload(csv, "greenhouse_results.csv");
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function readInputs() {
    const primary = {};
    for (const field of GREENHOUSE_INPUTS) {
      primary[field.id] = Number(document.getElementById(`inp_${field.id}`).value);
    }
    return { ...primary, ...INPUTS(primary) };
  }

  function runSingleCalc() {
    const inputs = readInputs();
    const defW   = defaultWeather();
    const w      = { ...defW, ...WEATHER(defW, inputs) };
    const sRoof  = ROOF(inputs, w, inputs.azimuthSouthRoof);
    const nRoof  = ROOF(inputs, w, inputs.azimuthNorthRoof);
    const transp = TRANSPIRATION(inputs, w);
    return CALCULATION(inputs, w, sRoof.it, nRoof.it, transp.transpiration);
  }

  function renderSingleResults(container, calc) {
    container.innerHTML = "<h2>Results</h2>";
    const table = document.createElement("table");

    const headerRow = document.createElement("tr");
    ["Output", "Value", "Unit"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    for (const col of CALCULATION_DERIVED) {
      const tr  = document.createElement("tr");
      const val = calc[col.id];
      [col.label, typeof val === "number" ? val.toFixed(4) : String(val), col.unit].forEach(text => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    }

    container.appendChild(table);
  }

  function parseWeatherCSV(text) {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.replace(/^﻿/, "").split(",").map(h => h.trim());
    return lines
      .filter(l => l.trim() !== "")
      .map(line => {
        const values = line.split(",");
        return Object.fromEntries(
          headers.map((h, i) => [h, isNaN(values[i]) ? values[i].trim() : Number(values[i])])
        );
      });
  }

  function calcAllRows(csvText, inputs) {
    return parseWeatherCSV(csvText).map(primary => {
      const w      = { ...primary, ...WEATHER(primary, inputs) };
      const sRoof  = ROOF(inputs, w, inputs.azimuthSouthRoof);
      const nRoof  = ROOF(inputs, w, inputs.azimuthNorthRoof);
      const transp = TRANSPIRATION(inputs, w);
      const calc   = CALCULATION(inputs, w, sRoof.it, nRoof.it, transp.transpiration);
      return { weather: w, calculation: calc };
    });
  }

  function buildCSV(rows) {
    const weatherCols = WEATHER_INPUTS.map(f => f.id);
    const weatherDerivedCols = WEATHER_DERIVED.map(f => f.id);
    const calcCols = CALCULATION_DERIVED.map(f => f.id);
    const allCols = [...weatherCols, ...weatherDerivedCols, ...calcCols];

    const escape = v => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = allCols.join(",");
    const dataLines = rows.map(row => {
      return allCols.map(col => {
        const val = row.weather[col] ?? row.calculation[col] ?? "";
        return escape(typeof val === "number" ? val : val);
      }).join(",");
    });

    return [header, ...dataLines].join("\n");
  }

  function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
})();
