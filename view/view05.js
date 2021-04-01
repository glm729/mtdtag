// Combine view02 and view04

// Retrieve the data from the API
let data = API.getData("filterTable").resurrect();

// Don't try to show the entire table.
// Only need this because a blank query in the Smart Filter module returns the
// entire array of data, which crashes the tab.
if (API.getData("dataTable").length !== data.length) {

  // Find the sink
  let sink = document.querySelector("#view05");

  // Initialise the container and add classes
  let container = document.createElement("div");
  container.classList.add("accordion");
  container.classList.add("accordion-major");

  // Reduce the data into the container
  container = data.reduce(
    (acc, crt, i, arr) => addObj(acc, i.toString(), crt),
    container
  );

  // Empty and refill the sink
  sink.innerHTML = '';
  sink.append(container);

};


/** -- Function definitions -- **/

// Helper function to make an accordion title button
function makeAccordionButton(ihtml) {
  function alterAccordionClass(e, n) {
    let t = `accordion-${n}-show`;
    if (e.classList.contains(t)) e.classList.remove(t);
    else e.classList.add(t);
    return e;
  };
  let container = document.createElement("div");
  let signal = document.createElement("div");
  let button = document.createElement("button");
  container.classList.add("accordion-button-container");
  signal.classList.add("accordion-button-signal");
  button.classList.add("accordion-button");
  signal.innerHTML = "&nbsp;";
  button.innerHTML = (ihtml === undefined) ? '' : ihtml;
  button.onclick = function() {
    let signal = this.previousElementSibling;
    let content = this.parentElement.nextElementSibling;
    alterAccordionClass(this, "button");
    alterAccordionClass(signal, "button-signal");
    alterAccordionClass(content, "content");
  };
  container.append(signal);
  container.append(button);
  return container;
};

// Add a string value to a list
// Essentially addArray, but for one value, which might be null
function addString(list, title, value) {
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
function addArray(list, title, value) {
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
// Modified for view05 -- container is a div, which is appended after a button
function addObj(list, title, object) {
  let button = makeAccordionButton(title);
  let ul = document.createElement("ul");
  let container = document.createElement("div");
  let cellValue = document.createElement("div");
  ul.classList.add("list");
  container.classList.add("accordion-content");
  cellValue.classList.add("list-cell-value");
  for (let key in object) {
    switch (categorise(object[key])) {
      case 0:
        ul = addString(ul, key, object[key]);
        break;
      case 1:
        ul = addObj(ul, key, object[key]);
        break;
      case 2:
        ul = addString(ul, key, object[key][0]);
        break;
      case 3:
        ul = addArray(ul, key, object[key]);
        break;
      default:
        throw new Error("Unhandled datatype");
    };
  };
  cellValue.append(ul);
  container.append(cellValue);
  list.append(button);
  list.append(container);
  return list;
};

// Helper to categorise incoming data (in addObj)
function categorise(data) {
  if (typeof(data) === "string" || data === null) return 0;
  if (typeof(data) === "object") {
    if (data.length === undefined) return 1;
    if (data.length === 1) return 2;
    return 3;
  };
  throw new Error("Unhandled datatype");
};
