/**
 * roof.js
 * Calculates global tilted radiation (It) for one row on a tilted roof surface,
 * mirroring the SOUTH ROOF and NORTH ROOF tabs.
 *
 * The two tabs are identical except for the surface azimuth used in cost2/cost4/cost5:
 *   SOUTH ROOF → inp.azimuthSouthRoof  (B33)
 *   NORTH ROOF → inp.azimuthNorthRoof  (B34)
 *
 * Usage:
 *   const southRoof = ROOF(inp, w, inp.azimuthSouthRoof);
 *   const northRoof = ROOF(inp, w, inp.azimuthNorthRoof);
 *   // pass southRoof.it and northRoof.it into CALCULATION()
 */

"use strict";

const ROOF_DERIVED = [
  { id:"day",         label:"Day of year",                                    unit:""      },
  { id:"ndeg",        label:"Day angle (ndeg)",                               unit:"°"     },
  { id:"eqnTime",     label:"Equation of time (eqntime)",                     unit:"min"   },
  { id:"eot",         label:"Equation of time alternate (EoT)",               unit:"min"   },
  { id:"tc",          label:"Time correction factor (TC)",                     unit:"min"   },
  { id:"lst",         label:"Local solar time (LST)",                         unit:"hr"    },
  { id:"hourAngle",   label:"Hour angle",                                      unit:"°"     },
  { id:"declination", label:"Declination",                                     unit:"°"     },
  { id:"beta",        label:"Solar altitude angle (Beta)",                     unit:"°"     },
  { id:"sinPhi",      label:"sin(phi)",                                        unit:""      },
  { id:"cosPhi",      label:"cos(phi)",                                        unit:""      },
  { id:"phi",         label:"Azimuth angle (phi)",                             unit:"°"     },
  { id:"costz",       label:"cos(zenith)",                                     unit:""      },
  { id:"zenith",      label:"Zenith angle (Z)",                                unit:"°"     },
  { id:"cost1",       label:"cos(theta) term 1",                              unit:""      },
  { id:"cost2",       label:"cos(theta) term 2",                              unit:""      },
  { id:"cost3",       label:"cos(theta) term 3",                              unit:""      },
  { id:"cost4",       label:"cos(theta) term 4",                              unit:""      },
  { id:"cost5",       label:"cos(theta) term 5",                              unit:""      },
  { id:"cost",        label:"cos(theta) total",                               unit:""      },
  { id:"rb",          label:"Beam radiation tilt factor (Rb)",                 unit:""      },
  { id:"gsc",         label:"Extraterrestrial irradiance (Gsc)",               unit:"W/m²"  },
  { id:"gscHorz",     label:"Horizontal extraterrestrial irradiance (Gsc_h)",  unit:"W/m²"  },
  { id:"ghi",         label:"Global horizontal irradiance (GHI)",              unit:"W/m²"  },
  { id:"kt",          label:"Clearness index (kt)",                            unit:""      },
  { id:"idl",         label:"Diffuse fraction (Idl)",                          unit:""      },
  { id:"id",          label:"Diffuse component (Id)",                          unit:"W/m²"  },
  { id:"ib",          label:"Beam component (Ib)",                             unit:"W/m²"  },
  { id:"ai",          label:"Anisotropic index (Ai)",                          unit:""      },
  { id:"f",           label:"Modulating factor (F)",                           unit:""      },
  { id:"it",          label:"Global tilted radiation (It)",                    unit:"W/m²"  },
];

const D2R = Math.PI / 180;  // degrees to radians
const R2D = 180 / Math.PI;  // radians to degrees

