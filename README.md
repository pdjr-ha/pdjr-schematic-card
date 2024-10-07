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
##  
<dl>
  <dt>type: custom:pdjr-schematic-card</dt>
  <dd>
  Required.
  </dd>
  <dt>id: '*card-identifier*'
  <dd>
  Optional string supplying an identifier for the card.
  Defaults to 'pdjr-schematic-card'.
  </dd>
  <dt>image: '*svg-document-filename*'</dt>
  <dd>
  Required string supplying a path to the SVG document that should be
  displayed as the card content.
  </dd>
  <dt>stylesheet: '*css-document-filename*'</dt>
  <dd>
  Optional string supplying a path to a CSS document that should be
  linked to the displayed SVG document.
  Defaults to *svg-document-filename* with the filename extension
  replaced by '.css'.
  </dd>
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
    Optional boolean controlling whether or not debug information for
    the group should be issued to the console.
    Defaults to false (do not issue debug information).
    </dd>
    <dt>entities</dt>
    <dd>
    A list of entity maps each of which binds a Home Assistant entity
    to one or more contingent SVG elements.
    Each entity map has two properties.
    <dl>
      <dt>entity</dt>
      <dd>
      Required string identifying a Home Assistant entity whose state
      changes will trigger actions to update the SVG.
      For example: <code>entity: 'sensor.saloon_temperature'</code>.
      </dd>
      <dt>elements</dt>
      <dd>
      Required string containing a list of one or more space-delimited
      DOM selectors which identify those SVG elements that should be
      updated when the associated entity's state changes.
      Selectors must begin with either '#' (to target a single element)
      or '.' (to target all elements in a class).
      For example: <code>elements: '#saloon-door .saloon-windows'</code>.
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
      <code>
      set_attribute:
        name: 'transform'
        value: 'rotate(0)'
      </code>
    </dl>
    </dd>
  </dl>
  </dd> 
The 'group' property is purely documentarySet actions are executed once as soon as the specified SVG document is
loaded.

## Update options
Update options are executed each time the value of the associated
entity is updated.
