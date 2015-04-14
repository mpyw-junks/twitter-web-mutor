'use strict';

(function (iframe) {
    
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    iframe.onload = function () {
        
        /* Sandboxed contentWindow */
        var sandbox = this.contentWindow;
        
        /* Callback managing functions */
        var RestoreCallbackCode = function () {
            return localStorage['tcm-callback'] || 'return true;';
        };
        var StoreCallbackCode = function (code) {
            localStorage['tcm-callback'] = code;
        }
        var SetCallback = function (code) {
            sandbox.postMessage({
                actionType: 'set-callback',
                code: code
            }, '*');
        };
        var GoCallback = function (item) {
            var isReply = item.getAttribute('data-component-context') === 'reply_activity';
            if (item.getAttribute('data-item-type') !== 'tweet' && !isReply) {
                return true;
            }
            var tweet = item.querySelector('.tweet');
            var retweeter = tweet.getAttribute('data-retweeter');
            var retweetInfo = item.querySelector('.js-retweet-text');
            var params = [
                tweet.getAttribute('data-user-id'),
                tweet.getAttribute('data-screen-name'),
                tweet.getAttribute('data-name'),
                tweet.querySelector('.tweet-text').textContent,
                isReply,
                !!tweet.getAttribute('data-promoted'),
                !!retweeter,
                retweeter ? retweetInfo.querySelector('a').getAttribute('data-user-id') : null,
                retweeter,
                retweeter ? retweetInfo.querySelector('b').textContent : null
            ];
            sandbox.postMessage({
                actionType: 'go-callback',
                itemId: item.id,
                params: params
            }, '*');
        }
        
        /* Observers */
        var CreateObserver = function (nodeType, options, filterCallback, applyCallback) {
            var observer = new MutationObserver(function (mutations) {
                var filterCallbackLocal = filterCallback;
                var applyCallbackLocal = applyCallback;
                var filterCallbackInvalid = typeof filterCallbackLocal !== 'function';
                if (typeof applyCallbackLocal !== 'function') {
                    return;
                }
                for (var i = mutations.length; i--;) {
                    var mutation = mutations[i];
                    for (var j = mutation[nodeType].length; j--;) {
                        if (filterCallbackInvalid || filterCallbackLocal(mutation[nodeType][j])) {
                            applyCallbackLocal(mutation[nodeType][j]);
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
				if (node) { 
					var childs = node.children;
					for (var i = childs.length; i--;) {
						GoCallback(childs[i]);
					}
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
				var streamItems = document.getElementById('stream-items-id');
				PreObserver.observe(streamItems);
				MuteObserver.observe(streamItems);
            }
        );
        
        /* Initialize callback */
        SetCallback(RestoreCallbackCode());
        
        /* Start listeing */
        window.addEventListener('message', function (e) {
            if (e.data.actionType === 'tcm-remove-tweet') {
                var node = document.getElementById(e.data.itemId);
                node.parentNode.removeChild(node);
            }
        });
        
        /* Start observing */
        (function (streamItems) {
            PreObserver.observe(streamItems);
            MuteObserver.observe(streamItems);
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
    iframe.setAttribute('src', chrome.extension.getURL('sandbox.html'));
    
})(document.createElement('iframe'));