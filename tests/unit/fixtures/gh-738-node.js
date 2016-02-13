// object with "eval" key
var obj = {
	eval: function (str) {
		return str;
	},
	wrapper: function (str) {
		// method calling "eval" key from context
		// permitted use
		return this.eval(str);
	}
};

// object-key use, permitted
obj["eval"]("console.log('hello world');");
obj.eval("console.log('hello world');");

// global use, forbidden
global["eval"]("console.log('hello world');");
global.eval("1+1");
eval("console.log('hello world');");

// In "top-level" code in Node.js, `this` resolves to the `exports` object, not
// the global object.
exports.eval = function() {};
this.eval("2+2");
