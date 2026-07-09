"use strict";

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

// ── Bootstrap ───────────────────────────────────────────────────────────────
// Runs last (after ui-forms.js / ui-results.js / ui-charts.js have defined
// renderInputSection / renderResults / renderCharts, etc.) since this fires
// immediately when the script loads.

const app = document.getElementById("app");
renderTabs();
renderSection(activeSection);