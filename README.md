# HTML-JSON-Viewer
## Requirements:
 - jQuery
 - Water CSS is recommeneded (style will be adjusted for Dark/Light Water Theme)

## Docs:
```js
/**
 * @callback onNodeClick
 * @param {string} nodeName
 * @param {Object} nodeValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @param {HTMLElement} nodeElement - node DOM element on the tree
 */
/**
 * @param {Object|string} data - Object / JSON string to be displayed
 * @param {HTMLElement} container - DOM element to display the tree in
 * @param {onNodeClick} nodeClickCallback - callback function to be called when a node (key) is clicked
 */
class JSONViewer(data, container, nodeClickCallback); // Constructor

/**
 * Update the tree using new data
 * @param {Object|string} data 
 */
JSONViewer.updateTree(data)

/**
 * Get the path of the node in the tree as an array
 * @param {HTMLElement} node 
 * @returns {string[]} - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 */
static JSONViewer.getNodePath(node);
```
## Example:
```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
        <script src="jsonviewer.js"></script>
        <link rel="stylesheet" href="jsonviewer.css">
    </head>
    <body>
        <div id="container"></div>
        <script>
            var jsonviewer = new JSONViewer({"example": {"abc": {"a": 1, "b":2, "c":3}, 345: "test"}}, document.getElementById("container"), console.log);

            jsonviewer.updateTree({"example2": {"abc": {"x": 10, "y":8, "z":5}, 543: "test2"}});
        </script>
    </body>
</html>
```

## CDNs:
 - [jsonviewer.js](https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@latest/src/jsonviewer.min.js)
 - [jsonviewer.css](https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@latest/src/jsonviewer.min.css)