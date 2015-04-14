(function () {
    
    var callback = function () { return true; };
    
    window.addEventListener('message', function (e) {
        switch (e.data.action_type) {
            case 'set_callback':
                callback = new Function(
                    'user_id_str',
                    'screen_name',
                    'name',
                    'text',
                    'is_in_notification_tab',
                    'is_promotion',
                    'is_retweet',
                    'retweeter_user_id_str',
                    'retweeter_screen_name',
                    'retweeter_name',
                    e.data.code
                );
                break;
            case 'go_callback':
                if (!callback.apply({}, e.data.params)) {
                    e.source.postMessage({
                        action_type: 'tcm-remove-tweet',
                        item_id: e.data.item_id,
                    }, e.origin);
                }
                break;
        }
    });
    
})();