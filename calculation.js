/**
 * calculation.js
 * Calculates one row of the Calculation tab given:
 *   - inp: the full input object  { ...defaultPrimary(), ...INPUTS(primary) }
 *   - w:   the full weather row   { ...defaultWeather(), ...WEATHER(weather) }
 *   - southRoofIt: Global tilted radiation on south roof (W/m²) from SOUTH ROOF tab
 *   - northRoofIt: Global tilted radiation on north roof (W/m²) from NORTH ROOF tab
 *   - transpiration: transpiration rate (W/m²) from Transpiration tab
 *
 * Columns moved to weather.js (excluded here):
 *   Indoor Temperature, Indoor RH, Indoor Humidity Ratio
 *
 * Columns excluded (time/index — same as weather row):
 *   Hr, Day, Month, Day of Month, Hour of the day
 *
 * Columns excluded (fixed-equipment summaries unrelated to per-row calc):
 *   Sensible Capacity, Column4 (total capacity sizing constants)
 */

"use strict";

const CALCULATION_DERIVED = [
  { id:"qR",              label:"Total transmitted radiation (Q_r)",              unit:"W"     },
  { id:"qS",              label:"Total solar heat gain (Q_s)",                    unit:"W"     },
  { id:"qSl",             label:"Heat gain from supplemental lighting (Q_sl)",    unit:"W"     },
  { id:"qM",              label:"Heat gain from air circulation fans (Q_m)",      unit:"W"     },
  { id:"qCo2",            label:"Heat gain from CO2 generators (Q_CO2)",          unit:"W"     },
  { id:"qE",              label:"Transpiration loss (Q_e)",                       unit:"W"     },
  { id:"qG",              label:"Heat loss through floor (Q_g)",                  unit:"W"     },
  { id:"qP",              label:"Perimeter heat loss (Q_p)",                      unit:"W"     },
  { id:"qI",              label:"Heat transfer air exchange (Q_i)",               unit:"W"     },
  { id:"qT",              label:"Transmission heat transfer (Q_t)",               unit:"W"     },
  { id:"sources",         label:"Sources",                                        unit:"W"     },
  { id:"sinks",           label:"Sinks",                                          unit:"W"     },
  { id:"qH",              label:"Heating/Cooling requirement (Q_h)",              unit:"W"     },
  { id:"heatingPerArea",  label:"Heating req per area",                           unit:"W/m²"  },
  { id:"coolingPerArea",  label:"Cooling req per area",                           unit:"W/m²"  },
  { id:"qsPerArea",       label:"Q_s per area",                                   unit:"W/m²"  },
  { id:"qePerArea",       label:"Q_e per area",                                   unit:"W/m²"  },
  { id:"totalLoad",       label:"Total load",                                     unit:"W/m²"  },
  { id:"shr",             label:"SHR",                                            unit:""      },
];

// All formulas mirror the Excel Calculation tab row formulas exactly.
// inp  = { ...primaryInputs, ...INPUTS(primary) }
// w    = { ...weatherRow,    ...WEATHER(weatherRow) }
const CALCULATION = (inp, w, southRoofIt, northRoofIt, transpiration) => {
  const qR = w.ih > 650
    ? (1 - inp.shadingFactor)  * inp.transmissivitySolar * (inp.areaSouthRoof * southRoofIt + inp.areaNorthRoof * northRoofIt)
    : w.ih > 550
    ? (1 - inp.shadingFactor1) * inp.transmissivitySolar * (inp.areaSouthRoof * southRoofIt + inp.areaNorthRoof * northRoofIt)
    :                            inp.transmissivitySolar * (inp.areaSouthRoof * southRoofIt + inp.areaNorthRoof * northRoofIt);
  const qS = inp.sensibleHeatFactor * qR;
  // NOTE: the original spreadsheet formula used the sequential index column
  // (sl, 1..8760) here instead of the daily clock-hour column (hour, 0..23),
  const qSl = (w.hour < 22 && w.hour > 7 && w.ih < 250)
    ? inp.installedLightingWattage * inp.heatConversionFactor * inp.lightingAllowanceFactor * inp.floorArea
    : 0;

  const qM = inp.numberOfFans * (inp.motorPower / inp.motorEfficiency) * inp.motorLoadFactor * inp.motorUseFactor;
  const qCo2 = w.ih > 0
    ? 0.278 * inp.netHeatingValueFuel * inp.co2SupplyRate * (inp.floorArea / inp.co2ProductionRate)
    : 0;
  const qE = transpiration * inp.floorArea;
  const qG = (inp.soilThermalConductivity / inp.subsoilDepth) * inp.floorArea * (w.indoorTemperature - inp.soilTemperature);
  const qP = inp.perimeterHeatLossFactorFp * inp.perimeter * (w.indoorTemperature - w.tDryBulb);
  const qI = 1.2 * (inp.infiltrationRateN / 3600) * inp.volume
    * ((1005 * (w.indoorTemperature - w.tDryBulb)) + inp.latentHeatVaporization * (w.indoorHumidityRatio - w.outdoorHumidityRatio));
  const qT = (inp.uCoverWithScreen * (inp.areaSouthRoof + inp.areaNorthRoof)
             + inp.uNonTransparentWalls * (inp.nonTranspSouthWall + inp.nonTranspNorthWall + inp.nonTranspEastWall + inp.nonTranspWestWall))
             * (w.indoorTemperature - w.tDryBulb);
  const sources = qS + qSl + qCo2 + qM;
  const sinks   = qE + qG + qP + qI + qT;
  const qH      = sources - sinks;
  const heatingPerArea = qH < 0 ? qH / inp.floorArea : 0;
  const coolingPerArea = qH < 0 ? 0 : qH / inp.floorArea;
  const qsPerArea      = qS / inp.floorArea;
  const qePerArea      = qE / inp.floorArea;
  const totalLoad      = coolingPerArea + qePerArea;
  const shr            = totalLoad !== 0 ? coolingPerArea / totalLoad : 0;

  return {
    qR, qS, qSl, qM, qCo2,
    qE, qG, qP, qI, qT,
    sources, sinks, qH,
    heatingPerArea, coolingPerArea,
    qsPerArea, qePerArea, totalLoad, shr,
  };
};