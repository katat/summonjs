var assert = require('assert');
var sinon = require('sinon');

describe('tests', function () {
	it('should build container based on configs', function () {
		var dependency = require('../')({
			configs: require('./configs/simple.json')
		});
		var Class = dependency.get('Class');
		assert.equal('class', Class.name);
		assert.equal('class_a', Class.ClassA.name);
	});
	it('should be able to load npm modules', function () {
		var dependency = require('../')({
			configs: require('./configs/load_modules.json')
		});
		var _ = dependency.get('_');
		assert.ok(_.map);
	});
	it('should register new dependency', function () {
		var dependency = require('../')({
			configs: require('./configs/simple.json')
		});
		dependency.register('test', 'test');
		var test = dependency.get('test');
		assert.equal(test, 'test');
	});
	it('should resolve dependencies with modifications', function () {
		var dependency = require('../')({
			configs: require('./configs/simple.json')
		});
		dependency.resolve({Class: {name: 'changed'}}, function(Class) {
			assert.equal('changed', Class.name);
		});
	});
	it('should be able to register custom objects', function () {
		var dependency = require('../')({
			configs: require('./configs/custom_obj.json')
		});
		var array = dependency.get('custom');
		assert.equal(array.length, 3);

		var obj = dependency.get('other_custom');
		assert.equal(obj.key, 1);
	});
	it('should resolve and run the functions of the dependencies specified in bootstrap', function () {
		var dependency = require('../')({
			configs: require('./configs/simple.json')
		});
		var spy = sinon.spy(dependency.container, "get");
		dependency.bootstrap({
			add: [{name: 'newOne', value: {t: 1}}, {name: 'newTwo', value: {}}], 
			targets: ['ClassB', 'ClassC']
		});
		assert(spy.calledTwice);
		assert.equal(spy.getCall(0).args[0], 'ClassB');
		assert.equal(spy.getCall(1).args[0], 'ClassC');
		assert(dependency.get('newOne').t);
		assert(dependency.get('newTwo'));
	});
});