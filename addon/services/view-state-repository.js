import Ember from 'ember';
import storage from 'ember-view-state/utils/local-storage';

// TODO: check if we need moment
let moment = function () {
  return new Date();
};

/***
 * The ViewStateRepository manages the data access to persist
 * properties for the ViewState Mixin and Service
 * We don't return promises to avoid async and delaying, UX
 * but we can expect that data to be "eventually consistent".
 */
export default Ember.Service.extend({
  serverSideSaveDelay: 5*60*1000, // 5 minutes
  /***
   * Flushes in memory data to localStorage so it's persisted across browser sessions
   * and enqueues a server side save (if implemented)
   */
  flush: function() {
    let data = {
      preferences: this.get('_preferences'),
      lastUpdatedAt: moment()
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
    let preferences = this.get('_preferences');
    let localState;
    if (Ember.isEmpty(preferences)) {
      localState = storage.getItem(this._getNamespace());
      localState = localState ? JSON.parse(localState) : {};
      localState.preferences = localState.preferences || {};
      preferences = localState.preferences;
      this.set('_preferences', preferences);

      return this._loadServerPreferences().then(serverState=>
        this._mergePreferences(localState, serverState)
      );
    }
  },

  getPreferencesFor: function(key) {
    this.load();
    let allPreferences = this.get('_preferences');
    const preferences = allPreferences[key] || {};
    allPreferences[key] = preferences;
    return preferences;
  },

  _getNamespace: function() {
    // NOTE: document that we can allow the user to override this so each user
    // can have a different namespace without overriding each other.
    // return 'ViewState.' + session.get('userGUID');
    return 'ViewState';
  },

  _loadServerPreferences: function() {
    // TODO: let consumers implement this add an example using firebase
    // return ajax.get(url)
    return Ember.RSVP.resolve();
  },

  /**
   * Merges the preferences stored locally with the server side preferences
   * giving preferences to the newer ones
   * @param  {Object} localPreferences
   * @param  {Object} serverPreferences
   */
  _mergePreferences: function(localPreferences, serverPreferences) {
    if (!serverPreferences) {
      return;
    }
    const newLocalPreference = !localPreferences.lastUpdatedAt;
    if (localPreferences.lastUpdatedAt === serverPreferences.lastUpdatedAt) {
      // They're the same, nothing to do here.
      return;
    }
    localPreferences.preferences = localPreferences.preferences || {};
    serverPreferences.preferences = serverPreferences.preferences || {};
    let local = localPreferences.preferences;
    let server = serverPreferences.preferences;

    let allKeys = Object.keys(local).concat(Object.keys(server));
    allKeys.forEach(function(key) {
      const localValue = local[key];
      const serverValue = server[key];
      const serverLastUpdatedAt = Ember.getWithDefault(serverValue || {}, 'lastUpdatedAt', serverPreferences.lastUpdatedAt);
      const localLastUpdatedAt = Ember.getWithDefault(localValue || {}, 'lastUpdatedAt', localPreferences.lastUpdatedAt);

      if (!localValue || serverLastUpdatedAt > localLastUpdatedAt) {
        if (serverValue) {
          Ember.set(local, key, serverValue);
        }
      }
    });

    if (newLocalPreference || serverPreferences.lastUpdatedAt > localPreferences.lastUpdatedAt) {
      localPreferences.lastUpdatedAt = serverPreferences.lastUpdatedAt;
    }
  },

  _enqueueServerSideSave: function() {
    const immediate = false; // trigger on the tail of the wait time interval as opposed as the default of leading
    Ember.run.throttle(this, ()=>{
      const data = storage.getItem(this._getNamespace());
      this._persistPreferencesServerSide(data);
    }, this.serverSideSaveDelay, immediate);
  },

  _persistPreferencesServerSide: function (/*data*/) {
    // return PFServer.promise(url, 'POST', data);
    return Ember.RSVP.resolve();
  }
});
