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
        
        JSONViewer.getInstanceByContainer(this).toggleSearch();
    }
})

$(document).on("keydown", ".json-viewer-container .json-viewer-search input", function (e) {
    if (!e.ctrlKey && !e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        e.target.parentElement.getElementsByClassName("json-viewer-filter-button")[0].click();
    }
});

$(document).on("keydown", ".json-viewer-container .json-viewer-search", function (e) {
    if (!e.ctrlKey && !e.shiftKey && e.key === "Escape") {
        // e.target.parentElement.getElementsByClassName("json-viewer-close-search")[0].click();
        JSONViewer.getInstanceByContainer(this.parentElement).toggleSearch("hide");
    }
});


class JSONViewer {
    #verticalLines;
    #topVerticalLines;
    #shown;
    #container;
    #data;
    #options;
    #advancedSearch = false;
    static #instances = {};
    static #arrow_right = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAGxJREFUSEtjZKAxYKSx+QyjFhAM4ZEVRA4MDAwHCIYJmgJSgmg/AwNDI6mWkGqBKQMDgw8plpBqASiYvpJiCTkWgEKZaEsGpQVEux7kVVJ9QPNIpmkypXlGIzUTg9WTEgejFpAVAgQ1Df04AABMSBYZWnttmAAAAABJRU5ErkJggg==";
    static #play_circle = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAXpJREFUSEu1lX9RxEAMhd854ByAAkDBgQLAATjAAXdSUAAoAAmgAE4BoADmY5JOSH+knU73z+5uvpeXNLvSwmu1cHyNBRxKOpZ0YoJeJb1J+qgEVoBLSXchcI4HaCfpsQ/UBziQ9CDpzJQS4EUSAVlkwh4CyIy9K0lfGdQFIPizBUHdtrCBfbIEfp4hXQDUbCSdBsWV1WRCxtwF0qwM8INjlGeoZ4JVTU0yIHocA+D3hRW05XM4yP0fy/7vcwTQiu8WJPsOgLrQljdmRZdtnsWRt3AEuD14iJc5AwC+sABQzsaFNDZFgNPXAxcjlOBA4j9AB35GF+YAviVdTwFMsehe0u1Ui8YUeW+qc43cusEic6jVZnbTxwIBqjb1UdJqUz4s/qMBmTMqnkxk76hgg1YDwpTEEsbG0HLfeR+w8p+FQ+Oa/mboURcf1wRhAfe6MLpRTsuOGtdRLTVBIQG7FkD2Jz84ORgtjNL4ZJLZ7CezsL/ert7kOkJx4hdvXWgZmZakXgAAAABJRU5ErkJggg==";

    /**
     * Returns the JSONViewer object for the given container - note that the container IDs must be unique.
     * @param {HTMLElement|jQuery} container
     * @returns {JSONViewer}
     */
    static getInstanceByContainer(container) {
        container = $(container)[0];
        return JSONViewer.#instances[container.id];
    }

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
     * @property {number} defaultDepth - default depth of the tree. default: 1
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

        JSONViewer.#instances[container.id] = this;

        var defaultDepth = this.#options.defaultDepth ? this.#options.defaultDepth : 1;

        this.#container.addClass("json-viewer-container");
        this.#container.attr("tabindex", "0");

        var search = $("<div class='json-viewer-search hidden' tabindex='0'></div>");
        search.append($("<button class='json-viewer-close-search'>&times;</button>").click(this.toggleSearch.bind(this, "hide")));
        search.append($("<input type='text' placeholder='Query' title='Filter query.'></input>"));
        search.append($(`<input type='number' placeholder='Depth' title='Depth of the desired filtered nodes (count starts at 0)' value='${defaultDepth}'></input>`).change((e) => {
            if (e.target.type == "number") {
                e.target.value = (e.target.valueAsNumber || 0);
            }
        }));

