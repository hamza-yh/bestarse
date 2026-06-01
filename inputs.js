/**
 * app.js
 * Defines the input schema, renders form fields, reads values,
 * calls formulas.js, and displays results.
 */

"use strict";

const GREENHOUSE_INPUTS = [
 
  // ── SECTION 1: Location & Orientation ──────────────────────────────────────
  { id:"latitude",                  label:"Latitude",                                    unit:"°N",         default:28.12,  section:"location",    subsection:"coordinates" },
  { id:"longitude",                 label:"Longitude",                                   unit:"°E",         default:35.32,  section:"location",    subsection:"coordinates" },
  { id:"timeZoneUTC",               label:"Time Zone (UTC)",                             unit:"hrs",        default:3,      section:"location",    subsection:"coordinates" },
  { id:"azimuthTurn",               label:"Azimuth Turn",                                unit:"degrees",    default:45,     section:"location",    subsection:"orientation" },
  { id:"wallsTilt",                 label:"Walls tilt",                                  unit:"degrees",    default:90,     section:"location",    subsection:"orientation" },
  { id:"roofTilt",                  label:"Roof tilt",                                   unit:"degrees",    default:22,     section:"location",    subsection:"orientation" },
 
  // ── SECTION 2: Structure ────────────────────────────────────────────────────
  { id:"numberOfBays",              label:"Number of bays",                              unit:"",           default:4,      section:"structure",   subsection:"geometry" },
  { id:"length",                    label:"Length",                                      unit:"m",          default:194,    section:"structure",   subsection:"geometry" },
  { id:"spanWidth",                 label:"Span Width",                                  unit:"m",          default:12,     section:"structure",   subsection:"geometry" },
  { id:"totalWidth",                label:"Total Width",                                 unit:"m",          default:48,     section:"structure",   subsection:"geometry" },
  { id:"ridgeHeight",               label:"Ridge Height",                                unit:"m",          default:7,      section:"structure",   subsection:"geometry" },
  { id:"gutterHeight",              label:"Gutter Height",                               unit:"m",          default:4.5,    section:"structure",   subsection:"geometry" },
  { id:"heightTransparentWall",     label:"Height of transparent wall",                  unit:"m",          default:0,      section:"structure",   subsection:"geometry" },
  { id:"heightNonTransparentWall",  label:"Height of non-transparent wall",              unit:"m",          default:4.5,    section:"structure",   subsection:"geometry" },
 
  { id:"transmissivitySolar",       label:"Transmissivity to solar radiation",           unit:"",           default:0.9,    section:"structure",   subsection:"covering" },
  { id:"transmissivityLongwave",    label:"Transmissivity to long-wave radiation",       unit:"",           default:0,      section:"structure",   subsection:"covering" },
  { id:"emissivityIRBarrier",       label:"Emissivity of IR barrier poly cover",         unit:"",           default:0.2,    section:"structure",   subsection:"covering" },
  { id:"uCoverNoScreen",            label:"U-value of cover without screen",             unit:"W m-2K-1",   default:6.9,    section:"structure",   subsection:"covering" },
  { id:"uCoverWithScreen",          label:"U-value of cover with screen",                unit:"W m-2K-1",   default:1.19,   section:"structure",   subsection:"covering" },
 
  { id:"uTransparentWalls",         label:"U-value transparent walls",                   unit:"W m-2K-1",   default:0,      section:"structure",   subsection:"walls" },
  { id:"uNonTransparentWalls",      label:"U-value non-transparent walls",               unit:"W m-2K-1",   default:0.36,   section:"structure",   subsection:"walls" },
  { id:"transmissivitySolarWalls",  label:"Transmissivity to solar radiation (walls)",   unit:"",           default:0,      section:"structure",   subsection:"walls" },
  { id:"transmissivityLongwaveWalls",label:"Transmissivity to long-wave radiation (walls)",unit:"",         default:0,      section:"structure",   subsection:"walls" },
  { id:"thermalConductivityPlywood",   label:"Thermal conductivity of plywood",          unit:"W m-1K-1",   default:0.12,   section:"structure",   subsection:"walls" },
  { id:"thermalConductivityPolystyrene",label:"Thermal conductivity of polystyrene",     unit:"W m-1K-1",   default:0.03,   section:"structure",   subsection:"walls" },
  { id:"perimeterHeatLossFactorFp",    label:"Perimeter heat loss factor (Fp)",          unit:"W m-1K-1",   default:0.85,   section:"structure",   subsection:"walls" },
 
  // ── SECTION 3: Crop ─────────────────────────────────────────────────────────
  { id:"leafAreaIndexTomato",       label:"Leaf area index",                             unit:"",           default:3,      section:"crop",        subsection:"plant" },
  { id:"leafLengthTomato",          label:"Characteristic leaf length",                  unit:"m",          default:0.027,  section:"crop",        subsection:"plant" },
  { id:"plantEmissivity",           label:"Emissivity coefficient of plants",            unit:"",           default:0.9,    section:"crop",        subsection:"plant" },
  { id:"plantAlbedo",               label:"Plant albedo",                                unit:"",           default:0.2,    section:"crop",        subsection:"plant" },
 
  { id:"soilThermalConductivity",   label:"Thermal conductivity of soil",                unit:"W m-1K-1",   default:0,      section:"crop",        subsection:"soil" },
  { id:"soilTemperature",           label:"Soil temperature",                            unit:"°C",         default:15,     section:"crop",        subsection:"soil" },
  { id:"subsoilDepth",              label:"Depth of subsoil",                            unit:"m",          default:3,      section:"crop",        subsection:"soil" },
 
  // ── SECTION 4: Environment ──────────────────────────────────────────────────
  { id:"indoorSetpointDay",         label:"Temperature setpoint (day)",                  unit:"°C",         default:25,     section:"environment", subsection:"climate" },
  { id:"indoorSetpointNight",       label:"Temperature setpoint (night)",                unit:"°C",         default:16,     section:"environment", subsection:"climate" },
  { id:"indoorSetpointRHDay",       label:"Relative humidity setpoint (day)",            unit:"%",          default:75,     section:"environment", subsection:"climate" },
  { id:"indoorSetpointRHNight",     label:"Relative humidity setpoint (night)",          unit:"%",          default:90,     section:"environment", subsection:"climate" },
  { id:"infiltrationRateN",         label:"Infiltration rate per hour (N)",              unit:"",           default:0.5,    section:"environment", subsection:"climate" },
  { id:"indoorAirVelocity",         label:"Indoor air velocity",                         unit:"m/s",        default:0.5,    section:"environment", subsection:"climate" },
 
  { id:"numberOfFans",              label:"Number of recirculating fans",                unit:"",           default:8,      section:"environment", subsection:"equipment" },
  { id:"motorPower",                label:"Rated power of motors",                       unit:"W",          default:0,      section:"environment", subsection:"equipment" },
  { id:"motorEfficiency",           label:"Motor efficiency",                            unit:"",           default:0.9,    section:"environment", subsection:"equipment" },
  { id:"motorLoadFactor",           label:"Motor load factor",                           unit:"",           default:1,      section:"environment", subsection:"equipment" },
  { id:"motorUseFactor",            label:"Motor use factor",                            unit:"",           default:1,      section:"environment", subsection:"equipment" },
  { id:"installedLightingWattage",  label:"Installed lighting wattage",                  unit:"W m-2",      default:0,      section:"environment", subsection:"equipment" },
  { id:"heatConversionFactor",      label:"Heat conversion factor",                      unit:"",           default:0.75,   section:"environment", subsection:"equipment" },
  { id:"lightingAllowanceFactor",   label:"Lighting allowance factor",                   unit:"",           default:1.2,    section:"environment", subsection:"equipment" },
 
  { id:"netHeatingValueFuel",       label:"Net heating value of fuel",                   unit:"MJ m-3",     default:0,      section:"environment", subsection:"co2" },
  { id:"co2SupplyRate",             label:"Rate of CO2 supply",                          unit:"g m-2 h-1",  default:4.5,    section:"environment", subsection:"co2" },
  { id:"co2ProductionRate",         label:"CO2 production rate",                         unit:"kg/kg fuel", default:2.7,    section:"environment", subsection:"co2" },
 
  { id:"latentHeatVaporization",    label:"Latent heat of water vaporization",           unit:"kJ kg-1",    default:2450,   section:"environment", subsection:"constants" },
  { id:"stefanBoltzmann",           label:"Stefan-Boltzmann constant",                   unit:"W m-2 K-4",  default:5.67e-8,section:"environment", subsection:"constants" },
  { id:"groundReflectivity",        label:"Reflectivity of outdoor ground",              unit:"",           default:0.5,    section:"environment", subsection:"constants" },
  { id:"psychrometricConstant",     label:"Psychrometric constant",                      unit:"Pa/°C",      default:66,     section:"environment", subsection:"constants" },
  { id:"airDensity",                label:"Density of air",                              unit:"kg/m3",      default:1.117,  section:"environment", subsection:"constants" },
  { id:"specificHeatAir",           label:"Specific heat capacity of air",               unit:"J kg-1°C-1", default:1003.5, section:"environment", subsection:"constants" },
  { id:"sensibleHeatFactor",        label:"Sensible heat factor",                        unit:"",           default:1,      section:"environment", subsection:"constants" },
 
];

