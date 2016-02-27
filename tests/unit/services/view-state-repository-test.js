import { moduleFor, test } from 'ember-qunit';

var clearLocalStorage = function () {
  if (window.localStorage && window.localStorage.clear) {
    window.localStorage.clear();
  }
};

moduleFor('service:view-state-repository', 'Unit | Service | view state repository', {
  setup() {
    clearLocalStorage();
  },
  teardown() {
    clearLocalStorage();
  }
});

test('_getNamespace', function (assert) {
  const service = this.subject();
  assert.equal(service._getNamespace(), 'ViewState');
});

test('load and flush', function (assert) {
  const service = this.subject();
  // Preferences are lazy loaded
  assert.deepEqual(service.get('_preferences'), undefined);

  let preference = service.getPreferencesFor('my-component-name');
  // New objects are created when gettingPreferences
  assert.deepEqual(preference, {});

  preference.sortProperty = 'firstname_asc';
  service.flush();
  // Changes to that object are saved to localStorage on flush
  assert.deepEqual(service.getPreferencesFor('my-component-name'), { sortProperty: 'firstname_asc' });

  service.set('_preferences', undefined);
  // Calling getPreferencesFor will reload the _preferences if _preferences is undefined
  assert.deepEqual(service.getPreferencesFor('my-component-name'), { sortProperty: 'firstname_asc' });

  clearLocalStorage();
  // Preferences are cached, so we won't hit local storage if it's in memory
  assert.deepEqual(service.getPreferencesFor('my-component-name'), { sortProperty: 'firstname_asc' });

  service.set('_preferences', undefined);
  // If not in memory, or local storage, a new object is returned (just like at the beginning)
  assert.deepEqual(service.getPreferencesFor('my-component-name'), {});
});

test('_mergePreferences given a newerLocalPreference object it should merge the server preferences that are not present in the local', function (assert) {
  const service = this.subject();
  const serverPreferences = {
    lastUpdatedAt: '2015-05-18T20:03:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeTrueSinceLocalIsNewer: false
      }
    }
  };
  const newerLocalPreferences = {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    preferences: {
      'tasks-user-settings': {
        shouldBeTrueSinceLocalIsNewer: true
      },
      chartsList: {
        showInactive: false,
      }
    }

  };
  service._mergePreferences(newerLocalPreferences, serverPreferences);
  assert.deepEqual(newerLocalPreferences, {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeTrueSinceLocalIsNewer: true
      },
      chartsList: {
        showInactive: false,
      }
    }
  });
});

test('_mergePreferences given a newerServerPreference object it should merge the local preferences overriding the local ones', function (assert) {
  const service = this.subject();
  const newerServerPreference = {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  };
  const localPreferences = {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    preferences: {
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: true
      },
      chartsList: {
        showInactive: false,
      }
    }

  };
  service._mergePreferences(localPreferences, newerServerPreference);
  assert.deepEqual(localPreferences, {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      },
      chartsList: {
        showInactive: false,
      }
    }
  });
});

test('_mergePreferences given a fresh localPreferences object we override with server side settings', function (assert) {
  const service = this.subject();
  const serverPreferences = {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  };
  const localPreferences = {};
  service._mergePreferences(localPreferences, serverPreferences);
  assert.deepEqual(localPreferences, {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    preferences: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  });
});

test('_mergePreferences merges based on lastUpdatedAt for each object inside the preferences hash', function (assert) {
  const service = this.subject();
  let serverPreferences = {
    lastUpdatedAt: '2020',
    preferences: {
      'my-component-name': {
        lastUpdatedAt: '2011',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: true,
      }
    }
  };
  let localPreferences = {
    // Old key at this level
    lastUpdatedAt: '2014',
    preferences: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: false,
      }
    }

  };
  service._mergePreferences(localPreferences, serverPreferences);
  assert.deepEqual(localPreferences, {
    lastUpdatedAt: '2020',
    preferences: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: false,
      }
    }
  });

  localPreferences = {
    lastUpdatedAt: '2020',
    preferences: {
      'my-component-name': {
        lastUpdatedAt: '2011',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: true,
      }
    }
  };
  serverPreferences = {
    // Old key at this level
    lastUpdatedAt: '2014',
    preferences: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: false,
      }
    }

  };
  service._mergePreferences(localPreferences, serverPreferences);
  assert.deepEqual(localPreferences, {
    lastUpdatedAt: '2020',
    preferences: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtThePreferenceKeyLevel: false,
      }
    }
  });
});
