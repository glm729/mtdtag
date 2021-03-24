// Read in the table and pathbank JSON data
let file = {
  table: API.getData("fileTable").resurrect(),
  pathbank: API.getData("filePathbank").resurrect()
};

// Parse the JSON data
let data = new Object();
for (let k in file) data[k] = JSON.parse(file[k].replace(/\s+$/, ''));

// For each entry in the PathBank JSON
data.pathbank.forEach(dp => dataPathbankForeachCallback(dp, data.table));

// Create the data in the API, and save the JSON
API.createData("dataTable", data.table);
saveJsonString({
  name: "tableAddition00Pathbank.json",
  content: JSON.stringify(data.table, null, 2)
});


/** -- Function definitions -- **/

// Abstracted callback for data.pathbank.forEach(dp => ...
// (just for a bit of easier editing)
function dataPathbankForeachCallback(dp, data_t) {
  // Get the SMILES code and initialise the data to add
  let smiles = dp.SMILES;
  let add = new Object();
  // Define the IDs to add to the table
  let id = {
    hmdb: dp.main["HMDB ID"]
  };
  // For each key in the IDs
  for (let k in id) {
    // If the entry is null or a string, place in an array
    if (id[k] === null) id[k] = [null];
    if (typeof(id[k]) === "string") id[k] = [id[k]];
    // Add to the data to add
    add[`id_${k}`] = id[k];
  };
  // Shortlist the table
  let sl = data_t.filter(dt => dt.smiles === smiles);
  // All SMILES should be present, but check anyway and throw and error if not
  if (sl.length === 0) {
    throw new Error(`Table entry missing for SMILES:\n${smiles}`);
  };
  // For each entry in the shortlist, add the ID data
  sl.forEach(s => {
    for (let k in add) s[k] = add[k];
  });
  return;
};

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
