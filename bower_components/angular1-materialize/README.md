# Angular1 Materialize

This is a port of the Angular2 Materialize directive (https://github.com/InfomediaLtd/angular2-materialize) to Angular 1. 
This is a lightweight solution to bringing Material Design to your angular 1 app without the performance nightmare that is the official angular-material library
It started out as a fork of the Angular2 Materialize repo and I am in the process of converting the source code and examples across to Angular 1.

This library provides Angular 1 support for Materialize CSS framework [https://github.com/Dogfalo/materialize](https://github.com/Dogfalo/materialize)

This library adds support for the Materialize CSS framework in Angular 1. 
It is needed to add the dynamic behavior of Materialize CSS that is using JavaScript rather than plain CSS.

You can find a working demo using the directive here
https://github.com/jhlagado/angular1-materialize-demo

To use the directive you need to import it into your project and then use 
its MaterializeDirective 
directive for binding it to any component that needs a dynamic behavior, 
like collapsible panels, tooltips, etc.

#### Using angular1-materialize

Add the Google MD fonts to your index.html:
```html
<link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```
Add the materialize directive to your index.html (soon I will release this as an Npm module):
```html
<script src="scripts/materialize-directive.js"></script>
```

In your page view, use it for dynamic behavior. For example, for collapsible panels:
```html
<ul materialize="collapsible" class="collapsible" data-collapsible="accordion">
  <li>
    <div class="collapsible-header"><i class="material-icons">filter_drama</i>First</div>
    <div class="collapsible-body"><p>Lorem ipsum dolor sit amet.</p></div>
  </li>
  <li>
    <div class="collapsible-header"><i class="material-icons">place</i>Second</div>
    <div class="collapsible-body"><p>Lorem ipsum dolor sit amet.</p></div>
  </li>
  <li>
    <div class="collapsible-header"><i class="material-icons">whatshot</i>Third</div>
    <div class="collapsible-body"><p>Lorem ipsum dolor sit amet.</p></div>
  </li>
</ul>

```

Apply an empty materialize directive attribute directive for top level components, like forms:
```html
<form materialize class="col s12">
  <div class="row">
    <div class="input-field col s6">
      <input placeholder="Placeholder" id="first_name" type="text" class="validate">
      <label for="first_name">First Name</label>
    </div>
  </div>
</form>
```

The materialize directive attribute directive (**materialize**) accepts any MaterializeCSS 
initialization call to apply to the element. The list of supported functions are provided by 
MaterializeCSS. Examples: collapsible, modal, tooltip, dropdown, tabs, material_select, sideNav, etc.

For example, to apply tooltip:
```html
<a materialize="tooltip" class="btn tooltipped" data-position="bottom" data-delay="50" data-tooltip="I am tooltip">Hover me!</a>
```

The materialize directive attribute directive also allows specifying parameters to be passed to the function, 
but providing a **materialize-params** attribute returning an array of params. Use it with a function 
call or even by inlining the params in the HTML.

Another useful option is emitting actions on an element. You may want to do that for calling Materialize functions, 
like closing a modal dialog or triggering a toast. You can do that by passing a callback function
with the **materialize-init** attribute, this callback will be called with an emit function that can be used
to send actions. The emitted events can either be a "string" type action (Materialize function call) 
or a structure with action and parameters:

The example below shows how you'd create a modal dialog and use the actions to open or close it.
```html
<!-- Modal Trigger -->
<a class="waves-effect waves-light btn modal-trigger" ng-click="openModal()">Modal</a>

<!-- Modal Structure -->
<div id="modal1" class="modal bottom-sheet" 
materialize="modal" materialize-params="[{dismissible: false}]" 
materialize-init="modalInit">
  <div class="modal-content">
    <h4>Modal Header</h4>
    <p>A bunch of text</p>
  </div>
  <div class="modal-footer">
    <a class="waves-effect waves-green btn-flat" (click)="closeModal()">Close</a>
    <a class="modal-action modal-close waves-effect waves-green btn-flat">Agree</a>
  </div>
</div>
```
```js
  var modalEmit;
  $scope.modalInit = function(emit) {
    modalEmit = emit;
  }

  $scope.openModal = function() {
    modalEmit({action:"modal",params:['open']});
  }
  $scpope.closeModal = function() {
    modalEmit({action:"modal",params:['close']});
  }
```

For dynamic select elements apply the **materialize-select-options** directive to trigger element updates 
when the options list changes:
```html
<select materialize="material_select" materialize-select-options="selectOptions">
  <option ng-repeat="option in selectOptions" value="{{option.value}}">{{option.name}}</option>
</select>
```

