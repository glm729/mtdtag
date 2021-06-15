// -- Operations -- //


// Pull in and parse the KEGG Compound JSON
let kegg = JSON.parse(API.getData("keggCompound").resurrect());

// Reduce entries in the data to only those with a molecular formula and a
// PubChem ID
let pcOnly = kegg.reduce(
  (a, c) => {
    if (c["FORMULA"] == null) return a;
    if (getPubchemId(c) == null) return a;
    a.push(c);
    return a;
  },
  new Array());

// Request the PubChem data
let requests = pcOnly.map(
  async (kegg, idx) => {
    await new Promise(_ => setTimeout(_, idx * 200));
    return {id: kegg["ENTRY"]["KEGG ID"], data: await getPubchem(kegg)};
  });

// Wait for all requests to finish, then get data and save as JSON
Promise.allSettled(requests)
  .then(val => val.map(v => v._settledValueField))
  .then(data => {
    let str = `${JSON.stringify(data, null, 0)}\n`;
    let blob = new Blob([str], {type: "application/json"});
    let button = downloadBlobButton({
      blob: blob,
      filename: "keggPubchem.json",
      buttonText: "Download keggPubchem"
    });
    let spot = document.querySelector("#dlb");
    spot.innerHTML = '';
    spot.append(button);
    console.log("%cAll requests finished.", "color:lightgreen");
  });


// -- Function definitions -- //


// Helper function for making a button to download a Blob
function downloadBlobButton(data) {
  let button = document.createElement("button");
  button.classList.add("submit-button");
  button.innerHTML = data.buttonText || "Download file";
  button.addEventListener("click", _ => (downloadBlob(data)));
  return button;
};


// Helper function to download a Blob
function downloadBlob(data) {
  let anchor = document.createElement("a");
  let uri = URL.createObjectURL(data.blob);
  anchor.setAttribute("download", data.filename || "downloadJson.json");
  anchor.setAttribute("href", uri);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(uri);
  return;
};


// Asynchronous recursive function to request PubChem Compound data
async function requestCompound(pcid, attempt) {
  // Cancel if too many attempts
  if (attempt > 9) return null;
  // Get the compound data
  let data = await fetch(pubchemURI(pcid, "compound")).then(r => r.json());
  // If there's a fault
  if (data["Fault"] != null) {
    // If too busy, try again
    if (data["Fault"]["Code"] === "PUGREST.ServerBusy") {
      await new Promise(_ => setTimeout(_, attempt * 200));
      data = await requestCompound(pcid, attempt + 1);
    // Else, boot
    } else {
      return null;
    };
  };
  // Cancel if the data are still null
  if (data == null) return null;
  // Return the result (only requesting one compound, so get the first one)
  return data["PC_Compounds"][0];
};

// Asynchronous recursive function to request PubChem Substance data
async function requestSubstance(pcid, attempt) {
  // Quit if too many attempts
  if (attempt > 9) return null;
  // Get the data
  let data = await fetch(pubchemURI(pcid, "substance")).then(r => r.json());
  // If there's a fault
  if (data["Fault"] != null) {
    // Retry if server busy
    if (data["Fault"]["Code"] === "PUGREST.ServerBusy") {
      await new Promise(_ => setTimeout(_, attempt * 200));
      data = await requestSubstance(pcid, attempt + 1);
    // Else, cancel
    } else {
      return null;
    };
  };
  // Forget it if the data are null
  if (data == null) return null;
  // Return the first (only requesting one anyway)
  return data["PC_Substances"][0];
};

// Helper function to check the PubChem Compound result by comparing to the
// KEGG Compound formula
function checkCompound(data, keggFormula) {
  // Not good if no data
  if (data == null) return false;
  // Get the molecular formula and cancel if not exactly one
  let pcFormula = data.props.filter(p => p.urn.label === "Molecular Formula");
  if (pcFormula.length !== 1) return false;
  // If it matches, all is well
  if (pcFormula[0].value.sval === keggFormula) return true;
  // Doesn't match
  return false;
};

// Helper function to check the PubChem Substance result for a PC Compound ID
function checkSubstance(data) {
  // Null if data is null
  if (data == null) return null;
  // Filter to get the CID and null if not found
  let pcSubCid = data.compound.filter(c => c?.id?.id?.cid != null);
  if (pcSubCid.length !== 1) return null;
  // Return the CID
  return pcSubCid[0].id.id.cid;
};

// Async operative function to attempt to collect the PubChem data
// - Checks Compound, and gets Substance then requests first-neighbour CID
//   collected from Substance data if formula doesn't match
async function getPubchem(kegg, idx) {
  // Get the current Compound data
  let pcid = kegg["DBLINKS"]["PubChem"];
  let pcCompound0 = await requestCompound(pcid, 0);
  // If it checks out, return it
  if (checkCompound(pcCompound0, kegg["FORMULA"])) return pcCompound0;
  // Get the current Substance data and extract the CID
  let pcSubstance = await requestSubstance(pcid, 0);
  let pcSubCid = checkSubstance(pcSubstance);
  // If no CID, no data
  if (pcSubCid == null) return null;
  // Get the second round of compound data
  let pcCompound1 = await requestCompound(pcSubCid, 0);
  // Return if checks out
  if (checkCompound(pcCompound1, kegg["FORMULA"])) return pcCompound1;
  // Stop trying
  return null;
};


// Helper to get the PubChem ID from a KEGG Compound JSON entry
function getPubchemId(entry) {
  if (entry["DBLINKS"] != null) {
    if (entry["DBLINKS"]["PubChem"] != null) {
      return entry["DBLINKS"]["PubChem"];
    };
  };
  return null;
};


// Helper to generate a PubChem PUG REST URI
function pubchemURI(id, type) {
  let frag = {compound: "compound/cid", substance: "substance/sid"};
  if (frag[type] == null) {
    let msg = [
      `PubChem REST API division not recognised:  ${type}`,
      `Please use "compound" or "substance" only`
    ];
    throw new Error(msg.join("\n"));
  };
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/${frag[type]}/${id}/json`;
};
