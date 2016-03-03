module.exports = function(params) {
	var that = this;
	var configs = params.configs;
	var dependecies = configs.dependency;
	var singletons = {};

	if (params.container) {
		this.container = params.container;
	} else {
		this.container = require('dependable').container();
	}

	Object.keys(dependecies).forEach(function(dependencyName) {
		var definition = dependecies[dependencyName];
		var obj = definition;

		if(definition.constructor === String) {
			obj = module.parent.require(definition);
		}
		if(definition.constructor === Object && definition.path) {
			obj = module.parent.require(definition.path);
			if(definition.shim) {
				that.container.register(dependencyName, function(){
					return obj;
				});
				return;
			}
		}
		that.container.register(dependencyName, obj);
	});

	this.get = function(dependencyName) {
		return that.container.get(dependencyName);
	};

	this.register = function() {
		that.container.register.apply(that.container, arguments);
	};

	this.resolve = function() {
		that.container.resolve.apply(that.container, arguments);
	};

	this.invoke = function(params) {
		var newDependencies = params.override;
		var targets = params.targets;
		if(newDependencies) {
			Object.keys(newDependencies).forEach(function(name) {
				that.register(name, newDependencies[name]);
			});
		}
		targets.forEach(function(name) {
			that.get(name);
		});
	};

	return this;
};
