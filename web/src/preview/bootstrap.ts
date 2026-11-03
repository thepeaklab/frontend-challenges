// Runs first inside every preview/test frame. Records console output, errors,
// fetch and geolocation usage on `window.__fc` and forwards console output to
// the app via postMessage. Tests can install mocks via `__fc.mockFetch` /
// `__fc.mockGeo`.
export const BOOTSTRAP_SCRIPT = `(function () {
  var fc = (window.__fc = { logs: [], errors: [], fetchCalls: [], geoCalls: 0 });

  function format(value) {
    if (value instanceof Error) return value.stack || String(value);
    if (typeof value === 'string') return value;
    try {
      var json = JSON.stringify(value, null, 2);
      return json === undefined ? String(value) : json;
    } catch (e) {
      return String(value);
    }
  }
  function send(level, args) {
    try {
      parent.postMessage({ __fc: 'console', level: level, text: args.map(format).join(' ') }, '*');
    } catch (e) {}
  }

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      fc.logs.push({ level: level, args: args });
      send(level, args);
      return original.apply(console, arguments);
    };
  });

  fc.reportError = function (error) {
    fc.errors.push(error);
    send('error', [error]);
  };
  window.addEventListener('error', function (event) {
    fc.reportError(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', function (event) {
    fc.reportError(event.reason);
  });

  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
    fc.fetchCalls.push({ url: url, init: init });
    return (fc.mockFetch || originalFetch).call(window, input, init);
  };

  var geo = navigator.geolocation;
  if (geo) {
    ['getCurrentPosition', 'watchPosition'].forEach(function (name) {
      var original = geo[name] && geo[name].bind(geo);
      try {
        geo[name] = function (success, failure, options) {
          fc.geoCalls++;
          if (fc.mockGeo) {
            setTimeout(function () { success(fc.mockGeo); }, 10);
            return 1;
          }
          return original(success, failure, options);
        };
      } catch (e) {}
    });
  }
})();`
