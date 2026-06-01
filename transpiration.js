/**
 * transpiration.js
 * Calculates one row of the Transpiration tab given:
 *   - inp: the full input object  { ...defaultPrimary(), ...INPUTS(primary) }
 *   - w:   the full weather row   { ...defaultWeather(), ...WEATHER(weatherRow) }
 *
 * w.indoorTemperature and w.indoorRH come from weather.js (moved from Calculation tab).
 *
 * The output `transpiration` (col N, W/m²) is the value consumed by calculation.js as
 * the `transpiration` argument.
 */

"use strict";

const TRANSPIRATION_DERIVED = [
  { id:"rn",              label:"Net radiation (Rn)",                              unit:"W/m²"   },
  { id:"xSatAir",         label:"Saturated vapor concentration of air (Xsat_air)", unit:"g/m³"   },
  { id:"xActAir",         label:"Actual vapor concentration of air (Xact_air)",    unit:"g/m³"   },
  { id:"vaporDiff",       label:"Vapor concentration difference",                  unit:"g/m³"   },
  { id:"rE",              label:"Aerodynamic resistance (r_e)",                    unit:"s/m"    },
  { id:"rI",              label:"Canopy resistance (r_i)",                         unit:"s/m"    },
  { id:"epsilon",         label:"Epsilon",                                         unit:""       },
  { id:"etStanghelini",   label:"ET Stanghelini (ET)",                             unit:"g/m²s"  },
  { id:"etStangheliniW",  label:"ET Stanghelini (W/m²)",                          unit:"W/m²"   },
  { id:"es",              label:"Saturated vapor pressure indoors (es)",           unit:"kPa"    },
  { id:"ea",              label:"Actual vapor pressure indoors (ea)",              unit:"kPa"    },
  { id:"delta",           label:"Slope of saturation curve (Delta)",               unit:"kPa/°C" },
  { id:"etC",             label:"ETc (Penman-Monteith)",                           unit:"g/m²s"  },
  { id:"transpiration",   label:"Transpiration (W/m²)",                           unit:"W/m²"   },
];

// All formulas mirror the Excel Transpiration tab row formulas exactly.
// inp = { ...primaryInputs, ...INPUTS(primary) }
// w   = { ...weatherRow,    ...WEATHER(weatherRow) }
const TRANSPIRATION = (inp, w) => {
  const lai    = inp.leafAreaIndexTomato;
  const lf     = inp.leafLengthTomato;
  const tau    = inp.transmissivitySolar;
  const lv     = inp.latentHeatVaporization;
  const albedo = inp.plantAlbedo;
  const indoorRH = inp.indoorRH;   // setpoint RH from inp (B86)
  const indoorT  = w.indoorTemperature;
  const indoorRh = w.indoorRH;

  // [A] Net radiation Rn (W/m²)
  // Accounts for shading factor based on ih level, transmissivity, plant albedo, and LAI extinction
  const extinction = 1 - Math.exp(-0.7 * lai);
  const rn = w.ih > 650
    ? (1 - inp.shadingFactor)  * inp.sensibleHeatFactor * (1 - albedo) * tau * extinction * w.ih
    : w.ih > 550
    ? (1 - inp.shadingFactor1) * inp.sensibleHeatFactor * (1 - albedo) * tau * extinction * w.ih
    :                            inp.sensibleHeatFactor * tau * (1 - albedo) * extinction * w.ih;

  // [B] Saturated vapor concentration of air at indoor temp (g/m³)
  const xSatAir = 5.5638 * Math.exp(0.0572 * indoorT);

  // [C] Actual vapor concentration of air (g/m³) — uses indoor setpoint RH (B86)
  const xActAir = xSatAir * indoorRh / 100;

  // [D] Vapor concentration difference (g/m³)
  const vaporDiff = xSatAir - xActAir;

  // [E] Aerodynamic resistance r_e (s/m)
  const rE = 200 * (Math.pow(lf, 0.2) / Math.pow(0.5, 0.8));

  // [F] Canopy resistance r_i (s/m)
  const rI = 82
    * (((rn / 2 * lai) + 4.3) / ((rn / 2 * lai) + 0.54))
    * (1 + 0.023 * Math.pow(indoorT - 24.5, 2));

  // [G] Epsilon — ratio of latent to sensible heat at indoor temp
  const epsilon = 0.7584 * Math.exp(0.0518 * indoorT);

  // [H] ET Stanghelini (g/m²s)
  const etStanghelini = (2 * lai / ((1 + epsilon) * rE + rI))
    * (vaporDiff + ((epsilon * rE * rn) / (2 * lai * lv)));

  // [I] ET Stanghelini (W/m²)
  const etStangheliniW = etStanghelini * lv;

  // [J] Saturated vapor pressure at indoor temp es (kPa)
  const es = 0.61078 * Math.exp(17.27 * indoorT / (indoorT + 237.3));

  // [K] Actual vapor pressure indoors ea (kPa)
  const ea = (indoorRh / 100) * es;

  // [L] Delta — slope of saturation vapor pressure curve (kPa/°C)
  const delta = (4098 * es) / Math.pow(indoorT + 237.3, 2);

  // [M] ETc Penman-Monteith (g/m²s)
  const etC = (delta * rn + 1200 * (es - ea) / rE)
    / (2450 * (delta + 0.067 * (1 + rI / rE)));

  // [N] Transpiration (W/m²) — this is the value consumed by calculation.js
  const transpiration = etC * lv;

  return {
    rn, xSatAir, xActAir, vaporDiff,
    rE, rI, epsilon,
    etStanghelini, etStangheliniW,
    es, ea, delta,
    etC, transpiration,
  };
};

// ── Example usage ─────────────────────────────────────────────────────────────
// const t = TRANSPIRATION(allInputs, allWeather);
// console.log(t.transpiration); // W/m² — pass this into CALCULATION() as `transpiration`