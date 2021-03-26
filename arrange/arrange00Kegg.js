// Get the KEGG Compound fetched data JSON from the API and parse
let file = API.getData("fileKeggCompoundFetch").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Get aaaaall of the text
let text = new String();
data.forEach(d => text += d.data);

// Split the text into the compound components
let comp = text.split(/\/\/\//).map(t => t.trim()).filter(t => t !== '');

// Convert the text into a rudimentary JSON (text segments by header)
let result = comp.map(handleKeggCompoundText);

// Save the resulting data
let uc = encodeURIComponent(`${JSON.stringify(result, null, 2)}\n`);
let hr = `data:application/json;charset=utf-8,${uc}`;
let anchor = document.createElement("a");
anchor.setAttribute("download", "arrange00Kegg.json");
anchor.setAttribute("href", hr);
anchor.click();
anchor.remove();


// Break the raw KEGG Compound text into segments
function handleKeggCompoundText(text) {
  let clean = text.replace(/\r/g, '');
  let split = clean.split(/\n/).filter(c => c !== '');
  let output = new Object();
  let segment = new String();
  while (split.length) {
    let row = split[0];
    if (/^\w+/.test(row)) {
      segment = row.match(/^(?<seg>\w+)/).groups.seg.toLowerCase();
      output[segment] = new Array();
    };
    output[segment].push(row.replace(/^(\w+)?\s+/, ''));
    split = split.slice(1);
  };
  return output;
};
