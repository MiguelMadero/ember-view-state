import storage from 'ember-view-state/utils/local-storage';
import { module, test } from 'qunit';

module('Unit | Utility | local storage');

// Replace this with your real tests.
test('storage contains a function to getItem and setItem even in private browsing in Safari', function(assert) {
  assert.ok(storage.getItem);
  assert.ok(storage.setItem);
});
