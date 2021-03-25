// Collecting all of the KEGG Compound data for all the IDs in List Compound

// Read the List Compound JSON file and parse
let file = API.getData("fileKeggListCompound").resurrect();
let data = JSON.parse(file.replace(/\s+$/, ''));

// Extract the IDs and group by tens (can request 10 at a time)
let ids = data.map(d => d.id);  // These are already sorted and unique
let chunks = arrayChunks(ids, 10);

// Generate the array of staggered-fetch promises
let promises = chunks.map(staggerFetch);

// Wait for all to settle, then handle the values
Promise.allSettled(promises).then(values => {
  let result = new Array();
  values.forEach(v => result.push(v._settledValueField));
  saveJsonString({
    name: "collect03Kegg.json",
    content: JSON.stringify(result, null, 2)
  });
});


/** -- Function definitions -- **/

// Stagger fetch requests by 500ms to avoid wrecking the server
async function staggerFetch(chunk, i) {
  await new Promise(r => setTimeout(r, i * 500));  // Wait 500ms between each
  return fetch(keggGetURIMultiple(chunk))
    .then(r => r.text())
    .then(d => {
      let padLength = chunks.length.toString().length;
      let fragment = i.toString().padStart(padLength, "0");
      return {fragment: fragment, data: d};
    });
};

// Generate a KEGG get URI for multiple IDs
function keggGetURIMultiple(chunk) {
  return `https://kegg.cheminfo.org/get/${chunk.join("+")}`;
};

// Split an array into chunks
function arrayChunks(array, size = 10) {
  // Initialise chunks array and index
  let chunks = [[]];
  let i = 0;
  // Loop over input array
  for (let j = 0; j < array.length; ++j) {
    // Push array entry
    chunks[i].push(array[j]);
    // If current chunk of max. size, push new empty chunk and increment index
    if (chunks[i].length === size) {
      chunks.push(new Array());
      ++i;
    };
  };
  // If array.length % size === 0, last array will be empty
  if (array.length % size === 0) chunks.pop();
  return chunks;
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
