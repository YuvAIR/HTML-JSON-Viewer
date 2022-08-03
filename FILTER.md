# Filtering Usage:
To open the filter box, press Ctrl+F while the container is focused, or click on the search icon.  
## Regular Mode:
The regular mode will filter the tree to show only nodes at a given depth which match the query (key / value contain the query as a string).
So for example, given this tree:
```json
{
    "a": {
        "b": {
            "c": "d",
            "e": "f"
        },
        "g": "d",
        "h": "i"
    }
}
```
 - and the query "d" at depth 2, the filtered tree will look like this:
```json
{
    "a": {
        "b": {
            "c": "d"
        },
        "g": "d"
    }
}
```
- and at depth 1, the filtered tree will look like this:
```json
{
    "a": {
        "b": {
            "c": "d",
            "e": "f"
        },
        "g": "d"
    }
}
```
 - and at depth 0, the filtered tree will look like this:
```json
{
    "a": {
        "b": {
            "c": "d",
            "e": "f"
        },
        "g": "d",
        "h": "i"
    }
}
```
## Advanced Mode:
The advanced mode will filter the tree to show only nodes which match a path and a (JS-like) rule.
The path format is: `path.*.to.node.*`, where `*` is a wildcard.
The rule is a boolean expression, and it has 2 variables you can access, `this` and `path`. For every node which matches the given path, the rule is evaluated, and if it returns true, the node is shown, otherwise it is hidden.  
`this` is the node value, and `path` is the path to the node, where `path[-1]` (` = path[path.length - 1]`) is the node name.  
For example, given this tree:
```json
{
    "example": {
        "a": {
            "x": 1,
            "y": 2,
            "z": 3
        },
        "b": {
            "x": 4,
            "y": 5,
            "z": 6
        }
    }
}
```
 - the path `example.*` and the rule `this.x == 4` will show:
```json
{
    "example": {
        "b": {
            "x": 4,
            "y": 5,
            "z": 6
        }
    }
}
```
 - the path `example.*` and the rule `path[-1] == "a"` will show:
```json
{
    "example": {
        "a": {
            "x": 1,
            "y": 2,
            "z": 3
        }
    }
}
```
 - the path `example.*.y` and the rule `this == 2` will show:
```json
{
    "example": {
        "a": {
            "y": 2
        }
    }
}
```


## Methods and functions:
 - `***.has(key)`: returns true if `***` has a property `key`, or if `***` is an array, it checks if key is a value in the array.
 - `***.hasKey(key)`: returns true if `***` has a property `key`. (aliases: `***.hasK`)
 - `***.hasValue(value)`: returns true if `***` has a property with the value `value`. (aliases: `***.hasV`, `***.hasVal`)
 - `***.length()`: returns the length of `***` if `***` is an array, or the number of properties if `***` is an object. (aliases: `***.len`)
 - `***.keys()`: returns an array of the keys of `***`, if `***` is an array, the list of indices.
 - `***.values()`: returns an array of the values of `***`.

You can also use all of JS's built in METHODS (not functions).