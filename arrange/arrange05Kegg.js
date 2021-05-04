#!/usr/bin/env js

// Trying this one using Node.
// Just converting the raw KEGG Reaction data into JSON format.


let path = {
  in: "../data/outCollect05Kegg.txt",
  out: "../data/outArrange06Kegg.json"
};

const fs = require("fs");

fs.readFile(path.in, "utf8", (e, d) => {
  if (e) {
    console.error(e);
    return;
  };
  let data = splitReduceFile(d.trimEnd());
  let json = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFile(path.out, json, e => {
    if (e) {
      console.error(e);
      return;
    };
    console.log("File written successfully");
  });
  return data;
});


// -- Function definitions -- //


function splitReduceFile(data) {
  let ck;
  let op = new Array();
  let ob = new Object();
  //
  let sp = data.split(/\n/);
  //
  for (let t of sp) {
    if (/^\/\/\/$/.test(t)) {
      op.push(ob);
      ob = new Object();
      continue;
    };
    if (/^[A-Z]/.test(t)) {
      let m = t.match(/^(?<k>[A-Z]+)\s+(?<d>.+)$/);
      ck = m.groups.k.toLowerCase();
      ob[ck] = [m.groups.d.trim()];
      continue;
    };
    ob[ck].push(t.trim());
  };
  //
  return op;
};
