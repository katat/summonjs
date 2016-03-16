module.exports = function() {
	this.pre = function(arg, next) {
        next(arg);
    };
    this.post = function(arg, next) {
        next(arg);
    };
	return this;
};
