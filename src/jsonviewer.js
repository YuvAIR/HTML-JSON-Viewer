const InstantSearch = {
    "highlight": function (container, highlightText) {
        const internalHighlighter = function (options) {
            const highlighted = [];
            const id = {
                container: "container",
                tokens: "tokens",
                all: "all",
                token: "token",
                className: "className",
                sensitiveSearch: "sensitiveSearch"
            },
                tokens = options[id.tokens],
                allClassName = options[id.all][id.className],
                allSensitiveSearch = options[id.all][id.sensitiveSearch];

            function getTagPath(node) {
                var path = [];
                while (node.parentElement) {
                    path.unshift(node.nodeName);
                    node = node.parentElement;
                }
                return path;
            }

            function checkAndReplace(node, tokenArr, classNameAll, sensitiveSearchAll) {
                if (getTagPath(node).some((tag) => ["SCRIPT", "STYLE"].includes(tag))) return;
                var nodeVal = node.nodeValue, parentNode = node.parentNode,
                    i, j, curToken, myToken, myClassName, mySensitiveSearch,
                    finalClassName, finalSensitiveSearch,
                    foundIndex, begin, matched, end,
                    textNode, span, isFirst;

                for (i = 0, j = tokenArr.length; i < j; i++) {
                    curToken = tokenArr[i];
                    myToken = curToken[id.token];
                    myClassName = curToken[id.className];
                    mySensitiveSearch = curToken[id.sensitiveSearch];

                    finalClassName = (classNameAll ? myClassName + " " + classNameAll : myClassName);

                    finalSensitiveSearch = (typeof sensitiveSearchAll !== "undefined" ? sensitiveSearchAll : mySensitiveSearch);

                    isFirst = true;
                    while (true) {
                        if (finalSensitiveSearch)
                            foundIndex = nodeVal.indexOf(myToken);
                        else
                            foundIndex = nodeVal.toLowerCase().indexOf(myToken.toLowerCase());

                        if (foundIndex < 0) {
                            if (isFirst)
                                break;

                            if (nodeVal) {
                                textNode = document.createTextNode(nodeVal);
                                parentNode.insertBefore(textNode, node);
                            } // End if (nodeVal)

                            parentNode.removeChild(node);
                            break;
                        } // End if (foundIndex < 0)

                        isFirst = false;


                        begin = nodeVal.substring(0, foundIndex);
                        matched = nodeVal.substr(foundIndex, myToken.length);

                        if (begin) {
                            textNode = document.createTextNode(begin);
                            parentNode.insertBefore(textNode, node);
                        } // End if (begin)

                        span = document.createElement("span");
                        span.className += finalClassName;
                        span.appendChild(document.createTextNode(matched));
                        parentNode.insertBefore(span, node);

                        highlighted.push(parentNode);

                        nodeVal = nodeVal.substring(foundIndex + myToken.length);
                    } // Whend
                } // Next i 
            }; // End Function checkAndReplace 

            function iterator(p) {
                if (p === null) return;

                var children = Array.prototype.slice.call(p.childNodes), i, cur;

                if (children.length) {
                    for (i = 0; i < children.length; i++) {
                        cur = children[i];
                        if (cur.nodeType === 3) {
                            checkAndReplace(cur, tokens, allClassName, allSensitiveSearch);
                        } else if (cur.nodeType === 1) {
                            iterator(cur);
                        }
                    }
                }
            }; // End Function iterator

            iterator(options[id.container]);
            return highlighted;
        }; // End Function highlighter

        if (!Array.isArray(highlightText)) {
            highlightText = [highlightText];
        }

        return internalHighlighter(
            {
                container: container,
                all:
                {
                    className: "highlighter"
                },
                tokens: highlightText.map((text) => {
                    return {
                        token: text,
                        className: "highlight",
                        sensitiveSearch: true
                    };
                }),
            }
        ); // End Call internalHighlighter 
    } // End Function highlight
};

// Requires jQuery and Water CSS is recommended, will look terrible otherwise

