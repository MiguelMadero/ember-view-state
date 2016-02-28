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
  // ViewState are lazy loaded
  assert.deepEqual(service.get('_state'), undefined);

  let viewState = service.getViewStateFor('my-component-name');
  // New objects are created when gettingViewState
  assert.deepEqual(viewState, {});

  viewState.sortProperty = 'firstname_asc';
  service.flush();
  // Changes to that object are saved to localStorage on flush
  assert.deepEqual(service.getViewStateFor('my-component-name'), { sortProperty: 'firstname_asc' });

  service.set('_state', undefined);
  // Calling getViewStateFor will reload the _state if _state is undefined
  assert.deepEqual(service.getViewStateFor('my-component-name'), { sortProperty: 'firstname_asc' });

  clearLocalStorage();
  // ViewState are cached, so we won't hit local storage if it's in memory
  assert.deepEqual(service.getViewStateFor('my-component-name'), { sortProperty: 'firstname_asc' });

  service.set('_state', undefined);
  // If not in memory, or local storage, a new object is returned (just like at the beginning)
  assert.deepEqual(service.getViewStateFor('my-component-name'), {});
});

test('_mergeViewState given a newerLocalState object it should merge the server viewState that are not present in the local', function (assert) {
  const service = this.subject();
  const serverViewState = {
    lastUpdatedAt: '2015-05-18T20:03:31.205Z',
    viewState: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeTrueSinceLocalIsNewer: false
      }
    }
  };
  const newerLocalViewState = {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    viewState: {
      'tasks-user-settings': {
        shouldBeTrueSinceLocalIsNewer: true
      },
      chartsList: {
        showInactive: false,
      }
    }

  };
  service._mergeViewState(newerLocalViewState, serverViewState);
  assert.deepEqual(newerLocalViewState, {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    viewState: {
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

test('_mergeViewState given a newerServerState object it should merge the local viewState overriding the local ones', function (assert) {
  const service = this.subject();
  const newerServerState = {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    viewState: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  };
  const localViewState = {
    lastUpdatedAt: '2015-06-22T09:04:31.205Z',
    viewState: {
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: true
      },
      chartsList: {
        showInactive: false,
      }
    }

  };
  service._mergeViewState(localViewState, newerServerState);
  assert.deepEqual(localViewState, {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    viewState: {
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

test('_mergeViewState given a fresh localViewState object we override with server side settings', function (assert) {
  const service = this.subject();
  const serverViewState = {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    viewState: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  };
  const localViewState = {};
  service._mergeViewState(localViewState, serverViewState);
  assert.deepEqual(localViewState, {
    lastUpdatedAt: '2015-07-22T09:04:31.205Z',
    viewState: {
      'patient-summary-page': {
        hideFlowsheets: true,
      },
      'tasks-user-settings': {
        shouldBeFalseSinceServerIsNewer: false
      }
    }
  });
});

test('_mergeViewState merges based on lastUpdatedAt for each object inside the viewState hash', function (assert) {
  const service = this.subject();
  let serverViewState = {
    lastUpdatedAt: '2020',
    viewState: {
      'my-component-name': {
        lastUpdatedAt: '2011',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: true,
      }
    }
  };
  let localViewState = {
    // Old key at this level
    lastUpdatedAt: '2014',
    viewState: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: false,
      }
    }

  };
  service._mergeViewState(localViewState, serverViewState);
  assert.deepEqual(localViewState, {
    lastUpdatedAt: '2020',
    viewState: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: false,
      }
    }
  });

  localViewState = {
    lastUpdatedAt: '2020',
    viewState: {
      'my-component-name': {
        lastUpdatedAt: '2011',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: true,
      }
    }
  };
  serverViewState = {
    // Old key at this level
    lastUpdatedAt: '2014',
    viewState: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: false,
      }
    }

  };
  service._mergeViewState(localViewState, serverViewState);
  assert.deepEqual(localViewState, {
    lastUpdatedAt: '2020',
    viewState: {
      'my-component-name': {
        // Newer key at this level
        lastUpdatedAt: '2012',
        shouldBeFalseSinceLocalIsNewerAtTheStateKeyLevel: false,
      }
    }
  });
});
