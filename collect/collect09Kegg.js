// -- Operations -- //


// Pull in the required data from the API and parse as JSON
let data = API.getData("tableJson").resurrect();
let table = JSON.parse(data.trimEnd());

// Get all IDs and group into chunks of 10
let idAll = table.map(t => t["KEGG ID"]);

// Initialise the requests to the KEGG API
let requests = groupArray(idAll, 10).map(requestKeggData);

// Wait for all to finish (about 1 hour, if all goes well), and process
Promise.allSettled(requests).then(processSettled);


// -- Functions -- //


// Abstracted async function for requesting KEGG Compound data
async function requestKeggData(id, i) {
  await new Promise(_ => setTimeout(_, i * 200));
  return fetch(keggGetCompoundURI(id))
    .then(r => r.text())
    .then(t => groupKeggResponse(t).map(reduceKeggEntry));
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


// Abstracted operations to process the settled results
function processSettled(result) {
  let values = result.map(r => r._settledValueField).reduce(
    (a, cr) => {
      cr.forEach(c => a.push(c));
      return a;
    },
    []);
  let cleaned = values.map(cleanKegg);
  let string = `${JSON.stringify(cleaned, null, 2)}\n`;
  let op = {
    blob: new Blob([string], {type: "application/json"}),
    filename: "outCollect09Kegg.json",
    buttonText: "Download KEGG Compound JSON"
  };
  let spot = document.querySelector("#dlkc");
  spot.innerHTML = '';
  spot.append(downloadBlobButton(op));
  return;
};


// Helper to reduce a KEGG response array into a JSON
function reduceKeggEntry(kegg) {
  let red = kegg.reduce(reduceText, new Object());
  delete red._ckey;
  return red;
};


// Helper to group an array by a given size
function groupArray(array, size) {
  let ndata = [[]];
  for (let a of array) {
    if (ndata[ndata.length - 1].length === size) ndata.push([]);
    ndata[ndata.length - 1].push(a)
  };
  return ndata;
};


// Helper function to generate a KEGG REST API `GET` call using an ID, or an
// array of IDs (up to length 10)
function keggGetCompoundURI(id) {
  let text = Array.isArray(id) ? id.join("+") : id;
  return `https://kegg.cheminfo.org/get/${text}`;
};


// Helper to group the KEGG Compound response text into arrays containing data
// for each compound, rather than just all in one array
function groupKeggResponse(text) {
  let ntext = text.trimEnd().split(/\n/);
  let ndata = [[]];
  for (let t of ntext.slice(0, ntext.length - 1)) {
    if (t === "///") {
      ndata.push([]);
      continue;
    };
    ndata[ndata.length - 1].push(t);
  };
  return ndata;
};


// Reduce the raw KEGG Compound text into a less-raw JSON
function reduceText(accumulator, current) {
  let ckey = accumulator._ckey;
  if (/^[A-Z]/.test(current)) {
    ckey = current.match(/^(?<id>[A-Z]+)/).groups.id;
    accumulator[ckey] = new Array();
  };
  accumulator[ckey].push(current.slice(12));
  accumulator._ckey = ckey;
  return accumulator;
};


// Helper to clean the KEGG attribute `ENTRY`
function cleanEntry(text) {
  let split = text[0].trim().split(/\s{2,}/);
  return {"KEGG ID": split[0], "KEGG DB": split[1]};
};


// Helper to clean the KEGG attributes `ENZYME` or `REACTION`
function cleanEnzymeReaction(text) {
  return text.reduce(
    (acc, crt) => {
      crt.trim().split(/\s+/).forEach(c => acc.push(c));
      return acc;
    },
    []);
};


// Helper to clean the KEGG attribute `NAME`
function cleanName(text) {
  return text.map(t => t.trim().replace(/;$/, ''));
};


// Helper to clean the KEGG attribute `DBLINKS`
function cleanDblinks(text) {
  return text.reduce(
    (a, c) => {
      let s = c.split(/: /);
      a[s[0].trim()] = s[1].trim();
      return a;
    },
    new Object());
};


// Helper to clean the KEGG attributes `MODULE` or `PATHWAY`
function cleanModulePathway(text) {
  return text.map(t => {
    let m = t.match(/^(?<id>[^\s]+)/).groups.id;
    return {"ID": m, "Description": t.slice(m.length).trim()};
  });
};


// Metahelper to clean an array of KEGG objects
function cleanKegg(kegg) {
  let ndata = new Object();
  for (let k in kegg) {
    switch (k) {
      case "DBLINKS":
        ndata[k] = cleanDblinks(kegg[k]);
        break;
      case "ENTRY":
        ndata[k] = cleanEntry(kegg[k]);
        break;
      case "ENZYME":
      case "REACTION":
        ndata[k] = cleanEnzymeReaction(kegg[k]);
        break;
      case "EXACT":
      case "FORMULA":
      case "MOL":
        ndata[k] = kegg[k][0];
        break;
      case "MODULE":
      case "PATHWAY":
        ndata[k] = cleanModulePathway(kegg[k]);
        break;
      case "NAME":
        ndata[k] = cleanName(kegg[k]);
        break;
      default:
        ndata[k] = kegg[k];
    };
  };
  return ndata;
};
