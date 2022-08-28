'use strict'


const ExcludedAutocompleteKeyNames = new Set([
    ' ',
    'Backspace',
    'Tab',
    'Enter',
    'Shift',
    'Ctrl',
    'Alt',
    'Pause',
    'CapsLock',
    'Escape',
    'PageUp',
    'PageDown',
    'End',
    'Home',
    'ArrowLeft',
    'ArrowUp',
    'ArrowRight',
    'ArrowDown',
    'Insert',
    'Delete',
    'Meta',
    'Select',
    '+',
    '-',
    '/',
    'F1',
    'F2',
    'F3',
    'F4',
    'F5',
    'F6',
    'F7',
    'F8',
    'F9',
    'F10',
    'F11',
    'F12',
    'NumLock',
    'ScrollLock',
    ';',
    '=',
    ',',
    '`',
    '\\',
    '\'',
    '"',
    '!',
    '%',
    '^',
    '&',
    '(',
    ')',
    '|'
]);


// const {keymap, EditorView} = CM["@codemirror/view"];
// const {defaultKeymap, history, historyKeymap} = CM["@codemirror/commands"];
// const {syntaxTree, syntaxHighlighting, defaultHighlightStyle} = CM["@codemirror/language"];
// const {javascript} = CM["@codemirror/lang-javascript"];

// const materialDark = window.materialDark.materialDark;

function addScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);
    var resolve;
    var promise = new Promise(function (resolve_) {
        resolve = resolve_;
    });
    script.onload = resolve;
    script.src = url;
    return promise;
}

function addStyle(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    document.getElementsByTagName('head')[0].appendChild(link);
    var resolve;
    var promise = new Promise(function (resolve_) {
        resolve = resolve_;
    });
    link.onload = resolve;
    link.href = url;
    return promise;
}

