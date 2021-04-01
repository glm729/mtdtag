// Redo initial construction from PathBank JSON, to accommodate multiple IDs

// Pull in the uploaded file from the API and parse as JSON
let file = API.getData("filePathbank").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Get the target data and save the JSON string
let result = data.map(d => dataMapCallback(d));
saveJsonString({
  name: "tableConstruct03Pathbank.json",
  content: JSON.stringify(result, null, 2)
});


// Abstracted callback for data.map
function dataMapCallback(dp) {
  // Initialise output object and attributes
  let op = new Object();
  let id = new Object();
  op.smiles = dp.SMILES;
  op.name = null;
  op.alias = new Array();
  op.id = new Object();
  // Shorthand for main data and name
  let m = dp.main;
  let mn = m["Metabolite Name"];
  // Define ID group
  let idg = {
    cas: m["CAS"],
    chebi: m["ChEBI ID"],
    drugbank: m["DrugBank ID"],
    hmdb: m["HMDB ID"],
    inchi: m["InChI"],
    inchikey: m["InChI Key"],
    kegg: m["KEGG ID"],
    pathbank: m["Metabolite ID"],
  };
  // For each key in the ID group
  for (let k in idg) {
    // If no value, skip on
    if (idg[k] === null || idg[k] === undefined) continue;
    // Coerce to array and assign
    let i = (typeof(idg[k]) === "string") ? [idg[k]] : idg[k];
    op.id[k] = i;
  };
  // Push the alias(es)
  if (typeof(mn) === "string") {
    op.alias.push(mn);
  } else {
    mn.forEach(n => op.alias.push(n));
  };
  return op;
};

// Helper function to save a stringified JSON
function saveJsonString(file) {
  let s = /\n$/.test(file.content) ? file.content : `${file.content}\n`;
  let n = (file.name) ? file.name : "saveJsonString.json";
  let uc = encodeURIComponent(s);
  let hr = `data:application/json;charset=utf-8,${uc}`;
  let a = document.createElement("a");
  a.setAttribute("download", n);
  a.setAttribute("href", hr);
  a.click();
  a.remove();
  return;
};