const GREENHOUSE_DERIVED = [
  { id:"lstMeridian",       label:"Local Standard Time Meridian", unit:"degrees" },

  { id:"areaSouthRoof",     label:"South roof",                   unit:"m²" },
  { id:"areaNorthRoof",     label:"North roof",                   unit:"m²" },
  { id:"areaSouthWall",     label:"South wall",                   unit:"m²" },
  { id:"areaNorthWall",     label:"North wall",                   unit:"m²" },
  { id:"areaEastWall",      label:"East wall",                    unit:"m²" },
  { id:"areaWestWall",      label:"West wall",                    unit:"m²" },
  { id:"floorArea",         label:"Floor area",                   unit:"m²" },
  { id:"perimeter",         label:"Perimeter",                    unit:"m" },
  { id:"volume",            label:"Volume",                       unit:"m³" },

  { id:"transpSouthRoof",   label:"Transparent south roof",       unit:"m²" },
  { id:"transpNorthRoof",   label:"Transparent north roof",       unit:"m²" },
  { id:"transpSouthWall",   label:"Transparent south wall",       unit:"m²" },
  { id:"transpNorthWall",   label:"Transparent north wall",       unit:"m²" },
  { id:"transpEastWall",    label:"Transparent east wall",        unit:"m²" },
  { id:"transpWestWall",    label:"Transparent west wall",        unit:"m²" },

  { id:"nonTranspSouthRoof",label:"Non-transparent south roof",   unit:"m²" },
  { id:"nonTranspNorthRoof",label:"Non-transparent north roof",   unit:"m²" },
  { id:"nonTranspSouthWall",label:"Non-transparent south wall",   unit:"m²" },
  { id:"nonTranspNorthWall",label:"Non-transparent north wall",   unit:"m²" },
  { id:"nonTranspEastWall", label:"Non-transparent east wall",    unit:"m²" },
  { id:"nonTranspWestWall", label:"Non-transparent west wall",    unit:"m²" },

  { id:"azimuthSouthWall",  label:"South wall azimuth",           unit:"degrees" },
  { id:"azimuthNorthWall",  label:"North wall azimuth",           unit:"degrees" },
  { id:"azimuthEastWall",   label:"East wall azimuth",            unit:"degrees" },
  { id:"azimuthWestWall",   label:"West wall azimuth",            unit:"degrees" },
  { id:"azimuthSouthRoof",  label:"South roof azimuth",           unit:"degrees" },
  { id:"azimuthNorthRoof",  label:"North roof azimuth",           unit:"degrees" },

  { id:"shadingFactor",     label:"Shading factor",               unit:"" },
  { id:"shadingFactor1",    label:"Shading factor 1",             unit:"" },
];

