let storage = window.localStorage,
  createInMemoryStorage = function() {
    var _data = {};
    return {
      getItem: function(key) {
        return _data[key];
      },
      setItem: function(key, value) {
        _data[key] = value;
      }
    };
  };

try {
  if (storage) {
    storage.setItem('test', 1);
    storage.removeItem('test');
  }
} catch (error) {
  // Mainly for safari in private mode, but might be a nice fallback for other cases as well
  storage = createInMemoryStorage();
}

/***
 * Returns either window.localStorage or an object that looks like it when used on Safari in private browsing mode.
 * Note that in Safari Mobile 7 that's the default setting.
 */
export default storage;
