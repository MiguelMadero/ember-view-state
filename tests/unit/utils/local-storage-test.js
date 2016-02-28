import storage, {createInMemoryStorage} from 'ember-view-state/utils/local-storage';
import { module, test } from 'qunit';

module('Unit | Utility | local storage');

test('storage contains a function to getItem and setItem even in private browsing in Safari', function(assert) {
  assert.ok(storage.getItem);
  assert.ok(storage.setItem);
});

test('createInMemoryStorage', function(assert) {
  const storage = createInMemoryStorage();
  assert.ok(storage.getItem);
  assert.ok(storage.setItem);

  storage.setItem('test', 1);
  assert.equal(storage.getItem('test'), 1);
});
