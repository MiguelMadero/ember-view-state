import Ember from 'ember';
import ViewStateMixin from 'ember-view-state/mixins/view-state';
// import ViewStateRepository from 'ember-view-state/services/view-state-repository';
import { module, test } from 'qunit';
import sinonTest from 'dummy/tests/ember-sinon-qunit/test';


module('Unit | Mixin | view state');


const persistedPreferences = {
  sort: 'tradeName_desc',
  displayComments: false,
  persistedAsUndefined: undefined,
};
const Component = Ember.Component.extend(ViewStateMixin, {
  sort: 'date_asc',
  group: 'tradeName',
  showComments: true,
  persistedAsUndefined: 'different value that should be overriden',
  viewPreferenceKey: 'preference-key',
  viewPreferenceProperties: ['sort', 'group', 'persistedAsUndefined', {showComments: 'displayComments'}]
});


test('properties are overriden on init based on persistedPreferences', function (assert) {
  const component = Component.create({
    viewStateRepository: {
      getPreferencesFor() {
        return persistedPreferences;
      }
    }
  });
  assert.equal(component.get('sort'), 'tradeName_desc');
  assert.equal(component.get('group'), 'tradeName');
  assert.equal(component.get('showComments'), false);
  assert.equal(component.get('persistedAsUndefined'), undefined);
});

sinonTest('#persistUserPreferences updates and persists persistedProperties', function (assert) {
  const repository = {
    getPreferencesFor() {
      return persistedPreferences;
    },
    flush() {}
  };
  const component = Component.create({
    viewStateRepository: repository
  });
  const flushSpy = this.spy(repository, 'flush');

  component.set('sort', 'newValue1');
  component.set('group', 'newValue2');
  component.set('showComments', undefined);
  component.set('persistedAsUndefined', 'newValue4');

  component.persistUserPreferences();

  assert.equal(component.get('sort'), 'newValue1');
  assert.equal(component.get('group'), 'newValue2');
  assert.equal(component.get('showComments'), undefined);
  assert.equal(component.get('persistedAsUndefined'), 'newValue4');

  assert.ok(flushSpy.called);
});
