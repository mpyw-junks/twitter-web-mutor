(() => {

  let callback = () => false;

  addEventListener('message', e => {

    switch (e.data.actionType) {

      case 'twm-set-callback':
        callback = new Function(
          'user_id_str',
          'screen_name',
          'name',
          'text',
          'is_promoted',
          'is_retweeted',
          'retweeter_user_id_str',
          'retweeter_screen_name',
          'retweeter_name',
          'stream_type',
          e.data.code
        );
        break;

      case 'twm-exec-callback':
        if (callback(...e.data.params)) {
          e.source.postMessage({
            actionType: 'twm-remove-tweet',
            itemId: e.data.itemId,
          }, e.origin);
        }
        break;

    }

  });

})();
