"use strict";

// ── Input sections ──────────────────────────────────────────────────────────
// Renders the number-input fields (and the special lat/lng map widget) for
// every tab except Results.

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

function renderInputSection(panel, sectionId) {
  const fields = GREENHOUSE_INPUTS.filter(f => f.section === sectionId);
  const subsections = [...new Set(fields.map(f => f.subsection))];

  subsections.forEach(sub => {
    const group = fields.filter(f => f.subsection === sub);

    const card = document.createElement("div");
    card.className = "card";
    const header = document.createElement("div");
    header.className = "card-header";
    const title = document.createElement("h3");
    title.textContent = SUBSECTION_LABELS[sub] || sub;
    header.appendChild(title);

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

function renderMapWidget(fields, container) {
  const latField = fields.find(f => f.id === "latitude");
  const lngField = fields.find(f => f.id === "longitude");
  const tzField  = fields.find(f => f.id === "timeZoneUTC");

  // Map container
  const mapEl = document.createElement("div");
  mapEl.id = "map-widget";
  mapEl.style.cssText = "height:320px; border-radius:6px; overflow:hidden; margin-bottom:16px;";
  container.appendChild(mapEl);

  // Visible inputs — these ARE the real inputs readInputs() reads
  const readout = document.createElement("div");
  readout.className = "fields-grid";
  container.appendChild(readout);

  let marker; // assigned once the map initializes below

  function makeInput(id, label, unit) {
    const f = fields.find(f => f.id === id);
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const row = document.createElement("div");
    row.className = "input-row";
    const input = document.createElement("input");
    input.type = "number";
    input.id = `inp_${id}`; // same convention as every other field
    input.value = f.default;
    input.step = "any";
    input.addEventListener("change", () => {
      if (id === "latitude" || id === "longitude") {
        const lat = parseFloat(document.getElementById("inp_latitude").value);
        const lng = parseFloat(document.getElementById("inp_longitude").value);
        if (!isNaN(lat) && !isNaN(lng) && marker) marker.setLatLng([lat, lng]);
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

  makeInput("latitude",    latField.label, latField.unit);
  makeInput("longitude",   lngField.label, lngField.unit);
  makeInput("timeZoneUTC", tzField.label,  tzField.unit);

  // Init map after DOM is attached
  requestAnimationFrame(() => {
    const defaultLat = latField.default;
    const defaultLng = lngField.default;

    const map = L.map("map-widget").setView([defaultLat, defaultLng], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    function updateInputsFromLatLng(lat, lng) {
      document.getElementById("inp_latitude").value    = lat.toFixed(4);
      document.getElementById("inp_longitude").value   = lng.toFixed(4);
      document.getElementById("inp_timeZoneUTC").value = Math.round(lng / 15);
    }

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      updateInputsFromLatLng(lat, lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      updateInputsFromLatLng(e.latlng.lat, e.latlng.lng);
    });
  });
}