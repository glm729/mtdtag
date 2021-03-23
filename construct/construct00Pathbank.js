// Pull in and parse the JSON text
let data =
  JSON.parse(API.getData("filePathbank").resurrect().replace(/\s+$/, ''));

// Initialise output array
let output = new Array();

// For each datum
data.forEach(d => {
  // Critical data
  let smiles = d.SMILES;
  let alias = d.main["Metabolite Name"];
  let kegg = d.main["KEGG ID"];
  // Check and reformat a little
  if (alias === null) alias = [null];
  if (kegg === null) kegg = [null];
  if (typeof(alias) === "string") alias = [alias];
  if (typeof(kegg) === "string") kegg = [kegg];
  // Build
  output.push({
    smiles: smiles,
    name: null,
    alias: alias,
    id_kegg: kegg
  });
  return;
});

// Save the resulting Object
saveJsonString({
  name: "tableConstruct00Pathbank.json",
  content: JSON.stringify(output, null, 2)
});


// Helper function to save a stringified JSON
function saveJsonString(file) {
  let uc = encodeURIComponent(file.content);
  let hr = `data:application/json;charset=utf-8,${uc}`;
  let n = (file.name) ? file.name : "saveJsonString.json";
  let a = document.createElement("a");
  a.setAttribute("download", n);
  a.setAttribute("href", hr);
  a.click();
  a.remove();
  return;
};
