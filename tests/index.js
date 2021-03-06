var assert = require('assert');
var sinon = require('sinon');

describe('tests', function () {
	it('should build container based on configs', function () {
		var summon = require('../')({
			configs: require('./configs/simple.json')
		});
		var Class = summon.get('Class');
		assert.equal('class', Class.name);
		assert.equal('class_a', Class.ClassA.name);
	});
	it('should be able to load npm modules', function () {
		var summon = require('../')({
			configs: require('./configs/load_modules.json')
		});
		var _ = summon.get('_');
		assert.ok(_.map);
	});
	it('should register new summon', function () {
		var summon = require('../')({
			configs: require('./configs/simple.json')
		});
		summon.register('test', 'test');
		var test = summon.get('test');
		assert.equal(test, 'test');
	});
	it('should resolve dependencies with modifications', function () {
		var summon = require('../')({
			configs: require('./configs/simple.json')
		});
		summon.resolve({Class: {name: 'changed'}}, function(Class) {
			assert.equal('changed', Class.name);
		});
	});
	it('should be able to register custom objects', function () {
		var summon = require('../')({
			configs: require('./configs/custom_obj.json')
		});
		var array = summon.get('custom');
		assert.equal(array.length, 3);

		var obj = summon.get('other_custom');
		assert.equal(obj.key, 1);
	});
	it('should resolve and run the functions of the dependencies specified in bootstrap', function () {
		var summon = require('../')({
			configs: require('./configs/simple.json')
		});
		var spy = sinon.spy(summon.container, "get");
		summon.invoke({
			override: {newOne: {t: 1}, newTwo: {}},
			targets: ['ClassB', 'ClassC']
		});
		assert(spy.calledTwice);
		assert.equal(spy.getCall(0).args[0], 'ClassB');
		assert.equal(spy.getCall(1).args[0], 'ClassC');
		assert(summon.get('newOne').t);
		assert(summon.get('newTwo'));
	});
	it('should use pre-created container', function () {
		var container = require('../dependable').container();
		container.register('test', true);
		var summon = require('../')({
			container: container,
			configs: require('./configs/simple.json')
		});
		assert.equal(summon.container.get('test'), true);
	});
	describe('hook', function () {
		var summon;
		beforeEach(function () {
			summon = require('../')({
				configs: require('./configs/hook.json')
			});
		});
		describe('with callback as last argument', function () {
			it('should call hook func as defined in config json', function () {
				var preSpy = sinon.spy(summon.get('ClassB.main'), 'pre');
				var postSpy = sinon.spy(summon.get('ClassB.main'), 'post');
				var mainSpy = sinon.spy(summon.get('ClassB'), 'main');
				summon.get('ClassB').main('test', function(arg1) {
					assert.equal(arg1, 'test passed to pre hook; passed to main func; passed to post hook;');
				});
				assert(mainSpy.calledOnce);
				assert(preSpy.calledOnce);
				assert(postSpy.calledOnce);
			});
			describe('override hook func', function () {
				it('should stop at the pre hook call, if pre hook callback start with false arg', function () {
					var postcount = 0;
					var precount = 0;
					var hook = summon.register('ClassB.main', function() {
						this.pre = function(arg, next) {
							precount ++;
							assert.equal(arg, 'test');
							next(false, 'test', 'test2');
						};
						this.post = function(arg, next) {
							postcount ++;
							next();
						};
						return this;
					});
					var classB = summon.get('ClassB');
					var mainproxy = sinon.spy(classB, 'main');

					var arg = 'test';
					classB.main(arg, function(test, test2){
						assert.equal(test, 'test');
						assert.equal(test2, 'test2');
						assert.equal(precount, 1);
						assert.equal(postcount, 0);
						assert.equal(mainproxy.callCount, 1);
					});
				});
				it('should call hook functions in pre -> main -> post order', function () {
					var precount = 0;
					var postcount = 0;
					var classb = function() {
						this.func = function() {};
						return this;
					};
					classb.prototype.main = function(arg, arg2, callback) {
						assert.equal(arg, 'test');
						assert.equal(arg2, 'test2');
						assert(this.func);
						callback(arg, 'test3');
					};
					summon.register('ClassB', classb, {main: function() {
						this.pre = function(arg, next) {
							precount ++;
							assert.equal(arg, 'test');
							next(arg, 'test2');
						};
						this.post = function(arg, arg2, next) {
							postcount ++;
							assert.equal(arg, 'test');
							assert.equal(arg2, 'test3');
							next(arg, 'test4');
						};
						return this;
					}});
					var classB = summon.get('ClassB');
					var mainproxy = sinon.spy(classB, 'main');

					var arg = 'test';
					classB.main(arg, function(test, test2){
						assert.equal(test, 'test');
						assert.equal(test2, 'test4');
						assert.equal(precount, 1);
						assert.equal(postcount, 1);
						assert.equal(mainproxy.callCount, 1);
					});
				});
				it('should ignore hook', function () {
					var precount = 0;
					var postcount = 0;
					var classb = function() {
						return this;
					};
					classb.prototype.main = function(arg, callback) {
						assert.equal(arg, 'test');
						callback(arg, 'test1');
					};
					var main = function() {
						this.pre = function(arg, next) {
							precount ++;
							assert.equal(arg, 'test');
							next(arg, 'test2');
						};
						this.post = function(arg, arg2, next) {
							postcount ++;
							assert.equal(arg, 'test');
							assert.equal(arg2, 'test3');
							next(arg, arg2);
						};
						return this;
					};
					var mainObj = main();
					summon.register('ClassB', classb, {main: mainObj});
					var classB = summon.get('ClassB');
					var mainproxy = sinon.spy(classB.main, 'origin');

					var arg = 'test';
					summon.invoke({
						targets: ['ClassB.main'],
						args: [
							arg,
							function(test, test2) {
								assert.equal(test, 'test');
								assert.equal(test2, 'test1');
								assert.equal(precount, 0);
								assert.equal(postcount, 0);
								assert.equal(mainproxy.callCount, 1);
							}
						],
						noHook: true
					});
				});
			});
		});
		describe('without callback as last argument', function () {
			it('should call in order of pre -> main -> post', function () {
				var precount = 0;
				var maincount = 0;
				var postcount = 0;
				var classb = function() {
					return this;
				};
				classb.prototype.main = function(arg) {
					assert.equal(arg, 'test2');
					maincount ++;
					return 'test3';
				};
				summon.register('ClassB', classb, {main: function() {
					this.pre = function(arg, next) {
						precount ++;
						assert.equal(arg, 'test');
						next('test2');
					};
					this.post = function(arg) {
						postcount ++;
						assert.equal(arg, 'test3');
					};
					return this;
				}});
				var classB = summon.get('ClassB');

				var arg = 'test';
				classB.main(arg);
				assert.equal(precount, 1);
				assert.equal(postcount, 1);
				assert.equal(maincount, 1);
			});
		});
		describe('call with custom pre or post hook', function () {
			it('should call post hook', function () {
				var precount = 0;
				var postcount = 0;
				var classb = function() {
					return this;
				};
				classb.prototype.main = function(arg, callback) {
					assert.equal(arg, 'test');
					callback(arg, 'test1');
				};
				var hookFunc = function() {
					this.pre = function(arg, next) {
						precount ++;
						assert.equal(arg, 'test');
						next(arg, 'test2');
					};
					this.post = function(arg, arg2, next) {
						postcount ++;
						assert.equal(arg, 'test');
						assert.equal(arg2, 'test1');
						next(arg, 'test2');
					};
					return this;
				};

				var hook = hookFunc();

				summon.register('ClassB', classb, {main: hook});
				var classB = summon.get('ClassB');
				var mainproxy = sinon.spy(classB.main, 'origin');

				var arg = 'test';
				summon.invoke({
					targets: ['ClassB.main'],
					args: [
						arg,
						function(test, test2) {
							assert.equal(test, 'test');
							assert.equal(test2, 'test2');
							assert.equal(precount, 0);
							assert.equal(postcount, 1);
							assert.equal(mainproxy.callCount, 1);
						}
					],
					withHooks: {
						post: hook.post
					}
				});
			});
			it('should call pre hook', function () {
				var precount = 0;
				var postcount = 0;
				var classb = function() {
					return this;
				};
				classb.prototype.main = function(arg, arg2, callback) {
					assert.equal(arg, 'test');
					assert.equal(arg2, 'test2');
					callback(arg, 'test3');
				};
				var hookFunc = function() {
					this.pre = function(arg, next) {
						precount ++;
						assert.equal(arg, 'test');
						next(arg, 'test2');
					};
					this.post = function(arg, arg2, next) {
						postcount ++;
						assert.equal(arg, 'test');
						assert.equal(arg2, 'test1');
						next(arg, 'test2');
					};
					return this;
				};

				var hook = hookFunc();

				summon.register('ClassB', classb, {main: hook});
				var classB = summon.get('ClassB');
				var mainproxy = sinon.spy(classB.main, 'origin');

				var arg = 'test';
				summon.invoke({
					targets: ['ClassB.main'],
					args: [
						arg,
						function(test, test2) {
							assert.equal(test, 'test');
							assert.equal(test2, 'test3');
							assert.equal(precount, 1);
							assert.equal(postcount, 0);
							assert.equal(mainproxy.callCount, 1);
						}
					],
					withHooks: {
						pre: hook.pre
					}
				});
			});
			it('should call both pre post hook', function () {
				var precount = 0;
				var postcount = 0;
				var classb = function() {
					return this;
				};
				classb.prototype.main = function(arg, arg2, callback) {
					assert.equal(arg, 'test');
					assert.equal(arg2, 'test2');
					callback(arg, 'test3');
				};
				var hook = function() {
					this.pre = function(arg, next) {
						precount ++;
						assert.equal(arg, 'test');
						next(arg, 'test2');
					};
					this.post = function(arg, arg2, next) {
						postcount ++;
						assert.equal(arg, 'test');
						assert.equal(arg2, 'test3');
						next(arg, 'test4');
					};
					return this;
				};

				var hookObj = hook();

				summon.register('ClassB', classb, {main: hookObj});
				var classB = summon.get('ClassB');
				var mainproxy = sinon.spy(classB.main, 'origin');

				var arg = 'test';
				summon.invoke({
					targets: ['ClassB.main'],
					args: [
						arg,
						function(test, test2) {
							assert.equal(precount, 1);
							assert.equal(postcount, 1);
							assert.equal(mainproxy.callCount, 1);
							assert.equal(test, 'test');
							assert.equal(test2, 'test4');
						}
					],
					withHooks: {
						pre: hookObj.pre,
						post: hookObj.post
					}
				});
			});
			it('should only call pre hook as specified in the custom hook call', function () {
				var precount = 0;
				var postcount = 0;
				var classb = function() {
					return this;
				};
				classb.prototype.main = function(arg, arg2, callback) {
					assert.equal(arg, 'test');
					assert.equal(arg2, 'test2');
					callback(arg, 'test3');
				};
				var hook = function() {
					this.pre = function(arg, next) {
						precount ++;
						assert.equal(arg, 'test');
						next(arg, 'test2');
					};
					this.post = function(arg, arg2, next) {
						postcount ++;
						assert.equal(arg, 'test');
						assert.equal(arg2, 'test3');
						next(arg, 'test4');
					};
					return this;
				};

				var hookObj = hook();

				summon.register('ClassB', classb, {main: hookObj});
				var classB = summon.get('ClassB');
				var mainproxy = sinon.spy(classB.main, 'origin');

				var arg = 'test';
				classB.main.callWithHooks({pre: true}, arg, function(test, test2) {
					assert.equal(precount, 1);
					assert.equal(postcount, 0);
					assert.equal(mainproxy.callCount, 1);
					assert.equal(test, 'test');
					assert.equal(test2, 'test3');
				});
			});
		});
	});
});
