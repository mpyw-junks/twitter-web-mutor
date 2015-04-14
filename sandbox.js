(function () {
    
    var callback = function () { return true; };
    
    window.addEventListener('message', function (e) {
        switch (e.data.actionType) {
            case 'set-callback':
                callback = new Function(
                    'user_id_str',
                    'screen_name',
                    'name',
                    'text',
                    'is_in_notification_area',
                    'is_promotion',
                    'is_retweet',
                    'retweeter_user_id_str',
                    'retweeter_screen_name',
                    'retweeter_name',
                    e.data.code
                );
                break;
            case 'go-callback':
                if (!callback.apply({}, e.data.params)) {
                    e.source.postMessage({
                        actionType: 'tcm-remove-tweet',
                        itemId: e.data.itemId,
                    }, e.origin);
                }
                break;
        }
    });
    
})();