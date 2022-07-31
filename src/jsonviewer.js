// Requires jQuery and Water CSS is recommended, will look terrible otherwise

window.onload = function() {
    var r = $(':root');
    var waterCSSTheme = r.css('--background-body');
    if (waterCSSTheme && waterCSSTheme.trim() === "#fff") { // light theme
        r.css('--jsonviewer-main-color', '#000000');
        r.css('--jsonviewer-link-color', '#2669bb');
        r.css('--jsonviewer-border-color', '#828282');
        r.css('--jsonviewer-background-color', '#ffffff');
        r.css('--jsonviewer-arrow', '0');
        r.css('--jsonviewer-arrow-hover', '0.175');
        r.css('--jsonviewer-highlight-color', '#ffd34f');
    }
};


$(document).on("keydown", ".json-viewer-container", function (e) {
    if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        
        var search = $(this).find(".json-viewer-search")[0];
        search.style.display = "block";
        search.getElementsByTagName("input")[0].focus();
        search.nextElementSibling.style.marginTop = "-153px";
    }
})


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

        this.#container.addClass("json-viewer-container");
        this.#container.attr("tabindex", "0");

        var search = $("<div class='json-viewer-search' style='display: none;'></div>");
        var closeButton = $("<button class='json-viewer-close-search'>&times;</button>");
        closeButton[0].addEventListener("click", (e) => {
            e.target.parentElement.style.display = "none";
            e.target.parentElement.nextElementSibling.style.marginTop = "0";
            this.updateTree(this.#data, true);
        });
        search.append(closeButton);
        search.append($("<input type='text' placeholder='Query' title='Filter query.'></input>"));
        search.append($("<input type='number' placeholder='Depth' title='Depth of the desired filtered nodes (count starts at 0)' value='0'></input>").change((e) => {
            e.target.value = (e.target.valueAsNumber || 0);
        }));
        search.append($("<button class='json-viewer-filter-button'>&#128269;</button>").click(() => {
            this.query(search.find("input").eq(0).val(), search.find("input").eq(1).val());
        }));

        this.#container.append(search);

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

        var treeContainer = $("<div class='json-viewer-tree-container'></div>");
        this.#container.append(treeContainer);
        this.#createTree(data, treeContainer);
    }

    /**
     * Filters the tree to show only nodes at a given depth which match the query.
     * @param {string} q
     * @param {number} depth
     */
    query(q="", depth=0) {
        q = q.toString();
        depth = parseInt(depth);
        var new_data = this.#queryRec(q, depth, this.#data);
        this.updateTree(new_data, true);

        var nodes = this.#container.find(".json-viewer-tree-container .nodeKey, .json-viewer-tree-container .nodeValue");
        for (const node of nodes) {
            var text = node.innerHTML;
            var regex = new RegExp(`(${q})`, 'ig');
            text = text.replace(regex, '<span class="highlight">$1</span>');
            node.innerHTML = text;
        }
    }
    #queryRec(q, depth, data) {
        var new_data = {};
        for (const key in data) {
            if (key.toLowerCase().includes(q.toLowerCase())) {
                new_data[key] = data[key];
            } else if (JSON.stringify(data[key]).toLowerCase().includes(q.toLowerCase())) {
                if (depth == 0) {
                    new_data[key] = data[key];
                } else { // depth > 0
                    new_data[key] = this.#queryRec(q, depth-1, data[key]);
                }
            }
        }
        return new_data;
    }


    /**
     * Update the tree using new data
     * @param {Object|string} data
     * @param {boolean} keepOldData - if true, only the tree would be updated, but the old data is kept. (shouldn't really be used by the user)
     */
    updateTree(data, keepOldData=false) {
        this.#verticalLines = [];
        this.#topVerticalLines = [];
        this.#shown = [];
        data = typeof data === "string" ? JSON.parse(data) : data;
        if (!keepOldData) {
            this.#data = data;
        }
        this.#container.find(".json-viewer-tree-container").empty();
        this.#createTree(data, this.#container.find(".json-viewer-tree-container"));
    }
    
    /**
     * @param {Object} data
     * @param {HTMLElement} container
     */
    #createTree(data, current_node, first=true) {
        current_node = $(current_node)[0];
        if (first) {
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
        while (node.length > 0 && !node.hasClass("json-viewer-tree-container")) {
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