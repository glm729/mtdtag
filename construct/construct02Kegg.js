// Get and parse the table data from the API
let data = {
  table: JSON.parse(API.getData("fileTable").resurrect().replace(/\s+$/, ''))
};

// Fetch KEGG List Compound and operate
fetch("https://kegg.cheminfo.org/list/compound")
  .then(r => r.text())
  .then(d => {
    // Clean and structure the KEGG List Compound TSV
    let clean = d.replace(/\r/g, '').replace(/\s+$/, '');
    let struc = clean.split(/\n/).map(c => c.split(/\t/));
    data.kegg = struc.map(s => {
      return {id: s[0].replace(/^cpd:/, ''), alias: s[1].split(/; /)};
    });
    // For each entry in the KEGG List Compound data
    data.kegg.forEach(dk => dataKeggCallback(dk, data.table));
    // Update and save the table
    API.createData("dataTable", data.table);
    saveJsonString({
      name: "tableConstruct02Kegg.json",
      content: JSON.stringify(data.table, null, 2)
    });
  });


// Abstracted callback function for the data.kegg.forEach(dk => ...
function dataKeggCallback(dk, data_t) {
  let dc = data_t.filter(dt => dt.id_kegg.indexOf(dk.id) !== -1);
  if (dc.length === 0) {
    data_t.push({
      smiles: null,
      name: null,
      alias: dk.alias,
      id_kegg: dk.id
    });
    return data_t;
  };
  dc.forEach(d => {
    dk.alias.forEach(a => d.alias.push(a));
    d.alias = [...new Set(d.alias)].sort();
  });
  return data_t;
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
