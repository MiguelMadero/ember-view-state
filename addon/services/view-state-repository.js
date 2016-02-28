import Ember from 'ember';
import storage from 'ember-view-state/utils/local-storage';

/***
 * The ViewStateRepository manages the data access to persist
 * properties for the ViewState Mixin and Service
 * We don't return promises to avoid async and delaying, UX
 * but we can expect that data to be "eventually consistent".
 */
export default Ember.Service.extend({
  /***
   * Flushes in memory data to localStorage so it's persisted across browser sessions
   * and enqueues a server side save (if implemented)
   */
  flush: function() {
    let data = {
      viewState: this.get('_state'),
      lastUpdatedAt: new Date()
    };
    data = JSON.stringify(data);
    storage.setItem(this._getNamespace(), data);
    // We persist in both places, but delay the server side save
    this._enqueueServerSideSave();
  },

  /***
   * Loads data from from localStorage and the server and leaves it in memory
   */
  load: function() {
    if (Ember.isEmpty(this.get('_state'))) {
      let localState = storage.getItem(this._getNamespace());
      localState = localState ? JSON.parse(localState) : {};
      localState.viewState = localState.viewState || {};
      this.set('_state', localState.viewState);

      return this._loadServerViewState().then(serverState=>
        this._mergeViewState(localState, serverState)
      );
    }
  },

  getViewStateFor: function(key) {
    this.load();
    let state = this.get('_state');
    const viewStateForKey = state[key] || {};
    state[key] = viewStateForKey;
    return viewStateForKey;
  },

  _getNamespace: function() {
    // NOTE: document that we can allow the user to override this so each user
    // can have a different namespace without overriding each other.
    // return 'ViewState.' + session.get('userGUID');
    return 'ViewState';
  },

  _serverSideSaveDelay: 5*60*1000, // 5 minutes
  _loadServerViewState: function() {
    // TODO: let consumers implement this add an example using firebase
    // return ajax(url);
    return Ember.RSVP.resolve();
  },

  /**
   * Merges the ViewState stored locally with the server side ViewState
   * giving ViewState to the newer ones
   * @param  {Object} localViewState
   * @param  {Object} serverViewState
   */
  _mergeViewState: function(localViewState, serverViewState) {
    if (!serverViewState) {
      return;
    }
    const newLocalState = !localViewState.lastUpdatedAt;
    if (localViewState.lastUpdatedAt === serverViewState.lastUpdatedAt) {
      // They're the same, nothing to do here.
      return;
    }
    localViewState.viewState = localViewState.viewState || {};
    serverViewState.viewState = serverViewState.viewState || {};
    let local = localViewState.viewState;
    let server = serverViewState.viewState;

    let allKeys = Object.keys(local).concat(Object.keys(server));
    allKeys.forEach(function(key) {
      const localValue = local[key];
      const serverValue = server[key];
      const serverLastUpdatedAt = Ember.getWithDefault(serverValue || {}, 'lastUpdatedAt', serverViewState.lastUpdatedAt);
      const localLastUpdatedAt = Ember.getWithDefault(localValue || {}, 'lastUpdatedAt', localViewState.lastUpdatedAt);

      if (!localValue || serverLastUpdatedAt > localLastUpdatedAt) {
        if (serverValue) {
          Ember.set(local, key, serverValue);
        }
      }
    });

    if (newLocalState || serverViewState.lastUpdatedAt > localViewState.lastUpdatedAt) {
      localViewState.lastUpdatedAt = serverViewState.lastUpdatedAt;
    }
  },

  _enqueueServerSideSave: function() {
    const immediate = false; // trigger on the tail of the wait time interval as opposed as the default of leading
    Ember.run.throttle(this, ()=>{
      const data = storage.getItem(this._getNamespace());
      this._persistViewStateServerSide(data);
    }, this._serverSideSaveDelay, immediate);
  },

  _persistViewStateServerSide: function (/*data*/) {
    // return ajax(url, 'POST', data);
    return Ember.RSVP.resolve();
  }
});
