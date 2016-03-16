var classb = function() {
	return this;
};
classb.prototype.main = function(arg, callback) {
	callback(arg);
};
module.exports = classb;
