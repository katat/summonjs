var classb = function() {
	return this;
};
classb.prototype.main = function(arg, callback) {
    callback(arg, 'test3');
};
module.exports = classb;
