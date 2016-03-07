module.exports = function(params) {
	var that = this;
	var configs = params.configs;
	var dependecies = configs.dependency;
	var singletons = {};
	var Q = require('q');
	var path = require('path');
	var util = require('util');

	if (params.container) {
		this.container = params.container;
	} else {
		this.container = require('./dependable').container();
	}

	this.get = function(dependencyName) {
		return that.container.get(dependencyName);
	};

	this.register = function() {
		var args = Array.prototype.slice.call(arguments);
		if (args.length === 3) {
			var name = args[0];
			var obj = args[1];
			var hookDefs = args[2];
			defineHook(name, hookDefs, obj);
			obj.prototype.hooked = true;
		}
		that.container.register.apply(that.container, args);
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
			var parts = name.split('.');
			var classObj = that.get(parts[0]);
			var method = parts[1];
			if (method) {
				if(!classObj[method]) {
					throw new Error(util.format('there is no method %s.%s', name, method));
				}
				if (params.noHook) {
					classObj[method].origin.apply(classObj, params.args);
					return;
				}
				classObj[method].apply(classObj, params.args);
			}
		});
	};

	var defineHook = function(dependencyName, hookDefs, obj) {
		Object.keys(hookDefs).forEach(function(method) {
			if (!obj.prototype[method]) {
				throw new Error('There is no prototype method: ' + method + ' in the dependency: ' + dependencyName)
			}
			var hookDep = dependencyName + '.' + method;
			if(typeof hookDefs[method] === 'string') {
				that.register(hookDep, module.parent.require(hookDefs[method]));
			} else {
				that.register(hookDep, hookDefs[method]);
			}
			var temp = obj.prototype[method];
			try {
				obj.prototype[method] = function() {
					var hookObj = that.get(hookDep);
					if(!hookObj.pre || !hookObj.post) {
						throw new Error(util.format('need to defined pre/post functions for hook %s.%s', dependencyName, method));
					}
					var args = arguments;
					var lastarg = args[args.length - 1];
					if(typeof lastarg === 'function') {
						args[args.length - 1] = function() {
							var mainargs = Array.prototype.slice.call(arguments);
							if(arguments[0] === false) {
								var finalArgs = Array.prototype.slice.call(arguments);
								finalArgs.splice(0, 1);
								lastarg.apply(lastarg, finalArgs);
								return;
							}
							mainargs.push(function() {
								var postargs = Array.prototype.slice.call(arguments);
								postargs.push(lastarg);
								hookObj.post.apply(hookObj, postargs);
							});
							temp.apply(that.get(dependencyName), mainargs);
						};
						hookObj.pre.apply(hookObj, args);
					}
				}
				obj.prototype[method].origin = temp;
			} catch (e) {
				console.log('test', e);
			} finally {

			}
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
				if(path.extname(definition.path) === '' && definition.path.indexOf('/') !== -1) {
					definition.path += '.js';
				}
				var src = path.join(path.dirname(module.parent.filename), definition.path);
				delete require.cache[src];
				obj = module.parent.require(definition.path);
				if(definition.shim) {
					that.register(dependencyName, function(){
						return obj;
					});
					return;
				}
				if(definition.hook) {
					defineHook(dependencyName, definition.hook, obj);
				}
			}
			that.register(dependencyName, obj);
		} catch (e) {
			console.error('test', e);
			console.error('error when trying register %s', dependencyName);
		}
	});

	return this;
};
