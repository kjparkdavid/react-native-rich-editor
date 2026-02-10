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
        var isRestoringFocus = false;
        var _contentLimitReached = false;
        let prevCursorPosition = 0;

        var body = document.body, docEle = document.documentElement;
        var defaultParagraphSeparatorString = 'defaultParagraphSeparator';
        var formatBlock = 'formatBlock';
        var editor = null, editorFoucs = false, o_height = 0, compositionStatus = 0, paragraphStatus = 0, enterStatus = 0;
        var isComposingOnIOS = false; // Track iOS-specific composition state
        var compositionEndTimeout = null; // Debounce composition end events
        var compositionSafetyTimeout = null; // Safety timeout to reset composition state
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
            if (sel.anchorNode && editor.content.contains(sel.anchorNode)) {
                anchorNode = sel.anchorNode;
                anchorOffset = sel.anchorOffset;
                focusNode = sel.focusNode;
                focusOffset = sel.focusOffset;
            }
        }

        function focusCurrent(){
            isRestoringFocus = true;
            editor.content.focus();
            try {
                var selection = window.getSelection();
                if (anchorNode){
                    if (!editor.content.contains(anchorNode)) {
                        // Saved node was removed from DOM, fall back to end of content
                        anchorNode = null;
                        selection.selectAllChildren(editor.content);
                        selection.collapseToEnd();
                    } else if (anchorNode !== selection.anchorNode && !selection.containsNode(anchorNode)){
                        _focusCollapse = true;
                        selection.collapse(anchorNode, anchorOffset);
                    }
                } else if(${firstFocusEnd} && !_focusCollapse ){
                    _focusCollapse = true;
                    selection.selectAllChildren(editor.content);
                    selection.collapseToEnd();
                }
            } catch(e){
                console.log(e);
                // Ensure we always have a valid selection
                try {
                    var sel = window.getSelection();
                    if (!sel.rangeCount) {
                        sel.selectAllChildren(editor.content);
                        sel.collapseToEnd();
                    }
                } catch(e2) {}
            }
            setTimeout(function(){ isRestoringFocus = false; }, 0);
        }

        function hasAttributesChanged(currentAttributes) {
            return JSON.stringify(currentAttributes) !== JSON.stringify(prevAttributes);
        }

        function setAttributeOnCurrentSelection(attribute, value) {
            let selection = window.getSelection();
            let node = selection.anchorNode;

            // Fall back to saved position when selection is broken (e.g. modal overlay)
            if (!node || !editor.content.contains(node)) {
                node = anchorNode;
            }

            let selectedText = selection.toString();

            if(selectedText.length > 0 && !selection.isCollapsed) {
                if(attribute === 'size') {
                    exec('fontSize', value);
                    return;
                } else if(attribute === 'face') {
                    exec('fontName', value);
                    return;
                } else if(attribute === 'color') {
                    exec('foreColor', value);
                    return;
                }
            }

            // No selection: use ZWSP technique to apply formatting to future typed text
            var fontEl;
            var cssProperty = attribute === 'size' ? 'font-size' : attribute === 'face' ? 'font-family' : 'color';
            var cssValue = attribute === 'size' ? convertSizeToPixel(parseInt(value)) : value;

            // Empty editor: create a font element with ZWSP and replace content
            if (!editor.content.textContent.trim()) {
                fontEl = document.createElement('font');
                fontEl.setAttribute(attribute, value);
                fontEl.style[cssProperty] = cssValue;
                fontEl.textContent = '\u200B';
                var p = document.createElement(editor.paragraphSeparator);
                p.appendChild(fontEl);
                editor.content.innerHTML = '';
                editor.content.appendChild(p);
                anchorNode = fontEl.firstChild;
                anchorOffset = 1;
                try {
                    var range = document.createRange();
                    range.setStart(fontEl.firstChild, 1);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch(e) {}
                cleanEmptyFontsInParagraph(fontEl);
                return;
            }

            // Check if cursor is inside a <font> with no real text content
            // (ZWSP, NBSP, <br>, whitespace are all considered "not real")
            var existingFont = getNodeByName(node, 'FONT');
            var isExistingFontEmpty = existingFont && !existingFont.textContent.replace(/[\u200B\u00A0\uFEFF]/g, '').trim();

            if (isExistingFontEmpty) {
                existingFont.setAttribute(attribute, value);
                appendToStyle(existingFont, attribute, value);
                // Save position inside the modified font
                var textChild = existingFont.firstChild;
                while (textChild && textChild.nodeType !== Node.TEXT_NODE) {
                    textChild = textChild.firstChild || textChild.nextSibling;
                }
                if (textChild) {
                    anchorNode = textChild;
                    anchorOffset = textChild.length;
                }
                cleanEmptyFontsInParagraph(existingFont);
                getAttributesAndPostMessage();
                return;
            }

            // If selection has no range, try to create one from saved position
            if (selection.rangeCount === 0 && node && editor.content.contains(node)) {
                try {
                    var maxOff = node.nodeType === Node.TEXT_NODE ? node.length : node.childNodes.length;
                    var r = document.createRange();
                    r.setStart(node, Math.min(anchorOffset || 0, maxOff));
                    r.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(r);
                } catch(e) {}
            }

            // Normal case: insert a new <font> element with ZWSP at cursor position
            if (selection.rangeCount > 0) {
                fontEl = document.createElement('font');
                fontEl.setAttribute(attribute, value);
                fontEl.style[cssProperty] = cssValue;
                fontEl.textContent = '\u200B';
                var curRange = selection.getRangeAt(0);
                curRange.collapse(false);
                curRange.insertNode(fontEl);

                // If fontEl is inside a parent <font> that has the same attribute
                // (e.g. font-size, color), split it out so the new formatting
                // is at the same level and cursor stability is preserved
                var splitParent = fontEl.parentNode;
                if (splitParent && splitParent.nodeName === 'FONT' && (splitParent.style.fontSize || splitParent.hasAttribute(attribute))) {
                    var afterNodes = [];
                    var nextSib = fontEl.nextSibling;
                    while (nextSib) {
                        afterNodes.push(nextSib);
                        nextSib = nextSib.nextSibling;
                    }
                    splitParent.parentNode.insertBefore(fontEl, splitParent.nextSibling);
                    if (afterNodes.length > 0) {
                        var tailFont = splitParent.cloneNode(false);
                        for (var j = 0; j < afterNodes.length; j++) {
                            tailFont.appendChild(afterNodes[j]);
                        }
                        fontEl.parentNode.insertBefore(tailFont, fontEl.nextSibling);
                    }
                    // Inherit attributes (e.g. face) from parent that fontEl doesn't have
                    for (var j = 0; j < splitParent.attributes.length; j++) {
                        var pa = splitParent.attributes[j];
                        if (pa.name !== 'style' && !fontEl.hasAttribute(pa.name)) {
                            fontEl.setAttribute(pa.name, pa.value);
                            appendToStyle(fontEl, pa.name, pa.value);
                        }
                    }
                }

                // Save position directly (addRange may fail if editor lacks native focus)
                anchorNode = fontEl.firstChild;
                anchorOffset = 1;
                try {
                    var newRange = document.createRange();
                    newRange.setStart(fontEl.firstChild, 1);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch(e) {}
                cleanEmptyFontsInParagraph(fontEl);
            } else if (node && editor.content.contains(node)) {
                // Selection API completely broken — insert font via direct DOM manipulation
                fontEl = document.createElement('font');
                fontEl.setAttribute(attribute, value);
                fontEl.style[cssProperty] = cssValue;
                fontEl.textContent = '\u200B';
                if (node.nodeType === Node.TEXT_NODE) {
                    var off = Math.min(anchorOffset || 0, node.length);
                    if (off < node.length) {
                        node.splitText(off);
                    }
                    node.parentNode.insertBefore(fontEl, node.nextSibling);
                } else {
                    var childOff = Math.min(anchorOffset || 0, node.childNodes.length);
                    if (childOff < node.childNodes.length) {
                        node.insertBefore(fontEl, node.childNodes[childOff]);
                    } else {
                        node.appendChild(fontEl);
                    }
                }
                anchorNode = fontEl.firstChild;
                anchorOffset = 1;
                cleanEmptyFontsInParagraph(fontEl);
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

        function stripFontZWSP(html) {
            var temp = document.createElement('div');
            temp.innerHTML = html;
            var fonts = temp.querySelectorAll('font');
            for (var i = 0; i < fonts.length; i++) {
                var walker = document.createTreeWalker(fonts[i], NodeFilter.SHOW_TEXT);
                var textNode;
                while (textNode = walker.nextNode()) {
                    if (textNode.textContent.indexOf('\u200B') !== -1) {
                        textNode.textContent = textNode.textContent.replace(/\u200B/g, '');
                    }
                }
                if (!fonts[i].textContent && !fonts[i].querySelector('br')) {
                    fonts[i].parentNode.removeChild(fonts[i]);
                }
            }
            return temp.innerHTML;
        }

        function cleanEmptyFontsInParagraph(keepFont) {
            // Walk up to nearest block-level ancestor
            var paragraph = keepFont.parentNode;
            while (paragraph && paragraph.nodeName !== 'DIV' && paragraph.nodeName !== 'P') {
                paragraph = paragraph.parentNode;
            }
            if (!paragraph) return;
            var childFonts = paragraph.querySelectorAll('font');
            for (var i = childFonts.length - 1; i >= 0; i--) {
                var cf = childFonts[i];
                if (cf === keepFont || cf.contains(keepFont)) continue;
                if (!cf.textContent.replace(/[\u200B\u00A0\uFEFF]/g, '').trim() && !cf.querySelector('br')) {
                    cf.parentNode.removeChild(cf);
                }
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
            } else if (attribute === 'color') {
              styleMap['color'] = value;
            }
          
            let newStyle = Object.entries(styleMap).map(([key, val]) => key + ': ' + val).join('; ') + ';';
            targetElement.setAttribute('style', newStyle.trim());
          }

        function getAttributesAndPostMessage() {
            let selection = window.getSelection();
            let node = selection.anchorNode;
            if (!node || !editor.content.contains(node)) {
                node = anchorNode;
            }
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
                // Remove orphaned ZWSP-only font placeholders when cursor moves away
                var allFonts = editor.content.querySelectorAll('font');
                var sel = window.getSelection();
                if (sel.anchorNode && !isRestoringFocus) {
                    for (var i = 0; i < allFonts.length; i++) {
                        var f = allFonts[i];
                        if (f.textContent === '\u200B' && !f.contains(sel.anchorNode)) {
                            f.parentNode.removeChild(f);
                        }
                    }
                }
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
            foreColor: { state: function() { return queryCommandState('foreColor'); }, result: function(color) {
                setAttributeOnCurrentSelection('color', color);
                return getAttributesAndPostMessage();
            }},
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
                getHtml: function() { return stripFontZWSP(editor.content.innerHTML); },
                blur: function() { editor.content.blur(); },
                focus: function() { focusCurrent(); },
                postHtml: function (){ postAction({type: 'CONTENT_HTML_RESPONSE', data: stripFontZWSP(editor.content.innerHTML)}); },
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
                // Normal input processing
                
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
                // Clean up ZWSP from font placeholders once user has typed real text
                var sel = window.getSelection();
                if (sel.anchorNode && sel.anchorNode.nodeType === Node.TEXT_NODE) {
                    var textNode = sel.anchorNode;
                    if (textNode.textContent.length > 1 && textNode.textContent.indexOf('\u200B') !== -1) {
                        var curOffset = sel.anchorOffset;
                        var before = textNode.textContent.substring(0, curOffset);
                        var after = textNode.textContent.substring(curOffset);
                        var zwspCountBefore = (before.match(/\u200B/g) || []).length;
                        textNode.textContent = textNode.textContent.replace(/\u200B/g, '');
                        // Restore cursor position adjusted for removed ZWSPs
                        var newSel = window.getSelection();
                        var newRange = document.createRange();
                        newRange.setStart(textNode, Math.max(0, curOffset - zwspCountBefore));
                        newRange.collapse(true);
                        newSel.removeAllRanges();
                        newSel.addRange(newRange);
                    }
                }
                // Clean stale empty font siblings that inflate line height
                var currentNode = sel.anchorNode;
                var currentFont = currentNode ? getNodeByName(
                    currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentNode : currentNode,
                    'FONT'
                ) : null;
                if (currentFont) {
                    cleanEmptyFontsInParagraph(currentFont);
                }
                handleChange(_ref);
                // Allow normal onChange flow
                settings.onChange();
                ${inputListener} && postAction({type: "ON_INPUT", data: {inputType: _ref.inputType, data: _ref.data}});
            };

            content.addEventListener('beforeinput', function(e) {
                if (_contentLimitReached && e.inputType && e.inputType.startsWith('insert')) {
                    e.preventDefault();
                }
            });

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
                
                // Send message to deselect stickers for general WebView content clicks
                // This replaces the problematic onStartShouldSetResponder approach
                var shouldDeselectStickers = true;
                
                // Check if click is on special elements that shouldn't trigger deselection
                if (ele.classList && (
                    ele.classList.contains('sticker') ||
                    ele.classList.contains('sticker-control') ||
                    ele.hasAttribute('data-preserve-selection')
                )) {
                    shouldDeselectStickers = false;
                }
                
                if (shouldDeselectStickers) {
                    postAction({type: 'WEBVIEW_DESELECT_STICKERS'});
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
                // Set iOS-specific composition flag
                if (window.navigator.platform && (window.navigator.platform.includes('iPhone') || window.navigator.platform.includes('iPad'))) {
                    isComposingOnIOS = true;
                    
                    // Clear any existing safety timeout
                    if (compositionSafetyTimeout) {
                        clearTimeout(compositionSafetyTimeout);
                    }
                    
                    // Safety timeout to reset composition state after 5 seconds
                    compositionSafetyTimeout = setTimeout(function() {
                        isComposingOnIOS = false;
                        compositionSafetyTimeout = null;
                    }, 5000);
                }
            })
            addEventListener(content, 'compositionend', function (event){
                compositionStatus = 0;
                
                // Clear iOS composition timeout if it exists
                if (compositionEndTimeout) {
                    clearTimeout(compositionEndTimeout);
                }
                
                // Clear safety timeout since composition is ending properly
                if (compositionSafetyTimeout) {
                    clearTimeout(compositionSafetyTimeout);
                    compositionSafetyTimeout = null;
                }
                
                // Debounce composition end processing on iOS to prevent duplicates
                if (window.navigator.platform && (window.navigator.platform.includes('iPhone') || window.navigator.platform.includes('iPad'))) {
                    compositionEndTimeout = setTimeout(function() {
                        isComposingOnIOS = false;
                        
                        // Only format paragraph if we're not in a checkbox list
                        const node = window.getSelection().anchorNode;
                        const inCheckbox = checkboxNode(node);
                        
                        if (paragraphStatus && !inCheckbox) {
                            formatParagraph(true);
                        }
                        compositionEndTimeout = null;
                    }, 100); // 100ms debounce
                } else {
                    // Non-iOS: immediate processing
                    const node = window.getSelection().anchorNode;
                    const inCheckbox = checkboxNode(node);
                    
                    if (paragraphStatus && !inCheckbox) {
                        formatParagraph(true);
                    }
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
                // String similarity calculation using Levenshtein distance
                function calculateStringSimilarity(str1, str2) {
                    var len1 = str1.length;
                    var len2 = str2.length;
                    var matrix = [];

                    // Create matrix
                    for (var i = 0; i <= len1; i++) {
                        matrix[i] = [];
                        matrix[i][0] = i;
                    }
                    for (var j = 0; j <= len2; j++) {
                        matrix[0][j] = j;
                    }

                    // Fill matrix
                    for (var i = 1; i <= len1; i++) {
                        for (var j = 1; j <= len2; j++) {
                            var cost = (str1.charAt(i - 1) === str2.charAt(j - 1)) ? 0 : 1;
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j] + 1,      // deletion
                                matrix[i][j - 1] + 1,      // insertion
                                matrix[i - 1][j - 1] + cost // substitution
                            );
                        }
                    }

                    var distance = matrix[len1][len2];
                    var maxLength = Math.max(len1, len2);
                    return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
                }

                _handleCTime = setTimeout(function(){
                    var html = Actions.content.getHtml();
                    
                    // iOS voice dictation duplicate content fix
                    var platform = window.navigator.platform;
                    var isIOSDevice = platform && (platform.includes('iPhone') || platform.includes('iPad'));
                    
                    // DISABLED: iOS voice dictation duplicate content fix
                    if (false && isIOSDevice) {
                        // Only do cursor restoration if we're in the middle of composition AND 
                        // this isn't a user-initiated cursor change
                        var shouldRestoreCursor = isComposingOnIOS;
                        
                        var needsUpdate = false;
                        var tempDiv = document.createElement('div');
                        tempDiv.innerHTML = html;
                        var fixedDivs = []; // Track which divs we actually fixed
                        
                        // Check each div element for internal duplication
                        var divElements = tempDiv.getElementsByTagName('div');
                        for (var i = 0; i < divElements.length; i++) {
                            var divText = divElements[i].textContent || divElements[i].innerText || '';
                            
                            // Skip empty divs or divs with just line breaks
                            if (divText.trim().length === 0) continue;
                            
                            var originalText = divText;
                            var wasFixed = false;
                            
                            // Method 1: Check if entire text is duplicated (first half == second half)
                            var halfLength = Math.floor(divText.length / 2);
                            if (halfLength > 2) {
                                var firstHalf = divText.substring(0, halfLength);
                                var secondHalf = divText.substring(halfLength);
                                
                                if (firstHalf === secondHalf && firstHalf.trim().length > 0) {
                                    divElements[i].textContent = firstHalf;
                                    needsUpdate = true;
                                    wasFixed = true;
                                    fixedDivs.push({index: i, originalText: originalText, newText: firstHalf});
                                }
                            }
                            
                            // Method 2: Check for partial duplication at the end (continuation dictation)
                            if (!wasFixed && divText.length > 6) { // At least 6 chars to check
                                // Approach A: Look for patterns where end portion duplicates earlier portion
                                for (var checkLength = 3; checkLength <= Math.floor(divText.length / 2); checkLength++) {
                                    var endPortion = divText.substring(divText.length - checkLength);
                                    
                                    // Find if this end portion appears earlier in the text
                                    var earlierIndex = divText.indexOf(endPortion);
                                    if (earlierIndex >= 0 && earlierIndex < divText.length - checkLength) {
                                        // Check if it's likely a duplication (not just common words)
                                        var beforeEnd = divText.substring(0, divText.length - checkLength);
                                        if (beforeEnd.endsWith(endPortion)) {
                                            divElements[i].textContent = beforeEnd;
                                            needsUpdate = true;
                                            wasFixed = true;
                                            fixedDivs.push({index: i, originalText: originalText, newText: beforeEnd});
                                            break;
                                        }
                                    }
                                }
                                
                                // Approach B: Look for repeated phrases/words using more aggressive scanning
                                if (!wasFixed) {
                                    var words = divText.split(/\s+/);
                                    if (words.length >= 4) { // At least 4 words to check
                                        // Look for repeated sequences of 2+ words
                                        for (var seqLen = 2; seqLen <= Math.floor(words.length / 2); seqLen++) {
                                            var endSequence = words.slice(-seqLen);
                                            var endSeqText = endSequence.join(' ');
                                            
                                            // Look for this sequence earlier in the text
                                            for (var startPos = 0; startPos <= words.length - seqLen - seqLen; startPos++) {
                                                var compareSequence = words.slice(startPos, startPos + seqLen);
                                                var compareSeqText = compareSequence.join(' ');
                                                
                                                if (endSeqText === compareSeqText && endSeqText.length > 5) {
                                                    // Remove the duplicate sequence from the end
                                                    var newWords = words.slice(0, -seqLen);
                                                    var newText = newWords.join(' ');
                                                    divElements[i].textContent = newText;
                                                    needsUpdate = true;
                                                    wasFixed = true;
                                                    fixedDivs.push({index: i, originalText: originalText, newText: newText});
                                                    break;
                                                }
                                            }
                                            if (wasFixed) break;
                                        }
                                    }
                                }
                                
                                // Approach C: Look for substring duplications more aggressively
                                if (!wasFixed) {
                                    // Split by common punctuation and check each part
                                    var segments = divText.split(/[.!?]\s*/);
                                    if (segments.length >= 2) {
                                        var lastSegment = segments[segments.length - 1].trim();
                                        if (lastSegment.length > 5) {
                                            // Check if this last segment appears in earlier segments
                                            for (var segIdx = 0; segIdx < segments.length - 1; segIdx++) {
                                                if (segments[segIdx].includes(lastSegment)) {
                                                    // Remove the last segment
                                                    var newSegments = segments.slice(0, -1);
                                                    var newText = newSegments.join('. ').trim();
                                                    divElements[i].textContent = newText;
                                                    needsUpdate = true;
                                                    wasFixed = true;
                                                    fixedDivs.push({index: i, originalText: originalText, newText: newText});
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                // Approach D: Advanced pattern-based duplication detection for question/sentence patterns
                                if (!wasFixed && divText.length > 20) {
                                    // Look for repeated question patterns like "What about this? How about this? What about this?"
                                    var sentences = divText.split(/[.!?]\s+/);
                                    if (sentences.length >= 2) {
                                        var cleanedSentences = [];
                                        for (var s = 0; s < sentences.length; s++) {
                                            var sentence = sentences[s].trim();
                                            if (sentence.length > 0) {
                                                cleanedSentences.push(sentence);
                                            }
                                        }
                                        
                                        if (cleanedSentences.length >= 2) {
                                            // Check for similar patterns between consecutive sentences
                                            var patternFound = false;
                                            var duplicateIndices = [];
                                            
                                            for (var si = 1; si < cleanedSentences.length && !patternFound; si++) {
                                                var currentSentence = cleanedSentences[si].toLowerCase();
                                                var previousSentence = cleanedSentences[si-1].toLowerCase();
                                                
                                                // Check for exact matches
                                                if (currentSentence === previousSentence && currentSentence.length > 8) {
                                                    duplicateIndices.push(si);
                                                    patternFound = true;
                                                }
                                                // Check for similar question patterns (>70% similarity)
                                                else if (currentSentence.length > 10 && previousSentence.length > 10) {
                                                    var similarity = calculateStringSimilarity(currentSentence, previousSentence);
                                                    if (similarity > 0.7) {
                                                        duplicateIndices.push(si);
                                                        patternFound = true;
                                                    }
                                                }
                                                // Check for pattern like "X about this one? Y about this one?"
                                                else if (currentSentence.includes('about') && previousSentence.includes('about')) {
                                                    var currentWords = currentSentence.split(/\s+/);
                                                    var previousWords = previousSentence.split(/\s+/);
                                                    var matchingWords = 0;
                                                    
                                                    for (var cw = 0; cw < currentWords.length; cw++) {
                                                        if (previousWords.indexOf(currentWords[cw]) >= 0) {
                                                            matchingWords++;
                                                        }
                                                    }
                                                    
                                                    var wordSimilarity = matchingWords / Math.max(currentWords.length, previousWords.length);
                                                    if (wordSimilarity > 0.6) {
                                                        duplicateIndices.push(si);
                                                        patternFound = true;
                                                    }
                                                }
                                            }
                                            
                                            if (patternFound && duplicateIndices.length > 0) {
                                                // Remove duplicate sentences
                                                var filteredSentences = [];
                                                for (var fi = 0; fi < cleanedSentences.length; fi++) {
                                                    if (duplicateIndices.indexOf(fi) === -1) {
                                                        filteredSentences.push(cleanedSentences[fi]);
                                                    }
                                                }
                                                var newText = filteredSentences.join('. ') + (filteredSentences.length > 0 ? '.' : '');
                                                divElements[i].textContent = newText;
                                                needsUpdate = true;
                                                wasFixed = true;
                                                fixedDivs.push({index: i, originalText: originalText, newText: newText});
                                            }
                                        }
                                    }
                                }
                                
                                // Approach E: Specific detection for question repetition patterns
                                if (!wasFixed && divText.length > 15) {
                                    // Look for specific patterns like "What about X? How about Y? What about Z?"
                                    var questionMarkers = ['what about', 'how about', 'are you going to'];
                                    var foundPattern = false;
                                    
                                    for (var qm = 0; qm < questionMarkers.length && !foundPattern; qm++) {
                                        var marker = questionMarkers[qm];
                                        var lowerText = divText.toLowerCase();
                                        var markerIndices = [];
                                        var searchStart = 0;
                                        
                                        // Find all occurrences of this question marker
                                        while (true) {
                                            var index = lowerText.indexOf(marker, searchStart);
                                            if (index === -1) break;
                                            markerIndices.push(index);
                                            searchStart = index + marker.length;
                                        }
                                        
                                        // If we found the same question pattern 2+ times, it's likely duplication
                                        if (markerIndices.length >= 2) {
                                            var questionSegments = [];
                                            for (var mi = 0; mi < markerIndices.length; mi++) {
                                                var startIndex = markerIndices[mi];
                                                var endIndex = (mi + 1 < markerIndices.length) ? markerIndices[mi + 1] : divText.length;
                                                var segment = divText.substring(startIndex, endIndex).replace(/[.!?]\s*$/, '').trim();
                                                questionSegments.push(segment);
                                            }
                                            
                                            // Check if any segments are similar (indicating duplication)
                                            for (var qs1 = 0; qs1 < questionSegments.length - 1; qs1++) {
                                                for (var qs2 = qs1 + 1; qs2 < questionSegments.length; qs2++) {
                                                    var seg1 = questionSegments[qs1].toLowerCase();
                                                    var seg2 = questionSegments[qs2].toLowerCase();
                                                    
                                                    if (seg1.length > 8 && seg2.length > 8) {
                                                        var segmentSimilarity = calculateStringSimilarity(seg1, seg2);
                                                        if (segmentSimilarity > 0.6) {
                                                            
                                                            // Keep only the first occurrence, remove duplicates
                                                            var firstSegment = questionSegments[0];
                                                            var cleanedText = firstSegment + (firstSegment.match(/[.!?]$/) ? '' : '.');
                                                            divElements[i].textContent = cleanedText;
                                                            needsUpdate = true;
                                                            wasFixed = true;
                                                            foundPattern = true;
                                                            fixedDivs.push({index: i, originalText: originalText, newText: cleanedText});
                                                            break;
                                                        }
                                                    }
                                                }
                                                if (foundPattern) break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Method 2.5: Aggressive substring duplication detection for sentence continuation
                        for (var i = 0; i < divElements.length; i++) {
                            var divText = divElements[i].textContent || divElements[i].innerText || '';
                            if (divText.trim().length === 0 || divText.length < 16) continue;
                            
                            var originalText = divText;
                            var wasFixed = false;
                            
                            // Look for any repeated substrings of reasonable length
                            var minSubstringLength = 8;
                            var maxSubstringLength = Math.floor(divText.length / 2);
                            
                            for (var subLen = maxSubstringLength; subLen >= minSubstringLength && !wasFixed; subLen--) {
                                for (var start = 0; start <= divText.length - subLen * 2 && !wasFixed; start++) {
                                    var substring = divText.substring(start, start + subLen);
                                    
                                    // Skip substrings that are mostly spaces or very short meaningful content
                                    if (substring.trim().length < Math.max(6, subLen * 0.6)) continue;
                                    
                                    // Look for this exact substring appearing again later
                                    var nextOccurrence = divText.indexOf(substring, start + subLen);
                                    if (nextOccurrence !== -1) {
                                        
                                        // Remove everything from the duplicate occurrence onward
                                        var cleanedText = divText.substring(0, nextOccurrence).trim();
                                        if (cleanedText.length > 0) {
                                            divElements[i].textContent = cleanedText;
                                            needsUpdate = true;
                                            wasFixed = true;
                                            fixedDivs.push({index: i, originalText: originalText, newText: cleanedText});
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Method 3: Check for duplications across consecutive div elements
                        // Run this regardless of needsUpdate to catch all cross-div duplications
                        if (divElements.length > 1) {
                            // Multiple passes to catch complex duplication patterns
                            var maxPasses = 3; // Limit to prevent infinite loops
                            var passCount = 0;
                            var foundDuplicationsInPass = true;
                            
                            while (foundDuplicationsInPass && passCount < maxPasses) {
                                foundDuplicationsInPass = false;
                                passCount++;
                                
                                // Refresh divElements after each pass since we might have removed some
                                divElements = tempDiv.getElementsByTagName('div');
                                
                                for (var j = 1; j < divElements.length; j++) {
                                    var currentDiv = divElements[j];
                                    var previousDiv = divElements[j-1];
                                    
                                    if (!currentDiv || !previousDiv) continue; // Skip if removed
                                    
                                    var currentText = currentDiv.textContent || currentDiv.innerText || '';
                                    var previousText = previousDiv.textContent || previousDiv.innerText || '';
                                    
                                    // Skip empty divs
                                    if (currentText.trim().length === 0 || previousText.trim().length === 0) continue;
                                    
                                    // Check if current div content duplicates previous div content
                                    if (currentText === previousText && currentText.trim().length > 0) {
                                        currentDiv.remove();
                                        needsUpdate = true;
                                        foundDuplicationsInPass = true;
                                        break; // Restart the loop after removal
                                    }
                                    
                                    // Check if current div starts with content that duplicates end of previous div
                                    if (previousText.length > 5 && currentText.length > 3) {
                                        // Look for overlapping content - be more aggressive
                                        var maxOverlap = Math.min(previousText.length, currentText.length);
                                        for (var overlapLen = 3; overlapLen <= maxOverlap; overlapLen++) {
                                            var prevEnd = previousText.substring(previousText.length - overlapLen);
                                            var currentStart = currentText.substring(0, overlapLen);
                                            
                                            if (prevEnd === currentStart && prevEnd.trim().length > 0) {
                                                var remainingText = currentText.substring(overlapLen);
                                                if (remainingText.trim().length === 0) {
                                                    // If nothing left, remove the div
                                                    currentDiv.remove();
                                                } else {
                                                    // Otherwise, keep the remaining text
                                                    currentDiv.textContent = remainingText;
                                                }
                                                needsUpdate = true;
                                                foundDuplicationsInPass = true;
                                                break;
                                            }
                                        }
                                        if (foundDuplicationsInPass) break;
                                    }
                                    
                                    // Additional check: if current div is contained within previous div
                                    if (currentText.length < previousText.length && previousText.includes(currentText) && currentText.trim().length > 0) {
                                        currentDiv.remove();
                                        needsUpdate = true;
                                        foundDuplicationsInPass = true;
                                        break;
                                    }
                                    
                                    // Check if previous div is contained within current div (reverse case)
                                    if (previousText.length < currentText.length && currentText.includes(previousText) && previousText.trim().length > 0) {
                                        // Check if current div starts with previous div content
                                        if (currentText.startsWith(previousText)) {
                                            previousDiv.remove();
                                            needsUpdate = true;
                                            foundDuplicationsInPass = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // If we fixed any duplications, update the HTML and restore cursor
                        if (needsUpdate) {
                            // Store cursor position before HTML update
                            var selection = window.getSelection();
                            var savedRange = null;
                            var cursorOffset = 0;
                            var totalTextLength = 0;
                            
                            if (selection.rangeCount > 0) {
                                var range = selection.getRangeAt(0);
                                // Calculate cursor position as offset from start of all text
                                var walker = document.createTreeWalker(
                                    content,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                while (walker.nextNode()) {
                                    if (walker.currentNode === range.startContainer) {
                                        cursorOffset = totalTextLength + range.startOffset;
                                        break;
                                    }
                                    totalTextLength += walker.currentNode.textContent.length;
                                }
                            }
                            
                            // Update the HTML
                            content.innerHTML = tempDiv.innerHTML;
                            html = Actions.content.getHtml();
                            
                            // Restore cursor position after HTML update
                            setTimeout(function() {
                                try {
                                    if (cursorOffset >= 0) {
                                        var newSelection = window.getSelection();
                                        var newRange = document.createRange();
                                        var currentOffset = 0;
                                        var targetNode = null;
                                        var targetOffset = 0;
                                        
                                        var walker = document.createTreeWalker(
                                            content,
                                            NodeFilter.SHOW_TEXT,
                                            null,
                                            false
                                        );
                                        
                                        while (walker.nextNode()) {
                                            var nodeLength = walker.currentNode.textContent.length;
                                            if (currentOffset + nodeLength >= cursorOffset) {
                                                targetNode = walker.currentNode;
                                                targetOffset = cursorOffset - currentOffset;
                                                break;
                                            }
                                            currentOffset += nodeLength;
                                        }
                                        
                                        if (targetNode) {
                                            // Make sure offset is within bounds
                                            targetOffset = Math.min(targetOffset, targetNode.textContent.length);
                                            newRange.setStart(targetNode, targetOffset);
                                            newRange.setEnd(targetNode, targetOffset);
                                            newSelection.removeAllRanges();
                                            newSelection.addRange(newRange);
                                        }
                                    }
                                } catch (e) {
                                    // If cursor restoration fails, ignore silently
                                }
                            }, 0);
                        }
                    }
                    
                    var htmlLength = html.length;
                    if (htmlLength > 8000000) {
                        if (!_contentLimitReached) {
                            _contentLimitReached = true;
                            _postMessage({type: 'CONTENT_LIMIT_WARNING', data: {length: htmlLength, level: 'critical'}});
                        }
                    } else if (htmlLength > 3000000) {
                        _contentLimitReached = false;
                        _postMessage({type: 'CONTENT_LIMIT_WARNING', data: {length: htmlLength, level: 'warning'}});
                    } else {
                        _contentLimitReached = false;
                    }

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
