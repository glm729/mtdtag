// Taking inspiration from arrange02Table.js

// Read and parse the data
let file = API.getData("fileTable").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Rearrange the table for viewing
let table = makeViewTable(data);

// Create the data table and view table
API.createData("dataTable", data);
API.createData("viewTable", table);


// Make the table to view (not the data table!)
function makeViewTable(data) {
  // Initialise variables
  let result = new Array();
  let keys = getTableKeys(data);
  // Loop over the data
  for (let dt of data) {
    // If no IDs, use a new Object
    let ids = (dt.id === undefined) ? new Object() : dt.id;
    // Initialise the output object
    let obj = new Object();
    // Assign required values
    obj.smiles = dt.smiles;
    obj.name = dt.name;
    // Sort aliases, if any
    obj.alias = (dt.alias === undefined) ? null : dt.alias.slice().sort();
    // Loop over the ID keys
    for (let id of keys.id) {
      // Assign the value in flat format, keeping presence with null
      obj[`id_${id}`] = (ids[id] === undefined) ? null : ids[id];
    };
    // Loop over the main keys
    for (let k of keys.main) {
      // Assign the values, if any, else null
      obj[k] = (dt[k] === undefined) ? null : dt[k];
    };
    // Push to the results
    result.push(obj);
  };
  return result;
};

// Hardcoded function to get the keys (main and ID) from the table
function getTableKeys(data) {
  // Initialise keys to exclude, and keys store
  let exclude = ["smiles", "name", "alias", "id"];
  let keys = {
    id: new Array(),
    main: new Array(),
  };
  // Loop over the data
  for (let dt of data) {
    // Loop over the current row keys
    for (let k in dt) {
      // Ignore if should, else push if missing
      if (exclude.indexOf(k) !== -1) continue;
      if (keys.main.indexOf(k) === -1) keys.main.push(k);
    };
    // If no ID object for the current row, go to next
    if (dt.id === undefined) continue;
    // Loop over the ID keys in the current row
    for (let k in dt.id) {
      // Push key to store if missing
      if (keys.id.indexOf(k) === -1) keys.id.push(k);
    };
  };
  // Sort each key array and return
  for (let k in keys) keys[k].sort();
  return keys;
};
