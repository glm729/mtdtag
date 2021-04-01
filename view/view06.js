// List-based version of view05

// Retrieve the data from the API
let data = API.getData("filterTable").resurrect();

// Don't try to show the entire table
if (data.length !== API.getData("dataTable").length) {

  // Find the sink and initialise a container list
  let sink = document.querySelector("#view06");
  let container = document.createElement("ul");

  // Add classes to the container list
  container.classList.add("accordion");
  container.classList.add("accordion-major");
  container.classList.add("list");

  // Reduce the data into the container
  container = data.reduce(
    (acc, crt, i, arr) => addObj(acc, i.toString(), crt),
    container
  );

  // Empty the sink and refill
  sink.innerHTML = '';
  sink.append(container);

};


/** -- Function definitions -- **/

// Helper function to make an accordion title button
function makeAccordionButton(ihtml) {
  let container = document.createElement("li");
  let signal = document.createElement("div");
  let button = document.createElement("button");
  container.classList.add("accordion-button-container");
  signal.classList.add("accordion-button-signal");
  button.classList.add("accordion-button");
  signal.innerHTML = "&nbsp;";
  button.innerHTML = (ihtml === undefined) ? "&nbsp;" : ihtml;
  button.onclick = accordionButtonOnclick;
  container.append(signal);
  container.append(button);
  return container;
};

// Helper function to switch an accordion element class
function switchAccordionClass(element, name) {
  let text = `accordion-${name}-show`;
  if (element.classList.contains(text)) {
    element.classList.remove(text);
  } else {
    element.classList.add(text);
  };
  return element;
};

// Abstracted accordion button onclick function
function accordionButtonOnclick() {
  let signal = this.previousElementSibling;
  let content = this.parentElement.nextElementSibling;
  switchAccordionClass(this, "button");
  switchAccordionClass(signal, "button-signal");
  switchAccordionClass(content, "content");
};

// Add a string to a container list
function addString(list, title, value) {
  let oli = document.createElement("li");
  let ul = document.createElement("ul");
  let li0 = document.createElement("li");
  let li1 = document.createElement("li");
  ul.classList.add("list");
  li0.classList.add("list-cell-title");
  li1.classList.add("list-cell-value");
  li0.innerHTML = title;
  li1.innerHTML = (value === null) ? "&nbsp;" : value;
  ul.append(li1);
  oli.append(li0);
  oli.append(ul);
  list.append(oli);
  return list;
};

// Add an array of values to a container list
function addArray(list, title, value) {
  let oli = document.createElement("li");
  let ul = document.createElement("ul");
  let li0 = document.createElement("li");
  ul.classList.add("list");
  li0.classList.add("list-cell-title");
  li0.innerHTML = title;
  ul = value.reduce(
    (acc, crt, i, arr) => {
      let li = document.createElement("li");
      li.classList.add("list-cell-value");
      li.innerHTML = crt;
      acc.append(li);
      return acc;
    },
    ul
  );
  oli.append(li0);
  oli.append(ul);
  list.append(oli);
  return list;
};

// Recursive function to add an Object of values to a container list
function addObj(list, title, value) {
  let button = makeAccordionButton(title);
  let container = document.createElement("li");
  let ul = document.createElement("ul");
  let cell = document.createElement("li");
  container.classList.add("accordion-content");
  container.classList.add("list-cell-value");
  ul.classList.add("list");
  cell.classList.add("list-cell-value");
  for (let key in value) {
    switch (categorise(value[key])) {
      case 0:
        ul = addString(ul, key, value[key]);
        break;
      case 1:
        ul = addObj(ul, key, value[key]);
        break;
      case 2:
        ul = addString(ul, key, value[key][0]);
        break;
      case 3:
        ul = addArray(ul, key, value[key]);
        break;
      default:
        throw new Error("Unhandled datatype");
    };
  };
  container.append(ul);
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
