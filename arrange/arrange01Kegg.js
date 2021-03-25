// Further rearrangement of KEGG Compound data -- follow-on from arrange00Kegg

// Get the data from the API and parse
let file = API.getData("fileArrange00Kegg").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Initialise results array
let result = new Array();

// For each entry in the data, rearrange it and push to the results
data.forEach(d => {
  let o = new Object();
  for (let k in d) o[k] = kcSwitch(k, d[k]);
  result.push(o);
});

// Save the results
saveJsonString({
  name: "arrange01Kegg.json",
  content: JSON.stringify(result, null, 2)
});


/** -- Function definitions -- **/

// Rearrange ENTRY
function kcEntry(text) {
  let output = new Array();
  text.forEach(t => {
    let s = t.split(/\s+/);
    output.push({id: s[0], db: s[1]});
  });
  return output;
};

// Rearrange NAME
function kcName(text) {
  let output = new Array();
  text.forEach(t => output.push(t.trim().replace(/;$/, '')));
  return output;
};

// Rearrange REACTION
function kcReaction(text) {
  let output = new Array();
  text.forEach(t => {
    t.match(/R\d{5}/g).forEach(m => output.push(m));
  });
  return output;
};

// Rearrange PATHWAY or MODULE
function kcPathwayModule(text) {
  let output = new Array();
  text.forEach(t => {
    let s = t.split(/  /);
    output.push({id: s[0], name: s[1]});
  });
  return output;
};

// Rearrange DBLINKS
function kcDblinks(text) {
  let output = new Object();
  text.forEach(t => {
    let m = t.match(/^(?<id>[^\:]+)\: +(?<vl>.+)$/);
    output[m.groups.id] = m.groups.vl;
  });
  return output;
};

// Select function to rearrange based on key name
function kcSwitch(key, text) {
  switch (key) {
    case "dblinks": return kcDblinks(text);
    case "entry": return kcEntry(text);
    case "module": return kcPathwayModule(text);
    case "name": return kcName(text);
    case "pathway":
    case "reaction": return kcReaction(text);
    default: return text;
  };
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
