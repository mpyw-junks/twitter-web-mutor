'use strict';

(function (Iframe) {
    
    Iframe.style.visibility = 'hidden';
    document.body.appendChild(Iframe);
    Iframe.onload = function () {
        
        /* Sandboxed contentWindow */
        var Sandbox = this.contentWindow;
        
        /* Callback managing functions */
        var RestoreCallbackCode = function () {
            return localStorage.getItem('tcm-callback') || 'return true;';
        };
        var StoreCallbackCode = function (code) {
            localStorage.setItem('tcm-callback', code);
        }
        var SetCallback = function (code) {
            Sandbox.postMessage({
                action_type: 'set_callback',
                code: code
            }, '*');
        };
        var GoCallback = function (item) {
            var is_reply = item.getAttribute('data-component-context') === 'reply_activity';
            if (item.getAttribute('data-item-type') !== 'tweet' && !is_reply) {
                return true;
            }
            var tweet = item.querySelector('.tweet');
            var retweeter = tweet.getAttribute('data-retweeter');
            var retweet_info = item.querySelector('.js-retweet-text');
            var params = [
                tweet.getAttribute('data-user-id'),
                tweet.getAttribute('data-screen-name'),
                tweet.getAttribute('data-name'),
                tweet.querySelector('.tweet-text').textContent,
                is_reply,
                !!tweet.getAttribute('data-promoted'),
                !!retweeter,
                retweeter ? retweet_info.querySelector('a').getAttribute('data-user-id') : null,
                retweeter,
                retweeter ? retweet_info.querySelector('b').textContent : null
            ];
            Sandbox.postMessage({
                action_type: 'go_callback',
                item_id: item.id,
                params: params
            }, '*');
        }
        
        /* Observers */
        var CreateObserver = function (nodeType, options, filter_callback, apply_callback) {
            var observer = new MutationObserver(function (mutations) {
                var filter_callback_local = filter_callback;
                var apply_callback_local = apply_callback;
                var filter_callback_invalid = typeof filter_callback_local !== 'function';
                if (typeof apply_callback_local !== 'function') {
                    return;
                }
                for (var i = mutations.length; i--;) {
                    var mutation = mutations[i];
                    for (var j = mutation[nodeType].length; j--;) {
                        if (filter_callback_invalid || filter_callback_local(mutation[nodeType][j])) {
                            apply_callback_local(mutation[nodeType][j]);
                        }
                    }
                }
            });
            var _observe = observer.observe;
            observer.observe = function (target) {
                return _observe.call(this, target, options);
            };
            return observer;
        };
        var PreObserver = {
            observe: function (node) {
                var childs = node.children;
                for (var i = childs.length; i--;) {
                    GoCallback(childs[i]);
                }
            }
        };
        var MuteObserver = CreateObserver(
            'addedNodes',
            {childList: true},
            function (e) { return e.tagName === 'LI'; },
            function (e) { GoCallback(e); }
        );
        var RefreshObserver = CreateObserver(
            'addedNodes',
            {childList: true, subtree: true},
            function (e) { return e.id === 'timeline'; },
            function (e) {
                MuteObserver.disconnect();
                var StreamItems = document.getElementById('stream-items-id');
                PreObserver.observe(StreamItems);
                MuteObserver.observe(StreamItems);
            }
        );
        
        /* Initialize callback */
        SetCallback(RestoreCallbackCode());
        
        /* Start listeing */
        window.addEventListener('message', function (e) {
            if (e.data.action_type === 'tcm-remove-tweet') {
                var node = document.getElementById(e.data.item_id);
                node.parentNode.removeChild(node);
            }
        });
        
        /* Start observing */
        (function (StreamItems) {
            PreObserver.observe(StreamItems);
            MuteObserver.observe(StreamItems);
            RefreshObserver.observe(document);
        })(document.getElementById('stream-items-id'));
        
        /* Insert mute button */
        document.styleSheets[0].insertRule('.Icon--volume-off:before { content: "\\f056"}', 0);
        (function (topbar) {
            var icon = document.createElement('span');
                icon.className = 'Icon Icon--volume-off Icon--large';
            var text = document.createElement('span');
                text.className = 'text';
                text.textContent = 'ミュート';
            var a = document.createElement('a');
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    var code = window.prompt(
                        "ミュート判定関数をJavaScriptで記述します. 以下の変数が参照できます.\n" +
                        "\n" + 
                        "user_id_str(string)\n" +
                        "screen_name(string)\n" +
                        "name(string)\n" +
                        "text(string)\n" +
                        "is_in_notification_tab(boolean)\n" +
                        "is_promotion(boolean)\n" +
                        "is_retweet(boolean)\n" +
                        "retweeter_user_id_str(string)\n" +
                        "retweeter_screen_name(string)\n" +
                        "retweeter_name(string)\n" +
                        "\n" +
                        "残したい場合は true, ミュートしたい場合は false を返してください. 規定値は return true; で, 全てのツイートを残します.\n",
                        RestoreCallbackCode()
                    );
                    if (code) {
                        StoreCallbackCode(code);
                        SetCallback(code);
                    }
                });
                a.className = 'js-nav js-tooltip js-dynamic-tooltip';
                a.href = '';
                a.appendChild(icon);
                a.appendChild(text);
            var li = document.createElement('li');
                li.id = 'mute-nav-id';
                li.appendChild(a);
            topbar.appendChild(li);
        })(document.getElementById('global-actions'));
        
    };
    Iframe.setAttribute('src', chrome.extension.getURL('sandbox.html'));
    
})(document.createElement('iframe'));