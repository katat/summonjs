module.exports = function() {
	this.pre = function(arg, next) {
        next(false, 'test', 'test2');
    };
    this.post = function(arg, next) {
        next();
    };
	return this;
};
