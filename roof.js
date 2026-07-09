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

// surfaceAzimuth = inp.azimuthSouthRoof  or  inp.azimuthNorthRoof
const ROOF = (inp, w, surfaceAzimuth) => {
  const lat   = inp.latitude;
  const lon   = inp.longitude;
  const lst   = inp.lstMeridian;
  const tilt  = inp.roofTilt;
  const rho   = inp.groundReflectivity;
  const hr    = w.sl;
  const lt    = w.hour;
  const day = Math.ceil(hr / 24);
  const ndeg = (day - 1) * 360 / 365;
    if (hr == 8) { console.log(day)}

  const eqnTime = 229.2 * (
    0.000075
    + 0.001868 * Math.cos(ndeg * D2R)
    - 0.032077 * Math.sin(ndeg * D2R)
    - 0.014615 * Math.cos(2 * ndeg * D2R)
    - 0.04089  * Math.sin(2 * ndeg * D2R)
  );

  const eot = 9.87  * Math.sin((720 / 365) * (day - 81) * D2R)
            - 7.53  * Math.cos((360 / 365) * (day - 81) * D2R)
            - 1.5   * Math.sin((360 / 365) * (day - 81) * D2R);

  const tc = 4 * (lon - lst) + eot;
  const lstHr = lt + tc / 60;
  const hourAngle = 15 * (lstHr - 12);
  const declination = 23.45 * Math.sin(2 * Math.PI * (day + 284) / 365);
  const beta = R2D * Math.asin(
    Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
    + Math.sin(lat * D2R) * Math.sin(declination * D2R)
  );

  const sinPhi = Math.sin(hourAngle * D2R) * Math.cos(declination * D2R);
  const cosPhi = Math.cos(hourAngle * D2R) * Math.cos(declination * D2R) * Math.sin(lat * D2R)
               - Math.sin(declination * D2R) * Math.cos(lat * D2R);
  const phi = Math.atan2(cosPhi, sinPhi) * R2D;
  const costz = Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
              + Math.sin(lat * D2R) * Math.sin(declination * D2R);
  const zenith = R2D * Math.acos(Math.max(-1, Math.min(1, costz)));
  const cost1 = Math.sin(declination * D2R) * Math.sin(lat * D2R) * Math.cos(tilt * D2R);
  const cost2 = Math.sin(declination * D2R) * Math.cos(lat * D2R) * Math.sin(tilt * D2R) * Math.cos(surfaceAzimuth * D2R);
  const cost3 = Math.cos(declination * D2R) * Math.cos(lat * D2R) * Math.cos(tilt * D2R) * Math.cos(hourAngle * D2R);
  const cost4 = Math.cos(declination * D2R) * Math.sin(lat * D2R) * Math.sin(tilt * D2R) * Math.cos(surfaceAzimuth * D2R) * Math.cos(hourAngle * D2R);
  const cost5 = Math.cos(declination * D2R) * Math.sin(tilt * D2R) * Math.sin(surfaceAzimuth * D2R) * Math.sin(hourAngle * D2R);
  const cost = cost1 - cost2 + cost3 + cost4 + cost5;
  const rb = (cost < 0 || costz < 0) ? 0 : Math.min(cost / costz, 2.8);
  const gsc = 1367 * (1 + 0.033 * Math.cos(360 * (day - 3) / 365 * D2R));
  const gscHorzRaw = gsc * (
    Math.cos(lat * D2R) * Math.cos(declination * D2R) * Math.cos(hourAngle * D2R)
    + Math.sin(lat * D2R) * Math.sin(declination * D2R)
  );
  const gscHorz = gscHorzRaw < 0 ? 0 : gscHorzRaw;
  const ghi = w.ih;
  const kt = (ghi > 0 && gscHorz > 0) ? Math.min(ghi / gscHorz, 1) : null;
  let idl = null;
  if (kt !== null) {
    if      (kt <= 0.22)              idl = 1 - 0.09 * kt;
    else if (kt <= 0.80)              idl = 0.9511 - 0.1604*kt + 4.388*kt**2 - 16.638*kt**3 + 12.336*kt**4;
    else                              idl = 0.165;
  }

  const id = idl !== null ? idl * ghi : null;
  const ib = id !== null ? ghi - id : null;
  const ai = (ib !== null && gscHorz > 0) ? ib / gscHorz : null;
  const f = (ib !== null && ghi > 0) ? Math.sqrt(ib / ghi) : null;
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