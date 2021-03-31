// Get the data from the API, and find the sink
let data = API.getData("filterTable").resurrect();
let sink = document.querySelector("#view04");

// Initialise the unordered list (overall list)
let ul = document.createElement("ul");
ul.classList.add("list");
ul.classList.add("list-major");

// Reduce the data into the ul
ul = data.reduce((acc, crt, i, arr) => {
  acc = listAddObj(acc, i.toString(), crt);
  return acc;
}, ul);

// Empty and refill the sink
sink.innerHTML = '';
sink.append(ul);


/** -- Function definitions -- **/

// Add a string value to a list
// Essentially listAddArray, but for one value, which might be null
function listAddString(list, title, value) {
  let oli = document.createElement("li");
  let ul = document.createElement("ul");
  let li = document.createElement("li");
  let container = document.createElement("div");
  let cellTitle = document.createElement("div");
  let cellValue = document.createElement("div");
  ul.classList.add("list");
  cellTitle.classList.add("list-cell-title");
  cellValue.classList.add("list-cell-value");
  cellTitle.innerHTML = title;
  li.innerHTML = (value === null) ? "&nbsp;" : value;
  ul.append(li);
  cellValue.append(ul);
  container.append(cellTitle);
  container.append(cellValue);
  oli.append(container);
  list.append(oli);
  return list;
};

// Add an array of values to a list
function listAddArray(list, title, value) {
  let oli = document.createElement("li");
  let ul = document.createElement("ul");
  let container = document.createElement("div");
  let cellTitle = document.createElement("div");
  let cellValue = document.createElement("div");
  ul.classList.add("list");
  cellTitle.classList.add("list-cell-title");
  cellValue.classList.add("list-cell-value");
  cellTitle.innerHTML = title;
  ul = value.reduce((acc, crt, i, arr) => {
    let li = document.createElement("li");
    li.innerHTML = crt;
    acc.append(li);
    return acc;
  }, ul);
  cellValue.append(ul);
  container.append(cellTitle);
  container.append(cellValue);
  oli.append(container);
  list.append(oli);
  return list;
};

// Recursive switch-like function to add data of an Object to a list
function listAddObj(list, title, object) {
  let oli = document.createElement("li");
  let ul = document.createElement("ul");
  let container = document.createElement("div");
  let cellTitle = document.createElement("div");
  let cellValue = document.createElement("div");
  ul.classList.add("list");
  cellTitle.classList.add("list-cell-title");
  cellValue.classList.add("list-cell-value");
  cellTitle.innerHTML = title;
  for (let key in object) {
    switch (categorise(object[key])) {
      case 0:
        ul = listAddString(ul, key, object[key]);
        break;
      case 1:
        ul = listAddObj(ul, key, object[key]);
        break;
      case 2:
        ul = listAddString(ul, key, object[key][0]);
        break;
      case 3:
        ul = listAddArray(ul, key, object[key]);
        break;
      default:
        throw new Error("Unhandled datatype");
    };
  };
  cellValue.append(ul);
  container.append(cellTitle);
  container.append(cellValue);
  oli.append(container);
  list.append(oli);
  return list;
};

// Helper to categorise incoming data (in listAddObj)
function categorise(data) {
  if (typeof(data) === "string" || data === null) return 0;
  if (typeof(data) === "object") {
    if (data.length === undefined) return 1;
    if (data.length === 1) return 2;
    return 3;
  };
  throw new Error("Unhandled datatype");
};
