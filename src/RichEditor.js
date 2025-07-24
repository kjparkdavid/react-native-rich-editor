import React, {Component} from 'react';
import {WebView} from 'react-native-webview';
import {actions, messages} from './const';
import {Keyboard, Platform, StyleSheet, TextInput, View, AppState} from 'react-native';
import {createHTML} from './editor';

const PlatformIOS = Platform.OS === 'ios';

export default class RichTextEditor extends Component {
    static defaultProps = {
        contentInset: {},
        style: {},
        placeholder: '',
        initialContentHTML: '',
        initialFocus: false,
        disabled: false,
        useContainer: true,
        pasteAsPlainText: false,
        autoCapitalize: 'off',
        defaultParagraphSeparator: 'div',
        editorInitializedCallback: () => {},
        initialHeight: 0,
    };

    constructor(props) {
        super(props);
        let that = this;
        that.renderWebView = that.renderWebView.bind(that);
        that.onMessage = that.onMessage.bind(that);
        that.sendAction = that.sendAction.bind(that);
        that.registerToolbar = that.registerToolbar.bind(that);
        that._onKeyboardWillShow = that._onKeyboardWillShow.bind(that);
        that._onKeyboardWillHide = that._onKeyboardWillHide.bind(that);
        that.init = that.init.bind(that);
        that.setRef = that.setRef.bind(that);
        that.onViewLayout = that.onViewLayout.bind(that);
        that.unmount = false;
        that._keyOpen = false;
        that._focus = false;
        that.layout = {};
        that.selectionChangeListeners = [];
        const {
            editorStyle: {
                backgroundColor,
                color,
                placeholderColor,
                initialCSSText,
                cssText,
                contentCSSText,
                caretColor,
            } = {},
            html,
            pasteAsPlainText,
            onPaste,
            onKeyUp,
            onKeyDown,
            onInput,
            enterKeyHint,
            autoCapitalize,
            autoCorrect,
            defaultParagraphSeparator,
            firstFocusEnd,
            useContainer,
            initialHeight,
        } = props;
        that.state = {
            html: {
                html:
                    html ||
                    createHTML({
                        backgroundColor,
                        color,
                        caretColor,
                        placeholderColor,
                        initialCSSText,
                        cssText,
                        contentCSSText,
                        pasteAsPlainText,
                        pasteListener: !!onPaste,
                        keyUpListener: !!onKeyUp,
                        keyDownListener: !!onKeyDown,
                        inputListener: !!onInput,
                        enterKeyHint,
                        autoCapitalize,
                        autoCorrect,
                        defaultParagraphSeparator,
                        firstFocusEnd,
                        useContainer,
                    }),
            },
            keyboardHeight: 0,
            height: initialHeight,
            webViewKey: Date.now(),
        };
        that.focusListeners = [];
        that.loadTimeout = null;
        that.appStateSubscription = null;
        that.backgroundTime = null;
        that.lastKnownContent = null; // Store content before WebView remount
        that.contentPreservationTimeout = null; // For debounced content saving
    }

    componentDidMount() {
        this.unmount = false;

        // Handle app state changes for iOS WebView restoration
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

        if (PlatformIOS) {
            this.keyboardEventListeners = [
                Keyboard.addListener('keyboardWillShow', this._onKeyboardWillShow),
                Keyboard.addListener('keyboardWillHide', this._onKeyboardWillHide),
            ];
        } else {
            this.keyboardEventListeners = [
                Keyboard.addListener('keyboardDidShow', this._onKeyboardWillShow),
                Keyboard.addListener('keyboardDidHide', this._onKeyboardWillHide),
            ];
        }
    }

    componentWillUnmount() {
        this.unmount = true;
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
        if (this.contentPreservationTimeout) {
            clearTimeout(this.contentPreservationTimeout);
            this.contentPreservationTimeout = null;
        }
        this.keyboardEventListeners.forEach(eventListener => eventListener.remove());
    }

    _onKeyboardWillShow(event) {
        this._keyOpen = true;
        // console.log('!!!!', event);
        /*const newKeyboardHeight = event.endCoordinates.height;
        if (this.state.keyboardHeight === newKeyboardHeight) {
            return;
        }
        if (newKeyboardHeight) {
            this.setEditorAvailableHeightBasedOnKeyboardHeight(newKeyboardHeight);
        }
        this.setState({keyboardHeight: newKeyboardHeight});*/
    }

