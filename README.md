### SummonJS
Define Node.js module dependencies in JSON format, and be able to resolve them using angular inject style.

### Define Dependency
Create a JSON file, define the mappings between dependency name and the source files.
```
{
	"dependency": {
		"ClassA": "./src/class_a",
		"ClassB": "./src/class_b",
		"_": {
            path: "lodash",
            shim: true
        }
	}
}
```

### Init the dependency manager
Pass in the dependency definition JSON file to the `summonjs` module, it will make all the dependencies defined available via `summonjs`:

    var summon = require('summonjs')({
        configs: require('./simple.json')
    });

### Auto inject dependencies by argument names
Take below function from `./src/class_a`(`ClassA`) for example, `ClassB` is a function argument, and it maps to the source file `./src/class_b`. When `ClassA` is loaded from summonjs, the `ClassA` will be injected automatically, available to the scope of `ClassA`.

`./src/class_a`:

    module.exports = function(ClassB) {
    	this.name = "class_a";
    	this.classB = ClassB;
    	return this;
    };

`./src/class_b`:

    module.exports = function() {
    	this.name = "class_b";
    	return this;
    };

#### `shim` the dependency without auto inject
If you don't want summon to auto inject dependencies, and want it to be initialized by a simple `require` operation, you can define the dependency to be shimmed:

    "_": {
        path: "lodash",
        shim: true
    }

Internally it wrap the dependency with an anonymous function with empty argument list, and to be registered in the dependency manager:

    function() {
        return require('lodash');
    }

### Register dependency in code
It can either register object or function.

    var obj = {};
    summon.register('Class', {});

    var func = function(){
        return 'test';
    };
    summon.register('Func', func);

If it is a function, when it loads by summon the first time, it will execute the function and store the returned `object` in the summon's factory. So for next time it loads, the registered function won't be executed again. Instead it returns the `object` returned at the first time load.

### `Summon spirits` by their names

    var classA = summon.get('ClassA');
    assert.equal(classA.name, 'class_a');
    assert.equal(classA.classB.name, 'class_b');

### Invoke targeted modules
`summon.invoke` will call on the targeted modules. Internally it is call `get` on all the specified targets, while override the dependencies if the `override` param is defined.

    summon.invoke({
        override: {ClassB: {}},
        targets: ['ClassA', 'ClassC']
    })


### Welcome Contributions
Feel free to fork and add features suit your needs.