        search.append($("<input type='checkbox' name='advanced' title='Filter by specific paths and rules'></input>").change((e) => {
            this.#advancedSearch = e.target.checked;
            if (e.target.checked) {
                e.target.parentElement.children[1].placeholder = "Path (e.g. `path.*.to.node.*`)";
                e.target.parentElement.children[2].placeholder = 'Rule (e.g. `this.someChild.has("value")`, where `this` is the last node in the path)';
                e.target.parentElement.children[1].title = "Filter path";
                e.target.parentElement.children[2].title = "Filter rule (JS-like)";
                e.target.parentElement.children[2].type = "text";
                // e.target.parentElement.children[1].value = "";
                e.target.parentElement.children[2].value = "";
            } else {
                e.target.parentElement.children[1].placeholder = "Query";
                e.target.parentElement.children[2].placeholder = "Depth";
                e.target.parentElement.children[1].title = "Filter query";
                e.target.parentElement.children[2].title = "Depth of the desired filtered nodes (count starts at 0)";
                e.target.parentElement.children[2].type = "number";
                // e.target.parentElement.children[1].value = "";
                e.target.parentElement.children[2].value = "" + defaultDepth;
            }
        }));
        search.append($("<label for='advanced'>Advanced filter</label>"));

        search.append($("<br>"));
        
        search.append($("<button class='json-viewer-filter-button' title='Ctrl+F'>&#128269;</button>").click((e) => {
            if (e.target.parentElement.classList.contains("hidden")) {
                // e.target.parentElement.classList.remove("hidden");
                // e.target.parentElement.children[1].focus();
                this.toggleSearch("show");
            } else {
                this.query(search.find("input").eq(0).val(), search.find("input").eq(1).val());
            }
        }));
        // question mark button
        search.append($("<button class='json-viewer-help-button' title='Help'>?</button>").click((e) => {
            window.open("https://github.com/YuvAIR/HTML-JSON-Viewer/blob/main/FILTER.md", "_blank");
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
            jsonThis.expandCollapse(JSONViewer.getNodePath($(this).parent().parent().parent()));
        });

        var treeContainer = $("<div class='json-viewer-tree-container'></div>");
        this.#container.append(treeContainer);
        this.#createTree(data, treeContainer);
        treeContainer.parent().focus();
    }

