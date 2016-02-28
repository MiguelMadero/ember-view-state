import Ember from 'ember';
import ViewStateMixin from 'ember-view-state/mixins/view-state';
// import ViewStateRepository from 'ember-view-state/services/view-state-repository';
import { module, test } from 'qunit';
import sinonTest from 'dummy/tests/ember-sinon-qunit/test';


module('Unit | Mixin | view state');


const persistedViewState = {
  sort: 'tradeName_desc',
  displayComments: false,
  persistedAsUndefined: undefined,
};
const Component = Ember.Component.extend(ViewStateMixin, {
  sort: 'date_asc',
  group: 'tradeName',
  showComments: true,
  persistedAsUndefined: 'different value that should be overriden',
  viewStateKey: 'view-state-key',
  viewStateProperties: ['sort', 'group', 'persistedAsUndefined', {showComments: 'displayComments'}]
});


test('properties are overriden on init based on persistedViewState', function (assert) {
  const component = Component.create({
    viewStateRepository: {
      getViewStateFor() {
        return persistedViewState;
      }
    }
  });
  assert.equal(component.get('sort'), 'tradeName_desc');
  assert.equal(component.get('group'), 'tradeName');
  assert.equal(component.get('showComments'), false);
  assert.equal(component.get('persistedAsUndefined'), undefined);
});

sinonTest('#persistViewState updates and persists persistedProperties', function (assert) {
  const repository = {
    getViewStateFor() {
      return persistedViewState;
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

  component.persistViewState();

  assert.equal(component.get('sort'), 'newValue1');
  assert.equal(component.get('group'), 'newValue2');
  assert.equal(component.get('showComments'), undefined);
  assert.equal(component.get('persistedAsUndefined'), 'newValue4');

  assert.ok(flushSpy.called);
});
