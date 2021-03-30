let data = API.getData("filterTable").resurrect();
let sink = document.querySelector("#view03");

let container = divTable();
container = data.reduce(
  function(acc, crt, i, arr) {
    acc = tableAddObj(acc, i.toString(), crt);
    return acc;
  },
  container
);

sink.innerHTML = '';
sink.append(container);


/** -- Function definitions -- **/

function divTable() {
  let table = document.createElement("div");
  table.classList.add("div-table");
  return table;
};

function divTableRow() {
  let row = document.createElement("div");
  row.classList.add("div-table-row");
  return row;
};

function divTableCell() {
  let cell = document.createElement("div");
  cell.classList.add("div-table-cell");
  return cell;
};

function tableAddString(table, title, value) {
  let row = divTableRow();
  let c0 = divTableCell();
  let c1 = divTableCell();
  c0.classList.add("div-table-cell-header");
  c0.innerHTML = title;
  c1.innerHTML = (value === null) ? '' : value;
  row.append(c0);
  row.append(c1);
  table.append(row);
  return table;
};

function tableAddArray(table, title, values) {
  let r0 = divTableRow();
  let c0 = divTableCell();
  let c1 = divTableCell();
  c0.classList.add("div-table-cell-header");
  c0.innerHTML = title;
  c1.innerHTML = values[0];
  r0.append(c0);
  r0.append(c1);
  table.append(r0);
  return values.slice(1).reduce(
    function(acc, crt, i, arr) {
      let row = divTableRow();
      let cell = divTableCell();
      cell.innerHTML = crt;
      row.append(divTableCell());
      row.append(cell);
      acc.append(row);
      return acc;
    },
    table
  );
};

function tableAddObj(table, title, object) {
  let r0 = divTableRow();
  let c0 = divTableCell();
  let c1 = divTableCell();
  let container = divTable();
  c0.classList.add("div-table-cell-header");
  c0.innerHTML = title;
  for (let key in object) {
    switch (categorise(object[key])) {
      case 0:
        container = tableAddString(container, key, object[key]);
        break;
      case 1:
        container = tableAddObj(container, key, object[key]);
        break;
      case 2:
        container = tableAddString(container, key, object[key][0]);
        break;
      case 3:
        container = tableAddArray(container, key, object[key]);
        break;
      default:
        throw new Error("Unhandled datatype");
    };
  };
  c1.append(container);
  r0.append(c0);
  r0.append(c1);
  table.append(r0);
  return table;
};

function categorise(data) {
  if (typeof(data) === "string" || data === null) return 0;
  if (typeof(data) === "object") {
    if (data.length === undefined) return 1;
    if (data.length === 1) return 2;
    return 3;
  };
  throw new Error("Unhandled datatype");
};
