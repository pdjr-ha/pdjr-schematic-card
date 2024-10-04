class ActiveDrawing extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  updateStates() {
    const svg_doc = this.image.getSVGDocument();

    if (svg_doc && this.myHass) {
      if (this.entityMap) this.entityMap.forEach((props, id) => {
        if (this.myHass.states[id]) {

          if (props.updateClass) {
            let cl = props.updateClass.get(this.myHass.states[id].state);
            if ((cl) && (props.appliedClass !== cl)) {
              props.appliedClass = setClass(props.elements, cl, props.appliedClass);
            }
          }

          if (props.updateText) {
            let text = this.myHass.states[id].state + (this.myHass.states[id]["attributes"]["unit_of_measurement"] || "");
            if ((text) && (props.appliedText !== text)) {
              setText(props.elements, text);
              props.appliedText = text;
            }
          }

          if (props.updateAttribute !== undefined) {
            if (props.appliedAttributeState !== this.myHass.states[id].state) {
              setAttribute(props.elements, props.updateAttribute.name, props.updateAttribute.value, this.myHass.states[id].state);
              props.appliedAttributeState = this.myHass.states[id].state;
            }
          }

        }
      });
    }
  }

  prepareSVGOnceLoaded() {
    var entityId, elementId, element;

    // Add the stylesheet to the svg file
    var svg_doc = this.image.contentDocument;
    var style = svg_doc.createElementNS("http://www.w3.org/2000/svg", "style");
    // Make the browser load our css
    style.textContent = '@import url("' + this.config.stylesheet + '");';
    var svgElem = svg_doc.querySelector('svg');
    svgElem.insertBefore(style, svgElem.firstChild);

    this.entityMap = new Map();
    this.config.groups.filter((group) => !(group.disabled && (group.disabled === true))).forEach((group) => {
      //console.info(`Processing group ${JSON.stringify(group, null, 2)}`);

      var classMap = new Map();
      if (("actions" in group) && ("update_class" in group.actions)) {
        group.actions.update_class.forEach((state) => {
          classMap.set(state.state, state.class);
        });
      }

      group.entities.forEach((entity) => {
        let elems = getElements(svg_doc, entity.elements);
        // Apply set_ actions...
        if ('actions' in group) {
          if ('set_class' in group.actions) setClass(elems, group.actions.set_class);
          if ('set_text' in group.actions) setText(elems, group.actions.set_text);
          if ('set_attribute' in group.actions) setAttribute(elems, group.actions.set_attribute.name, group.actions.set_attribute.value);
        }

        this.entityMap.set(entity.id, {
          state: undefined,
          appliedClass: undefined,
          elements: elems,
          updateClass: (('actions' in group) && ('update_class' in group.actions))?classMap:undefined,
          updateText: (('actions' in group) && ('update_text' in group.actions))?group.actions.update_text:undefined,
          updateAttribute: (('actions' in group) && ('update_attribute' in group.actions))?group.actions.update_attribute:undefined
        });
      });
    });

    // Set onClick handlers for each entity in a group for actions and more-info dialogue
    this.config.groups.forEach(group => {
      group.entities.forEach(entity => {
        if ((entity.elements) && (element = svg_doc.getElementById(entity.elements.split(/ /)[0]))) {
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
              event.detail = {'entityId': entity.id};
              document.querySelector('home-assistant').dispatchEvent(event);
            });
            // Touch event for touchscreens
            element.addEventListener('touchend', e => {
              event = new Event("hass-more-info");
              event.detail = {entityId: entity.id};
              document.querySelector('home-assistant').dispatchEvent(event);
              e.preventDefault();
            });
          }
        }
      });
    });

    this.updateStates();
  }



  setConfig(config) {
    if (!config.id) throw new Error("card configuration requires an 'id' attribute");
    if (!config.image) throw new Error("card configuration requires an 'image' attribute");
    if (!config.stylesheet) throw new Error("card configuration requires a 'stylesheet' attribute");
    
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
      this.image.id = this.config.id;
      this.image.async = false;
      this.image.onload = this.prepareSVGOnceLoaded.bind(this);

      // Put all the HTML elements together and also add the title if available
      this.content.appendChild(this.image);
      this.card.appendChild(this.content);
      if (this.config.title) {
        const title = document.createElement('h1');
        title.className = "pdjrsc-header pdjrsc-header-" + this.config.id;
        title.innerHTML = this.config.title;
        root.appendChild(title);
      }
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
   * of element ids (beginning with a '#') or class ids (beginning
   * with a '.').
   * @param elementIdString - space separated list of element ids.
   * @returns array of selected DOM elems. 
   */
  function getElements(svg_doc, elementIdString) {
    return(
      elementIdString.split(/ /).reduce((a,element) => {
        var elem;
        switch (element.charAt(0)) {
          case '#':
            if (elem = svg_doc.getElementById(element.slice(1))) a.push(elem);
            break;
          case '.':
            Array.prototype.forEach.call(svg_doc.getElementsByClassName(element.slice(1)), (elem) => { a.push(elem); });
            break;
          default:
            break;
        }
        return(a);
      }, [])
    )
  }

  /**
   * Assign a CSS class to a collection of DOM elements.
   * @param {*} elements - array of DOM elements.
   * @param {*} cssClass - class to be assigned.
   * @returns true on success false if arguments are invalid.
   */
  function setClass(elements, add, remove = undefined) {
    if (elements.length > 0) {
      elements.forEach((element) => {
        //console.info(`Updating class on ${element.id}: remove class ${remove}, add class ${add}`);
        if (remove !== undefined) element.classList.remove(remove);
        element.classList.add(add);
        return(add);
      });
    }
    return(undefined);
  }

  function setText(elements, text) {
    if ((elements.length > 0) && (text !== undefined)) {
      elements.forEach((element) => {
        //console.info(`Updating text on ${element.id}: ${text}`);
        element.textContent = text;
      });
      return(true);
    }
    return(false);
  }

function setAttribute(elements, attributeName, attributeValue, stateValue = undefined) {
  if ((elements.length > 0) && (attributeName !== undefined) && (attributeValue !== undefined)) {
    if (stateValue !== undefined) attributeValue = attributeValue.replace('${state}', stateValue);
    elements.forEach((element) => {
      //console.info(`Updating attribute on ${element.id}: ${attributeName} ${attributeValue}`);
      element.setAttribute(attributeName, attributeValue);
    });
    return(true);
  }
  return(false);
}
