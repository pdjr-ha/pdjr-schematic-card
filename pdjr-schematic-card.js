class ActiveDrawing extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Handler for HASS updates.
   */
  updateStates() {
    const svg_doc = this.image.getSVGDocument();

    // Globals required for update processing that may not be available
    // until document is fully loaded.
    if ((svg_doc) && (this.myHass) && (this.entityMap)) {

      this.entityMap.forEach((entityConfiguration, entityId) => {
        try {
          if (!(this.myHass.states[entityId])) { this.entityMap.delete(entityId); throw new Error(`entity ${entityId} does not exist`); }

          if ((entityConfiguration.state != this.myHass.states[entityId].state)) {
            if (this.config.debug) console.log(`processing state change on ${entityId} (from ${entityConfiguration.state} to ${this.myHass.states[entityId].state})`);
            entityConfiguration.state = this.myHass.states[entityId].state;
            entityConfiguration.groups.forEach((group) => {

              if (group.classMap) {
                let add = group.classMap.get(entityConfiguration.state);
                if (group.currentClass != add) {
                  if (this.config.debug) console.log(`-- class update: removing ${group.currentClass}, adding ${add} to ${group.elements.length} elements`);
		              group.currentClass = updateClass(group.elements, add, group.currentClass);
                }
              }

              if (group.text) {
                let text = group.text;
                text = text.replace('${state}', this.myHass.states[entityId].state);
                text = text.replace('${uom}', this.myHass.states[entityId].attributes.unit_of_measurement);
                if (group.currentText != text) {
                  if (this.config.debug) console.log(`-- text update: adding '${text}' to ${group.elements.length} elements`);
		              group.currentText = updateText(group.elements, text);
                }
              }

              if ((group.attribute) && (group.attribute.name) && (group.attribute.value)) {
                let attribute = group.attribute.value;
                attribute = attribute.replace('${state}', this.myHass.states[entityId].state);
                if (group.currentAttribute != attribute) {
                  if (this.config.debug) console.log(`-- attribute update: assigning '${attribute}' to '${group.attribute.name}' to ${group.elements.length} elements`);
                  group.currentAttribute =  updateAttribute(group.elements, group.attribute.name, attribute);
                }
              }

            });
          }
        } catch(e) {
          console.log(`warning: ${e.message}`);
        }
      });

    }
  }

  prepareSVGOnceLoaded() {
    var entityId, event;

    // Add any associated stylesheet to the svg file
    let svg_doc = this.image.contentDocument;
    let svgElem = svg_doc.querySelector('svg');
    let style = svg_doc.createElementNS("http://www.w3.org/2000/svg", "style");
    let styleSheet = (this.config.stylesheet)?`@import url("${this.config.stylesheet}")`:`@import url("${this.config.image.replace('.svg','.css')}")`
    console.info(`using ${styleSheet}`);
    style.textContent = styleSheet;
    svgElem.insertBefore(style, svgElem.firstChild);

    // Process 'initialisation' block which has the form:
    // initialisation:
    //   -- elements: "DOM selector string"
    //      
    if ('initialisation' in this.config) {
      this.config.initialisation.forEach((initialisation) => {
        try {
          if (!('elements' in initialisation)) throw new Error(`missing 'elements' property in initialisation block`);

          let elems = getElements(svg_doc, initialisation.elements);
          if (elems.length == 0) throw new Error(`'elements' selector '${initialisation.elements}' matches zero SVG elements`);

          if ('attribute' in initialisation) {
            if (!(('name' in initialisation.attribute) && ('value' in initialisation.attribute))) throw new Error(`'attribute' clause missing required 'name' or 'value' properties`);
            updateAttribute(elems, initialisation.attribute.name, initialisation.attribute.value);
          }

          if ('class' in initialisation) {
            updateClass(elems, initialisation['class']);
          }

          if ('tap_action' in initialisation) {
            if ('webhook' in initialisation.tap_action) {
              updateTapAction(elems, 'POST', initialisation.tap_action.webhook);
            } else {
              throw new Error(`'tap_action' clause missing valid protocol ('webhook')`);
            }
          }

          if ('text' in initialisation) {
            updateText(elems, initialisation['text']);
          }
        } catch(e) {
          console.log(`error in initialisation section: ${e.message}`)
        }
      });
    }

    // Create entityMap, a dictionary for every configured Hass entity
    // which maps entity.id => entity configuration.
    this.entityMap = new Map();
    // Iterate over every configured group
    this.config.updates.filter((update) => !(update.disabled && (update.disabled === true))).forEach((update) => {
      if ('entities' in update) {
        update.entities.forEach((entity) => {
          // If entity is not on the entity map then create a new map entry with an empty group configuration array.
          if (!this.entityMap.has(entity.entity)) {
            let entityMapValue = { state: 'unknown', groups: [] };
            this.entityMap.set(entity.entity, entityMapValue);        
          }

          let group = {
            elements: getElements(svg_doc, entity.elements),
            classMap: undefined,
            currentClass: undefined,
            text: undefined,
            currentText: undefined,
            attribute: undefined,
            currentAttribute: undefined,
            tapAction: undefined
          };

          if ('class' in update) {
            group.classMap = new Map();
            update.class.forEach((state) => { group.classMap.set(state.state, state['class']); });
          }

          if ('text' in update) {
            group.text = update.text;
          }

          if ('attribute' in update) {
            group.attribute = { name: update.attribute.name, value: update.attribute.value };
          }

          this.entityMap.get(entity.entity).groups.push(group);
        });
      }
    });
    this.updateStates();
  }

  setConfig(config) {
    if (!config.image) throw new Error("card configuration requires an 'image' attribute");
    
    console.info(
      `%c PDJR-SCHEMATIC-CARD %c Version 1.0.1 `,
      "color: orange; font-weight: bold; background: black",
      "color: white; font-weight: bold; background: dimgray",
    );

    this.config = config;

    if (!this.content) {
      // Create basic structure of the card
      const root = this.shadowRoot;
      this.card = document.createElement('pdjrs-card');
      this.card.header = 'pdjr-schematic-card';
      this.content = document.createElement('div');
      this.content.style.padding = '1px';

      // Add svg file to card and insert css style once loaded
      this.image = document.createElement('object');
      this.image.type = 'image/svg+xml';
      this.image.data = this.config.image;
      this.image.style = 'width: 100%; border-radius: 8px;';
      this.image.id = this.config.id || 'pdjr-schematic-card';
      this.image.async = false;
      this.image.onload = this.prepareSVGOnceLoaded.bind(this);

      // Put all the HTML elements together and also add the title if available
      this.content.appendChild(this.image);
      this.card.appendChild(this.content);
      root.appendChild(this.card);
    }
  }

  set hass(hass) {
    // Store the hass object for use in other functions
    this.myHass = hass;

    // Update states on the svg picture
    this.updateStates();
  }

  getCardSize() {
    return 8;
  }
  
}

