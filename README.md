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
 * @typedef {Object} JSONViewerOptions
 * @property {onNodeClick} nodeClickCallback - callback function to be called when a node (key) is clicked
 * @property {string} maxKeyWidth - max width of a key node (css string), overflow will be hidden. default: "100%"
 * @property {string} maxValueWidth - max width of a value node (css string), overflow will craete a new line. default: "100%"
 */
/**
 * @param {Object|string} data - Object / JSON string to be displayed
 * @param {HTMLElement} container - DOM element to display the tree in
 * @param {JSONViewerOptions} options
 */
class JSONViewer(data, container, options);

/**
 * Update the tree using new data
 * @param {Object|string} data 
 */
JSONViewer.updateTree(data);

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
 - `<script src="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@latest/src/jsonviewer.min.js"></script>`
 - `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@latest/src/jsonviewer.min.css">`