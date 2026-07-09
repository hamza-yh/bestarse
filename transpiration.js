/**
 * transpiration.js
 * Calculates one row of the Transpiration tab given the full input row and the full weather row.
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

const TRANSPIRATION = (inp, w) => {
  const lai    = inp.leafAreaIndexTomato;
  const lf     = inp.leafLengthTomato;
  const tau    = inp.transmissivitySolar;
  const lv     = inp.latentHeatVaporization;
  const albedo = inp.plantAlbedo;
  const indoorT  = w.indoorTemperature;
  const indoorRH = w.indoorRH;

  const extinction = 1 - Math.exp(-0.7 * lai);
  const rn = w.ih > 650
    ? (1 - inp.shadingFactor)  * inp.sensibleHeatFactor * (1 - albedo) * tau * extinction * w.ih
    : w.ih > 550
    ? (1 - inp.shadingFactor1) * inp.sensibleHeatFactor * (1 - albedo) * tau * extinction * w.ih
    :                            inp.sensibleHeatFactor * tau * (1 - albedo) * extinction * w.ih;

  const xSatAir = 5.5638 * Math.exp(0.0572 * indoorT);
  const xActAir = xSatAir * indoorRH / 100;
  const vaporDiff = xSatAir - xActAir;
  const rE = 200 * (Math.pow(lf, 0.2) / Math.pow(0.5, 0.8));
  const rI = 82
    * (((rn / 2 * lai) + 4.3) / ((rn / 2 * lai) + 0.54))
    * (1 + 0.023 * Math.pow(indoorT - 24.5, 2));
  const epsilon = 0.7584 * Math.exp(0.0518 * indoorT);
  const etStanghelini = (2 * lai / ((1 + epsilon) * rE + rI))
    * (vaporDiff + ((epsilon * rE * rn) / (2 * lai * lv)));
  const etStangheliniW = etStanghelini * lv;
  const es = 0.61078 * Math.exp(17.27 * indoorT / (indoorT + 237.3));
  const ea = (indoorRH / 100) * es;
  const delta = (4098 * es) / Math.pow(indoorT + 237.3, 2);
  const etC = (delta * rn + 1200 * (es - ea) / rE)
    / (2450 * (delta + 0.067 * (1 + rI / rE)));
  const transpiration = etC * lv;

  return {
    rn, xSatAir, xActAir, vaporDiff,
    rE, rI, epsilon,
    etStanghelini, etStangheliniW,
    es, ea, delta,
    etC, transpiration,
  };
};