customElements.define('pdjr-schematic-card', ActiveDrawing);

/**
 * Parse a string of element selectors into an array of DOM
 * elements. The string must contain a space delimited list
 * of selectors beginning with either a '#' or a '.'.
 * @param document - SVG document
 * @param selectors - space separated list of element ids.
 * @returns array of selected DOM elems. 
 */
function getElements(document, selectors) {
  return(
    selectors.split(/ /).reduce((a, selector) => {
      var element;
      switch (selector.charAt(0)) {
        case '#':
          if (element = document.getElementById(selector.slice(1))) {
            a.push(element);
          } else {
            console.debug(`element with id '${selector.slice(1)}' not found in DOM`);
          }
          break;
        case '.':
          Array.prototype.forEach.call(document.getElementsByClassName(selector.slice(1)), (element) => { a.push(element); });
          break;
        default:
          console.debug(`invalid '${selector}' (should begin with '#' or '.')`);
          break;
      }
      return(a);
    }, [])
  )
}

/**
 * Update the classList of a collection of DOM elements.
 * @param elements - array of DOM elements.
 * @param add - class to be added to elements.
 * @param remove - class to be removed from elements.
 * @returns add.
 */
function updateClass(elements, add, remove) {
  var retval = undefined;
  if (elements.length > 0) {
    elements.forEach((element) => {
      if ((remove !== undefined) && (element.classList.contains(remove))) {
        element.classList.remove(remove);
      }
      if ((add !== undefined) && (!element.classList.contains(add))) {
        element.classList.add(add);
        retval = add;
      }
    });
  }
  return(retval);
}

function updateText(elements, text) {
  var retval = undefined;
  if ((elements.length > 0) && (text !== undefined)) {
    elements.forEach((element) => { element.textContent = text; });
    retval = text;
  }
  return(retval);
}

function updateAttribute(elements, attributeName, attributeValue) {
  var retval = undefined;
  if ((elements.length > 0) && (attributeName !== undefined) && (attributeValue !== undefined)) {
    elements.forEach((element) => { element.setAttribute(attributeName, attributeValue); });
    retval = attributeValue;
  }
  return(retval);
}

function updateTapAction(elements, method, url, body='') {
  if (elements.length > 0) {
    elements.forEach((element) => {
      switch (method) {
        case 'POST':
          element.onclick = function() { fetch(url, { method: method }); };
          break;
        default:
          break;
      }
    });
  }
}


