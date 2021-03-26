// Sorting table entries alphanumerically (mainly for ID keys and aliases)

// Get the data from the API and parse
let file = API.getData("fileTable").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Initialise variables
let mainKeys = new Array();
let idKeys = new Array();
let result = new Array();

// Loop over the data and get the keys
for (let dt of data) {
  // Loop over the data keys
  for (let k in dt) {
    // This currently only skips, but there may be other keys in future
    if (["smiles", "name", "alias", "id"].indexOf(k) !== -1) continue;
    if (mainKeys.indexOf(k) === -1) mainKeys.push(k);
  };
  // If there are no IDs, go to next
  if (dt.id === undefined) continue;
  // Loop over the ID keys and push if not already present
  for (let k in dt.id) {
    if (idKeys.indexOf(k) === -1) idKeys.push(k);
  };
};

// Sort the keys arrays
mainKeys.sort();
idKeys.sort();

// Loop over the data again
for (let dt of data) {
  // Create a new object and assign the desired data
  let obj = new Object();
  obj.smiles = dt.smiles;
  obj.name = dt.name;
  // Sort aliases (if any)
  if (dt.alias !== undefined) obj.alias = dt.alias.slice().sort();
  // If there are any IDs
  if (dt.id !== undefined) {
    // Initialise IDs object
    obj.id = new Object();
    // Loop over the ID keys
    for (let id of idKeys) {
      // If not present in the entry, go to next, otherwise assign
      if (dt.id[id] === undefined) continue;
      obj.id[id] = dt.id[id];
    };
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
