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

	Object.keys(dependecies).forEach(function(dependencyName) {
		var definition = dependecies[dependencyName];
		var obj = definition;

		try {
			if(definition.constructor === String) {
				obj = module.parent.require(definition);
			}
			if(definition.constructor === Object && definition.path) {
				obj = module.parent.require(definition.path);
				if(definition.shim) {
					that.register(dependencyName, function(){
						return obj;
					});
					return;
				}
			}
			that.register(dependencyName, obj);
		} catch (e) {
			console.error(e);
			console.error('error when trying register %s', dependencyName);
		}
	});
	return this;
};
