// Pull in the current table and the arrange01Kegg JSONs from the API
let file = {
  table: API.getData("fileTable").resurrect(),
  kegg: API.getData("fileArrange01Kegg").resurrect(),
};

// Parse the files
let data = new Object();
for (let k in file) data[k] = JSON.parse(file[k].replace(/\s+$/, ''));

// Convert the KEGG data into the table format (not all data are of interest)
let keggTable = keggToTable(data.kegg);

// For each entry in the KEGG table
keggTable.forEach(kegg => {
  // Filter to the currently-relevant table entries
  let tc = data.table.filter(t => {
    // If no KEGG ID, no filter
    if (t.id.kegg === undefined) return false;
    // Check if the KEGG ID is for this table entry
    return t.id.kegg.indexOf(kegg.id.kegg) !== -1;
  });
  // If there isn't an associated entry already
  if (tc.length === 0) {
    // Create a new object with null SMILES and name
    let obj = new Object();
    obj.smiles = null;
    obj.name = null;
    // Attach the data and push the object to the table
    for (let key of Object.keys(kegg)) obj[key] = kegg[key];
    data.table.push(obj);
    return;
  };
  // Augment the current row(s)
  tc.forEach(t => augmentRow(t, kegg));
  return;
});

// Save the result
saveJsonString({
  name: "add01Kegg.json",
  content: JSON.stringify(data.table, null, 2)
});


/** -- Function definitions -- **/

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
    if (row.id[key].indexOf(data[key]) === -1) row.id[key].push(data[key]);
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

// Conver the KEGG data (arrange01Kegg) to JSON with data of interest
function keggToTable(kegg) {
  let result = new Array();
  kegg.forEach(kg => {
    let obj = new Object();
    obj.alias = kg.name;
    obj.id = kcDblinks(kg);
    obj.id.kegg = kg.entry.id;
    result.push(obj);
  });
  return result;
};

// Handle KEGG Compound DBLINKS data (convert to ID object)
function kcDblinks(kcd) {
  let db = kcd.dblinks;
  let obj = new Object();
  if (db === undefined) return obj;
  for (let key in db) {
    let k = key.toLowerCase().replace(/\W/g, "_");
    obj[k] = db[key];
  };
  return obj;
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
