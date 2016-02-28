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
		var container = require('dependable').container();
		container.register('test', true);
		var summon = require('../')({
			container: container,
			configs: require('./configs/simple.json')
		});
		assert.equal(summon.container.get('test'), true);
	});
});