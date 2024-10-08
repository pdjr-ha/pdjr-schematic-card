# pdjr-schematic-card

**pdjr-schematic-card** is a Lovelace card for Home Assistant which
dynamically updates SVG images in response to state changes on Home
Assistant entities.

The plugin supports three types of update.

A 'class' update allows arbitrary CSS classnames to be assigned to
selected elements dependent upon the state of a Home Assistant entity.

A 'text' update allows an arbitrary text value to be assigned to
selected elements.
The assigned text can be a simple state value or a more complex 

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
Required object specifying one or more of the following actions to
be performed on the selected SVG elements.

##### set_class: '*class*'
Add *class* to the classList of all selected elements as soon
as the SVG image is loaded.

Example: ```set_class: 'invisible'```.

##### set_text: '*text*'
Set the text content of all selected elements to *text* as soon
as the SVG image is loaded.

Example: ```set_text: '--'```.

##### set_attribute:
Set the value of a specified attribute of all selected elements
as soon as the SVG image is loaded.

Example:
```
set_attribute:
  name: 'transform'
  value: 'rotate(0)'
```

##### update_class:
Introduces an array of objects each of which maps an entity state
to a CSS class.

For example:
```
update_class:
  - state: 'on'
    class: 'visible'
  - state: 'off'
    class: 'invisible'
```

##### update_text: '*text*'
Set the text content of the selected elements to *text* each time
the state of the associated Home Assistant entity changes.

##### update_attribute:
Introduces an object which specifies an element attribute which
should be updated on each entity state change.
The object has the following properties.

###### name: '*attribute-name*'
Name of the attribute to be updated.

###### value: '*attribute-value*'
Value for the named attribute.

The *text* and *attribute-value* may include the token '${state}'
which will be interpolated with the current value of the associated
Home Assistant entity and the token '${uom}' which will be interpolated
with the value of the entity's unit of measure.

For example, ```update_text: '${state}${uom}'```.

## Author
Paul Reeve <*preeve_at_pdjr_dot_eu*>
