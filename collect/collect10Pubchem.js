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
let requests = pcOnly.slice(0, 6).map(
  async (kegg, idx) => {
    await new Promise(_ => setTimeout(_, idx * 200));
    return getPubchem(kegg);
  });

Promise.allSettled(requests)
  .then(values => {
    values = values.map(v => v._settledValueField);
    let result = new Object();
    pcOnly.slice(0, 6).forEach((k, i) => {
      result[k["ENTRY"]["KEGG ID"]] = values[i];
    });
    return result;
  })
  .then(console.log);


// -- Function definitions -- //


async function requestCompound(pcid, attempt) {
  if (attempt > 9) return null;
  let data = await fetch(pubchemURI(pcid, "compound")).then(r => r.json());
  if (data["Fault"] != null) {
    if (data["Fault"]["Code"] === "PUGREST.ServerBusy") {
      await new Promise(_ => setTimeout(_, attempt * 200));
      data = await requestCompound(pcid, attempt + 1);
    } else {
      return null;
    };
  };
  if (data == null) return null;
  return data["PC_Compounds"][0];
};

async function requestSubstance(pcid, attempt) {
  if (attempt > 9) return null;
  let data = await fetch(pubchemURI(pcid, "substance")).then(r => r.json());
  if (data["Fault"] != null) {
    if (data["Fault"]["Code"] === "PUGREST.ServerBusy") {
      await new Promise(_ => setTimeout(_, attempt * 200));
      data = await requestSubstance(pcid, attempt + 1);
    } else {
      return null;
    };
  };
  if (data == null) return null;
  return data["PC_Substances"][0];
};

function checkCompound(data, keggFormula) {
  if (data == null) return false;
  let pcFormula = data.props.filter(p => p.urn.label === "Molecular Formula");
  if (pcFormula.length !== 1) return false;
  if (pcFormula[0].value.sval === keggFormula) return true;
  return false;
};

function checkSubstance(data) {
  if (data == null) return null;
  let pcSubCid = data.compound.filter(c => c?.id?.id?.cid != null);
  if (pcSubCid.length !== 1) return null;
  return pcSubCid[0].id.id.cid;
};

async function getPubchem(kegg, idx) {
  let pcid = kegg["DBLINKS"]["PubChem"];
  let pcCompound0 = await requestCompound(pcid, 0);
  if (checkCompound(pcCompound0, kegg["FORMULA"])) return pcCompound0;
  let pcSubstance = await requestSubstance(pcid, 0);
  let pcSubCid = checkSubstance(pcSubstance);
  if (pcSubCid == null) return null;
  let pcCompound1 = await requestCompound(pcSubCid, 0);
  if (checkCompound(pcCompound1, kegg["FORMULA"])) return pcCompound1;
  return null;
};


function getPubchemId(entry) {
  if (entry["DBLINKS"] != null) {
    if (entry["DBLINKS"]["PubChem"] != null) {
      return entry["DBLINKS"]["PubChem"];
    };
  };
  return null;
};


function pubchemURI(id, type) {
  let frag = {
    compound: "compound/cid",
    substance: "substance/sid"
  };
  if (frag[type] == null) {
    let msg = [
      `PubChem REST API division not recognised:  ${type}`,
      `Please use "compound" or "substance" only`
    ];
    throw new Error(msg.join("\n"));
  };
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/${frag[type]}/${id}/json`;
};
