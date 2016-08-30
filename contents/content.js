'use strict';

(function (iframe) {

    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    iframe.onload = function () {

        /* Sandboxed contentWindow */
        var sandbox = this.contentWindow;

        /* Retryable document.getElementById() */
        var RetryableGetElementById = function self(id, maxRetries, delay) {
            return new Promise(function (resolve) {
                var element = document.getElementById(id);
                if (element) {
                    resolve(element);
                } else if (maxRetries-- > 0) {
                    setTimeout(function () {
                        self(id, maxRetries, delay).then(function (element) {
                            return resolve(element);
                        });
                    }, delay);
                }
            });
        };

        /* Callback managing functions */
        var RestoreCallbackCode = function () {
            return localStorage['tcm-callback'] || 'return false;';
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
            if (
                item.dataset.itemType !== 'tweet' &&
                item.dataset.componentContext !== 'reply_activity'
            ) {
                return true;
            }
            var tweet = item.querySelector('.tweet');
            var retweeter = tweet.dataset.retweeter;
            var retweetInfo = item.querySelector('.js-retweet-text');
            var params = [
                tweet.dataset.userId,
                tweet.dataset.screenName,
                tweet.dataset.name,
                tweet.querySelector('.tweet-text').textContent,
                !!tweet.dataset.promoted,
                !!retweeter,
                retweeter ? retweetInfo.querySelector('a').dataset.userId : null,
                retweeter,
                retweeter ? retweetInfo.querySelector('b').textContent : null,
                item.parentNode.parentNode.className.slice(7, -7)
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
                RetryableGetElementById('stream-items-id', 5, 500).then(function (streamItems) {
                    PreObserver.observe(streamItems);
                    MuteObserver.observe(streamItems);
                });
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
        RetryableGetElementById('stream-items-id', 5, 500).then(function (streamItems) {
            PreObserver.observe(streamItems);
            MuteObserver.observe(streamItems);
        });
        RefreshObserver.observe(document);

        /* Insert mute button */
        document.styleSheets[0].insertRule('.Icon--volume-off:before { content: "\\f056"}', 0);
        RetryableGetElementById('global-actions', 0, 0).then(function (topbar) {
            var icon = document.createElement('span');
                icon.className = 'Icon Icon--volume-off Icon--large';
            var text = document.createElement('span');
                text.className = 'text';
                text.textContent = 'ミュート';
            var a = document.createElement('a');
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    var code = window.prompt(
                        "ミュート判定関数をJavaScriptで記述.\n" +
                        "以下の変数が参照可能.\n" +
                        "\n" +
                        "user_id_str(string)\n" +
                        "screen_name(string)\n" +
                        "name(string)\n" +
                        "text(string)\n" +
                        "is_promoted(boolean)\n" +
                        "is_retweeted(boolean)\n" +
                        "retweeter_user_id_str(string | null)\n" +
                        "retweeter_screen_name(string | null)\n" +
                        "retweeter_name(string | null)\n" +
                        "stream_type(string)\n" +
                        "↑ \"home\", \"connect\", \"discover\", \"search\"\n" +
                        "\n" +
                        "ミュートする場合: return true;\n" +
                        "残したい場合: return false;\n",
                        RestoreCallbackCode()
                    );
                    if (code !== null) {
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
        });

    };
    iframe.setAttribute('src', chrome.extension.getURL('sandboxes/sandbox.html'));

})(document.createElement('iframe'));
