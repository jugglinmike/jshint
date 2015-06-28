/* jshint shadow: outer */
(function() {
  (function(a, a) { // warns because of shadow outer
  })();
})();
(function() {
  "use strict";
  (function(a, a) {  // errors because of strict mode
  })();
})();
/* jshint shadow: inner */
(function() {
  (function(a, a) {  // warns because of shadow inner
  })();
})();
(function() {
  "use strict";
  (function(a, a) {  // errors because of strict mode
  })();
})();
/* jshint shadow: true */
(function() {
  (function(a, a) { // doesn't warn - shadow option relaxed
  })();
})();
(function() {
  "use strict";
  (function(a, a) { // errors because of strict mode
  })();
})();