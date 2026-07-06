/**
 * weather.js
 * Defines the weather data input schema for a single row,
 * and derives calculated columns from the primary inputs.
 *
 * Also owns Indoor Temperature, Indoor RH, and Indoor Humidity Ratio —
 * these are derived purely from weather (ih) and indoor setpoints,
 * so they live here rather than in the Calculation tab.
 */

"use strict";

const WEATHER_INPUTS = [
  { id:"sl",       label:"Index",                         unit:"",      default:1 },
  { id:"year",     label:"Year",                          unit:"",      default:2001 },
  { id:"month",    label:"Month",                         unit:"",      default:1 },
  { id:"day",      label:"Day",                           unit:"",      default:1 },
  { id:"hour",     label:"Hour",                          unit:"",      default:1 },
  { id:"rh",       label:"Relative Humidity",             unit:"%",     default:39 },
  { id:"tDryBulb", label:"Dry Bulb Temperature",          unit:"°C",    default:17 },
  { id:"iExh",     label:"Extraterrestrial Irradiance",   unit:"Wh/m²", default:0 },
  { id:"ih",       label:"Horizontal Irradiance",         unit:"Wh/m²", default:0 },
  { id:"iDn",      label:"Direct Normal Irradiance",      unit:"Wh/m²", default:0 },
  { id:"iDfh",     label:"Diffuse Horizontal Irradiance", unit:"Wh/m²", default:0 },
];

const WEATHER_DERIVED = [
  { id:"saturatedVaporPressure", label:"Saturated Vapor Pressure", unit:"kPa"  },
  { id:"vaporPressure",          label:"Vapor Pressure",           unit:"kPa"  },
  { id:"outdoorHumidityRatio",   label:"Outdoor Humidity Ratio",   unit:"g/kg" },
  { id:"indoorTemperature",      label:"Indoor Temperature",       unit:"°C"   },
  { id:"indoorRH",               label:"Indoor RH",                unit:"%"    },
  { id:"indoorHumidityRatio",    label:"Indoor Humidity Ratio",    unit:"g/kg" },
];

const WEATHER = (p, inp) => {
  
  const svp = 0.61078 * Math.exp((17.27 * p.tDryBulb) / (p.tDryBulb + 237.3));
  const vp = (p.rh / 100) * svp;
  const indoorT = p.ih > 0 ? inp.indoorSetpointDay : inp.indoorSetpointNight;
  const indoorRH = p.ih > 0 ? inp.indoorSetpointRHDay : inp.indoorSetpointRHNight;
  const indoorSVP = 0.61078 * Math.exp((17.27 * indoorT) / (indoorT + 237.3));
  const indoorVP = (indoorRH / 100) * indoorSVP;

  return {
    saturatedVaporPressure: svp,
    vaporPressure:          vp,
    outdoorHumidityRatio:   622 * (vp / (101.325 - vp)),
    indoorTemperature:      indoorT,
    indoorRH:               indoorRH,
    indoorHumidityRatio:    622 * (indoorVP / (101.325 - indoorVP)),
  };
};

const defaultWeather = () => Object.fromEntries(WEATHER_INPUTS.map(({ id, default: val }) => [id, val]));