    _onKeyboardWillHide(event) {
        this._keyOpen = false;
        // this.setState({keyboardHeight: 0});
    }

    handleAppStateChange = nextAppState => {
        if (this.unmount) return;

        if (nextAppState === 'background') {
            // Track when app goes to background and save current content
            this.backgroundTime = Date.now();
            // Immediately preserve current content before background (bypass debounce)
            if (this.contentPreservationTimeout) {
                clearTimeout(this.contentPreservationTimeout);
                this.contentPreservationTimeout = null;
            }
            this.preserveContent();
        } else if (nextAppState === 'active') {
            // Check if app was in background for more than 30 seconds
            const timeInBackground = this.backgroundTime ? Date.now() - this.backgroundTime : 0;

            if (timeInBackground > 30000) {
                // 30 seconds
                // Force WebView remount by changing key
                this.setState({
                    webViewKey: Date.now(),
                });
            }
            this.backgroundTime = null;
        }
    };

    preserveContent = () => {
        // Try to get current content before WebView gets terminated
        if (this.webviewBridge && !this.unmount) {
            try {
                this.sendAction(actions.content, 'postHtml');
            } catch (e) {
                console.warn('Failed to preserve content:', e);
            }
        }
    };

    // Public method to manually preserve content
    preserveCurrentContent = content => {
        if (content) {
            this.lastKnownContent = content;
        }
    };

    /*setEditorAvailableHeightBasedOnKeyboardHeight(keyboardHeight) {
        const {top = 0, bottom = 0} = this.props.contentInset;
        const {marginTop = 0, marginBottom = 0} = this.props.style;
        const spacing = marginTop + marginBottom + top + bottom;

        const editorAvailableHeight = Dimensions.get('window').height - keyboardHeight - spacing;
        // this.setEditorHeight(editorAvailableHeight);
    }*/

    onMessage(event) {
        const that = this;
        const {
            onFocus,
            onBlur,
            onClick,
            onChange,
            onPaste,
            onKeyUp,
            onKeyDown,
            onInput,
            onMessage,
            onCursorPosition,
            onAttributeChanged,
            trackCursorPosition,
            onImageClicked,
            onWebViewDeselectStickers,
        } = that.props;
        try {
            const message = JSON.parse(event.nativeEvent.data);
            const data = message.data;
            switch (message.type) {
                // case messages.CUSTOM_IMAGE_CLICKED:
                //     this.dismissKeyboard();
                //     break;
                case messages.CONTENT_HTML_RESPONSE:
                    if (that.contentResolve) {
                        that.contentResolve(message.data);
                        that.contentResolve = undefined;
                        that.contentReject = undefined;
                        if (that.pendingContentHtml) {
                            clearTimeout(that.pendingContentHtml);
                            that.pendingContentHtml = undefined;
                        }
                    }
                    // Store content for potential WebView restoration
                    that.lastKnownContent = message.data;
                    break;
                case messages.LOG:
                    console.log('FROM EDIT:', ...data);
                    break;
                case messages.SELECTION_CHANGE:
                    const items = message.data;
                    that.selectionChangeListeners.map(listener => {
                        listener(items);
                    });
                    break;
                case messages.CONTENT_FOCUSED:
                    that._focus = true;
                    that.focusListeners.map(da => da()); // Subsequent versions will be deleted
                    onFocus?.();
                    break;
                case messages.CONTENT_BLUR:
                    that._focus = false;
                    onBlur?.();
                    break;
                case messages.CONTENT_CLICK:
                    onClick?.();
                    break;
                case messages.WEBVIEW_DESELECT_STICKERS:
                    onWebViewDeselectStickers?.();
                    break;
                case messages.CONTENT_CHANGE:
                    onChange?.(data);
                    // Debounced content preservation for better performance
                    that.debouncedPreserveContent(data);
                    break;
                case messages.CONTENT_PASTED:
                    onPaste?.(data);
                    break;
                case messages.CONTENT_KEYUP:
                    onKeyUp?.(data);
                    break;
                case messages.CONTENT_KEYDOWN:
                    onKeyDown?.(data);
                    break;
                case messages.ON_INPUT:
                    onInput?.(data);
                    break;
                case messages.OFFSET_HEIGHT:
                    that.setWebHeight(data);
                    break;
                // OFFSET_Y is not being called when the editor goes into newline without pressing enter
                case messages.OFFSET_Y:
                    let offsetY = Number.parseInt(Number.parseInt(data) + that.layout.y || 0);
                    offsetY > 0 && onCursorPosition(offsetY);
                    break;
                case messages.ATTRIBUTE_CHANGED:
                    onAttributeChanged?.(data);
                    break;
                // Newer way to track cursor position which tracks every cursor change
                case messages.CURSOR_POSITION:
                    trackCursorPosition?.(data);
                    break;
                case messages.IMAGE_CLICKED:
                    onImageClicked?.(data);
                    break;
                default:
                    onMessage?.(message);
                    break;
            }
        } catch (e) {
            //alert('NON JSON MESSAGE');
        }
    }

