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
          var cl = props.classMap.get(this.myHass.states[id].state);
          if (props.appliedClass !== cl) {
            props.elements.forEach((element) => {
              element.classList.remove(props.appliedClass);
              element.classList.add(cl);
            });
            props.appliedClass = cl;
          }
          if (props.updateText) {
            var text = this.myHass.states[id].state + (this.myHass.states[id]["attributes"]["unit_of_measurement"] || "");
            props.elements.forEach((element) => {
              element.textContent = text;
            });
          }
          if (props.updateRotation) {
            var text = `rotate(${this.myHass.states[id].state})`;
            props.elements.forEach((element) => {
              element.setAttribute('transform', text);
            });
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

      var classMap = new Map();
      if (("on_state_change" in group) && ("update_class" in group.on_state_change)) {
        group.on_state_change.update_class.forEach((state) => {
          classMap.set(state.state, state.class);
        });
      }

      group.entities.forEach((entity) => {
        this.entityMap.set(entity.id, {
          state: null,
          appliedClass: null,
          elements: getElementIds(entity.elements),
          classMap: classMap,
          updateText: (("on_state_change" in group) && ("update_text" in group.on_state_change))?setStaticClass(getElementIds(entity.elements), group.on_state_change.update_text):false,
          updateRotation: (("on_state_change" in group) && (group.on_state_change.update_rotation === true))
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

    function getElementIds(elementIdString) {
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

    function setStaticClass(elements, cssClass) {
      if ((elements.length > 0) && (cssClass !== undefined)) {
        elements.forEach((element) => { element.classList.add(cssClass); });
        return(true);
      }
      return(false);
    }
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

