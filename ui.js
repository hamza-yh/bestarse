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

  function renderDefaultField(field, container) {
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
    container.appendChild(fieldEl);
  }


  function renderMapWidget(fields, container) {
    const latField = fields.find(f => f.id === "latitude");
    const lngField = fields.find(f => f.id === "longitude");
    const tzField  = fields.find(f => f.id === "timeZoneUTC");

    // Hidden inputs — readInputs() reads these as normal
    ["latitude", "longitude", "timeZoneUTC"].forEach(id => {
      const f = fields.find(f => f.id === id);
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.id = `inp_${id}`;
      hidden.value = f.default;
      container.appendChild(hidden);
    });

    // Map container
    const mapEl = document.createElement("div");
    mapEl.id = "map-widget";
    mapEl.style.cssText = "height:320px; border-radius:6px; overflow:hidden; margin-bottom:16px;";
    container.appendChild(mapEl);

    // Readout row
    const readout = document.createElement("div");
    readout.className = "fields-grid";
    container.appendChild(readout);

    function makeReadout(id, label, unit) {
      const f = fields.find(f => f.id === id);
      const wrap = document.createElement("div");
      wrap.className = "field";
      const lbl = document.createElement("label");
      lbl.textContent = label;
      const row = document.createElement("div");
      row.className = "input-row";
      const input = document.createElement("input");
      input.type = "number";
      input.id = `inp_display_${id}`;   // display only — not read by readInputs()
      input.value = f.default;
      input.step = "any";
      input.addEventListener("change", () => {
        document.getElementById(`inp_${id}`).value = input.value;
        if (id === "latitude" || id === "longitude") {
          const lat = parseFloat(document.getElementById("inp_latitude").value);
          const lng = parseFloat(document.getElementById("inp_longitude").value);
          if (!isNaN(lat) && !isNaN(lng)) marker.setLatLng([lat, lng]);
        }
      });
      row.appendChild(input);
      if (unit) {
        const u = document.createElement("span");
        u.className = "unit";
        u.textContent = unit;
        row.appendChild(u);
      }
      wrap.appendChild(lbl);
      wrap.appendChild(row);
      readout.appendChild(wrap);
    }

    makeReadout("latitude",    latField.label, latField.unit);
    makeReadout("longitude",   lngField.label, lngField.unit);
    makeReadout("timeZoneUTC", tzField.label,  tzField.unit);

    // Init map after DOM is attached
    requestAnimationFrame(() => {
      const defaultLat = latField.default;
      const defaultLng = lngField.default;

      const map = L.map("map-widget").setView([defaultLat, defaultLng], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

      function updateFromLatLng(lat, lng) {
        const tz = Math.round(lng / 15);
        document.getElementById("inp_latitude").value    = lat.toFixed(4);
        document.getElementById("inp_longitude").value   = lng.toFixed(4);
        document.getElementById("inp_timeZoneUTC").value = tz;
        document.getElementById("inp_display_latitude").value    = lat.toFixed(4);
        document.getElementById("inp_display_longitude").value   = lng.toFixed(4);
        document.getElementById("inp_display_timeZoneUTC").value = tz;
      }

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        updateFromLatLng(lat, lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        updateFromLatLng(e.latlng.lat, e.latlng.lng);
      });
    });
  }

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

      if (sub === "coordinates") {
        renderMapWidget(group, body);
      } else {
        const grid = document.createElement("div");
        grid.className = "fields-grid";
        group.forEach(field => renderDefaultField(field, grid));
        body.appendChild(grid);
      }

      card.appendChild(body);
      panel.appendChild(card);
    });
  }

  
  // ── Results section ─────────────────────────────────────────────────────────
 
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
 
  // ── Charts ───────────────────────────────────────────────────────────────────
 
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 
  function renderCharts(container, rows) {
    container.innerHTML = "";
 
    // ── 1. Stat cards ──
    // const calc = rows.map(r => r.calculation);
    // const peakHeat    = Math.max(...calc.map(c => Math.abs(c.heatingPerArea)));
    // const peakCool    = Math.max(...calc.map(c => c.coolingPerArea));
    // const hoursHeat   = calc.filter(c => c.heatingPerArea < 0).length;
    // const hoursCool   = calc.filter(c => c.coolingPerArea > 0).length;
 
    // const statsCard = makeCard("Summary");
    // const statsGrid = document.createElement("div");
    // statsGrid.className = "stats-grid";
    // [
    //   { label: "Peak heating load",   value: peakHeat.toFixed(1),  unit: "W/m²",  color: "blue"   },
    //   { label: "Peak cooling load",   value: peakCool.toFixed(1),  unit: "W/m²",  color: "orange" },
    //   { label: "Hours heating needed",value: hoursHeat,            unit: "hrs/yr", color: "blue"   },
    //   { label: "Hours cooling needed",value: hoursCool,            unit: "hrs/yr", color: "orange" },
    // ].forEach(({ label, value, unit, color }) => {
    //   const el = document.createElement("div");
    //   el.className = `stat-card stat-${color}`;
    //   el.innerHTML = `<div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-unit">${unit}</div>`;
    //   statsGrid.appendChild(el);
    // });
    // statsCard.body.appendChild(statsGrid);
    // container.appendChild(statsCard.card);
 
    // ── 2. Annual demand chart ──
    const annualCard = makeCard("Annual heating & cooling demand");
    const annualCanvas = document.createElement("canvas");
    annualCanvas.style.maxHeight = "280px";
    annualCard.body.appendChild(annualCanvas);
    container.appendChild(annualCard.card);
 
    // Aggregate by day (avg W/m²)
    const byDay = {};
    rows.forEach(r => {
      const key = `${r.weather.month}-${r.weather.day}`;
      if (!byDay[key]) byDay[key] = { heating: [], cooling: [], idx: r.weather.sl };
      byDay[key].heating.push(Math.abs(r.calculation.heatingPerArea));
      byDay[key].cooling.push(r.calculation.coolingPerArea);
    });
    const dayKeys = Object.keys(byDay).sort((a, b) => byDay[a].idx - byDay[b].idx);
    const avgOf = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
 
    new Chart(annualCanvas, {
      type: "line",
      data: {
        labels: dayKeys,
        datasets: [
          { label: "Heating (W/m²)", data: dayKeys.map(k => avgOf(byDay[k].heating).toFixed(2)), borderColor: "#3b7fc4", backgroundColor: "rgba(59,127,196,0.12)", fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.3 },
          { label: "Cooling (W/m²)", data: dayKeys.map(k => avgOf(byDay[k].cooling).toFixed(2)), borderColor: "#e07b39", backgroundColor: "rgba(224,123,57,0.12)",  fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.3 },
        ],
      },
      options: {
        animation: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 12 } } }, tooltip: { mode: "index", intersect: false } },
        scales: {
          x: { ticks: { maxTicksLimit: 12, font: { size: 11 }, callback: (_, i) => { const m = byDay[dayKeys[i]]?.idx; return m && (m-1) % 30 === 0 ? MONTHS[Math.floor((m-1)/30)] : ""; } }, grid: { display: false } },
          y: { title: { display: true, text: "W/m²", font: { size: 11 } }, ticks: { font: { size: 11 } } },
        },
      },
    });
 
    // ── 3. Monthly breakdown chart ──
    const monthlyCard = makeCard("Monthly heat balance");
    const monthlyCanvas = document.createElement("canvas");
    monthlyCanvas.style.maxHeight = "300px";
    monthlyCard.body.appendChild(monthlyCanvas);
    container.appendChild(monthlyCard.card);
 
    // Average each component by month
    const byMonth = Array.from({ length: 12 }, () => ({ qS:[], qSl:[], qM:[], qCo2:[], qE:[], qG:[], qP:[], qI:[], qT:[] }));
    rows.forEach(r => {
      const m = r.weather.month - 1;
      const c = r.calculation;
      byMonth[m].qS.push(c.qS / 1000);
      byMonth[m].qSl.push(c.qSl / 1000);
      byMonth[m].qM.push(c.qM / 1000);
      byMonth[m].qCo2.push(c.qCo2 / 1000);
      byMonth[m].qE.push(-c.qE / 1000);
      byMonth[m].qG.push(-c.qG / 1000);
      byMonth[m].qP.push(-c.qP / 1000);
      byMonth[m].qI.push(-c.qI / 1000);
      byMonth[m].qT.push(-c.qT / 1000);
    });
    const mAvg = (arr) => arr.length ? avgOf(arr) : 0;
 
    new Chart(monthlyCanvas, {
      type: "bar",
      data: {
        labels: MONTHS,
        datasets: [
          { label: "Solar gain",   data: byMonth.map(m => mAvg(m.qS).toFixed(2)),    backgroundColor: "#e8a838", stack: "s" },
          { label: "Lighting",     data: byMonth.map(m => mAvg(m.qSl).toFixed(2)),   backgroundColor: "#f0d060", stack: "s" },
          { label: "Fans",         data: byMonth.map(m => mAvg(m.qM).toFixed(2)),    backgroundColor: "#8ec4e8", stack: "s" },
          { label: "CO₂ gen",      data: byMonth.map(m => mAvg(m.qCo2).toFixed(2)),  backgroundColor: "#a8d8a0", stack: "s" },
          { label: "Transpiration",data: byMonth.map(m => mAvg(m.qE).toFixed(2)),    backgroundColor: "#5aa878", stack: "s" },
          { label: "Floor loss",   data: byMonth.map(m => mAvg(m.qG).toFixed(2)),    backgroundColor: "#9b7bb0", stack: "s" },
          { label: "Perimeter",    data: byMonth.map(m => mAvg(m.qP).toFixed(2)),    backgroundColor: "#c47a7a", stack: "s" },
          { label: "Air exchange", data: byMonth.map(m => mAvg(m.qI).toFixed(2)),    backgroundColor: "#e0a0a0", stack: "s" },
          { label: "Transmission", data: byMonth.map(m => mAvg(m.qT).toFixed(2)),    backgroundColor: "#b0b0c8", stack: "s" },
        ],
      },
      options: {
        animation: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { mode: "index" } },
        scales: {
          x: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { stacked: true, title: { display: true, text: "kW (avg)", font: { size: 11 } }, ticks: { font: { size: 11 } } },
        },
      },
    });
 
    // ── 4. Typical day profile ──
    const dayCard = makeCard("Typical day profile");
 
    // Month picker
    const pickerRow = document.createElement("div");
    pickerRow.style.cssText = "display:flex; align-items:center; gap:10px; margin-bottom:16px;";
    const pickerLabel = document.createElement("label");
    pickerLabel.style.cssText = "font-size:12px; color:#4a5e50; font-weight:500;";
    pickerLabel.textContent = "Month:";
    const picker = document.createElement("select");
    picker.className = "month-picker";
    MONTHS.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = i + 1;
      opt.textContent = m;
      picker.appendChild(opt);
    });
    pickerRow.appendChild(pickerLabel);
    pickerRow.appendChild(picker);
    dayCard.body.appendChild(pickerRow);
 
    const dayCanvas = document.createElement("canvas");
    dayCanvas.style.maxHeight = "260px";
    dayCard.body.appendChild(dayCanvas);
    container.appendChild(dayCard.card);
 
    // Group by month → hour, average qH and outdoor temp
    const byMonthHour = {};
    rows.forEach(r => {
      const key = `${r.weather.month}-${r.weather.hour}`;
      if (!byMonthHour[key]) byMonthHour[key] = { qH: [], temp: [], heat: [], cool: [] };
      byMonthHour[key].qH.push(r.calculation.qH / 1000);
      byMonthHour[key].temp.push(r.weather.tDryBulb);
      byMonthHour[key].heat.push(r.calculation.heatingPerArea);
      byMonthHour[key].cool.push(r.calculation.coolingPerArea);
    });
 
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,"0")}:00`);
 
    let dayChart = new Chart(dayCanvas, {
      type: "line",
      data: { labels: hours, datasets: [] },
      options: {
        animation: false,
        plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 12 } } }, tooltip: { mode: "index", intersect: false } },
        scales: {
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
          y:  { position: "left",  title: { display: true, text: "kW",  font: { size: 11 } }, ticks: { font: { size: 11 } } },
          y2: { position: "right", title: { display: true, text: "°C",  font: { size: 11 } }, ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });
 
    function updateDayChart(month) {
      const m = parseInt(month);
      dayChart.data.datasets = [
        {
          label: "Net load (kW)", yAxisID: "y",
          data: Array.from({ length: 24 }, (_, h) => {
            const d = byMonthHour[`${m}-${h + 1}`];
            return d ? mAvg(d.qH).toFixed(2) : null;
          }),
          borderColor: "#1c3a2a", backgroundColor: "rgba(28,58,42,0.08)", fill: true, pointRadius: 3, borderWidth: 2, tension: 0.4,
        },
        {
          label: "Outdoor temp (°C)", yAxisID: "y2",
          data: Array.from({ length: 24 }, (_, h) => {
            const d = byMonthHour[`${m}-${h + 1}`];
            return d ? mAvg(d.temp).toFixed(1) : null;
          }),
          borderColor: "#c47a2a", borderDash: [4, 3], pointRadius: 0, borderWidth: 1.5, tension: 0.4, fill: false,
        },
      ];
      dayChart.update();
    }
 
    updateDayChart(1);
    picker.addEventListener("change", () => updateDayChart(picker.value));
  }
 
  // ── Card builder helper ──────────────────────────────────────────────────────
 
  function makeCard(title) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-header"><h3>${title}</h3></div>`;
    const body = document.createElement("div");
    body.className = "card-body";
    card.appendChild(body);
    return { card, body };
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