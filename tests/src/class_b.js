var classb = function() {
	return this;
};
classb.prototype.main = function(arg, callback) {
	callback(arg + ' passed to main func;');
};
module.exports = classb;
