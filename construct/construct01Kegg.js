// Pull in the required data from the API, and parse as JSON
let data = {
  table: JSON.parse(API.getData("fileTable").resurrect().replace(/\s+$/, '')),
  kegg: JSON.parse(API.getData("fileKegg").resurrect().replace(/\s+$/, ''))
};

// For each entry in the table
data.table.forEach(dt => {
  let idk = dt.id_kegg;
  if (idk === null) return;
  let getAs = [
    {get: "name", as: "alias"}
  ];
  idk.forEach(id => {
    idKeggLookup(dt, data.kegg, id, getAs);
    dt.alias = [...new Set(dt.alias)].sort();
  });
});

API.createData("dataTable", data.table);
saveJsonString({
  name: "tableConstruct01Kegg.json",
  content: JSON.stringify(data.table, null, 2)
});


// Lookup data in the KEGG JSON and attach to the current table entry
function idKeggLookup(tr, kegg, id, getAs) {
  let fd = kegg.filter(k => k.entry.id === id);
  if (fd.length === 0) {
    console.warn(`No KEGG data found for ID ${id}, skipping.`)
    return;
  };
  if (fd.length > 1) {
    let error = `KEGG data for ID ${id} features more than one entry:\n${fd}`;
    throw new Error(error);
  };
  fd = fd[0];
  for (let i = 0; i < getAs.length; ++i) {
    let get = fd[getAs[i].get];
    let as = getAs[i].as;
    if (get === null || get === undefined) continue;
    if (typeof(get) === "object" && get.length !== undefined) {
      get.forEach(g => tr[as].push(g));
      continue;
    };
    tr[as].push(get);
  };
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
