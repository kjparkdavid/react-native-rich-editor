function getContentCSS() {
    /*img {max-width: 98%;margin-left:auto;margin-right:auto;display: block;}*/
    return `
    <style>
        video {max-width: 98%;margin-left:auto;margin-right:auto;display: block;}
        img {max-width: 98%;vertical-align: middle;}
        table {width: 100% !important;}
        table td {width: inherit;}
        table span { font-size: 12px !important; }
        .x-todo li {
            list-style: none;
            position: relative;
            padding-left: 8px;  /* Reduced padding from 24px to 16px */
            line-height: 24px;   /* Match height of checkbox for vertical centering */
            gap: 4px;
        }
        .x-todo-box {
            position: absolute;
            left: -24px;            
            top: 50%;          
            transform: translateY(-50%);
        }
        .x-todo-box input[type="checkbox"] {
            position: relative;
            width: 20px;
            height: 20px;
            appearance: none;
            -webkit-appearance: none;
            border: 2px solid #651DFF;
            border-radius: 50%;
            outline: none;
            cursor: pointer;
            background-color: white;
            margin: 0;
            vertical-align: middle;
        }
        .x-todo-box input[type="checkbox"]:checked {
            background-color: #651DFF;
            position: relative;
        }
        .x-todo-box input[type="checkbox"]:checked:after {
            content: '';
            position: absolute;
            left: 5px;     
            top: 1px;
            width: 4px; 
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        blockquote{border-left: 6px solid #ddd;padding: 5px 0 5px 10px;margin: 15px 0 15px 15px;}
        hr{display: block;height: 0; border: 0;border-top: 1px solid #ccc; margin: 15px 0; padding: 0;}
        pre{padding: 10px 5px 10px 10px;margin: 15px 0;display: block;line-height: 18px;background: #F0F0F0;border-radius: 6px;font-size: 13px; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-display: optional; word-break: break-all; word-wrap: break-word;overflow-x: auto;}
        pre code {display: block;font-size: inherit;white-space: pre-wrap;color: inherit;}
    </style>
    `;
}

