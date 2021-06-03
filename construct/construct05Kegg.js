// -- Operations -- //


// Specify keys to use, and where to search
// Most are `null` for now, just to kick it all off
let keySpec = {
  "SMILES": null,
  "Name": null,
  "Alias": "alias",
  "Molecular Formula": null,
  "KEGG ID": "id",
  "HMDB ID": null,
  "CAS Registry Number": null,
  "InChI": null,
  "InChI Key": null
};

// Fetch KEGG List Compound, clean up, and finalise (JSON and TSV)
console.log("%cFetching KEGG List Compound", "color:orange;");
fetch("https://kegg.cheminfo.org/list/compound")
  .then(r => r.text())
  .then(cleanText)
  .then(data => finalise(data, keySpec));


// -- Function definitions -- //


// Abstracted operations for preparing output data
function prepareOutput(data, keySpec) {
  // Create table TSV string (a bit tricky, so done first)
  let tableString = data.reduce(
    (a, c) => reduceToTable(a, c, keySpec),
    `${Object.keys(keySpec).join("\t")}\n`);
  // Initialise output object (decided not to use getters)
  let op = {
    klc: {string: `${JSON.stringify(data, null, 2)}\n`},
    table: {string: tableString}
  };
  // Make the blobs
  op.klc.blob = new Blob(
    [op.klc.string],
    {type: "application/json"});
  op.table.blob = new Blob(
    [op.table.string],
    {type: "text/tab-separated-values"});
  // Prepare the file details
  op.klc.file = {
    blob: op.klc.blob,
    filename: "outCollect09Kegg.json",
    buttonText: "Download KLC JSON"
  };
  op.table.file = {
    blob: op.table.blob,
    filename: "outCollect09Kegg.tsv",
    buttonText: "Download KLC TSV"
  };
  // All done here
  return op;
};


// Abstracted reducer for collapsing KLC data to TSV
function reduceToTable(accumulator, current, keySpec) {
  let nstring = new Array();
  for (let k in keySpec) {
    let v = current[keySpec[k]] || '';
    nstring.push((k === "Alias" && Array.isArray(v)) ? v.join("|") : v);
  };
  return accumulator += `${nstring.join("\t")}\n`;
};


// Helper to finish off operations
// - Find button box, prepare data, place buttons
function finalise(data, keySpec) {
  let spot = document.querySelector("#dlklc");
  let op = prepareOutput(data, keySpec);
  spot.innerHTML = '';
  spot.append(downloadBlobButton(op.klc.file));
  spot.append(downloadBlobButton(op.table.file));
  console.log(
    "%cKEGG List Compound collected and processed",
    "color:lightgreen;");
  return;
};


// Helper function for making a button to download a Blob
function downloadBlobButton(data) {
  let button = document.createElement("button");
  let buttonText = data.buttonText == null ? "Download file" : data.buttonText;
  button.classList.add("submit-button");
  button.innerHTML = buttonText;
  button.addEventListener("click", _ => (downloadBlob(data)));
  return button;
};


// Helper function to download a Blob
function downloadBlob(data) {
  let anchor = document.createElement("a");
  let uri = URL.createObjectURL(data.blob);
  anchor.setAttribute("download", data.filename);
  anchor.setAttribute("href", uri);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(uri);
  return;
};


// Specific version of downloadBlob to convert an Object to a JSON string
function downloadJson(data) {
  let string = `${JSON.stringify(data.json, null, 2)}\n`;
  let fname = data.filename == null ? "json.json" : data.filename;
  let blob = new Blob([string], {type: "application/json"});
  downloadBlob({blob: blob, filename: fname});
  return;
};


// Helper function for cleaning the entire raw TSV received from KEGG
function cleanText(text) {
  return text
    .replace(/\r/g, '')
    .trimEnd()
    .split(/\n/)
    .map(s => cleanTextEntry(s.split(/\t/)));
};


// Helper function for cleaning the KLC text for one entry
function cleanTextEntry(entry) {
  return {id: entry[0].replace(/^cpd:/, ''), alias: entry[1].split(/; /)};
};
