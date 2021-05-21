let describe = document.querySelector("#describe");
let ca = new CouchAttachments();

describe.innerHTML = "<b>Please wait, loading attachments....</b>";
ca.fetchList().then(onFetch).then(init);


// -- Function definitions -- //


async function onFetch(atts) {
  let _data = atts.filter(a => a.filename === "upload/_data.zip");
  if (_data.length !== 1) {
    let describe = document.querySelector("#describe");
    describe.innerHTML = "<b>No attachment data</b>";
    throw new Error(`Need _data.length === 1, found length ${_data.length}`);
  }
  let data = await fetch(_data[0].url).then(r => r.arrayBuffer());
  let unzipped = await unzip(data);
  return unzipped;
}

async function unzip(data) {
  let output = new Object();
  let jsz = new JSZip();
  let zip = await jsz.loadAsync(data);
  let files = zip.files;
  for (let k in files) {
    let content = await files[k].async("string");
    let name = k.replace(/\..+$/, '');
    output[name] = content;
  }
  return output;
}

function init(data) {
  let table = JSON.parse(data["table"].trimEnd());
  // table.forEach(t => {
  //   t.molecular_formula = t.molecular_formula.join("; ");
  //   t.alias = t.alias.join("; ");
  //   delete t.id;
  // });
  API.createData("table", table);
  document.querySelector("#describe").innerHTML = '';
  return null;
}
