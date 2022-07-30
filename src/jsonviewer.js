// Requires jQuery and Water CSS is recommended, will look terrible otherwise

window.onload = function() {
    var r = $(':root');
    var waterCSSTheme = r.css('--background-body');
    if (waterCSSTheme && waterCSSTheme.trim() === "#fff") { // light theme
        r.css('--jsonviewer-main-color', '#000000');
        r.css('--jsonviewer-link-color', '#2669bb');
        r.css('--jsonviewer-border-color', '#828282');
        r.css('--jsonviewer-background-color', '#fafafa');
        r.css('--jsonviewer-arrow', '0');
        r.css('--jsonviewer-arrow-hover', '0.175');
    }
};


class JSONViewer {
    #verticalLines;
    #topVerticalLines;
    #shown;
    #container;
    #data;
    #options;
    static #arrow_right = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAGxJREFUSEtjZKAxYKSx+QyjFhAM4ZEVRA4MDAwHCIYJmgJSgmg/AwNDI6mWkGqBKQMDgw8plpBqASiYvpJiCTkWgEKZaEsGpQVEux7kVVJ9QPNIpmkypXlGIzUTg9WTEgejFpAVAgQ1Df04AABMSBYZWnttmAAAAABJRU5ErkJggg==";
    static #play_circle = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAXpJREFUSEu1lX9RxEAMhd854ByAAkDBgQLAATjAAXdSUAAoAAmgAE4BoADmY5JOSH+knU73z+5uvpeXNLvSwmu1cHyNBRxKOpZ0YoJeJb1J+qgEVoBLSXchcI4HaCfpsQ/UBziQ9CDpzJQS4EUSAVlkwh4CyIy9K0lfGdQFIPizBUHdtrCBfbIEfp4hXQDUbCSdBsWV1WRCxtwF0qwM8INjlGeoZ4JVTU0yIHocA+D3hRW05XM4yP0fy/7vcwTQiu8WJPsOgLrQljdmRZdtnsWRt3AEuD14iJc5AwC+sABQzsaFNDZFgNPXAxcjlOBA4j9AB35GF+YAviVdTwFMsehe0u1Ui8YUeW+qc43cusEic6jVZnbTxwIBqjb1UdJqUz4s/qMBmTMqnkxk76hgg1YDwpTEEsbG0HLfeR+w8p+FQ+Oa/mboURcf1wRhAfe6MLpRTsuOGtdRLTVBIQG7FkD2Jz84ORgtjNL4ZJLZ7CezsL/ert7kOkJx4hdvXWgZmZakXgAAAABJRU5ErkJggg==";

    get container() {
        return this.#container;
    }