    setWebHeight(height) {
        const {onHeightChange, useContainer, initialHeight} = this.props;
        if (height !== this.state.height) {
            const maxHeight = Math.max(height, initialHeight, this.state.height);
            if (!this.unmount && useContainer && maxHeight >= initialHeight) {
                this.setState({height: maxHeight});
            }
            onHeightChange && onHeightChange(height);
        }
    }

    /**
     * @param {String} type
     * @param {String} action
     * @param {any} data
     * @param [options]
     * @private
     */
    sendAction(type, action, data, options) {
        let jsonString = JSON.stringify({type, name: action, data, options});
        if (!this.unmount && this.webviewBridge) {
            this.webviewBridge.postMessage(jsonString);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {editorStyle, disabled, placeholder} = this.props;
        if (prevProps.editorStyle !== editorStyle) {
            editorStyle && this.setContentStyle(editorStyle);
        }
        if (disabled !== prevProps.disabled) {
            this.setDisable(disabled);
        }
        if (placeholder !== prevProps.placeholder) {
            this.setPlaceholder(placeholder);
        }
    }

    setRef(ref) {
        this.webviewBridge = ref;
    }

    renderWebView() {
        let that = this;
        const {html, editorStyle, useContainer, style, ...rest} = that.props;
        const {html: viewHTML, webViewKey} = that.state;
        const DISABLE_TEXT_SELECT = "document.body.style.userSelect = 'none'"; // For not selecting any text when user is interacting with a sticker
        return (
            <>
                <WebView
                    key={webViewKey}
                    useWebKit={true}
                    scrollEnabled={false}
                    hideKeyboardAccessoryView={true}
                    keyboardDisplayRequiresUserAction={false}
                    nestedScrollEnabled={!useContainer}
                    style={[styles.webview, style]}
                    {...rest}
                    ref={that.setRef}
                    onMessage={that.onMessage}
                    originWhitelist={['*']}
                    dataDetectorTypes={['none']}
                    domStorageEnabled={false}
                    bounces={false}
                    javaScriptEnabled={true}
                    source={viewHTML}
                    onLoad={that.init}
                    onRenderProcessGone={that.handleRenderProcessGone}
                    injectedJavaScript={DISABLE_TEXT_SELECT}
                    // Network-independent configurations
                    startInLoadingState={false}
                    mixedContentMode={'compatibility'}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    // Ensure offline functionality
                    onShouldStartLoadWithRequest={() => true}
                />
                {Platform.OS === 'android' && <TextInput ref={ref => (that._input = ref)} style={styles._input} />}
            </>
        );
    }

    onViewLayout({nativeEvent: {layout}}) {
        // const {x, y, width, height} = layout;
        this.layout = layout;
    }

    render() {
        let {height} = this.state;

        // useContainer is an optional prop with default value of true
        // If set to true, it will use a View wrapper with styles and height.
        // If set to false, it will not use a View wrapper
        const {useContainer, style} = this.props;
        return useContainer ? (
            <View style={[style, {height}]} onLayout={this.onViewLayout}>
                {this.renderWebView()}
            </View>
        ) : (
            this.renderWebView()
        );
    }

    //-------------------------------------------------------------------------------
    //--------------- Public API

    registerToolbar(listener) {
        this.selectionChangeListeners = [...this.selectionChangeListeners, listener];
    }

    /**
     * Subsequent versions will be deleted, please use onFocus
     * @deprecated remove
     * @param listener
     */
    setContentFocusHandler(listener) {
        this.focusListeners.push(listener);
    }

    setContentHTML(html) {
        this.sendAction(actions.content, 'setHtml', html);
        // Also preserve this content for potential restoration
        this.lastKnownContent = html;
    }

    setPlaceholder(placeholder) {
        this.sendAction(actions.content, 'setPlaceholder', placeholder);
    }

    setContentStyle(styles) {
        this.sendAction(actions.content, 'setContentStyle', styles);
    }

    setDisable(dis) {
        this.sendAction(actions.content, 'setDisable', !!dis);
    }

    blurContentEditor() {
        this.sendAction(actions.content, 'blur');
    }

    focusContentEditor() {
        this.showAndroidKeyboard();
        this.sendAction(actions.content, 'focus');
    }

    /**
     * open android keyboard
     * @platform android
     */
    showAndroidKeyboard() {
        let that = this;
        if (Platform.OS === 'android') {
            !that._keyOpen && that._input.focus();
            that.webviewBridge.requestFocus && that.webviewBridge.requestFocus();
        }
    }

    /**
     * @param attributes
     * @param [style]
     */
    insertImage(attributes, style) {
        this.sendAction(actions.insertImage, 'result', attributes, style);
    }

    /**
     * @param attributes
     * @param [style]
     */
    insertVideo(attributes, style) {
        this.sendAction(actions.insertVideo, 'result', attributes, style);
    }

    insertText(text) {
        this.sendAction(actions.insertText, 'result', text);
    }

    insertHTML(html) {
        this.sendAction(actions.insertHTML, 'result', html);
    }

    insertLink(title, url) {
        if (url) {
            this.showAndroidKeyboard();
            this.sendAction(actions.insertLink, 'result', {title, url});
        }
    }

    preCode(type) {
        this.sendAction(actions.code, 'result', type);
    }

    setFontSize(size) {
        this.sendAction(actions.fontSize, 'result', size);
    }

    setForeColor(color) {
        this.sendAction(actions.foreColor, 'result', color);
    }

    setHiliteColor(color) {
        this.sendAction(actions.hiliteColor, 'result', color);
    }

    setFontName(name) {
        this.sendAction(actions.fontName, 'result', name);
    }

    commandDOM(command) {
        if (command) {
            this.sendAction(actions.content, 'commandDOM', command);
        }
    }

    command(command) {
        if (command) {
            this.sendAction(actions.content, 'command', command);
        }
    }

    dismissKeyboard() {
        this._focus ? this.blurContentEditor() : Keyboard.dismiss();
    }

    get isKeyboardOpen() {
        return this._keyOpen;
    }

    init() {
        let that = this;
        const {initialFocus, initialContentHTML, placeholder, editorInitializedCallback, disabled} = that.props;

        // Restore content if WebView was remounted
        const contentToRestore = that.lastKnownContent || initialContentHTML;
        if (contentToRestore) {
            that.setContentHTML(contentToRestore);
        }

        placeholder && that.setPlaceholder(placeholder);
        that.setDisable(disabled);
        editorInitializedCallback();

        // initial request focus
        initialFocus && !disabled && that.focusContentEditor();
        // no visible ?
        that.sendAction(actions.init);
    }

    handleRenderProcessGone = syntheticEvent => {
        const {nativeEvent} = syntheticEvent;
        console.warn('WebView render process terminated:', nativeEvent);

        if (!this.unmount) {
            // Force WebView remount when render process is gone
            this.setState({
                webViewKey: Date.now(),
            });
        }
    };

    /**
     * @deprecated please use onChange
     * @returns {Promise}
     */
    async getContentHtml() {
        return new Promise((resolve, reject) => {
            this.contentResolve = resolve;
            this.contentReject = reject;
            this.sendAction(actions.content, 'postHtml');

            this.pendingContentHtml = setTimeout(() => {
                if (this.contentReject) {
                    this.contentReject('timeout');
                }
            }, 5000);
        });
    }

    debouncedPreserveContent = content => {
        // Clear existing timeout
        if (this.contentPreservationTimeout) {
            clearTimeout(this.contentPreservationTimeout);
        }

        // Set new timeout to save content after user stops typing for 500ms
        this.contentPreservationTimeout = setTimeout(() => {
            if (content && !this.unmount) {
                this.lastKnownContent = content;
            }
            this.contentPreservationTimeout = null;
        }, 500);
    };
}

const styles = StyleSheet.create({
    _input: {
        position: 'absolute',
        width: 1,
        height: 1,
        zIndex: -999,
        bottom: -999,
        left: -999,
    },

    webview: {
        backgroundColor: 'transparent',
    },
});
