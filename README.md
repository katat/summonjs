### SummonJS
Define Node.js module dependencies in JSON format, and be able to resolve them using angular inject style.

`npm install summonjs`

### Define Dependency
Create a JSON file, define the mappings between dependency name and the source files.
```javascript
"dependency": {
    "ClassA": "./src/class_a",
    "ClassB": "./src/class_b",
    "_": {
        path: "lodash",
        shim: true
    }
}
```

### Init the dependency manager
Pass in the dependency definition JSON file to the `summonjs` module, it will make all the dependencies defined available via `summonjs`:
```javascript
var summon = require('summonjs')({
    configs: require('./simple.json')
});
```

### Auto inject dependencies by argument names
Take below function from `./src/class_a` for example, `ClassB` is a function argument, and it maps to the source file `./src/class_b`. When `ClassA` is loaded from SummonJS, the `ClassB` will be injected automatically, available to the scope of `ClassA`.

`./src/class_a`:
```javascript
module.exports = function(ClassB) {
	this.name = "class_a";
	this.classB = ClassB;
	return this;
};
```

`./src/class_b`:
```javascript
module.exports = function() {
	this.name = "class_b";
	return this;
};
```

#### `shim` the dependency without auto inject
If you don't want summon to auto inject dependencies, and want it to be initialized by a simple `require` operation, you can define the dependency to be shimmed:
```javascript
"_": {
    path: "lodash",
    shim: true
}
```

Internally it wrap the dependency with an anonymous function with empty argument list, and to be registered in the dependency manager:
```javascript
function() {
    return require('lodash');
}
```

### Register dependency in code
It can either register object or function.
```javascript
var obj = {};
summon.register('Class', {});

var func = function(){
    return 'test';
};
summon.register('Func', func);
```

If it is a function, when it loads by summon the first time, it will execute the function and store the returned `object` in the summon's factory. So for next time it loads, the registered function won't be executed again. Instead it returns the `object` returned at the first time load.

### `Summon spirits` by their names
```javascript
var classA = summon.get('ClassA');
assert.equal(classA.name, 'class_a');
assert.equal(classA.classB.name, 'class_b');
```

### Invoke targeted modules
`summon.invoke` will call on the targeted modules. Internally it is call `get` on all the specified targets, while override the dependencies if the `override` param is defined.
```javascript
summon.invoke({
    override: {ClassB: {}},
    targets: ['ClassA', 'ClassC']
})
```

### Hook Dependency Functions
In some scenarios, there might be needs to add integrate intercept logics for a object's function, such as manipulate input arguments before passing them to an existing function, or adding data caching logics in the function. SummonJS has a way to create a pre/post logic hook for a dependency's function, making it easier to plug in or plug out the custom logics to a function.

The SummonJS definition below define a dependency with a hook object.
```javascript
{
	"dependency": {
		"ClassB": {
            "path" : "./src/class_b",
            "hook" : {
                "main" : "./src/hook"
            }
        }
	}
}
```

The `main` key value under the `hook` property is the function needed to be hooked with the pre/post logics defined in the `./src/hook` file. The hook object needs to have pre/post functions such as below:
```javascript
module.exports = function(ClassA) {
	this.pre = function(arg, next) {
        next(arg + ' passed to pre hook;');
    };
    this.post = function(arg, next) {
        next(arg + ' passed to post hook;');
    };
	return this;
};
```

With the ClassB source code as below:
```javascript
var classb = function() {
	return this;
};
classb.prototype.main = function(arg, callback) {
	callback(arg + ' passed to main func;');
};
module.exports = classb;
```

Note that in order for a function to be hooked, it has be defined as a prototype function.

The callback result of the `main` will be as below:
```javascript
var mainCallback = function(arg1) {
    assert.equal(arg1, 'test passed to pre hook; passed to main func; passed to post hook;');
};
summon.get('ClassB').main('test', mainCallback);
```

Here is how the hook works:
 1. `pre` hook function will be called first when the `main` function is called.
 2. `next` function in the pre hook will call the `ClassB.main` with the arguments.
 3. The `callback` argument in the `main` function will call the `post` hook function with the arguments.
 4. The original `mainCallback` will be postponed to be the `next` callback function in the post hook.
 5. Assume if `ClassA` is defined in the dependency config json, it can be injected into the hook scope function and to be used by the pre/post hook functions.

### Welcome Contributions
Feel free to fork and add features suit your needs.

### Development Test
Run `gulp`, it should run all the unit tests and generate a coverage report.