// inp         = { ...primaryInputs, ...INPUTS(primary) }
// w           = { ...weatherRow,    ...WEATHER(weatherRow) }
// surfaceAzimuth = inp.azimuthSouthRoof  or  inp.azimuthNorthRoof  (degrees)
const ROOF = (inp, w, surfaceAzimuth) => {
  const lat   = inp.latitude;
  const lon   = inp.longitude;
  const lst   = inp.lstMeridian;
  const tilt  = inp.roofTilt;
  const rho   = inp.groundReflectivity;
  const hr    = w.sl;       // sequential hour index (1-based)
  const lt    = w.hour;     // local clock hour

  // [C] Day of year
  const day = Math.ceil(hr / 24);

  // [D] Day angle (degrees)
  const ndeg = (day - 1) * 360 / 365;

  // [E] Equation of time (minutes) — Spencer formula
  const eqnTime = 229.2 * (
    0.000075
    + 0.001868 * Math.cos(ndeg * D2R)
    - 0.032077 * Math.sin(ndeg * D2R)
    - 0.014615 * Math.cos(2 * ndeg * D2R)
    - 0.04089  * Math.sin(2 * ndeg * D2R)
  );

  // [F] Equation of time alternate
  const eot = 9.87  * Math.sin((720 / 365) * (day - 81) * D2R)
            - 7.53  * Math.cos((360 / 365) * (day - 81) * D2R)
            - 1.5   * Math.sin((360 / 365) * (day - 81) * D2R);

  // [G] Time correction factor (minutes)
  const tc = 4 * (lon - lst) + eot;

  // [H] Local solar time (hours)
  const lstHr = lt + tc / 60;

  // [I] Hour angle (degrees)
  const hourAngle = 15 * (lstHr - 12);

  // [J] Declination (degrees)
  const declination = 23.45 * Math.sin(2 * Math.PI * (day + 284) / 365);

  // [K] Solar altitude angle Beta (degrees)
  const beta = R2D * Math.asin(
    Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
    + Math.sin(lat * D2R) * Math.sin(declination * D2R)
  );

  // [L] sin(phi)
  const sinPhi = Math.sin(hourAngle * D2R) * Math.cos(declination * D2R);

  // [M] cos(phi)
  const cosPhi = Math.cos(hourAngle * D2R) * Math.cos(declination * D2R) * Math.sin(lat * D2R)
               - Math.sin(declination * D2R) * Math.cos(lat * D2R);

  // [N] Solar azimuth angle (degrees)
  const phi = Math.atan2(cosPhi, sinPhi) * R2D;

  // [O] cos(zenith)
  const costz = Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
              + Math.sin(lat * D2R) * Math.sin(declination * D2R);

  // [P] Zenith angle (degrees)
  const zenith = R2D * Math.acos(Math.max(-1, Math.min(1, costz)));

  // [Q-U] cos(theta) components — surfaceAzimuth differs between south/north roof
  const cost1 = Math.sin(declination * D2R) * Math.sin(lat * D2R) * Math.cos(tilt * D2R);
  const cost2 = Math.sin(declination * D2R) * Math.cos(lat * D2R) * Math.sin(tilt * D2R) * Math.cos(surfaceAzimuth * D2R);
  const cost3 = Math.cos(declination * D2R) * Math.cos(lat * D2R) * Math.cos(tilt * D2R) * Math.cos(hourAngle * D2R);
  const cost4 = Math.cos(declination * D2R) * Math.sin(lat * D2R) * Math.sin(tilt * D2R) * Math.cos(surfaceAzimuth * D2R) * Math.cos(hourAngle * D2R);
  const cost5 = Math.cos(declination * D2R) * Math.sin(tilt * D2R) * Math.sin(surfaceAzimuth * D2R) * Math.sin(hourAngle * D2R);

  // [V] cos(theta) total
  const cost = cost1 - cost2 + cost3 + cost4 + cost5;

  // [W] Rb — beam tilt factor, clamped to [0, 2.8]
  const rb = (cost < 0 || costz < 0) ? 0 : Math.min(cost / costz, 2.8);

  // [X] Extraterrestrial irradiance Gsc (W/m²)
  const gsc = 1367 * (1 + 0.033 * Math.cos(360 * (day - 3) / 365 * D2R));

  // [Y] Horizontal extraterrestrial irradiance (W/m²)
  const gscHorzRaw = gsc * (
    Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
    + Math.sin(lat * D2R) * Math.sin(declination * D2R)
  );
  const gscHorz = gscHorzRaw < 0 ? 0 : gscHorzRaw;

  // [Z] GHI — taken directly from weather row
  const ghi = w.ih;

  // [AA] Clearness index kt
  const kt = (ghi > 0 && gscHorz > 0) ? Math.min(ghi / gscHorz, 1) : null;

  // [AB] Diffuse fraction Idl (Erbs model)
  let idl = null;
  if (kt !== null) {
    if      (kt <= 0.22)              idl = 1 - 0.09 * kt;
    else if (kt <= 0.80)              idl = 0.9511 - 0.1604*kt + 4.388*kt**2 - 16.638*kt**3 + 12.336*kt**4;
    else                              idl = 0.165;
  }

  // [AC] Diffuse component Id (W/m²)
  const id = idl !== null ? idl * ghi : null;

  // [AD] Beam component Ib (W/m²)
  const ib = id !== null ? ghi - id : null;

  // [AE] Anisotropic index Ai
  const ai = (ib !== null && gscHorz > 0) ? ib / gscHorz : null;

  // [AF] Modulating factor F
  const f = (ib !== null && ghi > 0) ? Math.sqrt(ib / ghi) : null;

  // [AG] Global tilted radiation It (W/m²) — Perez model
  let it = 0;
  if (ai !== null && f !== null && id !== null && ib !== null) {
    it = ib * rb
       + id * ai * rb
       + id * (1 - ai) * (1 + Math.cos(tilt * D2R)) / 2 * (1 + f * Math.pow(Math.sin(0.5 * tilt * D2R), 3))
       + ghi * rho * (1 - Math.cos(tilt * D2R)) / 2;
  }

  return {
    day, ndeg, eqnTime, eot, tc, lst: lstHr,
    hourAngle, declination, beta,
    sinPhi, cosPhi, phi,
    costz, zenith,
    cost1, cost2, cost3, cost4, cost5, cost,
    rb, gsc, gscHorz, ghi,
    kt, idl, id, ib, ai, f,
    it,
  };
};

// ── Example usage ─────────────────────────────────────────────────────────────
// const southRoof = ROOF(allInputs, allWeather, allInputs.azimuthSouthRoof);
// const northRoof = ROOF(allInputs, allWeather, allInputs.azimuthNorthRoof);
// const t   = TRANSPIRATION(allInputs, allWeather);
// const row = CALCULATION(allInputs, allWeather, southRoof.it, northRoof.it, t.transpiration);