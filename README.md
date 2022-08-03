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
 * Returns the JSONViewer object for the given container - note that the container IDs must be unique.
 * @param {HTMLElement|jQuery} container
 * @returns {JSONViewer}
 */
static JSONViewer.getInstanceByContainer(container);

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
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
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
 - `<script src="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@1.0.8/src/jsonviewer.min.js"></script>`
 - `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YuvAIR/HTML-JSON-Viewer@1.0.8/src/jsonviewer.min.css">`


## [Filtering](FILTER.md)