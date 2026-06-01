
// const defWeather = defaultWeather();
// const weather = { ...defWeather, ...WEATHER(defWeather, inputs) };

// const southRoof = ROOF(inputs, weather, inputs.azimuthSouthRoof);
// const northRoof = ROOF(inputs, weather, inputs.azimuthNorthRoof);
// const transpiration = TRANSPIRATION(inputs, weather);
// const row = CALCULATION(inputs, weather, southRoof.it, northRoof.it, transpiration.transpiration);


// console.log("TESTING GREENHOUSE CALCULATOR");
// console.log("inputs",         inputs);
// console.log("weather",        weather);
// console.log("southRoof",      southRoof);
// console.log("northRoof",      northRoof);
// console.log("transpiration",  transpiration);
// console.log("calculation",    row);

function parseWeatherCSV(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.replace(/^\uFEFF/, "").split(",").map(h => h.trim());
  return lines.map(line => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((h, i) => [h, isNaN(values[i]) ? values[i].trim() : Number(values[i])])
    );
  });
}


function calcAllRows(csvText, inputs) {
  const primaryRows = parseWeatherCSV(csvText);
 
  return primaryRows.map(primary => {
    const w          = { ...primary, ...WEATHER(primary, inputs) };
    const sRoof      = ROOF(inputs, w, inputs.azimuthSouthRoof);
    const nRoof      = ROOF(inputs, w, inputs.azimuthNorthRoof);
    const transp     = TRANSPIRATION(inputs, w);
    const calc       = CALCULATION(inputs, w, sRoof.it, nRoof.it, transp.transpiration);
 
    return {
      ...w,
      southRoof:     sRoof,
      northRoof:     nRoof,
      transpiration: transp,
      calculation:   calc,
    };
  });
}


const defInputs = defaultInputs();
const inputs = { ...defInputs, ...INPUTS(defInputs) };

(async () => {
  const csvText = await fetch("weather_csv.csv").then(r => r.text());
  const allRows = calcAllRows(csvText, inputs);
  console.log(`Processed ${allRows.length} weather rows`);
  console.log("300th row:", allRows[299]);
})();