    get data() {
        return this.#data;
    }

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
    constructor(data, container, options) {
        data = typeof data === "string" ? JSON.parse(data) : data;
        this.#verticalLines = [];
        this.#topVerticalLines = [];
        this.#shown = [];
        this.#container = $(container);
        this.#data = data;
        this.#options = options ? options : {};

        if (options.maxKeyWidth) {
            this.#container.css("--jsonviewer-max-key-width", options.maxKeyWidth);
        }
        if (options.maxValueWidth) {
            this.#container.css("--jsonviewer-max-value-width", options.maxValueWidth);
        }
        
        var jsonThis = this;
        var nodeClickCallback = options.nodeClickCallback;
        this.#container.on("click", ".nodeKey", function() {
            if (!nodeClickCallback) {
                return;
            }
            var node = $(this).parent().parent();
            var path = JSONViewer.getNodePath(node);
            var name = name = path[path.length-1];
            var value = jsonThis.data;
            for (const key of path) {
                value = value[key];
            }
            nodeClickCallback(name, value, path, node);
        });
        
        this.#container.on("click", ".arrow", function() {
            $(this).attr("src", $(this).attr("src") == JSONViewer.#play_circle ? JSONViewer.#arrow_right : JSONViewer.#play_circle);
            $(this).parent().parent().parent().toggleClass("hidden");
            if ($(this).attr("src") == JSONViewer.#arrow_right) {
                jsonThis.#shown.push(JSONViewer.getNodePath($(this).parent().parent().parent()).join("/"));
            } else {
                jsonThis.#shown.splice(jsonThis.#shown.indexOf(JSONViewer.getNodePath($(this).parent().parent().parent())), 1);
            }
            jsonThis.#updateLines();
        });

        this.#createTree(data, container);
    }


    /**
     * Update the tree using new data
     * @param {Object|string} data 
     */
    updateTree(data) {
        this.#container.empty();
        this.#verticalLines = [];
        this.#topVerticalLines = [];
        this.#shown = [];
        this.#data = typeof data === "string" ? JSON.parse(data) : data;
        this.#createTree(this.#data, this.#container);
    }

    
    /**
     * @param {Object} data
     * @param {HTMLElement} container
     */
    #createTree(data, current_node, first=true) {
        current_node = $(current_node)[0];
        if (first) {
            current_node.classList.add("json-tree-viewer-container");

            if (Object.keys(data).length == 1 && typeof data[Object.keys(data)[0]] == "object") {
                var key = Object.keys(data)[0];

                current_node.innerHTML = "";
                var node = document.createElement("div");
                node.classList.add("node");
                node.classList.add("root");
                node.dataset.key = JSON.stringify(key);

                    var nodeBody = document.createElement("div");
                    nodeBody.classList.add("nodeBody");
                    nodeBody.classList.add("root");

                        var nodeKey = document.createElement("span");
                        nodeKey.classList.add("nodeKey");
                        nodeKey.innerHTML = key;

                    nodeBody.appendChild(nodeKey);

                node.appendChild(nodeBody);


                current_node.appendChild(node);
                current_node = node;
                first = false;
                data = data[key];
            }
        }

        var nodes = []
        for (var key in data) {
            var node = document.createElement("div");
            node.classList.add("node");
            node.dataset.key = JSON.stringify(key);

                var nodeBody = document.createElement("div");
                nodeBody.classList.add("nodeBody");

                    var arrowDiv = document.createElement("div");
                    arrowDiv.classList.add("arrowDiv");

                        var arrow = document.createElement("img");
                        arrow.classList.add("arrow");
                        arrow.src = JSONViewer.#play_circle;
                
                    arrowDiv.appendChild(arrow);
                
                nodeBody.appendChild(arrowDiv);
                
                    var nodeKey = document.createElement("span");
                    nodeKey.classList.add("nodeKey");
                    nodeKey.innerHTML = key;
                
                nodeBody.appendChild(nodeKey);

            node.appendChild(nodeBody);


            current_node.appendChild(node);
            var isHidden = this.#shown.indexOf(JSONViewer.getNodePath(node).join("/")) == -1;
            isHidden && node.classList.add("hidden");
            !isHidden && (arrow.src = JSONViewer.#arrow_right);

            if (typeof data[key] === "object") {
                this.#createTree(data[key], node, false);
            } else {
                arrow.remove();
                arrowDiv.classList.add("lastArrowDiv")
                nodeKey.classList.add("lastNodeKey");
                
                    var nodeValue = document.createElement("span");
                    nodeValue.classList.add("nodeValue");
                    nodeValue.classList.add(typeof data[key]);
                    nodeValue.innerHTML = JSONViewer.#linkify(data[key]);

                nodeBody.appendChild(nodeValue);
            }
            nodes.push(node);
        }

        for (var i = 0; i < nodes.length; i++) {
            if (i < nodes.length - 1) {
                this.#verticalLine(current_node, nodes[i], nodes[i+1]);
            }
            if (i === 0 && !first) {
                this.#topVerticalLine(current_node, nodes[i]);
            }
        }
    }

    /**
     * Get the path of the node in the tree as an array
     * @param {HTMLElement} node 
     * @returns {string[]} - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
     */
    static getNodePath(node) {
        node = $(node)
        var currPath = [];
        while (node.length > 0 && !node.hasClass("json-tree-viewer-container")) {
            currPath.push(JSON.parse(node.attr("data-key")));
            node = node.parent();
        }
        var res = currPath.reverse();
        return res;
    }

    static #linkify(text) {
        if (typeof text !== "string") {
            return text;
        }
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
            return '<a href="' + url + '" target="_blank">' + url + '</a>';
        });
    }

    
    #verticalLine(parent, node1, node2) {
        if (!node1 || !node2) {
            return;
        }

        var line = document.createElement("div");
        line.classList.add("verticalLine");
        parent.appendChild(line);

        this.#updateVerticalLine(parent, node1, node2, line);
        this.#verticalLines.push([parent, node1, node2, line]);
    }

    #updateVerticalLine(parent, node1, node2, line) {
        node1 = node1.getElementsByClassName("arrowDiv")[0];
        node2 = node2.getElementsByClassName("arrowDiv")[0];

        if (!node1 || !node2) {
            return;
        }

        var node1Offset = node1.getBoundingClientRect();
        var node2Offset = node2.getBoundingClientRect();
        var parentOffset = parent.getBoundingClientRect();

        line.style.top = node1Offset.top + node1Offset.height - parentOffset.top + "px";
        line.style.left = node1Offset.left + 9 - parentOffset.left + "px";
        line.style.height = node2Offset.top - node1Offset.top - node1Offset.height + "px";
    }

    #updateVerticalLines() {
        for (var data of this.#verticalLines) {
            this.#updateVerticalLine(...data);
        }
    }


    #topVerticalLine(parent, node) {
        if (!node) {
            return;
        }

        var line = document.createElement("div");
        line.classList.add("verticalLine");
        parent.appendChild(line);

        this.#updateTopVerticalLine(parent, node, line);
        this.#topVerticalLines.push([parent, node, line]);
    }

    #updateTopVerticalLine(parent, node, line) {
        var node = node.getElementsByClassName("arrowDiv")[0];
        if (!node) {
            return;
        }

        var nodeOffset = node.getBoundingClientRect();
        var nodeBodyOffset = parent.getElementsByClassName("nodeBody")[0].getBoundingClientRect();
        var parentOffset = parent.getBoundingClientRect();

        line.style.left = nodeOffset.left + 9 - parentOffset.left + "px";
        line.style.top = nodeBodyOffset.top + nodeBodyOffset.height - parentOffset.top + "px";
        line.style.height = nodeOffset.top - nodeBodyOffset.top - nodeBodyOffset.height + "px";
    }

    #updateTopVerticalLines() {
        for (var data of this.#topVerticalLines) {
            this.#updateTopVerticalLine(...data);
        }
    }

    #updateLines() {
        this.#updateVerticalLines();
        this.#updateTopVerticalLines();
    }

}