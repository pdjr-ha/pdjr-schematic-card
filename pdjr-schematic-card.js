class ActiveDrawing extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  updateStates() {
    const svg_doc = this.image.getSVGDocument();

    if ((svg_doc) && (this.myHass)) {
      if (this.entityMap) this.entityMap.forEach((groupPropertiesArray, entityId) => {
        groupPropertiesArray.forEach((groupProperties) => {
          try {
            if (groupProperties.currentState != this.myHass.states[entityId].state) {

              if (groupProperties.updateClass) {
                let cl = groupProperties.updateClass.get(this.myHass.states[entityId].state);
                if (groupProperties.currentClass != cl) groupProperties.currentClass = updateClass(groupProperties.elements, cl, groupProperties.currentClass);
              }

              if (groupProperties.updateText) {
                let text = groupProperties.updateText;
                text = text.replace('${state}', this.myHass.states[entityId].state);
                text = text.replace('${uom}', this.myHass.states[entityId].attributes.unit_of_measurement);
                if (groupProperties.currentText != text) groupProperties.currentText = updateText(groupProperties.elements, text);
              }

              if (groupProperties.updateAttribute) {
                if ((groupProperties.updateAttribute.name) && (groupProperties.updateAttribute.value)) {
                  let attributeValue = groupProperties.updateAttribute.value;
                  attributeValue = attributeValue.replace('${state}', this.myHass.states[entityId].state);
                  if (groupProperties.currentAttribute != attributeValue) groupProperties.currentAttribute =  updateAttribute(groupProperties.elements, groupProperties.updateAttribute.name, attributeValue);
                } else {
                  throw new Error(`'update_attribute' configuration missing 'name' and 'value' properties`);
                }
              }

              groupProperties.currentState = this.myHass.states[entityId].state;
            }
          } catch(e) {
            console.error(`error updating entity '${entityId}' in group '${groupProperties.group}' (${e.message})`);
          }
        });
      });
    }
  }

  prepareSVGOnceLoaded() {
    var entityId, event;

    // Add any associated stylesheet to the svg file
    let svg_doc = this.image.contentDocument;
    let svgElem = svg_doc.querySelector('svg');
    let style = svg_doc.createElementNS("http://www.w3.org/2000/svg", "style");
    if (this.config.stylesheet) {
      style.textContent = '@import url("' + this.config.stylesheet + '");';
    } else {
      console.info(`stylesheet not specified - using default '${this.config.image.replace('.svg','.css')}'`);
      style.textContent = '@import url("' + this.config.image.replace('.svg','.css') + '");';
    }
    svgElem.insertBefore(style, svgElem.firstChild);

    // Create entityMap, a dictionary for every configured Hass entity
    // which maps entity.id => entity configuration.
    this.entityMap = new Map();
    // Iterate over every configured group
    this.config.groups.filter((group) => !(group.disabled && (group.disabled === true))).forEach((group) => {
      if (('entities' in group) && ('actions' in group)) {
        // Iterate over every configured entity
        group.entities.forEach((ent) => {

          // Apply any initialisations configured for the current element.
          let elems = getElements(svg_doc, ent.elements);
          if ('set_class' in group.actions) updateClass(elems, group.actions.set_class);
          if ('set_text' in group.actions) updateText(elems, group.actions.set_text);
          if ('set_attribute' in group.actions) updateAttribute(elems, group.actions.set_attribute.name, group.actions.set_attribute.value);

          // Create an entity map with a group configuration array.
          if (!this.entityMap.has(ent.entity)) this.entityMap.set(ent.entity, []);        
          let groupProperties = {
            group: group.name,
            elements: elems,
            currentState: undefined,
            currentClass: undefined,
            currentText: undefined,
            currentAttribute: undefined,
            updateClass: undefined,
            updateText: undefined,
            updateAttribute: undefined
          };

          if ('update_class' in group.actions) {
            var classMap = new Map();
            group.actions.update_class.forEach((state) => { classMap.set(state.state, state.class); });
            groupProperties.updateClass = classMap;
          }

          if ('update_text' in group.actions) {
            groupProperties.updateText = group.actions.update_text
          }

          if ('update_attribute' in group.actions) {
            groupProperties.updateAttribute = group.actions.update_attribute;
          }

          this.entityMap.get(ent.entity).push(groupProperties);

          elems.forEach((element) => {
          if ("action" in group) {
            group.action.forEach(service => {
              switch (service.type) {
                case 'post':
                  var request_url = service.url;
                  var request_headers = { "Content-type": "application/json" };
                  if (service.authorization) request_headers["Authorization"] = "Bearer " + service.authorization;
                  var request_body = { "entity_id": entity.id };
                  if (service.topic) request_body["topic"] = (service.topic.slice(-1) == "/")?(service.topic + entityId):service.topic; 
                  if (service.message) request_body["message"] = service.message;
                  element.addEventListener('click', () => {
                    if (service.confirm) {
                      if (confirm("Toggle " + entity.id + "?")) {
                        fetch(request_url, {
                          method: "POST",
                          headers: request_headers,
                          body: JSON.stringify(request_body)
                        });
                      }
                    } else {
                      fetch(request_url, {
                        method: "POST",
                        headers: request_headers,
                        body: JSON.stringify(request_body)
                      });
                    }
                  });
                  break;
                default:
                  break;
              }
            });
          } else {
            // Click event for mouse
            element.addEventListener('click', (e) => {
              event = new Event('hass-more-info');
              event.detail = { 'entityId': ent.entity };
              document.querySelector('home-assistant').dispatchEvent(event);
            });
            // Touch event for touchscreens
            element.addEventListener('touchend', (e) => {
              event = new Event('hass-more-info');
              event.detail = { 'entityId': ent.entity };
              document.querySelector('home-assistant').dispatchEvent(event);
            });
          }
          });

        });
      } else {
        console.error(`bad configuration: missing 'action' and/or 'entities' property in group '${group.name}'`);
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