async function includeDependencies(callback) {
    // jQuery
    if (typeof jQuery === 'undefined') {
        await addScript('https://code.jquery.com/jquery-3.6.0.min.js');
    }
    // Water CSS
    var root = document.querySelector(':root');
    var prop = getComputedStyle(root).getPropertyValue('--background-body');
    if (!prop || prop.trim() === "") {   
        await addStyle('https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css');
    }
    // CodeMirror
    if (typeof CodeMirror === 'undefined') {
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/codemirror.min.js');

        await addScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/show-hint.min.js');
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/javascript-hint.min.js');
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/mode/javascript/javascript.min.js');
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/edit/closebrackets.min.js');

        await addStyle('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/codemirror.min.css');
        await addStyle('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/addon/hint/show-hint.min.css');
        await addStyle('https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/theme/material.min.css');
    }


    function getWord(cm, line, ch) {
        var word = cm.findWordAt({line: line, ch: ch});
        return {word: cm.getRange({line: line, ch: word.anchor.ch}, {line: line, ch: word.head.ch}), start: word.anchor.ch, end: word.head.ch};
    }

    
    var orig = CodeMirror.hint.javascript;
    CodeMirror.hint.javascript = function (cm, options) {
        if (options.rec) {
            return orig(cm, options);
        }
        options.rec = true;
        var inner = orig(cm, options) || {from: cm.getCursor(), to: cm.getCursor(), list: []};
        var line = cm.getCursor().line;
        var cursor_ch = cm.getCursor().ch;

        var words = []
        var prev_start = -1;
        for (var ch = 0; ch <= cursor_ch-1; ch++) {
            var word = getWord(cm, line, ch);
            if (word.start != prev_start) {
                words.push(word.word);
                prev_start = word.start;
            }
        }

        var x = words.pop();
        var y = words.pop();
        var z = words.pop();
        
        if (x === '.' && y === 'this' || y === '.' && z === 'this') {
            inner.list.push({text: 'has()', displayText: 'has()', className: 'autocomplete-method'});
            inner.list.push({text: 'hasKey()', displayText: 'hasKey()', className: 'autocomplete-method'});
            inner.list.push({text: 'hasValue()', displayText: 'hasValue()', className: 'autocomplete-method'});
            inner.list.push({text: 'length()', displayText: 'length()'});

            if (options.path && options.data) {
                var data = options.data;
                if (Object.keys(data).length === 1) {
                    data = data[Object.keys(data)[0]];
                }
                var path = options.path.split('.');

                function addHints(curr, path, index) {
                    if (index === path.length) {
                        for (const key in curr) {
                            inner.list.push({text: key, displayText: key, className: 'autocomplete-property'});
                        }
                    }

                    var p = path[index];
                    if (p === '*') {
                        for (const key in curr) {
                            addHints(curr[key], path, index + 1);
                        }
                    } else {
                        curr[p] && addHints(curr[p], path, index + 1);
                    }
                }

                addHints(data, path, 0);
            }


            var new_list = [];
            for (var i = 0; i < inner.list.length; i++) {
                var add = true;
                for (var j = 0; j < i; j++) {
                    if (inner.list[i].text === inner.list[j].text) {
                        add = false;
                        break;
                    }
                }
                
                if (y === '.') {
                    if (!inner.list[i].text.includes(x)) {
                        add = false;
                    }
                }
                
                if (add) {
                    new_list.push(inner.list[i]);
                }
            }

            new_list.sort(function (a, b) {
                if (y === '.') {
                    return a.text.indexOf(x) - b.text.indexOf(x);
                } else if (a.className !== b.className) {
                    return a.className === 'autocomplete-method' ? 1 : -1;
                } else {
                    return a.text.localeCompare(b.text);
                }
            });

            inner.list = new_list;

            CodeMirror.on(inner, 'pick', function (picked) {
                if (picked.className === 'autocomplete-method') {
                    // move cursor:
                    cm.setCursor({line: line, ch: cm.getCursor().ch - 1});
                }
            });
        }
        return inner;
    };

    CodeMirror.commands.autocomplete = function(cm, data, path) {
        // cm.showHint({hint: CodeMirror.hint.javascript}, {rec: false, data: data, path: path});
        CodeMirror.showHint(cm, CodeMirror.hint.javascript, {rec: false, data: data, path: path});
    }

    typeof callback === 'function' && callback();
}

document.addEventListener("DOMContentLoaded", includeDependencies);

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
    } else if (waterCSSTheme && waterCSSTheme.trim() === "#202b38") { // dark theme
        r.css('--jsonviewer-main-color', '#ffffff');
        r.css('--jsonviewer-link-color', '#86bcff');
        r.css('--jsonviewer-border-color', '#cccccc');
        r.css('--jsonviewer-background-color', '#202b38');
        r.css('--jsonviewer-arrow', '1');
        r.css('--jsonviewer-arrow-hover', '0.825');r
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
    
    $(document).on("keyup", ".json-viewer-container .json-viewer-search", function (e) {
        if (!e.ctrlKey && !e.shiftKey && e.key === "Escape" && document.activeElement.tagName !== "TEXTAREA") {
            JSONViewer.getInstanceByContainer(this.parentElement).toggleSearch("hide");
        }
    });
};




class JSONViewer {
    #verticalLines;
    #topVerticalLines;
    #shown;
    #container;
    #data;
    #currentData;
    #options;
    #advancedSearch = false;
    #keyMapCallback;
    #valueMapCallback;
    #expandAll;
    #autocompleteActive = true;
    #codeMirror;
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
     * @returns {Object}
     */
    get data() {
        return this.#data;
    }

    /**
     * Get the currently displayed data.
     * @returns {Object}
     */
    get currentData() {
        return this.#currentData;
    }

