/** -- Operations -- **/

let table = API.getData("fileTable").resurrect();
let parsed = JSON.parse(table.trimEnd());

let shortlist = parsed.filter(p => filterTable(p));

let data = shortlist.reduce(
  reduceShortlist,
  {req: new Array(), tmi: new Array()}
);

if (data.tmi.length) {
  let l = data.tmi.length;
  let s = (l === 1) ? "y" : "ies";
  let fsTmi = {
    name: "outCollect04Pubchem_excessPubchemIds.json",
    data: `${JSON.stringify(data.tmi, null, 2)}\n`
  };
  console.warn(`${l} entr${s} with Gt1 PubChem ID`);
  saveJsonButton(fsTmi, "#sinkCollect04");
};

data.req.sort()

requestData(data.req).then(d => {
  console.log("%cSaving data", "color: dodgerblue");
  let fsFinal = {
    name: "outCollect04Pubchem.json",
    data: `${JSON.stringify(d, null, 2)}\n`
  };
  saveJsonButton(fsFinal, "#sinkCollect04");
});


/** -- Function definitions -- **/

function pcCompoundUri(id) {
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${id}/json`;
};

function distributePromises(array) {
  return array.map(async (x, i) => {
    await new Promise(r => setTimeout(r, i * 200));  // 200ms between requests
    return fetch(pcCompoundUri(x))
      .then(r => r.text())
      .then(d => ({id: x, data: d}))
  })
};

function filterTable(entry) {
  if (entry.smiles !== null) return false;
  if (entry.id === null || entry.id === undefined) return false;
  let eip = entry.id.pubchem;
  if (eip === null || eip === undefined) return false;
  return true;
};

function reduceShortlist(acc, crt) {
  if (crt.id.pubchem.length > 1) {
    acc.tmi.push(crt);
    return acc;
  };
  acc.req.push(crt.id.pubchem[0]);
  return acc;
};

function saveJsonButton(fileSpec, selector) {
  let parent = document.querySelector(selector);
  let a = document.createElement("a");
  let b = document.createElement("button");
  let uc = encodeURIComponent(fileSpec.data);
  let hr = `data:application/json;charset=utf-8,${uc}`;
  a.setAttribute("href", hr);
  a.setAttribute("download", fileSpec.name);
  a.style.visibility = "hidden";
  b.innerHTML = `Download file:  ${fileSpec.name}`;
  b.onclick = _ => a.click();
  parent.append(a);
  parent.append(b);
  return;
};

function randomElements(arr, len) {
  let num = new Array();
  for (let i = 0; i < len; ++i) {
    let n = Math.floor(Math.random() * arr.length);
    while (num.indexOf(n) !== -1) n = Math.floor(Math.random() * arr.length);
    num.push(n);
  };
  num.sort();
  return num.map(n => arr[n]);
};

async function requestData(ids) {
  let pn = 0;
  let store = {
    toGet: ids,
    found: new Array(),
    notFound: new Array(),
    unknownError: new Array()
  };
  while (store.toGet.length) {
    ++pn;
    console.log([
      `%cInitialising data request pass ${pn}:  `,
      `${store.toGet.length} to request`
    ].join(''), "color: yellow");
    let pass = distributePromises(store.toGet);
    for await (let p of pass) {
      let d = p.data;
      if (d === '') {
        store.unknownError.push(p);
        store.toGet.filter(s => s !== p.id);
        continue;
      };
      d = JSON.parse(d);
      let c = classifyPugrestReturn(d);
      if (c !== 1) {
        if (c === 9) store.unknownError.push(p);
        if (c === 2) store.notFound.push(p.id);
        if (c === 0) store.found.push({id: p.id, data: d});
        store.toGet = store.toGet.filter(s => s !== p.id);
      };
    };
  };
  delete store.toGet;
  console.log([
    `%cAll data requested.`,
    `Successful:      ${store.found.length}`,
    `Not found:       ${store.notFound.length}`,
    `Unknown errors:  ${store.unknownError.length}`
  ].join("\n"), "color: lawngreen");
  return store;
};

function classifyPugrestReturn(data) {
  if (data.PC_Compounds !== undefined) return 0;
  if (data.Fault !== undefined) {
    let m = data.Fault.Message;
    if (/^Too many requests/.test(m)) return 1;
    if (m === "Record not found") return 2;
    return 9;
  };
  return 9;
};
