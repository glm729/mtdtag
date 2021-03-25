// Read and parse the table JSON
let data = API.getData("fileTable").resurrect();
let parsed = JSON.parse(data.replace(/\s+$/, ''));

// Form the flat table
let table = flattenTable(parsed);

// Create the data in the API -- one for data, one for viewing
API.createData("dataTable", parsed);
API.createData("viewTable", table);


// Helper function to flatten the table (because of the IDs object)
function flattenTable(data) {
  let table = new Array();
  // This ONLY works because (main) keys are common for all entries
  let keys = Object.keys(data[0]).filter(k => k !== "id");
  data.forEach(dt => {
    let op = new Object();
    let idk = Object.keys(dt.id);
    keys.forEach(k => op[k] = dt[k]);
    idk.forEach(k => op[`id_${k}`] = dt.id[k]);
    table.push(op);
  });
  return table;
};
