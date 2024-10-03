# pdjr-schematic-card

pdjr-schematic-card is a lovelace card for Home Assistant which updates
SVG images by applying class and text value changes to image components
in response to state changes on associated Home Assistant entities.

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
    on_state_change:
      update_class:
        - state: state
          class: name_of_css_class
