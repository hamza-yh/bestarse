"use strict";

// ── Charts ───────────────────────────────────────────────────────────────────
// Builds the four result charts (annual demand, monthly breakdown, typical
// day profile) once calcAllRows() has produced data.

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

  // Aggregate by day (avg qH, in kW — negative = heating, positive = cooling)
  const byDay = {};
  rows.forEach(r => {
    const key = `${r.weather.month}-${r.weather.day}`;
    if (!byDay[key]) byDay[key] = { qH: [], month: r.weather.month, day: r.weather.day };
    byDay[key].qH.push(r.calculation.qH / 1000);
  });
  const dayKeys = Object.keys(byDay).sort((a, b) => {
    const A = byDay[a], B = byDay[b];
    return A.month - B.month || A.day - B.day;
  });
  const avgOf = arr => arr.reduce((s, v) => s + v, 0) / arr.length;

  new Chart(annualCanvas, {
    type: "line",
    data: {
      labels: dayKeys,
      datasets: [
        { label: "Net load (kW) — heating (–) / cooling (+)", data: dayKeys.map(k => avgOf(byDay[k].qH).toFixed(2)), borderColor: "#3b7fc4", backgroundColor: "rgba(59,127,196,0.12)", fill: true, pointRadius: 0, borderWidth: 1.5, tension: 0.3 },
      ],
    },
    options: {
      animation: false,
      plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { size: 12 } } }, tooltip: { mode: "index", intersect: false } },
      scales: {
        x: {
          // Keep Chart.js's normal one-tick-per-day layout (autoSkip: false)
          // so positioning is never touched — every day still gets a tick at
          // its correct, evenly-spaced spot. We only change what TEXT shows:
          // blank for most days, the month name on the 1st of each month.
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 11 },
            callback: value => {
              const d = byDay[dayKeys[value]];
              return d && d.day === 15 ? MONTHS[d.month - 1] : "";
            },
          },
          grid: { display: false },
        },
        y: { title: { display: true, text: "kW", font: { size: 11 } }, ticks: { font: { size: 11 } } },
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
          const d = byMonthHour[`${m}-${h}`];
          return d ? mAvg(d.qH).toFixed(2) : null;
        }),
        borderColor: "#1c3a2a", backgroundColor: "rgba(28,58,42,0.08)", fill: true, pointRadius: 3, borderWidth: 2, tension: 0.4,
      },
      {
        label: "Outdoor temp (°C)", yAxisID: "y2",
        data: Array.from({ length: 24 }, (_, h) => {
          const d = byMonthHour[`${m}-${h}`];
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