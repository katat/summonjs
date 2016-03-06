module.exports = function(params) {
	var that = this;
	var configs = params.configs;
	var dependecies = configs.dependency;
	var singletons = {};
	var Q = require('q');

	if (params.container) {
		this.container = params.container;
	} else {
		this.container = require('./dependable').container();
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
				if(definition.hook) {

					Object.keys(definition.hook).forEach(function(method) {
						if (!obj.prototype[method]) {
							throw new Error('There is no prototype method: ' + method + ' in the dependency: ' + dependencyName)
						}
						var hookDep = dependencyName + '.' + method;
						that.register(hookDep, module.parent.require(definition.hook[method]));
						var temp = obj.prototype[method];
						obj.prototype[method] = function() {
							var inheritScope = this;
							var args = arguments;
							var hookObj = that.get(hookDep);
							var promise;
							var funcs = [];
							if(hookObj.beforeCall) {
								funcs.push(function(){
									return hookObj.beforeCall.apply(hookObj, args);
								});
							}
							funcs.push(function(){
								return temp.apply(that.get(dependencyName), args);
							});
							if(hookObj.afterCall) {
								funcs.push(function(values){
									args = Array.prototype.slice.call(args);
									args = args.concat(values);
									return hookObj.afterCall.apply(hookObj, args);
								});
							}
							var initFunc = funcs[0];
							funcs.splice(0, 1);
							funcs.reduce(function (soFar, f) {
							    return soFar.then(f);
							}, initFunc());
						}
					});
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