const INPUTS = (p) => ({
  // location
  lstMeridian:      p.timeZoneUTC * 15,

  // geometry areas
  areaSouthRoof:    Math.sqrt((0.5*p.spanWidth)**2 + (p.ridgeHeight-p.gutterHeight)**2) * p.length * p.numberOfBays,
  areaNorthRoof:    Math.sqrt((0.5*p.spanWidth)**2 + (p.ridgeHeight-p.gutterHeight)**2) * p.length * p.numberOfBays,
  areaSouthWall:    p.gutterHeight * p.length,
  areaNorthWall:    p.gutterHeight * p.length,
  areaEastWall:     (p.spanWidth*p.gutterHeight + 0.5*p.spanWidth*(p.ridgeHeight-p.gutterHeight)) * p.numberOfBays,
  areaWestWall:     (p.spanWidth*p.gutterHeight + 0.5*p.spanWidth*(p.ridgeHeight-p.gutterHeight)) * p.numberOfBays,
  floorArea:        p.length * p.spanWidth * p.numberOfBays,
  perimeter:        2 * (p.length + p.totalWidth),
  volume:           p.length * p.spanWidth * p.numberOfBays * p.gutterHeight,

  // transparent areas
  transpSouthRoof:  Math.sqrt((0.5*p.spanWidth)**2 + (p.ridgeHeight-p.gutterHeight)**2) * p.length * p.numberOfBays,
  transpNorthRoof:  Math.sqrt((0.5*p.spanWidth)**2 + (p.ridgeHeight-p.gutterHeight)**2) * p.length * p.numberOfBays,
  transpSouthWall:  p.heightTransparentWall * p.length,
  transpNorthWall:  p.heightTransparentWall * p.length,
  transpEastWall:   p.heightTransparentWall * p.spanWidth * p.numberOfBays,
  transpWestWall:   p.heightTransparentWall * p.spanWidth * p.numberOfBays,

  // non-transparent areas
  nonTranspSouthRoof: 0,
  nonTranspNorthRoof: 0,
  nonTranspSouthWall: p.length * p.heightNonTransparentWall,
  nonTranspNorthWall: p.length * p.heightNonTransparentWall,
  nonTranspEastWall:  (p.spanWidth*p.gutterHeight + 0.5*p.spanWidth*(p.ridgeHeight-p.gutterHeight)) * p.numberOfBays,
  nonTranspWestWall:  (p.spanWidth*p.gutterHeight + 0.5*p.spanWidth*(p.ridgeHeight-p.gutterHeight)) * p.numberOfBays,

  // azimuths
  azimuthSouthWall: 0   + p.azimuthTurn,
  azimuthNorthWall: 180 + p.azimuthTurn,
  azimuthEastWall:  -90 + p.azimuthTurn,
  azimuthWestWall:  90  + p.azimuthTurn,
  azimuthSouthRoof: 0   + p.azimuthTurn,
  azimuthNorthRoof: 180 + p.azimuthTurn,

  // shading
  shadingFactor:    1 - (1 - 0.65) * (1 - 0.32),
  shadingFactor1:   1 - (1 - 0.65),
});

// ── Helper: build a primary object from GREENHOUSE_INPUTS defaults ────────────
const defaultInputs = () =>
  Object.fromEntries(GREENHOUSE_INPUTS.map(({ id, default: val }) => [id, val]));