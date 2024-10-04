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
  This array consists of a collection of named configuration items and
  serves simply to organise the card configuration.
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
    
    <dd>
  </dl>
  </dd> 
The 'group' property is purely documentarySet actions are executed once as soon as the specified SVG document is
loaded.

## Update options
Update options are executed each time the value of the associated
entity is updated.
