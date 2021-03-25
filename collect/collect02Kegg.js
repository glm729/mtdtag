/**
 * Collect and handle KEGG List Compound.
 * - Permits retrieving all KEGG IDs in KEGG Compound.
 * - Can be used to get KEGG ID--alias pairs, if only going for this.
 */

// No table data for this one, just getting the preliminary KEGG data (setup)

// Fetch /list/compound via ChemInfo proxy, convert to text, and use
fetch("https://kegg.cheminfo.org/list/compound")
  .then(r => r.text())
  .then(useFetchData);


// Callback function to use in fetch-then chain
function useFetchData(data) {
  let rmws = data.replace(/\r/g, '').replace(/\s+$/, '');
  let strc = rmws.split(/\n/).map(s => s.split(/\t/));
  let kegg = strc.map(s => {
    return {id: s[0].replace(/^cpd:/, ''), alias: s[1].split(/; /)};
  });
  saveJsonString({
    name: "collect02Kegg.json",
    content: JSON.stringify(kegg, null, 2)
  });
  return kegg;
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