    toggleSearch(action="toggle") {
        var search = this.#container.find(".json-viewer-search")[0];
        switch (action) {
            case "toggle":
                search.classList.toggle("hidden");
                break;
            case "show":
                search.classList.remove("hidden");
                break;
            case "hide":
                search.classList.add("hidden");
                break;
        }

        if (search.classList.contains("hidden")) {
            search.getElementsByClassName("json-viewer-filter-button")[0].title = "Ctrl+F";
            this.updateTree(this.#data, true);
            this.#container.focus();
        } else {
            search.getElementsByClassName("json-viewer-filter-button")[0].title = "Enter";
            search.getElementsByTagName("input")[0].focus();
        }
    }



    /**
     * Check if the node at the given path is expanded.
     * @param {string[]} path
     */
    isExpanded(path) {
        return this.#shown.indexOf(path.join("/")) != -1;
    }
    /**
     * Expands or collapses the node at the given path (expands if collapsed, collapses if expanded)
     * @param {string[]} path
     */
     expandCollapse(path) {
        var node = this.#container.find(".node[data-path='" + path.join("/") + "']");
        if (node.length == 0) {
            return;
        }
        node.find(".arrow").first().attr("src", node.attr("src") == JSONViewer.#play_circle ? JSONViewer.#arrow_right : JSONViewer.#play_circle);
        node.toggleClass("hidden");
        if (!node.hasClass("hidden")) {
            this.#shown.push(path.join("/"));
        } else {
            this.#shown.splice(this.#shown.indexOf(JSONViewer.getNodePath(node).join("/")), 1);
        }
        this.#updateLines();
    }
    /**
     * Expand the node at the given path.
     * @param {string[]} path
     */
    expand(path) {
        if (this.isExpanded(path)) {
            return;
        }
        this.expandCollapse(path);
    }
    /**
     * Collapse the node at the given path.
     * @param {string[]} path
     */
    collapse(path) {
        if (!this.isExpanded(path)) {
            return;
        }
        this.expandCollapse(path);
    }
    /**
     * Expand all nodes.
     */
    expandAll() {
        var jsonThis = this;
        this.#container.find(".node").each(function() {
            jsonThis.expand(JSONViewer.getNodePath($(this)));
        });
    }
    /**
     * Collapse all nodes.
     */
    collapseAll() {
        var jsonThis = this;
        this.#container.find(".node").each(function() {
            jsonThis.collapse(JSONViewer.getNodePath($(this)));
        });
    }



    /**
     * Filters the tree to show only nodes at a given depth which match the query.
     * @param {string} q
     * @param {number|string} depth
     * @param {boolean} advanced - If true, q is the path and depth is the rule.
     */
    query(q="", depth=0, advanced=null) {
        q = q.toString();
        advanced = advanced === null ? this.#advancedSearch : advanced;
        !advanced && (depth = parseInt(depth));
        

        var new_data;
        var regex;
        if (advanced === true) {
            if (Object.keys(this.#data).length == 1) {
                var key = Object.keys(this.#data)[0];
                q = q.startsWith(key) ? q : key + "." + q;
            }
            new_data = JSONViewer.#advancedQueryRec(q.split("."), depth.trim(), this.#data);
            var strings = new_data.strings;
            new_data = new_data.data;
            regex = strings.length > 0 ? new RegExp(`(${strings.join("|")})`, "gi") : null;
        } else {
            new_data = JSONViewer.#queryRec(q, depth, this.#data);
            regex = new RegExp(`(${q})`, 'ig');
        }
        this.updateTree(new_data, true);

        var nodes = this.#container.find(".json-viewer-tree-container .nodeKey, .json-viewer-tree-container .nodeValue");
        if (regex) {
            for (const node of nodes) {
                var og_text = node.innerHTML;
                var text = og_text.replace(regex, '<span class="highlight">$1</span>');
                node.innerHTML = text;
            }
        }
    }
    static #queryRec(q, depth, data) {
        var new_data = {};
        for (const key in data) {
            if (key.toLowerCase().includes(q.toLowerCase())) {
                new_data[key] = data[key];
            } else if (JSON.stringify(data[key]).toLowerCase().includes(q.toLowerCase())) {
                if (depth == 0) {
                    new_data[key] = data[key];
                } else { // depth > 0
                    new_data[key] = JSONViewer.#queryRec(q, depth-1, data[key]);
                }
            }
        }
        return new_data;
    }

    static #advancedQueryRec(path, query, data) {
        var expression = esprima.parse(query).body[0].expression;
        function evaluate(path, expr, target, isFunc=false, isFirstInMember=true) {
            switch (expr.type) {
                case "CallExpression":
                    var func = evaluate(path, expr.callee, target, true);
                    var args = expr.arguments.map((arg) => evaluate(path, arg, target));
                    return func(...args);
                case "BinaryExpression":
                case "LogicalExpression":
                    return eval(`evaluate(path, expr.left, target) ${expr.operator} evaluate(path, expr.right, target)`);
                case "UnaryExpression":
                    return eval(`${expr.operator} evaluate(path, expr.argument, target)`);
                case "MemberExpression":
                    var object = evaluate(path, expr.object, target, false, true && isFirstInMember);
                    var property = evaluate(path, expr.property, target, false, false);
                    var res = object[property];
                    if (isFunc) {
                        switch (property) {
                            case "has":
                                property = Array.isArray(object) ? "includes" : "hasOwnProperty";
                                break;
                            case "hasK":
                            case "hasKey":
                                property = "hasOwnProperty";
                                break;
                            case "hasV":
                            case "hasVal":
                            case "hasValue":
                                object = Object.values(object);
                                property = "includes";
                                break;
                            
                            case "keys":
                                return () => Object.keys(object);
                            
                            case "values":
                                return () => Object.values(object);
                            
                            case "len":
                            case "length":
                                return () => Object.keys(object).length;
                        }
                        return object[property].bind(object);
                    } else if (res == undefined) {
                        if (Array.isArray(object) && property < 0) {
                            res = object[object.length + property];
                        }
                    }
                    return res;
                case "Identifier":
                    var res = expr.name;
                    if (["length", "len"].includes(res) && isFunc) {
                        res = (x) => Object.keys(x).length;
                    } else if (res === "path" && isFirstInMember) {
                        res = path;
                    }
                    return res;
                case "Literal":
                    return expr.value;
                case "ThisExpression":
                    return target;
            }
        }
        
        var new_data = {};
        function rec(data, path, depth=0, pathToHere=[]) {
            if (path.length > depth && path[depth] == "*") {
                for (const key in data) {
                    rec(data[key], path, depth+1, pathToHere.concat([key]));
                }
            } else if (path.length > depth && path[depth] in data) {
                rec(data[path[depth]], path, depth+1, pathToHere.concat([path[depth]]));
            } else if (path.length == depth) {
                if (evaluate(pathToHere, expression, data)) {
                    var pointer = new_data;
                    for (var i = 0; i < pathToHere.length - 1; i++) {
                        if (!(pathToHere[i] in pointer)) {
                            pointer[pathToHere[i]] = {};
                        }
                        pointer = pointer[pathToHere[i]];
                    }
                    pointer[pathToHere[pathToHere.length - 1]] = data;

                }
            }
        }

        rec(data, path);

        var strings = JSONViewer.#getAllStrings(expression);

        return {
            strings: strings,
            data: new_data
        };
    }

    static #getAllStrings(expr) {
        var strings = [];
        for (const key in expr) {
            if (key == "type" && expr[key] == "Literal" && typeof expr.value == "string") {
                strings.push(expr.value);
            } else if (typeof expr[key] == "object") {
                strings = strings.concat(JSONViewer.#getAllStrings(expr[key]));
            }
        }
        return strings;
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
    #createTree(data, current_node, first=true, path=[]) {
        current_node = $(current_node)[0];

        var nodes = []
        var firstCond = first && Object.keys(data).length == 1;
        for (var key in data) {
            var node = document.createElement("div");
            node.classList.add("node");
            firstCond && node.classList.add("root");
            node.dataset.path = path.concat(key).join("/");
            node.dataset.key = JSON.stringify(key);

                var nodeBody = document.createElement("div");
                nodeBody.classList.add("nodeBody");
                firstCond && nodeBody.classList.add("root");
                var arrowDiv = document.createElement("div");
                arrowDiv.classList.add("arrowDiv");

                if (!firstCond) {
                    var arrow = document.createElement("img");
                    arrow.classList.add("arrow");
                    arrow.src = JSONViewer.#play_circle;
                
                    arrowDiv.appendChild(arrow);
                
                    nodeBody.appendChild(arrowDiv);
                }
                
                    var nodeKey = document.createElement("span");
                    nodeKey.classList.add("nodeKey");
                    nodeKey.innerHTML = key;
                
                nodeBody.appendChild(nodeKey);

            node.appendChild(nodeBody);


            current_node.appendChild(node);
            var isHidden = this.#shown.indexOf(JSONViewer.getNodePath(node).join("/")) == -1;
            isHidden && firstCond && this.#shown.push(JSONViewer.getNodePath(node).join("/"));
            isHidden && !firstCond && node.classList.add("hidden");
            !isHidden && arrow && (arrow.src = JSONViewer.#arrow_right);

            if (typeof data[key] === "object") {
                this.#createTree(data[key], node, false, path.concat([key]));
            } else {
                arrow && arrow.remove();
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
        return $(node).attr("data-path").split("/");
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