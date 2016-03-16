module.exports = function(ClassA) {
	this.pre = function(arg, next) {
        next(arg + ' passed to pre hook;');
    };
    this.post = function(arg, next) {
        next(arg + ' passed to post hook;');
    };
	return this;
};
