// Adding data as found in the JSON version of the HMDB data (collect01Hmdb.rb)
// - Edited to avoid adding a new entry if SMILES code not found

// Get the required data from the API
let file = {
  table: API.getData("fileTable").resurrect(),
  hmdb: API.getData("fileHmdbJson").resurrect(),
};

// Parse the file contents
let data = new Object();
for (let k in file) data[k] = JSON.parse(file[k].replace(/\s+$/, ''));

// Get the HMDB data of interest
let hmdb = data.hmdb.map(getHmdbData);

// For each entry in the new data
hmdb.forEach(dh => {
  // Check for current entries in the table by SMILES code
  let tc = data.table.filter(dt => {
    if (dt.smiles === undefined || dt.smiles === null) return false;
    return dt.smiles === dh.smiles;
  });
  // If no current entries, DO NOT make a new one
  if (tc.length === 0) return;
  // For each current entry, augment
  tc.forEach(t => augmentRow(t, dh));
});

// Save the resulting table data
saveJsonString({
  name: "tableAdd02Hmdb.json",
  content: JSON.stringify(data.table, null, 2)
});


/** -- Function definitions -- **/

// Get the HMDB data of interest for the current entry
function getHmdbData(dh) {
  // Initialise output object
  let obj = new Object();
  obj.id = new Object();
  // Hardcoding these as a sort of anchor point
  obj.alias = new Array();
  obj.smiles = dh.smiles[0];
  // Loop over the keys and assign to the output object
  let keys = Object.keys(dh).filter(k => k !== "smiles").sort();
  for (let key of keys) {
    if (dh[key].length === 1 && dh[key][0] === null) continue;
    // Assign to the ID sub-object if it's an ID key
    if (/^id_/.test(key)) {
      obj.id[key.replace(/^id_/, '')] = dh[key];
      continue;
    };
    // If it's the name, push to the aliases
    if (key === "name") {
      dh[key].forEach(n => {
        if (obj.alias.indexOf(n) === -1) obj.alias.push(n);
      });
      continue;
    };
    // Anything else, assign as-is
    obj[key] = dh[key];
  };
  return obj;
};
// Switch augment strategy per key in the data
function augmentRow(row, data) {
  for (let key in data) {
    if (key === "id") {
      augmentRowId(row, data[key]);
    } else {
      augmentRowMain(row, data, key);
    };
  };
};

// Augment method if ID object
function augmentRowId(row, data) {
  if (row.id === undefined) row.id = new Object();
  for (let key in data) {
    if (row.id[key] === undefined) row.id[key] = new Array();
    let values = (typeof(data[key]) === "string") ? [data[key]] : data[key];
    values.forEach(v => {
      if (row.id[key].indexOf(v) === -1) row.id[key].push(v);
    });
  };
  return row;
};

// Augment method if not ID object
function augmentRowMain(row, data, key) {
  if (row[key] === undefined) row[key] = new Array();
  let values = (typeof(data[key]) === "string") ? [data[key]] : data[key];
  values.forEach(v => {
    if (row[key].indexOf(v) === -1) row[key].push(v);
  });
  return row;
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