window.addEventListener("load", () => {
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
    } else if (waterCSSTheme && waterCSSTheme.trim() === "#202b38") { // dark theme
        r.css('--jsonviewer-main-color', '#ffffff');
        r.css('--jsonviewer-link-color', '#86bcff');
        r.css('--jsonviewer-border-color', '#cccccc');
        r.css('--jsonviewer-background-color', '#202b38');
        r.css('--jsonviewer-arrow', '1');
        r.css('--jsonviewer-arrow-hover', '0.825');
        r.css('--jsonviewer-highlight-color', '#896700');
    }
});

// fix contenteditable focus on any click
var fakeBlur = false;
if (/AppleWebKit\/([\d.]+)/.exec(navigator.userAgent)) {
    document.addEventListener('DOMContentLoaded', function () {
        var fixEl = document.createElement('input');
        fixEl.style.cssText = 'width:1px;height:1px;border:none;margin:0;padding:0; position:fixed; top:0; left:0';
        fixEl.tabIndex = -1;

        var shouldNotFocus = null;

        function checkMouseEvent(e) {
            if (e.target.isContentEditable) return;
            var range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (!range) return;
            var wouldFocus = getContentEditableRoot(range.commonAncestorContainer);
            if (!wouldFocus || wouldFocus.contains(e.target)) return;
            shouldNotFocus = wouldFocus;
            setTimeout(function () {
                shouldNotFocus = null;
            });
            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', checkMouseEvent, false);
            }
        }
        document.addEventListener('mousedown', checkMouseEvent, false);
        document.addEventListener('mouseup', function () {
            document.removeEventListener('mousemove', checkMouseEvent, false);
        }, false);

        document.addEventListener('focus', function (e) {
            if (e.target !== shouldNotFocus) return;
            if (!e.target.isContentEditable) return;
            fakeBlur = true;
            setTimeout(function () {
                fakeBlur = false;
            }, 100);
            document.body.appendChild(fixEl);
            fixEl.focus();
            fixEl.setSelectionRange(0, 0);
            document.body.removeChild(fixEl);
        }, true);

    });
}
function getContentEditableRoot(el) {
    if (el.nodeType === 3) el = el.parentNode;
    if (!el.isContentEditable) return false;
    while (el) {
        var next = el.parentNode;
        if (next.isContentEditable) {
            el = next;
            continue
        }
        return el;
    }
}

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
        JSONViewer.getInstanceByContainer(this.parentElement).toggleSearch("hide");
    }
});


class JSONViewer {
    #verticalLines;
    #topVerticalLines;
    #shown;
    #preQueryShown;
    #container;
    #data;
    #tmpData;
    #currentData;
    #options;
    #advancedSearch = false;
    #keyMapCallback;
    #valueMapCallback;
    #expandAll;
    #allowEdit;
    #showLines;
    #editOnChange;
    #editOnBlur;
    #editBlurOnEnter;
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