function createHTML(options = {}) {
    const {
        backgroundColor = '#FFF',
        color = '#000033',
        caretColor = '',
        placeholderColor = '#a9a9a9',
        contentCSSText = '',
        cssText = '',
        initialCSSText = '',
        pasteAsPlainText = false,
        pasteListener = false,
        keyDownListener = false,
        keyUpListener = false,
        inputListener = false,
        autoCapitalize = 'on',
        enterKeyHint = '',
        initialFocus = false,
        autoCorrect = true,
        defaultParagraphSeparator = 'div',
        // When first gaining focus, the cursor moves to the end of the text
        firstFocusEnd = true,
        useContainer = true,
    } = options;
    //ERROR: HTML height not 100%;
    return `
<!DOCTYPE html>
<html>
<head>
    <title>RN Rich Text Editor</title>
    <meta name="viewport" content="user-scalable=1.0,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'none';">
    <style>
        ${initialCSSText}
        * {outline: 0px solid transparent;-webkit-tap-highlight-color: rgba(0,0,0,0);-webkit-touch-callout: none;box-sizing: border-box;}
        html, body { margin: 0; padding: 0;font-family: Roboto, "Segoe UI", system-ui, Arial, sans-serif; font-size:1em; height: 100%; font-display: optional;}
        body { overflow-y: hidden; -webkit-overflow-scrolling: touch;background-color: ${backgroundColor};caret-color: ${caretColor};}
        .content {font-family: Roboto, "Segoe UI", system-ui, Arial, sans-serif;color: ${color}; width: 100%;${
        !useContainer ? 'height:100%;' : ''
    }-webkit-overflow-scrolling: touch;padding-left: 0;padding-right: 0;}
        .pell { height: 100%;} .pell-content { outline: 0; overflow-y: auto;padding: 10px 10px 80px 10px;height: 100%; transition: font-family 0.1s ease-out;${contentCSSText}}
        .image-options{
            display:none; 
            position:absolute; 
            bottom: -64px; 
            left: 0;            
            flex-direction:row; 
            height: 56; 
            background-color:white;
            justify-content:space-between; 
            padding: 8px;
            z-index: 999;
            max-width: 240px;
            border-radius: 5px;
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
        }
        .image-option-button{
            display: flex;
            flex-direction: column;
            background-color: transparent;
            border: none;
            justify-content: center;
            align-items: center;
        }
    </style>
    <style>
        [placeholder]:empty:before { content: attr(placeholder); color: ${placeholderColor};}
        [placeholder]:empty:focus:before { content: attr(placeholder);color: ${placeholderColor};display:block;}
    </style>
    ${getContentCSS()}
    <style>${cssText}</style>
</head>
<body>
<div class="content"><div id="editor" class="pell"/></div>
<script>
    var __DEV__ = !!${window.__DEV__};
    var _ = (function (exports) {
        var anchorNode, focusNode, anchorOffset, focusOffset, _focusCollapse = false, cNode;
        var _log = console.log;
        var placeholderColor = '${placeholderColor}';
        var _randomID = 99;
        var generateId = function (){
            return "auto_" + (++ _randomID);
        }
        let prevAttributes = [];
        let isProcessingSelectionChange = false;
        let prevCursorPosition = 0;

        var body = document.body, docEle = document.documentElement;
        var defaultParagraphSeparatorString = 'defaultParagraphSeparator';
        var formatBlock = 'formatBlock';
        var editor = null, editorFoucs = false, o_height = 0, compositionStatus = 0, paragraphStatus = 0, enterStatus = 0;
        function addEventListener(parent, type, listener) {
            return parent.addEventListener(type, listener);
        };
        function appendChild(parent, child) {
            return parent.appendChild(child);
        };
        function createElement(tag) {
            return document.createElement(tag);
        };
        function queryCommandState(command) {
            return document.queryCommandState(command);
        };
        function queryCommandValue(command) {
            return document.queryCommandValue(command);
        };
        function query(command){
            return document.querySelector(command);
        }
        function querys(command){
            return document.querySelectorAll(command);
        }

        function exec(command) {
            var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            return document.execCommand(command, false, value);
        };

        function asyncExec(command){
            var args = Array.prototype.slice.call(arguments);
            setTimeout(function(){
                exec.apply(null, args);
            }, 0);
        }

        function _postMessage(data){
            exports.window.postMessage(JSON.stringify(data));
        }
        function postAction(data){
            editor.content.contentEditable === 'true' && _postMessage(data);
        };

        exports.isRN && (
            console.log = function (){
                var data = Array.prototype.slice.call(arguments);
                __DEV__ && _log.apply(null, data);
                __DEV__ && postAction({type: 'LOG', data});
            }
        )

        function formatParagraph(async){
            (async ? asyncExec: exec)(formatBlock, '<' + editor.paragraphSeparator + '>' );
        }

        function getNodeByClass(node, className){
            return node ? (node.nodeType === Node.ELEMENT_NODE && node.classList.contains(className)? node : getNodeByClass(node.parentNode, className)): node;
        }

        function getNodeByName(node, name){
            return node? (node.nodeType === Node.ELEMENT_NODE && node.nodeName === name? node: getNodeByName(node.parentNode, name)): node;
        }

        function setCollapse(node){
            var selection = window.getSelection();
            selection.selectAllChildren(node);
            selection.collapseToEnd();
        }

        function checkboxNode(node){
            return getNodeByClass(node, 'x-todo');
        }

        function execCheckboxList(node, html) {
            var html = createCheckbox(node ? node.innerHTML : '');
            
            // If editor is empty, create first list directly
            if (!editor.content.textContent.trim()) {
                var HTML = "<ol class='x-todo'><li>" + html + "</li></ol>";
                editor.content.innerHTML = HTML;  // Set innerHTML directly
                setCollapse(editor.content.firstChild.firstChild);  // Set cursor in first li
                return;
            }
            
            // Rest of the existing logic for non-empty editor
            const existingList = getNodeByClass(window.getSelection().anchorNode, 'x-todo');
            if (existingList) {
                const newLi = createElement('li');
                newLi.innerHTML = html;
                const currentLi = getNodeByName(window.getSelection().anchorNode, 'LI');
                if (currentLi) {
                    existingList.insertBefore(newLi, currentLi.nextSibling);
                    setCollapse(newLi);
                }
            } else {
                var HTML = "<ol class='x-todo'><li>" + html + "</li></ol>";
                if (node) {
                    node.innerHTML = HTML;
                    setCollapse(node.firstChild);
                } else {
                    exec("insertHTML", HTML);
                }
            }
        }

        var _checkboxFlag = 0; // 1 = add checkbox; 2 = cancel checkbox
        function cancelCheckboxList(box){
            _checkboxFlag = 2;
            exec("execCheckboxList");
            setCollapse(box);
        }

        function createCheckbox(end) {
            var html = '<span contenteditable="false" class="x-todo-box"><input type="checkbox"></span>';
            if (end && typeof end !== 'boolean') {
                html += end;
            }
            // Only add <br/> if no content and not explicitly set to false
            if (!end && end !== false) {
                html += "\u200B"; // Add zero-width space instead of <br/>
            }
            return html;
        }

        function insertCheckbox (node){
            var li = getNodeByName(node, 'LI');
            li.insertBefore(document.createRange().createContextualFragment(createCheckbox(false)), li.firstChild);
            setCollapse(node);
        }

        function getCheckbox (node){
            return getNodeByClass(node, "x-todo-box");
        }

        function saveSelection(){
            var sel = window.getSelection();
            anchorNode = sel.anchorNode;
            anchorOffset = sel.anchorOffset;
            focusNode = sel.focusNode;
            focusOffset = sel.focusOffset;
        }

        function focusCurrent(){
            editor.content.focus();
            try {
                var selection = window.getSelection();
                if (anchorNode){
                    if (anchorNode !== selection.anchorNode && !selection.containsNode(anchorNode)){
                        _focusCollapse = true;
                        selection.collapse(anchorNode, anchorOffset);
                    }
                } else if(${firstFocusEnd} && !_focusCollapse ){
                    _focusCollapse = true;
                    selection.selectAllChildren(editor.content);
                    selection.collapseToEnd();
                }
            } catch(e){
                console.log(e)
            }
        }

        function hasAttributesChanged(currentAttributes) {
            return JSON.stringify(currentAttributes) !== JSON.stringify(prevAttributes);
        }

        function setAttributeOnCurrentSelection(attribute, value) {
            let selection = window.getSelection();
            let node = selection.anchorNode;
            let selectedText = selection.toString();

            if(selectedText.length > 0) {
                if(attribute === 'size') {
                    exec('fontSize', value);
                    return;
                } else if(attribute === 'face') {
                    exec('fontName', value);
                    return;
                }
            }

            if (node) {
                let targetElement = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                
                if (targetElement) {
                    if(editor.content.innerHTML.length > 0) {
                        appendToStyle(targetElement, attribute, value);
                        return targetElement.setAttribute(attribute, value);
                    }                    
                }
            }
        }

        function convertSizeToPixel(size) {
            switch (size) {
              case 1:
                return '10px';
              case 2:
                return '13px';
              case 3:
                return '16px';
              case 4:
                return '18px';
              case 5:
                return '24px';
              case 6:
                return '32px';
              case 7:
                return '48px';
              default:
                return '16px'; // Default size, you can change this as needed
            }
          }

          // (dpark) GENERATED by CHAT GPT
          function appendToStyle(targetElement, attribute, value) {
            let currentStyle = targetElement.getAttribute('style') || '';
            let styles = currentStyle.split(';').map(style => style.trim()).filter(style => style.length > 0);
            let styleMap = {};
          
            styles.forEach(style => {
              let [key, val] = style.split(':').map(part => part.trim());
              styleMap[key] = val;
            });
          
            if (attribute === 'size') {
              let sizeInPixels = convertSizeToPixel(value);
              styleMap['font-size'] = sizeInPixels;
            } else if (attribute === 'face') {
              // Properly quote font names that contain spaces
              const fontName = value.includes(' ') ? '"' + value + '"' : value;
              // Add system fallbacks after the custom font
              const systemFallbacks = ', Roboto, "Segoe UI", system-ui, Arial, sans-serif';
              styleMap['font-family'] = fontName + systemFallbacks;
              
              // Force a re-render to ensure the font is applied
              targetElement.style.fontFamily = '';
              setTimeout(() => {
                targetElement.style.fontFamily = fontName + systemFallbacks;
              }, 0);
            }
          
            let newStyle = Object.entries(styleMap).map(([key, val]) => key + ': ' + val).join('; ') + ';';
            targetElement.setAttribute('style', newStyle.trim());
          }

        function getAttributesAndPostMessage() {
            let selection = window.getSelection();
            let node = selection.anchorNode;
            let attributes = [];

            if (node) {
                let targetElement = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                if (targetElement.attributes) {
                    for (let attr of targetElement.attributes) {
                        attributes.push({name: attr.name, value: attr.value});
                    }
                    if(hasAttributesChanged(attributes)) {
                        prevAttributes = [...attributes];
                        _postMessage({type: 'ATTRIBUTE_CHANGED', data: attributes});

                        var html = Actions.content.getHtml();
                        postAction({type: 'CONTENT_CHANGE', data: html});
                    }
                }
            } 
        }

        function getCursorScrollPositionAndPostMessage() {
            let selection = window.getSelection();
            let range;
        
            // Check if there's a valid selection range
            if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
            } else {
                // If no range, create a new collapsed range at the current caret position
                range = document.createRange();
                if (selection.anchorNode) {
                    range.setStart(selection.anchorNode, selection.anchorOffset);
                    range.setEnd(selection.anchorNode, selection.anchorOffset);
                }
            }
        
            if (range) {
                // Create a temporary span element to insert at the range for measurement
                const tempSpan = document.createElement("span");
                tempSpan.textContent = "\u200B"; // Zero-width space character
                range.insertNode(tempSpan);
        
                // Get the bounding rectangle of the temporary span
                const rect = tempSpan.getBoundingClientRect();
                const cursorOffsetTop = rect.top + window.scrollY; // Adding window.scrollY to account for scroll position
        
                // Clean up the temporary span element and restore the range
                tempSpan.parentNode.removeChild(tempSpan);

                if(prevCursorPosition !== cursorOffsetTop) {
                    prevCursorPosition = cursorOffsetTop;
                    _postMessage({ type: 'CURSOR_POSITION', data: cursorOffsetTop });
                }
            }
        }

        function onSelectionChange() {
            if (isProcessingSelectionChange) {
                return;
            }
            isProcessingSelectionChange = true;
        
            try {
                getAttributesAndPostMessage();
                getCursorScrollPositionAndPostMessage();
            } finally {
                // Ensure the flag is reset after the operations
                setTimeout(() => {
                    isProcessingSelectionChange = false;
                }, 0);
            }
        }

        function handleCheckboxDelete(node) {
            if (checkboxNode(node)) {
                const list = getNodeByClass(node, 'x-todo');
                if (list) {
                    const p = createElement(editor.paragraphSeparator);
                    list.parentNode.replaceChild(p, list);
                    setCollapse(p);
                    return true;
                }
            }
            return false;
        }

        function toggleCheckboxList(checked) {
            const node = window.getSelection().anchorNode;
            const checkboxNode = getNodeByClass(node, 'x-todo');
            
            if (checkboxNode) {
                // Exit checkbox mode
                if (checkboxNode.textContent.trim() === '') {
                    handleCheckboxDelete(checkboxNode);
                    _checkboxFlag = 0;
                }
            } else {
                // Enter checkbox mode
                _checkboxFlag = 1;
                execCheckboxList(null);
            }
        }

        var _keyDown = false;
        function handleChange (event){
            var node = anchorNode;
            Actions.UPDATE_HEIGHT();
            Actions.UPDATE_OFFSET_Y();
            
            if (_keyDown) {
                // Handle checkbox deletion
                if (checkboxNode(node) && node.textContent.trim() === '') {
                    handleBackspaceInCheckbox({ target: node });
                    _checkboxFlag = 0;
                    return;
                }
                // Handle checkbox creation
                if (_checkboxFlag === 1 && checkboxNode(node)) {
                    _checkboxFlag = 0;
                    var sib = node.previousSibling;
                    if (!sib || sib.childNodes.length > 1) {
                        insertCheckbox(node);
                    }
                } 
                // Handle checkbox exit
                else if (checkboxNode(node) && node.textContent.trim() === '') {
                    if (enterStatus === 2) {
                        handleCheckboxDelete(node);
                        _checkboxFlag = 0;
                        enterStatus = 0;
                    }
                }
                // Handle new checkbox on enter
                else if (checkboxNode(node) && enterStatus === 1) {
                    enterStatus = 0;
                    execCheckboxList(null);
                }
            }
        }

        var Actions = {
            bold: { state: function() { return queryCommandState('bold'); }, result: function() { return exec('bold'); }},
            italic: { state: function() { return queryCommandState('italic'); }, result: function() { return exec('italic'); }},
            underline: { state: function() { return queryCommandState('underline'); }, result: function() { return exec('underline'); }},
            strikeThrough: { state: function() { return queryCommandState('strikeThrough'); }, result: function() { return exec('strikeThrough'); }},
            subscript: { state: function() { return queryCommandState('subscript'); }, result: function() { return exec('subscript'); }},
            superscript: { state: function() { return queryCommandState('superscript'); }, result: function() { return exec('superscript'); }},
            heading1: { state: function() { return queryCommandValue(formatBlock) === 'h1'; }, result: function() { return exec(formatBlock, '<h1>'); }},
            heading2: { state: function() { return queryCommandValue(formatBlock) === 'h2'; }, result: function() { return exec(formatBlock, '<h2>'); }},
            heading3: { state: function() { return queryCommandValue(formatBlock) === 'h3'; }, result: function() { return exec(formatBlock, '<h3>'); }},
            heading4: { state: function() { return queryCommandValue(formatBlock) === 'h4'; }, result: function() { return exec(formatBlock, '<h4>'); }},
            heading5: { state: function() { return queryCommandValue(formatBlock) === 'h5'; }, result: function() { return exec(formatBlock, '<h5>'); }},
            heading6: { state: function() { return queryCommandValue(formatBlock) === 'h6'; }, result: function() { return exec(formatBlock, '<h6>'); }},
            paragraph: { state: function() { return queryCommandValue(formatBlock) === 'p'; }, result: function() { return exec(formatBlock, '<p>'); }},
            quote: { result: function() { return exec(formatBlock, '<blockquote>'); }},
            removeFormat: { result: function() { return exec('removeFormat'); }},
            orderedList: {
                state: function() { return !checkboxNode(window.getSelection().anchorNode) && queryCommandState('insertOrderedList'); },
                result: function() { if (!!checkboxNode(window.getSelection().anchorNode)) return;return exec('insertOrderedList'); }
            },
            unorderedList: {
                state: function() { return queryCommandState('insertUnorderedList');},
                result: function() { if (!!checkboxNode(window.getSelection().anchorNode)) return; return exec('insertUnorderedList');}
            },
            code: { result: function(type) {
                var flag = exec(formatBlock, '<pre>');
                var node = anchorNode.nodeName === "PRE" ? anchorNode: anchorNode.parentNode;
                if (node.nodeName === 'PRE'){
                    type && node.setAttribute("type", type);
                    node.innerHTML = "<code type='"+(type || '') +"'>" + node.innerHTML + "</code>";
                    // var br = createElement("br");
                    // node.parentNode.insertBefore(br, node.nextSibling);
                    setTimeout(function (){
                        setCollapse(node.firstChild);
                    });
                }
                return flag;
             }},
            line: { result: function() { return exec('insertHorizontalRule'); }},
            redo: { result: function() { return exec('redo'); }},
            undo: { result: function() { return exec('undo'); }},
            indent: { result: function() { return exec('indent'); }},
            outdent: { result: function() { return exec('outdent'); }},
            outdent: { result: function() { return exec('outdent'); }},
            justifyCenter: {  state: function() { return queryCommandState('justifyCenter'); }, result: function() { return exec('justifyCenter'); }},
            justifyLeft: { state: function() { return queryCommandState('justifyLeft'); }, result: function() { return exec('justifyLeft'); }},
            justifyRight: { state: function() { return queryCommandState('justifyRight'); }, result: function() { return exec('justifyRight'); }},
            justifyFull: { state: function() { return queryCommandState('justifyFull'); }, result: function() { return exec('justifyFull'); }},
            hiliteColor: {  state: function() { return queryCommandState('hiliteColor'); }, result: function(color) { return exec('hiliteColor', color); }},
            foreColor: { state: function() { return queryCommandState('foreColor'); }, result: function(color) { return exec('foreColor', color); }},
            fontSize: { result: function(size) { 
                setAttributeOnCurrentSelection('size', size);
                return getAttributesAndPostMessage();
            }},
            fontName: { result: function(name) { 
                setAttributeOnCurrentSelection('face', name);
                return getAttributesAndPostMessage();
            }},
            link: {
                result: function(data) {
                    data = data || {};
                    var title = data.title;
                    title = title || window.getSelection().toString();
                    // title = title || window.prompt('Enter the link title');
                    var url = data.url || window.prompt('Enter the link URL');
                    if (url){
                        exec('insertHTML', "<a href='"+ url +"'>"+(title || url)+"</a>");
                    }
                }
            },
            image: {
                result: function(url, style) {
                    if (url){
                        exec('insertHTML', "<img style='"+ (style || '')+"' src='"+ url +"'/>");
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            html: {
                result: function (html){
                    if (html){
                        exec('insertHTML', html);
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            text: { result: function (text){ text && exec('insertText', text); }},
            video: {
                result: function(url, style) {
                    if (url) {
                        var thumbnail = url.replace(/.(mp4|m3u8)/g, '') + '-thumbnail';
                        var html = "<br><div style='"+ (style || '')+"'><video src='"+ url +"' poster='"+ thumbnail + "' controls><source src='"+ url +"' type='video/mp4'>No video tag support</video></div><br>";
                        exec('insertHTML', html);
                        Actions.UPDATE_HEIGHT();
                    }
                }
            },
            checkboxList: {
                state: function() {
                    const node = window.getSelection().anchorNode;
                    return !!getNodeByClass(node, 'x-todo');
                },
                result: function() {
                    const node = window.getSelection().anchorNode;
                    const listNode = getNodeByClass(node, 'x-todo');
                    
                    if (listNode) {
                        // If we're already in a checkbox list and it's empty, convert to normal paragraph
                        if (listNode.textContent.trim() === '') {
                            const p = createElement('p');
                            listNode.parentNode.replaceChild(p, listNode);
                            setCollapse(p);
                        } else {
                            // Otherwise, just toggle the checkbox
                            execCheckboxList();
                        }
                    } else {
                        // Create new checkbox list
                        execCheckboxList();
                    }
                }
            },
            content: {
                setDisable: function(dis){ this.blur(); editor.content.contentEditable = !dis},
                setHtml: function(html) { editor.content.innerHTML = html; Actions.UPDATE_HEIGHT(); },
                getHtml: function() { return editor.content.innerHTML; },
                blur: function() { editor.content.blur(); },
                focus: function() { focusCurrent(); },
                postHtml: function (){ postAction({type: 'CONTENT_HTML_RESPONSE', data: editor.content.innerHTML}); },
                setPlaceholder: function(placeholder){ editor.content.setAttribute("placeholder", placeholder) },

                setContentStyle: function(styles) {
                    styles = styles || {};
                    var bgColor = styles.backgroundColor, color = styles.color, pColor = styles.placeholderColor;
                    if (bgColor && bgColor !== body.style.backgroundColor) body.style.backgroundColor = bgColor;
                    if (color && color !== editor.content.style.color) editor.content.style.color = color;
                    if (pColor && pColor !== placeholderColor){
                        var rule1="[placeholder]:empty:before {content:attr(placeholder);color:"+pColor+";}";
                        var rule2="[placeholder]:empty:focus:before{content:attr(placeholder);color:"+pColor+";}";
                        try {
                            document.styleSheets[1].deleteRule(0);document.styleSheets[1].deleteRule(0);
                            document.styleSheets[1].insertRule(rule1); document.styleSheets[1].insertRule(rule2);
                            placeholderColor = pColor;
                        } catch (e){
                            console.log("set placeholderColor error!")
                        }
                    }
                },

                commandDOM: function (command){
                    try {new Function("$", command)(exports.document.querySelector.bind(exports.document))} catch(e){console.log(e.message)};
                },
                command: function (command){
                    try {new Function("$", command)(exports.document)} catch(e){console.log(e.message)};
                }
            },

            init: function (){
                if (${useContainer}){
                    // setInterval(Actions.UPDATE_HEIGHT, 150);
                    Actions.UPDATE_HEIGHT();
                } else {
                    // react-native-webview There is a bug in the body and html height setting of a certain version of 100%
                    // body.style.height = docEle.clientHeight + 'px';
                }
            },

            UPDATE_HEIGHT: function() {
                if (!${useContainer}) return;
                // var height = Math.max(docEle.scrollHeight, body.scrollHeight);
                var height = editor.content.scrollHeight;
                if (o_height !== height){
                    _postMessage({type: 'OFFSET_HEIGHT', data: o_height = height});
                }
            },

            UPDATE_OFFSET_Y: function (){
                if (!${useContainer}) return;
                var node = anchorNode || window.getSelection().anchorNode;
                var sel = window.getSelection();
                if (node){
                    var siblingOffset = (node.nextSibling && node.nextSibling.offsetTop) || (node.previousSibling && node.previousSibling.offsetTop)
                    var offsetY = node.offsetTop || siblingOffset || node.parentNode.offsetTop;
                    if (offsetY){
                        _postMessage({type: 'OFFSET_Y', data: offsetY});
                    }
                }
            }
        };

        var init = function init(settings) {

            var paragraphSeparator = settings[defaultParagraphSeparatorString];
            var content = settings.element.content = createElement('div');
            content.id = 'content';
            content.contentEditable = true;
            content.spellcheck = false;
            content.autofocus = ${initialFocus};
            content.enterKeyHint = '${enterKeyHint}';
            content.autocapitalize = '${autoCapitalize}';
            content.autocorrect = ${autoCorrect};
            content.autocomplete = 'off';
            content.className = "pell-content";
            content.oninput = function (_ref) {
                // var firstChild = _ref.target.firstChild;
                if ((anchorNode === void 0 || anchorNode === content) && queryCommandValue(formatBlock) === ''){
                    if ( !compositionStatus ){
                        formatParagraph(true);
                        paragraphStatus = 0;
                    } else {
                        paragraphStatus = 1;
                    }
                } else if (content.innerHTML === '<br>'){
                     content.innerHTML = '';
                } else if (enterStatus && queryCommandValue(formatBlock) === 'blockquote') {
                    formatParagraph();
                }
                saveSelection();
                handleChange(_ref);
                settings.onChange();
                ${inputListener} && postAction({type: "ON_INPUT", data: {inputType: _ref.inputType, data: _ref.data}});
            };
            
            appendChild(settings.element, content);

            if (settings.styleWithCSS) exec('styleWithCSS');
            exec(defaultParagraphSeparatorString, paragraphSeparator);

            var actionsHandler = [];
            for (var k in Actions){
                if (typeof Actions[k] === 'object' && Actions[k].state){
                    actionsHandler[k] = Actions[k]
                }
            }

            function handler() {
                var activeTools = [];
                for(var k in actionsHandler){
                    if ( Actions[k].state() ){
                        activeTools.push(k);
                    }
                }
                postAction({type: 'SELECTION_CHANGE', data: activeTools});
            };

            var _handleStateDT = null;
            function handleState(){
                clearTimeout(_handleStateDT);
                _handleStateDT = setTimeout(function (){
                    handler();
                    saveSelection();
                }, 50);
            }

            function handleSelecting(event){
                event.stopPropagation();
                handleState();
            }

            function postKeyAction(event, type){
                postAction({type: type, data: {keyCode: event.keyCode, key: event.key}});
            }
            function handleKeyup(event){
                enterStatus = 0;
                _keyDown = false;
                if (event.keyCode === 8) handleSelecting (event);
                ${keyUpListener} && postKeyAction(event, "CONTENT_KEYUP")
            }
            function handleEnterInCheckbox(event) {
                const node = window.getSelection().anchorNode;
                const listNode = getNodeByClass(node, 'x-todo');

                if (listNode) {
                    const checkboxSpan = getNodeByClass(node, 'x-todo-box');
                    const textContent = node.textContent.replace(/\u200B/g, '').trim();

                    if (textContent === '') {
                        event.preventDefault();
                        
                        // Create a new div for the next line
                        const newDiv = createElement(editor.paragraphSeparator);
                        newDiv.innerHTML = '<br>';  // Add br to make div visible
                        
                        // Get the parent list to know where to insert the div
                        const list = getNodeByClass(node, 'x-todo');
                        
                        // Insert the new div after the list
                        if (list && list.parentNode) {
                            list.parentNode.insertBefore(newDiv, list.nextSibling);
                        }
                        
                        // Remove the empty checkbox
                        handleBackspaceInCheckbox(event);
                        
                        // Set cursor to the new div
                        setCollapse(newDiv);
                        
                        enterStatus = 0;
                        return true;
                    } else {
                        // Create new checkbox item
                        event.preventDefault();
                        execCheckboxList(null);
                        enterStatus = 0;
                        return true;
                    }
                }
                return false;
            }

            function handleBackspaceInCheckbox(event) {
                const node = window.getSelection().anchorNode;
                const listItem = getNodeByName(node, 'LI'); // Get the current LI element
                const list = getNodeByClass(node, 'x-todo'); // Get the parent list
                
                if (list) {
                    if (listItem) {
                        if (list.children.length > 1) {
                            // Get the previous list item before removing current one
                            const prevListItem = listItem.previousElementSibling || listItem.nextElementSibling;
                            
                            // Remove current list item
                            list.removeChild(listItem);
                            
                            // Set cursor to end of previous list item's content
                            if (prevListItem) {
                                setCollapse(prevListItem);
                            }
                        } else {
                            // If this is the last item, replace the whole list with a paragraph
                            const p = createElement(editor.paragraphSeparator);
                            list.parentNode.replaceChild(p, list);
                            setCollapse(p);
                        }
                        _checkboxFlag = 0;
                        return true;
                    }
                }
                return false;
            }

            function handleKeydown(event){
                _keyDown = true;
                handleState();
                if (event.key === 'Enter'){
                    if (handleEnterInCheckbox(event)) {
                        return;
                    }
                    enterStatus = 1; // set enter true
                    var box;
                    var block = queryCommandValue(formatBlock);
                    if (anchorNode.innerHTML === '<br>' && anchorNode.parentNode !== editor.content){
                        // setCollapse(editor.content);
                    } else if (queryCommandState('insertOrderedList') && !!(box = checkboxNode(anchorNode))){
                        var node = anchorNode && anchorNode.childNodes[1];
                        if (node && node.nodeName === 'BR'){
                            cancelCheckboxList(box.parentNode);
                            event.preventDefault();
                        } else{
                            // add checkbox
                            _checkboxFlag = 1;
                        }
                    }
                    if (block === 'pre' && anchorNode.innerHTML === '<br>'){
                        // code end enter new line (Unfinished)
                        if (!anchorNode.nextSibling){
                            event.preventDefault();
                            var node = anchorNode.parentNode;
                            var br = createElement("br");
                            node.parentNode.insertBefore(br, node.nextSibling);
                            setTimeout(function (){
                                setCollapse(br);
                            });
                        }
                    }
                } else if (event.key === 'Backspace') {
                    // Get the current selection
                    const selection = window.getSelection();
                    const node = selection.anchorNode;
                    
                    // Check if we're in a checkbox item
                    if (checkboxNode(node)) {
                        const checkboxSpan = getNodeByClass(node, 'x-todo-box');
                        const textContent = node.textContent.replace(/\u200B/g, '').trim();
                        
                        // Create a range from the start of the node to the cursor
                        const range = document.createRange();
                        range.setStart(node, 0);
                        range.setEnd(selection.anchorNode, selection.anchorOffset);

                        // Get the text before cursor, excluding the checkbox
                        const textBeforeCursor = range.toString().replace(/\u200B/g, '').trim();
                        
                        // If there's no text before cursor (except checkbox), we're right after checkbox
                        const isAfterCheckbox = !textBeforeCursor;
                        
                        if (isAfterCheckbox) {
                            if (textContent !== '') {
                                // Prevent deletion if there's text content
                                event.preventDefault();
                                return;
                            } else {
                                // Delete empty checkbox immediately
                                event.preventDefault();
                                handleBackspaceInCheckbox(event);
                                return;
                            }
                        } 
                    }
                }
                ${keyDownListener} && postKeyAction(event, "CONTENT_KEYDOWN");
            }
            function handleFocus (){
                editorFoucs = true;
                setTimeout(function (){
                    Actions.UPDATE_OFFSET_Y();
                });
                postAction({type: 'CONTENT_FOCUSED'});
            }
            function handleBlur (){
                editorFoucs = false;
                postAction({type: 'SELECTION_CHANGE', data: []});
                postAction({type: 'CONTENT_BLUR'});
            }
            function handleClick(event){
                var ele = event.target;
                if (ele.nodeName === 'INPUT' && ele.type === 'checkbox'){
                    // Set whether the checkbox is selected by default
                    if (ele.checked) ele.setAttribute('checked', '');
                    else ele.removeAttribute('checked');
                }
                // Handle image clicks for fullscreen
                if (ele.nodeName === 'IMG') {
                    postAction({
                        type: 'IMAGE_CLICKED', 
                        data: {
                            src: ele.getAttribute('src'),
                            width: ele.naturalWidth,
                            height: ele.naturalHeight
                        }
                    });
                }
                postAction({type: 'CONTENT_CLICK'});
            }
            addEventListener(content, 'touchcancel', handleSelecting);
            addEventListener(content, 'mouseup', handleSelecting);
            addEventListener(content, 'touchend', handleSelecting);
            addEventListener(content, 'keyup', handleKeyup);
            addEventListener(content, 'click', handleClick);
            addEventListener(content, 'keydown', handleKeydown);
            addEventListener(content, 'blur', handleBlur);
            addEventListener(content, 'focus', handleFocus);
            addEventListener(content, 'paste', function (e) {
                // get text representation of clipboard
                var text = (e.originalEvent || e).clipboardData.getData('text/plain');

                ${pasteListener} && postAction({type: 'CONTENT_PASTED', data: text});
                if (${pasteAsPlainText}) {
                    // cancel paste
                    e.preventDefault();
                    // insert text manually
                    exec("insertText", text);
                }
            });
            addEventListener(content, 'compositionstart', function(event){
                compositionStatus = 1;
            })
            addEventListener(content, 'compositionend', function (event){
                compositionStatus = 0;
                
                // Only format paragraph if we're not in a checkbox list
                const node = window.getSelection().anchorNode;
                const inCheckbox = checkboxNode(node);
                
                if (paragraphStatus && !inCheckbox) {
                    formatParagraph(true);
                }
            })

            document.addEventListener('selectionchange', onSelectionChange);

            var message = function (event){
                var msgData = JSON.parse(event.data), action = Actions[msgData.type];
                if (action ){
                    if ( action[msgData.name]){
                        var flag = msgData.name === 'result';
                        // insert image or link need current focus
                        flag && focusCurrent();
                        action[msgData.name](msgData.data, msgData.options);
                        flag && handleState();
                    } else {
                        action(msgData.data, msgData.options);
                    }
                }
            };
            document.addEventListener("message", message , false);
            window.addEventListener("message", message , false);
            document.addEventListener('mouseup', function (event) {
                event.preventDefault();
                Actions.content.focus();
                handleSelecting(event);
            });
            return {content, paragraphSeparator: paragraphSeparator};
        };

        var _handleCTime = null;
        editor = init({
            element: document.getElementById('editor'),
            defaultParagraphSeparator: '${defaultParagraphSeparator}',
            onChange: function (){
                clearTimeout(_handleCTime);
                _handleCTime = setTimeout(function(){
                    var html = Actions.content.getHtml();
                    postAction({type: 'CONTENT_CHANGE', data: html});
                }, 50);
            }
        })
        return {
            sendEvent: function (type, data){
                event.preventDefault();
                event.stopPropagation();
                var id = event.currentTarget.id;
                if ( !id ) event.currentTarget.id = id = generateId();
                _postMessage({type, id, data});
            }
        }
    })({
        window: window.ReactNativeWebView || window.parent,
        isRN: !!window.ReactNativeWebView ,
        document: document
    });
    
    // $(document).ready(function() {
    //     $(document).on('click', '.custom-image', function() {
    //         // Your code here
    //         console.log('jquery: image clicked', $(this).siblings('image-options'));
    //         $(this).siblings('.image-options').css('display', function(_, current) {
    //             console.log(current);
    //             return current === 'none' ? 'flex' : 'none';
    //         });
    //     });
    // });
   
</script>
</body>
</html>
`;
}

const HTML = createHTML();
export {HTML, createHTML, getContentCSS};
