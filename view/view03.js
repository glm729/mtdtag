// Pull in the data from the API, and find the Twig sink
let data = API.getData("filterTable").resurrect();
let sink = document.querySelector("#view03");

// Initialise the container table
let container = divTable();
container.classList.add("div-table-major");

// Reduce the data into the container
container = data.reduce(
  function(acc, crt, i, arr) {
    acc = tableAddObj(acc, i.toString(), crt);
    return acc;
  },
  container
);

// Empty the sink and refill
sink.innerHTML = '';
sink.append(container);


/** -- Function definitions -- **/

// Helper to generate a div table
function divTable() {
  let table = document.createElement("div");
  table.classList.add("div-table");
  return table;
};

// Helper to generate a div table row
function divTableRow() {
  let row = document.createElement("div");
  row.classList.add("div-table-row");
  return row;
};

// Helper to generate a div table cell
function divTableCell() {
  let cell = document.createElement("div");
  cell.classList.add("div-table-cell");
  return cell;
};

// Add a string value to a div table
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

// Add an array of strings to a div table
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

// Recursive "meta-function" to handle adding an Object of data to a table
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

// Helper to categorise data within tableAddObj
function categorise(data) {
  if (typeof(data) === "string" || data === null) return 0;
  if (typeof(data) === "object") {
    if (data.length === undefined) return 1;
    if (data.length === 1) return 2;
    return 3;
  };
  throw new Error("Unhandled datatype");
};
