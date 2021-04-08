// Sorting table entries alphanumerically (mainly for ID keys and aliases)

// Get the data from the API and parse
let file = API.getData("fileTable").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Initialise variables
let exclude = ["smiles", "molecular_formula", "name", "alias", "id"];
let result = new Array();
let keys = {
  id: new Array(),
  main: new Array(),
};

// Loop over the data and get the keys
for (let dt of data) {
  // Loop over the data keys
  for (let k in dt) {
    // This currently only skips, but there may be other keys in future
    if (exclude.indexOf(k) !== -1) continue;
    if (keys.main.indexOf(k) === -1) keys.main.push(k);
  };
  // If there are no IDs, go to next
  if (dt.id === undefined) continue;
  // Loop over the ID keys and push if not already present
  for (let k in dt.id) {
    if (keys.id.indexOf(k) === -1) keys.id.push(k);
  };
};

// Sort the keys arrays
for (let k in keys) keys[k].sort();

// Loop over the data again
for (let dt of data) {
  // Create a new object and assign the desired data
  let obj = new Object();
  obj.smiles = dt.smiles;
  if (dt.molecular_formula !== undefined) {
    obj.molecular_formula = dt.molecular_formula.slice().sort();
  };
  obj.name = dt.name;
  // Sort aliases (if any)
  if (dt.alias !== undefined) obj.alias = dt.alias.slice().sort();
  // If there are any IDs
  if (dt.id !== undefined) {
    // Initialise IDs object
    obj.id = new Object();
    // Loop over the ID keys
    for (let id of keys.id) {
      // If not present in the entry, go to next, otherwise assign
      if (dt.id[id] === undefined) continue;
      if (typeof(dt.id[id]) === "string") {
        obj.id[id] = [dt.id[id]];
        continue;
      };
      obj.id[id] = dt.id[id];
    };
  };
  // Assign data for the main keys, if present
  for (let key of keys.main) {
    if (dt[key] !== undefined) obj[key] = dt[key];
  };
  // Push to the results
  result.push(obj);
};

// Save the resulting data
saveJsonString({
  name: "arrange02Table.json",
  content: JSON.stringify(result, null, 2)
});


// Helper function to save a JSON string
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
