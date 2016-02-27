import Ember from 'ember';

const {on, computed, inject } = Ember;
// TODO: check if we need moment
let moment = function () {
  return new Date();
};

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
 * Synchronizes mixee properties with persisted user preferences.
 * some of the API is inspired by concept's used by Ember's [query-params]
 * (http://emberjs.com/guides/routing/query-params/), please read it for a deeper understanding
 */
export default Ember.Mixin.create({
  viewStateRepository: inject.service(),
  /***
   * key used to uniquely identify the persisted properties.
   * Required, must be defined by mixee
   */
  viewPreferencesKey: null,
  /***
   * List of properties to persist
   * Specify an array with strings or objects. If using an object, the key refers to the mixee property
   * and the string value to the persisted property
   * ```
   * viewPreferenceProperties: ['sort', 'group', {componentProperty: 'persistedProperty'}]
   * ```
   * To specify a default value, simply define it in the mixee.
   * For more information see [query-params Map a controller's property to a different query param
   * key](http://emberjs.com/guides/routing/query-params/)
   */
  viewPreferenceProperties: computed(function() {
    return [];
  }),

  loadUserPreferences: on('init', function() {
    var _this = this,
      preferences = this.get('viewStateRepository').getPreferencesFor(this.get('viewPreferencesKey')),
      propertyDefinitions = adjustPropertyDefinitions(this.get('viewPreferenceProperties'));

    propertyDefinitions.forEach(function(propertyDefinition) {
      if (preferences.hasOwnProperty(propertyDefinition.persistedPropertyName)) {
        // If we have a persisted value, we set it in the mixee. Otherwise, leave the default
        _this.set(propertyDefinition.mixeePropertyName,
          preferences[propertyDefinition.persistedPropertyName]);
      }
    });
  }),

  persistUserPreferences: on('willDestroyElement', function() {
    // TODO: consider checking isDirty instead of always flushing
    var _this = this,
      preferences = this.get('viewStateRepository').getPreferencesFor(this.get('viewPreferencesKey')),
      propertyDefinitions = adjustPropertyDefinitions(this.get('viewPreferenceProperties'));

    propertyDefinitions.forEach(function(propertyDefinition) {
      Ember.set(preferences, propertyDefinition.persistedPropertyName,
        _this.get(propertyDefinition.mixeePropertyName));
    });
    preferences.lastUpdatedAt = moment();
    this.get('viewStateRepository').flush();
  })
});
