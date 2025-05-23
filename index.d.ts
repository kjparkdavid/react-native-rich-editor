import {WebViewProps} from 'react-native-webview';
import {ImageSourcePropType, StyleProp, ViewStyle} from 'react-native';
import React from 'react';

/** The RichTextEditor accepts all props from Webview */
export interface RichEditorProps extends WebViewProps {
    /**
     * Used for placement of editor
     */
    contentInset?: {top: number; bottom: number};

    /**
     * Wrap the editor webview inside a container.
     * Default is true
     */
    useContainer?: boolean;

    /**
     * useContainer is false by inline view of initial height
     */
    initialHeight?: number | string;
    /**
     * Wrap the editor content placeholder
     * Default is empty string
     */
    placeholder?: string;
    /**
     * Styling for container or for Webview depending on useContainer prop
     */
    style?: StyleProp<ViewStyle>;

    /**
     * Initial content to be rendered inside WebView
     */
    initialContentHTML?: string;

    /**
     * Boolean value to Initial content request focus. The default value is false.
     */
    initialFocus?: boolean;

    /**
     * Boolean value to disable editor. The default value is false.
     */
    disabled?: boolean;

    /**
     * String value to set text auto capitalization.
     * See: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize
     */
    autoCapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';

    /**
     * String value to set return key type
     * See: https://reactnative.dev/docs/textinput#returnkeytype
     */
    enterKeyHint?: 'done' | 'go' | 'next' | 'search' | 'send';

    /**
     * Boolean value to enable paste as plain text. The default value is false.
     */
    pasteAsPlainText?: boolean;

    /**
     * HTML element used to insert when the user presses enter. The default value is div.
     */
    defaultParagraphSeparator?: string;

    /**
     * Callback called after the editor has been initialized
     */
    editorInitializedCallback?: () => void;

    /**
     * Callback for content height change
     */
    onHeightChange?: (height: number) => void;

    /**
     * Callback after selection change
     */
    onChange?: (data: string) => void;

    /**
     * Callback to change cursor position
     */
    onCursorPosition?: (offsetY: number) => void;

    /**
     * Callback after editor focus
     */
    onFocus?: () => void;

    /**
     * Callback after editor blur
     */
    onBlur?: () => void;

    /**
     * Callback when the editor receives a click event
     */
    onClick?: () => void;

    /**
     * Callback when the editor receives an attribute change
     */
    onAttributeChanged?: (data: any) => void;

    /**
     * Callback when cursor position changes
     */
    trackCursorPosition?: (data: number) => void;

    /**
     * Callback when an image is clicked in the editor
     */
    onImageClicked?: (data: {src: string; width: number; height: number}) => void;

    /**
     * Styling for the editable content
     */
    editorStyle?: {
        backgroundColor?: string;
        color?: string;
        caretColor?: string;
        placeholderColor?: string;
        initialCSSText?: string;
        cssText?: string;
        contentCSSText?: string;
    };

    /**
     * Listener for paste event
     */
    onPaste?: (data: string) => void;

    /**
     * Listener for keyup event
     */
    onKeyUp?: (data: any) => void;

    /**
     * Listener for keydown event
     */
    onKeyDown?: (data: any) => void;

    /**
     * Listener for editor input
     */
    onInput?: (data: any) => void;

    /**
     * Listener for message event
     */
    onMessage?: (message: any) => void;
}

export type SelectionChangeListener = (items: string[]) => void;

export const actions: {[key: string]: string};

export type defaultActions = ['image', 'bold', 'italic', 'unorderedList', 'orderedList', 'link'];

export type createHTML = (options?: Object) => string;

export type getContentCSS = () => string;

export type IconRecord = {
    selected: boolean;
    disabled: boolean;
    tintColor: any;
    iconSize: number;
};

export class RichEditor extends React.Component<RichEditorProps> {
    // Public API

    /**
     * @deprecated please use onChange
     */
    getContentHtml: () => Promise<string>;

    registerToolbar: (listener: SelectionChangeListener) => void;

    /**
     * @deprecated please use onFocus
     */
    setContentFocusHandler: (listener: () => void) => void;

    /**
     * Set current HTML to be rendered
     */
    setContentHTML: (html: string) => void;

    blurContentEditor: () => void;

    focusContentEditor: () => void;

    insertImage: (attributes: any, style?: string) => void;

    insertVideo: (attributes: any, style?: string) => void;

    insertLink: (title: string, url: string) => void;

    insertText: (text: string) => void;

    insertHTML: (html: string) => void;

    preCode: (type: string) => void;

    /**
     * 1 = 10px, 2 = 13px, 3 = 16px, 4 = 18px, 5 = 24px, 6 = 32px, 7 = 48px;
     */
    setFontSize: (size: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;

    /**
     * The background color of the selected text
     * @param color
     */
    setHiliteColor: (color: string) => void;

    /**
     * The color of the selected text
     * @param color
     */
    setForeColor: (color: string) => void;

    /**
     * $ = document.querySelector
     * this.richText.current?.commandDOM(`$('#title').style.color='${color}'`);
     */
    commandDOM: (command: string) => void;

    /**
     * Execute JS in the editor
     * $ = document
     * this.richText.current?.commandDOM('$.execCommand('insertHTML', false, "<br/>")');
     */
    command: (command: string) => void;

    /**
     * Returns whether the keyboard is on
     */
    isKeyboardOpen: boolean;

    /**
     * Dismisses the active keyboard and removes focus.
     */
    dismissKeyboard: () => void;
}

export interface RichToolbarProps {
    /**
     * Function that returns a reference to the RichEditor instance
     * Optional editor props
     */
    getEditor?: () => RichEditor;

    /**
     * React.createRef reference to the RichEditor instance
     * Optional getEditor props
     */
    editor?: React.createRef;

    unselectedButtonStyle?: StyleProp<ViewStyle>;
    selectedButtonStyle?: StyleProp<ViewStyle>;
    disabledButtonStyle?: StyleProp<ViewStyle>;

    /**
     * Color for selected button Icon
     */
    selectedIconTint?: string;
    /**
     * Color for unselected button Icon
     */
    iconTint?: string;
    /**
     * Color for disabled button Icon
     */
    disabledIconTint?: string;

    /**
     * Boolean value to disable editor. The default value is false.
     */
    disabled?: boolean;
    /**
     * Custom renderer for toolbar actions
     */
    renderAction?: (action: string, selected: boolean) => React.Element;

    /**
     * Custom style prop for the toolbar
     */
    style?: StyleProp<ViewStyle>;

    /**
     * Flat container style prop for the toolbar
     */
    flatContainerStyle?: StyleProp<ViewStyle>;

    /**
     * Your own set if images for the toolbar
     */
    iconMap?: Record<string, (IconRecord) => React.Element | ImageSourcePropType>;

    /**
     * Logic for what happens when you press on the add image button
     */
    onPressAddImage?: () => void;

    /**
     *  Logic for what happens when you press on the add insert link button
     */
    onInsertLink?: () => void;

    /**
     * Custom actions you want the toolbar to permit.
     * By default the toolbar permits an Action set of type DefaultActions
     */
    actions?: Partial<defaultActions> | string[];
}

export class RichToolbar extends React.Component<RichToolbarProps> {}
