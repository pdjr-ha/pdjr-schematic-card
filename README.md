# pdjr-schematic-card

**pdjr-schematic-card** is a Lovelace card for Home Assistant which
dynamically updates SVG images in response to state changes on Home
Assistant entities.

## Example YAML configuration
```
type: custom:pdjr-schematic-card
image: path_to_svg_document
groups:
  - name: 'Lighting'
    entities:
      - entity: 'switch.saloon_downlights'
        elements: '.saloon-downlights'
      - entity: 'switch.saloon_sconces'
        elements: '.saloon-sconces'
    actions:
      update_class:
        - state: 'on'
          class: 'light-on'
        - state: 'off'
          class: 'light-off'
```
## Configuration properties

### type: custom:pdjr-schematic-card
Required.

### id: '*card-identifier*'
Optional string supplying an identifier for the card.

Defaults to 'pdjr-schematic-card'.

### image: '*svg-document-filename*'
Required string supplying a path to the SVG document that should be
displayed as the card content.

### stylesheet: '*css-document-filename*'
Optional string supplying a path to a CSS document that should be
linked to the displayed SVG document.

Defaults to *svg-document-filename* with the filename extension
replaced by '.css'.

### groups:
Required array consisting of a collection of named group objects.

Each item in the groups array has the following properties.

#### name: '*group-name*'
Required, purely documentary, name for the group.

#### debug: [ true | false ]
Optional boolean controlling whether or not debug information for
the group should be issued to the console.

Defaults to false (do not issue debug information).

#### entities:
Required array of entity objects each of which binds a Home Assistant
entity to one or more contingent SVG elements.

Each object in the entities array has two properties.

##### entity: '*entity-id*'
Required string identifying a Home Assistant entity whose state
changes should update the SVG.

##### elements: '*element-selectors*'
Required string containing a space-delimited list of one or more
DOM selectors which identify those SVG elements that should be
updated when the associated entity's state changes.
    
Selectors must begin with either '#' (to target a single element)
or '.' (to target all elements in a class).

#### actions:
Required object specifying actions to be performed on the selected
SVG elements.
Actions are selected and configured by included one or more of the
following properties in the *action* object.

##### set_class: '*class*'
Add *class* to the classList of all selected SVG elements.

##### set_text: '*text*'
Set the text content of all selected SVG elements to *text*.

##### set_attribute:
Object introducing a configuration which will assign a specified
value to a named attribute in all selected SVG elements.

Required properties are.

###### name: '*attribute-name*'
Name of the attribute to be updated.

###### value: '*attribute-value*'
Value for the named attribute.

*attribute-value* may include the token '${state}' which will be
interpolated with the current value of the associated Home Assistant
entity.

## Author
Paul Reeve <*preeve_at_pdjr_dot_eu*>
