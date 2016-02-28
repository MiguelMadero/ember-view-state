import Ember from 'ember';

const {on, computed, inject } = Ember;

/***
 * Turns a mix of string and objects into objects with key/value so we can use consistently.
 */
var adjustPropertyDefinitions = function(properties) {
  return properties.map(function(propertyDefinition) {
    if (typeof propertyDefinition === 'string') {
      return {
        mixeePropertyName: propertyDefinition,
        persistedPropertyName: propertyDefinition
      };
    }
    var key = Object.keys(propertyDefinition)[0];
    return {
      mixeePropertyName: key,
      persistedPropertyName: propertyDefinition[key]
    };
  });
};
/***
 * Synchronizes mixee properties with persisted user ViewState.
 * some of the API is inspired by concept's used by Ember's [query-params]
 * (http://emberjs.com/guides/routing/query-params/), please read it for a deeper understanding
 */
export default Ember.Mixin.create({
  viewStateRepository: inject.service(),
  /***
   * key used to uniquely identify the persisted properties.
   * Required, must be defined by mixee
   */
  viewStateKey: null,
  /***
   * List of properties to persist
   * Specify an array with strings or objects. If using an object, the key refers to the mixee property
   * and the string value to the persisted property
   * ```
   * viewStateKey: ['sort', 'group', {componentProperty: 'persistedProperty'}]
   * ```
   * To specify a default value, simply define it in the mixee.
   * For more information see [query-params Map a controller's property to a different query param
   * key](http://emberjs.com/guides/routing/query-params/)
   */
  viewStateProperties: computed(function() {
    return [];
  }),

  loadViewState: on('init', function() {
    var _this = this,
      viewState = this.get('viewStateRepository').getViewStateFor(this.get('viewStateKey')),
      propertyDefinitions = adjustPropertyDefinitions(this.get('viewStateProperties'));

    propertyDefinitions.forEach(function(propertyDefinition) {
      if (viewState.hasOwnProperty(propertyDefinition.persistedPropertyName)) {
        // If we have a persisted value, we set it in the mixee. Otherwise, leave the default
        _this.set(propertyDefinition.mixeePropertyName,
          viewState[propertyDefinition.persistedPropertyName]);
      }
    });
  }),

  persistViewState: on('willDestroyElement', function() {
    // TODO: consider checking isDirty instead of always flushing
    var _this = this,
      viewState = this.get('viewStateRepository').getViewStateFor(this.get('viewStateKey')),
      propertyDefinitions = adjustPropertyDefinitions(this.get('viewStateProperties'));

    propertyDefinitions.forEach(function(propertyDefinition) {
      Ember.set(viewState, propertyDefinition.persistedPropertyName,
        _this.get(propertyDefinition.mixeePropertyName));
    });
    viewState.lastUpdatedAt = new Date();
    this.get('viewStateRepository').flush();
  })
});
