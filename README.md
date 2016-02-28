# Ember-view-state

[![Build Status](https://travis-ci.org/MiguelMadero/ember-view-state.svg?branch=master)](https://travis-ci.org/MiguelMadero/ember-view-state)
[![Code Climate](https://codeclimate.com/github/MiguelMadero/ember-view-state/badges/gpa.svg)](https://codeclimate.com/github/MiguelMadero/ember-view-state)
[![Test Coverage](https://codeclimate.com/github/MiguelMadero/ember-view-state/badges/coverage.svg)](https://codeclimate.com/github/MiguelMadero/ember-view-state/coverage)
[![Dependency Status](https://www.versioneye.com/user/projects/56d23356157a690037bbb71c/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56d23356157a690037bbb71c)
[![npm version](https://badge.fury.io/js/ember-view-state.svg)](https://badge.fury.io/js/ember-view-state)

Ember View State persists the values of the specified properties in a component (or controller if that's still your thing) so the state can be maintained between transitions, sessions and devices. This is useful to provide a better user experience. Some useful cases are:

* Remember the sort state
* Remember the last selected tab
* Remember if an accordion panel is open or closed.

# Simple Usage

The addon exposes an view-state Mixin, you can use it in your component and sepecify the viewStateKey and viewStateProperties and the addon will take care of the rest.

```
// app/components/my-component
import ViewStateMixin from 'ember-view-state/mixins/view-state';
export default Ember.Component.extend(ViewStateMixin, {
  myProperty: 'value',
  transientProperty: 'this value won\'t be persisted',
  viewStateKey: 'my-component',
  viewStateProperties: ['myProperty']
});
```

## Explanation

1. When the component is instantiated, the addon will look for a persisted state for the viewStateKey and set all the properties defined by viewStateProperties. If the properties aren't present, the default value defined by the componet will be used.
2. When the component is destroyed, the properties will be persisted to local storage.
3. If the user navigates back to a page that uses the same component, the cycle repeats.

By default, the view state is persisted to local storage, this can be overriden, please see [Server Persistance](#Server Persistance) below. It's important to keep in mind that on Incognito window, Local Storage will only be valid during the session. In Safari for Private Browser, we use a polyfill that stores in memory, that means that we can't share the ViewState across tabs.

*Note:* it's recommended to use the component name as the key, but you can use any string, even a calculated value as long as it's calculated on init and it doesn't change during the lifycycle of the component.

# Persisting manually

Normally, persisting during willDestroy is enough. However, there're cases that a property won't ever be persisted if the component is never destroyed (e.g. a component is used by application.hbs) or the user closes the browser. In those cases you can explicitly call `this.persistViewState` from an action.

```
// app/components/my-component
import ViewStateMixin from 'ember-view-state/mixins/view-state';
export default Ember.Component.extend(ViewStateMixin, {
  myProperty: 'value',
  viewStateKey: 'my-component',
  viewStateProperties: ['myProperty'],
  action: {
    save(newValue) {
      this.set('myProperty', newValue);
      // ... do the actual save here
    this.persistViewState();
    }
  }
});
```

# Usage from controllers

Don't do it.

If you really feel like using controllers and persisting some of their properties the setup is the same, but you have to manually call `persistViewState` on `deactivate` from the route.

```
// app/controllers/blog
import ViewStateMixin from 'ember-view-state/mixins/view-state';
export default Ember.Component.extend(ViewStateMixin, {
  myProperty: 'value',
  transientProperty: 'this value won\'t be persisted',
  viewStateKey: 'my-component',
  viewStateProperties: ['myProperty', {persistedWithDifferentName: 'differentName'}]
});
```

```
// app/routes/blog
export default Ember.Route.extend({
  deactivate: function () {
    this._super();
    this.controllerFor('blog').persistViewState();
  }
});
```

# Alias

This is useful for cases where the name of the property in the component doesn't match the name used when persisting the state. It can happen after refactoring or if you're sharing the same state between different components.

```
// app/components/my-component
import ViewStateMixin from 'ember-view-state/mixins/view-state';
export default Ember.Component.extend(ViewStateMixin, {
  persistedWithDifferentName: 'this property is persisted as differentName instead of persistedWithDifferentName',
  viewStateKey: 'my-component',
  viewStateProperties: [{persistedWithDifferentName: 'differentName'}]
});
```

# Server Persistance

All of the persistance happens on `services/view-state-repository`, that service is responsible for persisting to localStorage and it has a hook you can use to persist to the server. This properties can change too frequently and by default, the server saves are throttle to 5 minutes. The current implementation also merges the ViewState persisted in localStorage and the ViewState persisted server side. You can override al of this. To override any of this, overri

```
// app/services/view-state-repository.js
import ViewStateRepository from 'ember-view-state/services/view-state-repository';
export default ViewStateRepository.extend({
  _serverSideSaveDelay: 5*60*1000, // 5 minutes (the default)
  _loadServerViewState() {
    return ajax.get('url');
  },
  _persistViewStateServerSide: function (data) {
    return ajax('url', 'POST', data);
  }
});
```

The data retrieved and persisted has the following format

```
let data = {
  viewState: {
    'my-component': {
      myProperty: 'value'
    }
  },
  lastUpdatedAt: "2016-02-28T00:49:01.068Z"
};
```

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