    /**
     * @returns {HTMLElement}
     */
    get container() {
        return $(this.#container)[0];
    }

    /**
     * Get original data or the last data that was used in an `updateTree` call, with `keepOldData` set to false.
     * Note that queries call `updateTree` with `keepOldData` set to true, so this will return the original data even if a query is active.
     * @returns {object}
     */
    get data() {
        return this.#data;
    }

    /**
     * Get the currently displayed data.
     * @returns {object}
     */
    get currentData() {
        return this.#currentData;
    }

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
     * @property {editOnChange} editOnChange - callback function to be called when a node (value) is edited. default: `(name, prevVal, newVal, path) => newVal`
     * @property {editOnBlur} editOnBlur - callback function to be called when a node (value) is edited and loses focus. default: `(name, newVal, path) => newVal`
     * @property {boolean} editBlurOnEnter - if true, the content editable value will lose focus when the user presses enter. default: true
     * @property {number} defaultDepth - default depth of the tree. default: 1
     * @property {boolean} defaultAdvanced - default state of the advanced search. default: false
     * @property {boolean} expandAll - expand all nodes on every tree update call (including the initial one). default: false
     * @property {boolean} showLines - show lines between nodes. some features (such as auto expand on filter) will not work as the lines are bad for performance. default: false
     */
    /**
     * @param {object|string} data - Object / JSON string to be displayed
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
        this.#tmpData = structuredClone(data);
        this.#currentData = data;
        this.#options = options ? options : {};

        JSONViewer.#instances[$(container)[0].id] = this;

        var defaultDepth = this.#options.defaultDepth ? this.#options.defaultDepth : 1;
        this.#advancedSearch = this.#options.defaultAdvanced ? this.#options.defaultAdvanced : false;
        this.#keyMapCallback = this.#options.keyMapCallback ? this.#options.keyMapCallback : (key) => { return key; };
        this.#valueMapCallback = this.#options.valueMapCallback ? this.#options.valueMapCallback : JSONViewer.linkify;
        this.#allowEdit = this.#options.allowEdit ? this.#options.allowEdit : () => { return false; };
        this.#editOnChange = this.#options.editOnChange ? this.#options.editOnChange : (name, prevVal, newVal, path) => { return newVal; };
        this.#editOnBlur = this.#options.editOnBlur ? this.#options.editOnBlur : (name, newVal, path) => { return newVal; };
        this.#editBlurOnEnter = this.#options.editBlurOnEnter ? this.#options.editBlurOnEnter : true;
        this.#expandAll = this.#options.expandAll ? this.#options.expandAll : false;
        this.#showLines = this.#options.showLines ? this.#options.showLines : false;

        this.#container.addClass("json-viewer-container");
        this.#container.attr("tabindex", "0");
        (this.#container.attr("id") === undefined) && this.#container.attr("id", "json-viewer-" + JSONViewer.#instances.length);
        !this.#showLines && this.#container.append(`
        <style scoped>
            .arrowDiv::after, .arrowDiv::before {
                display: none;
            }
        </style>
        `);

        var search = $("<div class='json-viewer-search hidden' tabindex='0'></div>");
        search.append($("<button class='json-viewer-close-search'>&times;</button>").click(this.toggleSearch.bind(this, "hide")));
        search.append($("<input type='text' placeholder='Query' title='Filter query.'></input>"));
        search.append($(`<input type='number' placeholder='Depth' title='Depth of the desired filtered nodes (count starts at 0)' value='${defaultDepth}'></input>`).change((e) => {
            if (e.target.type == "number") {
                e.target.value = (e.target.valueAsNumber || 0);
            }
        }));

        var jsonThis = this;
        function advancedChange(target) {
            target = $(target)[0];
            jsonThis.#advancedSearch = target.checked;
            if (target.checked) {
                target.parentElement.children[1].placeholder = "Path (e.g. `path.*.to.node.*`)";
                target.parentElement.children[2].placeholder = 'Rule (e.g. `this.someChild.has("value")`, where `this` is the last node in the path)';
                target.parentElement.children[1].title = "Filter path";
                target.parentElement.children[2].title = "Filter rule (JS-like)";
                target.parentElement.children[2].type = "text";
                // target.parentElement.children[1].value = "";
                target.parentElement.children[2].value = "";
            } else {
                target.parentElement.children[1].placeholder = "Query";
                target.parentElement.children[2].placeholder = "Depth";
                target.parentElement.children[1].title = "Filter query";
                target.parentElement.children[2].title = "Depth of the desired filtered nodes (count starts at 0)";
                target.parentElement.children[2].type = "number";
                // target.parentElement.children[1].value = "";
                target.parentElement.children[2].value = "" + defaultDepth;
            }
        }

        search.append($(`<input type='checkbox' name='advanced' title='Filter by specific paths and rules' ${this.#advancedSearch ? 'checked' : ''}></input>`).change((e) => {
            advancedChange(e.target);
        }));
        search.append($("<label for='advanced'>Advanced filter</label>"));

        search.append($("<br>"));

        search.append($("<button class='json-viewer-filter-button' title='Ctrl+F'>&#128269;</button>").click((e) => {
            if (e.target.parentElement.classList.contains("hidden")) {
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

        advancedChange(search.find("input[type='checkbox']"));

        if (this.#options.maxKeyWidth) {
            this.#container.css("--jsonviewer-max-key-width", this.#options.maxKeyWidth);
        }
        if (this.#options.maxValueWidth) {
            this.#container.css("--jsonviewer-max-value-width", this.#options.maxValueWidth);
        }


        var nodeClickCallback = this.#options.nodeClickCallback;
        this.#container.on("click", ".nodeKey", function () {
            if (!nodeClickCallback) {
                return;
            }
            var node = $(this).parent().parent();
            var path = JSONViewer.getNodePath(node);
            var name = name = path[path.length - 1];
            var value = jsonThis.data;
            for (const key of path) {
                value = value[key];
            }
            nodeClickCallback(name, value, path, node);
        });

        this.#container.on("click", ".arrow", function () {
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
            this.#shown = structuredClone(this.#preQueryShown);
            search.getElementsByClassName("json-viewer-filter-button")[0].title = "Ctrl+F";
            this.updateTree(this.#data, true);
            this.#container.focus();
        } else {
            this.#preQueryShown = structuredClone(this.#shown);
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
        node.find(".arrow").first().attr("src", node.find(".arrow").first().attr("src") == JSONViewer.#play_circle ? JSONViewer.#arrow_right : JSONViewer.#play_circle);
        node.toggleClass("hidden");
        if (!node.hasClass("hidden")) {
            this.#shown.push(path.join("/"));
        } else {
            this.#shown.splice(this.#shown.indexOf(JSONViewer.getNodePath(node).join("/")), 1);
        }
        this.#showLines && this.#updateLines();
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
     * Expand the node at the given path, and all its parents.
     * @param {string[]} path
     */
    expandUpTo(path) {
        var currentPath = [];
        for (const key of path) {
            currentPath.push(key);
            this.expand(currentPath);
        }
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
        this.#container.find(".node").each(function () {
            jsonThis.expand(JSONViewer.getNodePath($(this)));
        });
    }
    /**
     * Collapse all nodes.
     */
    collapseAll() {
        var jsonThis = this;
        this.#container.find(".node").each(function () {
            jsonThis.collapse(JSONViewer.getNodePath($(this)));
        });
    }



    /**
     * Filters the tree to show only nodes at a given depth which match the query.
     * @param {string} q
     * @param {number|string} depth
     * @param {boolean} advanced - If true, q is the path and depth is the rule.
     */
    async query(q = "", depth = 0, advanced = null) {
        q = q.toString();
        advanced = advanced === null ? this.#advancedSearch : advanced;
        !advanced && (depth = parseInt(depth));


        var new_data;
        var highlight;
        if (advanced === true) {
            if (Object.keys(this.#data).length == 1) {
                var key = Object.keys(this.#data)[0];
                q = q.startsWith(key) ? q : key + "." + q;
            }
            new_data = JSONViewer.#advancedQueryRec(q.split("."), depth.trim(), this.#data);
            var strings = new_data.strings;
            new_data = new_data.data;
            highlight = strings;
        } else {
            new_data = JSONViewer.#queryRec(q, depth, this.#data);
            highlight = q;
        }
        await this.updateTree(new_data, true);

        if (highlight) {
            const res = InstantSearch.highlight(this.container.querySelector(".json-viewer-tree-container"), highlight);
            for (const elem of res) {
                const node = elem.closest(".node");
                if (node) {
                    this.expandUpTo(JSONViewer.getNodePath(node));
                }
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
                    new_data[key] = JSONViewer.#queryRec(q, depth - 1, data[key]);
                }
            }
        }
        return new_data;
    }

    static #advancedQueryRec(path, query, data) {
        var expression = esprima.parse(query).body[0].expression;
        function evaluate(path, expr, target, isFunc = false, isFirstInMember = true) {
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
        function rec(data, path, depth = 0, pathToHere = []) {
            if (path.length > depth && path[depth] == "*") {
                for (const key in data) {
                    rec(data[key], path, depth + 1, pathToHere.concat([key]));
                }
            } else if (path.length > depth && path[depth] in data) {
                rec(data[path[depth]], path, depth + 1, pathToHere.concat([path[depth]]));
            } else if (path.length == depth) {
                var res;
                try {
                    res = evaluate(pathToHere, expression, data);
                } catch (e) { }

                if (res) {
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
            if (key == "type" && expr[key] == "Literal" && typeof expr.value == "string" && expr.value != "") {
                strings.push(expr.value);
            } else if (typeof expr[key] == "object") {
                strings = strings.concat(JSONViewer.#getAllStrings(expr[key]));
            }
        }
        return strings;
    }


    /**
     * Update the tree using new data
     * @param {object|string} data
     * @param {boolean} keepOldData - if true, only the tree would be updated, but the old data is kept. (shouldn't really be used by the user)
     */
    async updateTree(data, keepOldData = false) {
        this.#verticalLines = [];
        this.#topVerticalLines = [];
        data = typeof data === "string" ? JSON.parse(data) : data;
        this.#currentData = data;
        this.#tmpData = structuredClone(data);
        if (!keepOldData) {
            this.#data = data;
        }
        this.#container.find(".json-viewer-tree-container").empty();
        await this.#createTree(data, this.#container.find(".json-viewer-tree-container"));
    }

    /**
     * Calls `func` with args, if `func` is async, wait for result and pass to `callback`, otherwise just pass the return value to `callback`.
     * @param {object[]} args
     * @param {function} func
     * @param {function} callback
     */
    static #maybeAsyncCallback(args, func, callback) {
        const res = func(...args);
        if (res == undefined) {
            return callback();
        }
        if (res.then) {
            res.then(callback);
        } else {
            callback(res);
        }
    }

    /**
     * If path is `[a, b, c]`, returns `data[a][b][c]`
     * @param {object} data
     * @param {string[]} path
     * @returns {object}
     */
    static #getDeepValue(data, path) {
        let pointer = data;
        for (var i = 0; i < path.length; i++) {
            if (pointer[path[i]] == undefined) {
                return undefined;
            }
            pointer = pointer[path[i]];
        }
        return pointer;
    }

    /**
     * If path is `[a, b, c]`, sets `data[a][b][c]` to `value`
     * @param {object} data
     * @param {string[]} path
     * @param {object} value
     */
    static #setDeepValue(data, path, value) {
        let pointer = data;
        for (var i = 0; i < path.length - 1; i++) {
            if (pointer[path[i]] == undefined) {
                pointer[path[i]] = {};
            }
            pointer = pointer[path[i]];
        }
        pointer[path[path.length - 1]] = value;
    }

    /**
     * @param {object} data
     * @param {HTMLElement} container
     */
    async #createTree(data, current_node, first = true, path = []) {
        current_node = $(current_node)[0];

        var nodes = []
        var firstCond = first && Object.keys(data).length == 1;
        for (let key in data) {
            let node = document.createElement("div");
            node.classList.add("node");
            firstCond && node.classList.add("root");
            node.dataset.path = path.concat(key).join("/");
            node.dataset.key = JSON.stringify(key);

            let nodeBody = document.createElement("div");
            nodeBody.classList.add("nodeBody");
            firstCond && nodeBody.classList.add("root");
            let arrowDiv = document.createElement("div");
            arrowDiv.classList.add("arrowDiv");

            if (!firstCond) {
                var arrow = document.createElement("img");
                arrow.classList.add("arrow");
                arrow.src = JSONViewer.#play_circle;

                arrowDiv.appendChild(arrow);

                nodeBody.appendChild(arrowDiv);
            }

            let nodeKey = document.createElement("span");
            nodeKey.classList.add("nodeKey");
            nodeKey.innerHTML = key;
            JSONViewer.#maybeAsyncCallback([key, data[key], path.concat(key)], this.#keyMapCallback, (newkey) => {
                nodeKey.innerHTML = newkey;
            });

            nodeBody.appendChild(nodeKey);

            node.appendChild(nodeBody);


            current_node.appendChild(node);

            let nodePath = JSONViewer.getNodePath(node).join("/");
            if (this.#expandAll) {
                this.#shown.push(nodePath);
            }

            let isHidden = this.#shown.indexOf(nodePath) == -1;
            isHidden && firstCond && this.#shown.push(nodePath);
            isHidden && !firstCond && node.classList.add("hidden");
            !isHidden && arrow && (arrow.src = JSONViewer.#arrow_right);

            if (typeof data[key] === "object") {
                await this.#createTree(data[key], node, false, path.concat([key]));
            } else {
                arrow && arrow.remove();
                arrowDiv.classList.add("lastArrowDiv")
                nodeKey.classList.add("lastNodeKey");

                let nodeValue = document.createElement("span");
                nodeValue.classList.add("nodeValue");
                nodeValue.classList.add(typeof data[key]);
                nodeValue.innerHTML = data[key];
                JSONViewer.#maybeAsyncCallback([data[key], path.concat([key])], this.#valueMapCallback, (newval) => {
                    nodeValue.innerHTML = newval;
                });

                function parseString(string) {
                    if (typeof string !== "string") {
                        return string;
                    }

                    if (parseFloat(string).toString() === string) {
                        return parseFloat(string);
                    } else if (string === "true" || string === "false") {
                        return string === "true";
                    } else if (string === "null") {
                        return null;
                    } else if (string === "undefined") {
                        return undefined;
                    }
                    return string;
                }

                const jsonThis = this;
                function editable() {
                    nodeValue.contentEditable = true;
                    nodeValue.classList.add("editable");

                    nodeValue.onkeydown = function (e) {
                        if (e.key === "Enter" && jsonThis.#editBlurOnEnter) {
                            nodeValue.blur();
                        } else if (e.key === "Escape") {
                            nodeValue.innerHTML = data[key];
                            nodeValue.blur();
                        }
                    };

                    nodeValue.addEventListener("input", () => {
                        const newPath = path.concat([key]);

                        const oldValue = JSONViewer.#getDeepValue(jsonThis.#tmpData, newPath);
                        const currentValue = parseString(nodeValue.innerHTML);

                        const oldType = typeof oldValue;
                        const currentType = typeof currentValue;

                        if (oldType !== currentType) {
                            nodeValue.classList.toggle(oldType, false);
                            nodeValue.classList.toggle(currentType, true);
                        }

                        JSONViewer.#maybeAsyncCallback([key, oldValue, currentValue, newPath], jsonThis.#editOnChange, (newVal) => {
                            if (newVal != currentValue) {
                                nodeValue.innerHTML = newVal;
                                nodeValue.focus();
                            }
                            JSONViewer.#setDeepValue(jsonThis.#tmpData, newPath, newVal);
                        });
                    });

                    nodeValue.onblur = () => {
                        if (!fakeBlur) {
                            const newPath = path.concat([key]);
                            const currentValue = nodeValue.innerHTML;
                            JSONViewer.#maybeAsyncCallback([key, currentValue, newPath], jsonThis.#editOnBlur, (newval) => {
                                nodeValue.innerHTML = newval;
                                nodeValue.blur();
                                JSONViewer.#setDeepValue(jsonThis.#data, newPath, newval);
                                JSONViewer.#setDeepValue(jsonThis.#currentData, newPath, newval);
                                JSONViewer.#setDeepValue(jsonThis.#tmpData, newPath, newval);
                            });
                        }
                    };
                }

                JSONViewer.#maybeAsyncCallback([key, data[key], path.concat([key])], this.#allowEdit, (allow) => {
                    allow && editable();
                });


                nodeBody.appendChild(nodeValue);
            }
            nodes.push(node);
        }

        if (this.#showLines) {
            for (var i = 0; i < nodes.length; i++) {
                if (i < nodes.length - 1) {
                    this.#verticalLine(current_node, nodes[i], nodes[i + 1]);
                }
                if (i === 0 && !first) {
                    this.#topVerticalLine(current_node, nodes[i]);
                }
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

    static linkify(text) {
        if (typeof text !== "string") {
            return text;
        }
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function (url) {
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