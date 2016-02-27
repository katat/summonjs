module.exports = function(Class) {
	this.count = this.count || 0;
	console.log('singleton');
	return this;
};