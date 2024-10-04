# pdjr-schematic-card

pdjr-schematic-card is a lovelace card for Home Assistant which updates
SVG images by applying changes to image components in response to state
changes on associated Home Assistant entities.

## YAML configuration
```
type: custom:pdjr-schematic-card
id: home_assistant_entity_identifier
image: path_to_svg_document
stylesheet: path_to_css_stylesheet
groups:
  - name: name_of_group
    debug: boolean
    entities:
      - id: ha_entity_id
        element_ids: ids_of_svg_elements_associated_with ha_entity_id
    actions:
      set_class: 'temp'
      set_text: 'text'
      set_attribute:
        name: 'transform'
        value: 'rotate(0)'
      update_class:
        - state: 'on'
          class: 'on-class'
        - state: 'off'
          class: 'off-class'
      update_text: true
      update_attribute:
        name: 'transform'
        value: 'rotate(${state})'
```
##  
<dl>
  <dt>groups<dt>
  <dd>
  Required array consisting of a collection of named configuration groups.
  Serves simply to organise the card configuration.
  Each item in the groups array has the following properties.
  <dl>
    <dt>name</dt>
    <dd>
    Optional text. Purely documentary.
    </dd>
    <dt>debug</dt>
    <dd>
    Optional boolean which defaults to false.
    A true value causes debug info to be issued to the console.
    </dd>
    <dt>entities</dt>
    <dd>
    A list of entity maps each of which binds a Home Assistant entity
    to one or more contingent SVG elements.
    Each entity map has two properties.
    <dl>
      <dt>id</dt>
      <dd>
      Required string identifying a Home Assistant entity whose state
      changes will trigger actions to update the SVG.
      For example: 'sensor.saloon_temperature'.
      </dd>
      <dt>element_ids</dt>
      <dd>
      Required string containing a list of one or more space-delimited
      DOM selectors which identify those SVG elements that should be
      updated when 'id's state changes.
      Selectors must begin with either '#' (to target a single element)
      or '.' (to target all elements in a class).
      For example: '#saloon-door .saloon-windows'.
      </dd>
    </dl>
    </dd>
    <dt>actions</dt>
    <dd>
    Required collection of one or more of the following actions.
    Set actions are executed once immediately the SVG image is loaded.
    Update actions are executed on every state change of the associated
    Home Assistant entity.
    <dl>
      <dt>set_class: '<em>class</em>'</dt>
      <dd>
      Add <em>class</em> to the classList of all selected SVG elements. 
      </dd>
      <dt>set_text: '<em>text</em>'</dt>
      <dd>
      Set the text content of all selected SVG elements to <em>text</em>.
      </dd>
      <dt>set_attribute:</dt>
      Introduces a configuration which will assign a specified value to
      a named attribute in all selected SVG elements.
      Required properties are:
      <dl>
        <dt>name: '<em>attribute_name</em>'
        <dd>
        Name of the attribute to be updated.
        </dd>
        <dt>value: '<em>attribute_value</em>'
        <dd>
        Value for the named attribute.
        </dd>
      </dl>
      For example:
      ```
      set_attribute:
        name: 'transform'
        value: 'rotate(0)'
      ```
    </dl>
    </dd>
  </dl>
  </dd> 
The 'group' property is purely documentarySet actions are executed once as soon as the specified SVG document is
loaded.

## Update options
Update options are executed each time the value of the associated
entity is updated.
