// Get the (current) filtered data from the API, and find the sink
let data = API.getData("filterTable").resurrect();
let sink = document.querySelector("#view02");

// Initialise an accordion container
let container = document.createElement("div");
container.classList.add("accordion");

// Reduce the data, adding to the container
container = data.reduce(
  (acc, crt, i, arr) => {
    acc = accordionAddObj(acc, i.toString(), crt);
    return acc;
  },
  container
);

// Empty the sink and append the accordion
sink.innerHTML = '';
sink.append(container);


/** -- Function definitions -- **/

// Overarching switching function to add Object data to an accordion
function accordionAddObj(accordion, key, obj) {
  let container = document.createElement("div");
  let button = makeAccordionButton(key);
  container.classList.add("accordion-content");
  for (let k in obj) {
    if (typeof(obj[k]) === "string" || obj[k] === null) {
      container = accordionAddString(container, k, obj[k]);
      continue;
    };
    if (typeof(obj[k]) === "object") {
      if (obj[k].length === undefined) {
        container = accordionAddObj(container, k, obj[k]);
        continue;
      };
      if (obj[k].length === 1) {
        container = accordionAddString(container, k, obj[k][0]);
        continue;
      };
      container = accordionAddArray(container, k, obj[k]);
      continue;
    };
    throw new Error("Unhandled datatype");
  };
  accordion.append(button);
  accordion.append(container);
  return accordion;
};

// Add a string value (with title) to an accordion
function accordionAddString(accordion, title, value) {
  // Create required DOM elements
  let container = document.createElement("div");
  let c0 = document.createElement("div");
  let c1 = document.createElement("div");
  // Assign attributes and styles
  container.style.display = "block";
  c0.style.display = "inline-block";
  c0.style.fontWeight = "bold";
  c0.style.width = "20%";
  c1.style.display = "inline-block";
  c1.style.width = "80%";
  // Assign innerHTML
  c0.innerHTML = title;
  c1.innerHTML = (value === null) ? '' : value;
  // Append to the container
  container.append(c0);
  container.append(c1);
  // Append the container to the accordion and return
  accordion.append(container);
  return accordion;
};

// Add an array of values (with title) to an accordion
function accordionAddArray(accordion, title, array) {
  // Create required DOM elements
  let container = document.createElement("div");
  let content = document.createElement("div");
  let button = makeAccordionButton(title);
  // Assign attributes and styles
  container.classList.add("accordion");
  content.classList.add("accordion-content");
  // Append the button to the container
  container.append(button);
  // Reduce the data into the content div
  content = array.reduce((acc, crt, i, arr) => {
    let cell = document.createElement("div");
    cell.style.display = "block";
    cell.innerHTML = crt;
    acc.append(cell);
    return acc;
  }, content);
  // Append the content div to the container
  container.append(content);
  // Append the container to the accordion and return
  accordion.append(container);
  return accordion;
};

// Helper function to make an accordion title button
function makeAccordionButton(ihtml) {
  let button = document.createElement("button");
  button.innerHTML = (ihtml === undefined) ? '' : ihtml;
  button.classList.add("accordion-button");
  button.onclick = function() {
    let ns = this.nextElementSibling;
    if (this.className.indexOf("accordion-button-show") === -1) {
      this.className += " accordion-button-show";
    } else {
      let r = this.className.replace(" accordion-button-show", '');
      this.className = r;
    };
    if (ns.className.indexOf("accordion-content-show") === -1) {
      ns.className += " accordion-content-show";
    } else {
      ns.className = ns.className.replace(" accordion-content-show", '');
    };
  };
  return button;
};
