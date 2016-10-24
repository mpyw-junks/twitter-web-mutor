'use strict';

(iframe => {

  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  iframe.addEventListener('load', () => {

    /* Sandboxed contentWindow */
    const sandbox = iframe.contentWindow;
    
    /* Current timeline type */
    let current_timeline_type;

    /* Retryable document.getElementById() */
    const retryableGetElementById = (id, maxRetries, delay) => {
      return new Promise(resolve => {
        const e = document.getElementById(id);
        if (e) {
          resolve(e);
        } else if (maxRetries-- > 0) {
          setTimeout(() => {
            retryableGetElementById(id, maxRetries, delay).then(e => resolve(e));
          })
        }
      });
    };

    /* Callback managing functions */
    const restoreCallbackCode = () => {
      return localStorage['twm-callback'] || 'return false;';
    };
    const storeCallbackCode = code => {
      localStorage['twm-callback'] = code;
    };
    const setCallback = code => {
      sandbox.postMessage({
        actionType: 'twm-set-callback',
        code,
      }, '*');
    };
    const getTimelineType = () => {
      if (current_timeline_type !== undefined) {
        return current_timeline_type;
      }
      const tl = document.getElementById('timeline');
      if (!tl) {
        return current_timeline_type = null;
      }
      const classes = [...tl.classList];
      /*
      誰も使わなさそうなのでコメントアウト
      if (classes.includes('ProfileTimeline')) {
        return current_timeline_type = 'profile';
      }
      if (classes.includes('AdaptiveSearchTimeline')) {
        return current_timeline_type = 'search';
      }
      */
      if (classes.includes('light-inline-actions')) {
        return current_timeline_type = 'activity';
      }
      if (classes.includes('top-timeline-tweetbox')) {
        return current_timeline_type = 'home';
      }
      return current_timeline_type = null;
    };
    const allowableComponentContext = ['quote_activity', 'reply_activity', 'mention_activity'];
    const execCallback = item => {
      const type = getTimelineType();
      if (!type ||
          type === 'activity' &&
          !allowableComponentContext.includes(item.dataset.componentContext)) {
        return;
      }
      for (const tweet of item.querySelectorAll('.tweet')) {
        const retweeter = tweet.dataset.retweeter;
        const retweetInfo = item.querySelector('.js-retweet-text');
        const params = [
          tweet.dataset.userId,
          tweet.dataset.screenName,
          tweet.dataset.name,
          tweet.querySelector('.tweet-text').textContent,
          !!tweet.dataset.promoted,
          !!retweeter,
          retweeter ? retweetInfo.querySelector('a').dataset.userId : null,
          retweeter,
          retweeter ? retweetInfo.querySelector('b').textContent : null,
          type,
        ];
        sandbox.postMessage({
          actionType: 'twm-exec-callback',
          itemId: item.id,
          params,
        }, '*');
      }
    }

    /* Observers */
    const createPseudoObserver = (nodeType, options, filterCallback, applyCallback) => {
      const observer = new MutationObserver(mutations => {
        const filterCallbackLocal = filterCallback;
        const applyCallbackLocal = applyCallback;
        const filterCallbackInvalid = typeof filterCallbackLocal !== 'function';
        if (typeof applyCallbackLocal !== 'function') {
          return;
        }
        for (const mutation of mutations) {
          for (const item of mutation[nodeType]) {
            if (filterCallbackInvalid || filterCallbackLocal(item)) {
              applyCallbackLocal(item);
            }
          }
        }
      });
      return {
        observe: target => observer.observe(target, options),
        disconnect: () => observer.disconnect(),
      };
    };
    const preObserver = {
      observe: target => {
        for (const child of target.children) {
          execCallback(child);
        }
      },
    };
    const listObserver = createPseudoObserver(
      'addedNodes',
      {childList: true},
      e => e.tagName === 'LI',
      e => execCallback(e)
    );
    const refreshObserver = createPseudoObserver(
      'addedNodes',
      {childList: true, subtree: true},
      e => e.id === 'timeline',
      e => {
        listObserver.disconnect();
        current_timeline_type = undefined;
        retryableGetElementById('stream-items-id', 5, 500).then(streamItems => {
          preObserver.observe(streamItems);
          listObserver.observe(streamItems);
        });
      }
    );

    /* Initialize callback */
    setCallback(restoreCallbackCode());

    /* Start listeing */
    addEventListener('message', e => {
      switch (e.data.actionType) {
        case 'twm-remove-tweet':
          const node = document.getElementById(e.data.itemId);
          node.parentNode.removeChild(node);
          break;
      }
    });

    /* Start observing */
    retryableGetElementById('stream-items-id', 5, 500).then(streamItems => {
      preObserver.observe(streamItems);
      listObserver.observe(streamItems);
    });
    refreshObserver.observe(document);

    /* Insert mute button */
    document.styleSheets[0].insertRule('.Icon--volume-off:before { content: "\\f056"}', 0);
    retryableGetElementById('global-actions', 0, 0).then(topbar => {
      const icon = document.createElement('span');
            icon.className = 'Icon Icon--volume-off Icon--large';
      const text = document.createElement('span');
            text.className = 'text';
            text.textContent = 'ミュート';
      const a = document.createElement('a');
            a.addEventListener('click', e => {
              e.preventDefault();
              const code = window.prompt(
                "ミュート判定関数をJavaScriptで記述。\n" +
                "以下の変数が参照可能。\n" +
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
                "timeline_type(string)\n" +
                "↑ \"home\", \"activity\"\n" +
                "\n" +
                "ミュートする場合: return true;\n" +
                "残したい場合: return false;\n",
                restoreCallbackCode()
              );
              if (code !== null) {
                storeCallbackCode(code);
                setCallback(code);
              }
            });
            a.className = 'js-nav js-tooltip js-dynamic-tooltip';
            a.href = '';
            a.appendChild(icon);
            a.appendChild(text);
        const li = document.createElement('li');
              li.id = 'mute-nav-id';
              li.appendChild(a);
        topbar.appendChild(li);
    });

  });
  iframe.setAttribute('src', chrome.extension.getURL('sandboxes/sandbox.html'));

})(document.createElement('iframe'));