    get #queryPath() {
        var search = this.#container.find('.json-viewer-search');
        return search.find("input").eq(0).val();
    }

    get #queryRule() {
        var search = this.#container.find('.json-viewer-search');
        return this.#advancedSearch ? this.#codeMirror.state.doc.toString() : search.find("input").eq(1).val();
    }


    /**
     * @callback nodeCallback
     * @param {string} nodeName
     * @param {Object} nodeValue
     * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
     * @param {HTMLElement} nodeElement - node DOM element on the tree
     */
    /**
     * @callback keyCallback
     * @param {string} nodeName
     * @param {Object} nodeValue
     * @param {string} nodePath - ["path", "to", "node"] => data[path][to][nodeName] == nodeValue
     * @return {string|Promise<string>} - HTML string to replace the node element
     */
    /**
     * @callback valueCallback
     * @param {Object} nodeValue
     * @param {string} nodePath - ["path", "to", "node"] => data[path][to][node] == nodeValue
     * @return {string|Promise<string>} - HTML string to replace the node element
     */
    /**
     * @typedef {Object} JSONViewerOptions
     * @property {nodeCallback} nodeClickCallback - callback function to be called when a node (key) is clicked
     * @property {keyCallback} keyMapCallback - every key in the tree is passed to this callback, which returns an html string to replace the key element. default: keep the key as is.
     * @property {valueCallback} valueMapCallback - every terminal value in the tree is passed to this callback, which returns an html string to replace the value element. default: JSONViewer.linkify
     * @property {string} maxKeyWidth - max width of a key node (css string), overflow will be hidden. default: "100%"
     * @property {string} maxValueWidth - max width of a value node (css string), overflow will craete a new line. default: "100%"
     * @property {number} defaultDepth - default depth of the tree. default: 1
     * @property {boolean} defaultAdvanced - default state of the advanced search. default: false
     * @property {boolean} expandAll - expand all nodes on every tree update call (including the initial one). default: false
     */
    /**
     * @param {Object|string} data - Object / JSON string to be displayed
     * @param {HTMLElement} container - DOM element to display the tree in
     * @param {JSONViewerOptions} options
     */
    constructor(data, container, options) {
        includeDependencies(() => {
            data = typeof data === "string" ? JSON.parse(data) : data;
            this.#verticalLines = [];
            this.#topVerticalLines = [];
            this.#shown = [];
            this.#container = $(container);
            this.#data = data;
            this.#currentData = data;
            this.#options = options ? options : {};

            JSONViewer.#instances[$(container)[0].id] = this;

            var defaultDepth = this.#options.defaultDepth ? this.#options.defaultDepth : 1;
            this.#advancedSearch = this.#options.defaultAdvanced ? this.#options.defaultAdvanced : false;
            this.#keyMapCallback = this.#options.keyMapCallback ? this.#options.keyMapCallback : (key) => { return key; };
            this.#valueMapCallback = this.#options.valueMapCallback ? this.#options.valueMapCallback : JSONViewer.linkify;
            this.#expandAll = this.#options.expandAll ? this.#options.expandAll : false;

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

                    if (jsonThis.#codeMirror) {
                        jsonThis.#codeMirror.setValue("");
                        return;
                    }
                    jsonThis.#codeMirror = window.editorViewFromElement(target.parentElement);


                    return;
                    jsonThis.#codeMirror = CodeMirror.fromTextArea(target.parentElement.children[2], {
                        lineNumbers: false,
                        styleActiveLine: false,
                        matchBrackets: true,
                        autoCloseBrackets: true,
                        mode: {
                            name: "javascript",
                            globalVars: true
                        },
                        theme: "material",
                        extraKeys: {
                            "Ctrl-Space": "autocomplete"
                        },
                        hintOptions: {
                            completeSingle: false
                        }
                    });

                    jsonThis.#codeMirror.setOption("this", "somestring");

                    

                    jsonThis.#codeMirror.on("keyup", function (cm, event) {
                        if (!cm.state.completionActive && jsonThis.#autocompleteActive) {
                            if (!ExcludedAutocompleteKeyNames.has(event.key) && !event.ctrlKey && !event.altKey) {
                                var line = cm.getLine(cm.getCursor().line);
                                var cursor = cm.getCursor().ch;
                                var lastWord = line.substring(0, cursor-1).split(new RegExp("\\s|\\.|\\" + Array.from(ExcludedAutocompleteKeyNames).filter(x => x.length == 1).join("|\\"))).pop();
                                if (parseFloat(lastWord).toString() === lastWord || (cursor === 0)) {
                                    return;
                                }

                                CodeMirror.commands.autocomplete(cm, jsonThis.#data, jsonThis.#queryPath);
                            } else if (event.key == "Escape") {
                                jsonThis.#autocompleteActive = false;
                            }
                        } else {
                            if ((event.key == "Space" && event.ctrlKey) || event.key == '.') {
                                jsonThis.#autocompleteActive = true;
                                CodeMirror.commands.autocomplete(cm, jsonThis.#data, jsonThis.#queryPath);
                            }
                        }
                    });

                    jsonThis.#codeMirror.on("beforeChange", function(cm, changeObj) {
                        var typedNewLine = changeObj.origin == '+input' && typeof changeObj.text == "object" && changeObj.text.join("") == "";
                        if (typedNewLine) {
                            return changeObj.cancel();
                        }
                    
                        var pastedNewLine = changeObj.origin == 'paste' && typeof changeObj.text == "object" && changeObj.text.length > 1;
                        if (pastedNewLine) {
                            var newText = changeObj.text.join(" ");
                    
                            return changeObj.update(null, null, [newText]);
                        }
                    
                        return null;
                    });
                } else {
                    target.parentElement.children[1].placeholder = "Query";
                    target.parentElement.children[2].placeholder = "Depth";
                    target.parentElement.children[1].title = "Filter query";
                    target.parentElement.children[2].title = "Depth of the desired filtered nodes (count starts at 0)";
                    target.parentElement.children[2].type = "number";
                    // target.parentElement.children[1].value = "";
                    target.parentElement.children[2].value = "" + defaultDepth;
                    jsonThis.#codeMirror && jsonThis.#codeMirror.toTextArea();
                    jsonThis.#codeMirror = null;
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
                    this.query(this.#queryPath, this.#queryRule);
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
        });
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
                var res;
                try {
                    res = evaluate(pathToHere, expression, data);
                } catch (e) {}
                
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
     * @param {Object|string} data
     * @param {boolean} keepOldData - if true, only the tree would be updated, but the old data is kept. (shouldn't really be used by the user)
     */
    async updateTree(data, keepOldData=false) {
        this.#verticalLines = [];
        this.#topVerticalLines = [];
        this.#shown = [];
        data = typeof data === "string" ? JSON.parse(data) : data;
        this.#currentData = data;
        if (!keepOldData) {
            this.#data = data;
        }
        this.#container.find(".json-viewer-tree-container").empty();
        await this.#createTree(data, this.#container.find(".json-viewer-tree-container"));
    }
    
    /**
     * @param {Object} data
     * @param {HTMLElement} container
     */
    async #createTree(data, current_node, first=true, path=[]) {
        current_node = $(current_node)[0];

        var nodes = []
        var firstCond = first && Object.keys(data).length == 1;
        for (var key in data) {
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
                    let res = this.#keyMapCallback(key, data[key], path.concat(key));
                    if (res.then) {
                        res.then((newkey) => {
                            nodeKey.innerHTML = newkey;
                        });
                    } else {
                        nodeKey.innerHTML = res;
                    }
                
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
                    let res = this.#valueMapCallback(data[key], path.concat([key]));
                    if (res.then) {
                        res.then((newval) => {
                            nodeValue.innerHTML = newval;
                        });
                    } else {
                        nodeValue.innerHTML = res;
                    }

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

    static linkify(text) {
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