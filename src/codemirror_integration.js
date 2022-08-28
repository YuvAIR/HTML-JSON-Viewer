
import { keymap, EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxTree, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { autocompletion, acceptCompletion } from "@codemirror/autocomplete";
import { materialDark } from "cm6-theme-material-dark";



const completePropertyAfter = ["PropertyName", ".", "?."];
const dontCompleteIn = ["TemplateString", "LineComment", "BlockComment", "VariableDefinition", "PropertyDefinition"];

const thisExtras = [
  { label: "has", type: "function" },
  { label: "hasKey", type: "function" },
  { label: "hasValue", type: "function" },
  { label: "length", type: "function" },
]

function completeFromGlobalScope(context) {
  let nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (completePropertyAfter.includes(nodeBefore.name) && nodeBefore.parent?.name == "MemberExpression") {
    let object = nodeBefore.parent.getChild("Expression");
    let from = /\./.test(nodeBefore.name) ? nodeBefore.to : nodeBefore.from;
    console.log(object);
    if (object?.name == "VariableName") {
      let variableName = context.state.sliceDoc(object.from, object.to);
      if (typeof window[variableName] == "object")
        return completeProperties(from, window[variableName]);
    } else if (object?.name == "String") {
      return completeProperties(from, String);
    } else if (object?.name == "this") {
      var complete = completeProperties(from, Object);
      complete.options = [...complete.options, ...thisExtras];

      return complete;
    }
  } else if (nodeBefore.name == "VariableName") {
    return completeProperties(nodeBefore.from, window);
  } else if (context.explicit && !dontCompleteIn.includes(nodeBefore.name)) {
    return completeProperties(context.pos, window);
  }
  return null;
}

function completeProperties(from, object) {
  let options = [];
  for (let name in typeof object === "function" ? Object.getOwnPropertyDescriptors(object.prototype) : object) {
    options.push({
      label: name,
      type: typeof object[name] == "function" ? "function" : "variable"
    });
  }
  return {
    from,
    options,
    validFor: /^[\w$]*$/
  };
}


const globalJavaScriptCompletions = javascriptLanguage.data.of({
  autocomplete: completeFromGlobalScope
});

window.editorViewFromElement = function (element) {
  var editorView = new EditorView({
    parent: element,
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap,
        { key: "Tab", run: acceptCompletion }]),
      javascript(),
      materialDark,
      javascriptLanguage,
      globalJavaScriptCompletions,
      autocompletion(),
      EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr)
    ]
  });
  return editorView;
}

editorViewFromElement(document.body);
