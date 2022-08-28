# HTML-JSON-Viewer
## Requirements:
 - jQuery - [CDN](https://code.jquery.com/jquery-3.6.0.min.js)
 - Water CSS (recommeneded + style will be adjusted for Dark/Light Water Theme) - [CDN](https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css)
 - Esprima - [CDN](https://cdn.jsdelivr.net/npm/esprima@4.0.1/dist/esprima.min.js)

## Docs:
```js
/**
 * @callback nodeCallback
 * @param {string} nodeName
 * @param {object} nodeValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @param {HTMLElement} nodeElement - node DOM element on the tree
 */
/**
 * @callback keyCallback
 * @param {string} nodeName
 * @param {object} nodeValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @return {string|Promise<string>} - HTML string to replace the node element
 */
/**
 * @callback valueCallback
 * @param {object} nodeValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][node] == nodeValue
 * @return {string|Promise<string>} - HTML string to replace the node element
 */
/**
 * @callback allowEdit
 * @param {string} nodeName
 * @param {string} nodeValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @return {boolean|Promise<boolean>} - allow user to edit the value of the node (only for terminal nodes, thus `nodeValue` is a string and not an object)
 */
/**
 * @callback editOnChange
 * @param {string} nodeName
 * @param {string} previousValue
 * @param {string} newValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @return {string|Promise<string>} - value to be set in the node element (usually the same as `newValue`)
 */
/**
 * @callback editOnBlur
 * @param {string} nodeName
 * @param {string} newValue
 * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 * @return {string|Promise<string>} - value to be set in the node element (usually the same as `newValue`)
 */
/**
 * @typedef {object} JSONViewerOptions
 * @property {nodeCallback} nodeClickCallback - callback function to be called when a node (key) is clicked
 * @property {keyCallback} keyMapCallback - every key in the tree is passed to this callback, which returns an html string to replace the key element. default: keep the key as is.
 * @property {valueCallback} valueMapCallback - every terminal value in the tree is passed to this callback, which returns an html string to replace the value element. default: JSONViewer.linkify
 * @property {string} maxKeyWidth - max width of a key node (css string), overflow will be hidden. default: "100%"
 * @property {string} maxValueWidth - max width of a value node (css string), overflow will craete a new line. default: "100%"
 * @property {allowEdit} allowEdit - all terminal nodes (string values) which this callback outputs true for will be editable. default: `() => false`
 * @property {editOnChange} editOnChange - callback function to be called when a node (value) is edited. default: `(name, prevVal, newVal, path) => prevVal`
 * @property {editOnBlur} editOnBlur - callback function to be called when a node (value) is edited and loses focus. default: `(name, newVal, path) => newVal`
 * @property {boolean} editBlurOnEnter - if true, the content editable value will lose focus when the user presses enter. default: true
 * @property {number} defaultDepth - default depth of the tree. default: 1
 * @property {boolean} defaultAdvanced - default state of the advanced search. default: false
 * @property {boolean} expandAll - expand all nodes on every tree update call (including the initial one). default: false
 */
/**
 * @param {object|string} data - Object / JSON string to be displayed
 * @param {HTMLElement} container - DOM element to display the tree in
 * @param {JSONViewerOptions} options
 */
class JSONViewer(data, container, options);


/**
 * The container element for the JSONViewer object.
 */
JSONViewer.container;

/**
 * The original data, or the last data that was used in an `updateTree` call, with `keepOldData` set to false.
 * Note that queries call `updateTree` with `keepOldData` set to true, so this will return the original data even if a query is active.
 */
JSONViewer.data;

/**
 * The currently displayed data.
 */
JSONViewer.currentData;


/**
 * Returns the JSONViewer object for the given container - note that the container IDs must be unique.
 * @param {HTMLElement|jQuery} container
 * @returns {JSONViewer}
 */
static JSONViewer.getInstanceByContainer(container);

/**
 * Update the tree using new data
 * @param {object|string} data 
 */
JSONViewer.updateTree(data);

/**
 * Get the path of the node in the tree as an array
 * @param {HTMLElement} node 
 * @returns {string[]} - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
 */
static JSONViewer.getNodePath(node);

/**
 * Filters the tree to show only nodes at a given depth which match the query (key / value contain the query as a string)
 * Pressing ctrl+f while the container is focused will open a search box
 * @param {string} q
 * @param {number} depth
 */
JSONViewer.query(q="", depth=0);

/**
 * Check if the node at the given path is expanded.
 * @param {string[]} path
 */
JSONViewer.isExpanded(path);

/**
 * Expands or collapses the node at the given path (expands if collapsed, collapses if expanded)
 * @param {string[]} path
 */
JSONViewer.expandCollapse(path);

/**
 * Expand the node at the given path.
 * @param {string[]} path
 */
JSONViewer.expand(path);

/**
 * Collapse the node at the given path.
 * @param {string[]} path
 */
JSONViewer.collapse(path);

/**
 * Expand all nodes.
 */
JSONViewer.expandAll();

/**
 * Collapse all nodes.
 */
JSONViewer.collapseAll();
```

## Code Example:
```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/esprima@4.0.1/dist/esprima.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css">
        <script src="../src/jsonviewer.js"></script>
        <link rel="stylesheet" href="../src/jsonviewer.css">
    </head>
    <body>
        <div id="container" style="height: calc(100vh - 120px);"></div>
        <script>
            var jsonviewer = new JSONViewer({"example": {"a": {"x": 1, "y":2, "z":3}, "b": {"x": 4, "y": 5, "z": 6}}}, document.getElementById("container"), {
                nodeClickCallback: console.log
            });

            setTimeout(() => {
                jsonviewer.updateTree({"example2": {"c": {"x": 7, "y":8, "z":9}, "d": {"x": 10, "y": 11, "z": 12}}});
            }, 3000);
        </script>
    </body>
</html>
```

## CDNs:
 - `<script src="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@1.0.19/src/jsonviewer.min.js"></script>`
 - `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@1.0.19/src/jsonviewer.min.css">`


## [Filtering](FILTER.md)