# twitter-web-mutor

カスタマイズ可能なミュート機能をTwitter公式Web版に提供します．

## インストール

1. [「Download ZIP」](https://github.com/mpyw/twitter-web-mutor/archive/master.zip)で落としてきて展開
2. [chrome://extensions](chrome://extensions) を開く
3. 「デベロッパーモード」にチェックを入れる
4. 「パッケージ化されていない拡張機能を読み込む」で先ほど展開した **フォルダ** を選択<br /> (`manifest.json`などのファイルが直下にくるフォルダ)

## 使い方

インストールすると勝手に変なタブが増えます．

![スクリーンショット 2015-04-15 11.41.28.png](https://qiita-image-store.s3.amazonaws.com/0/25060/f26a373a-4e34-962e-3654-5f95d464cb89.png)

![スクリーンショット 2015-04-15 11.39.54.png](https://qiita-image-store.s3.amazonaws.com/0/25060/2fd1bace-0751-1551-4cab-6c4dc1ab0ef6.png)

1行しかないので窮屈ですが，あとは下記の変数を用いて自由にJavaScript関数の内容を書いちゃってください．

|変数|型|意味|
|:--:|:--:|:--:|
|user_id_str|string|ツイート主のユーザID|
|screen_name|string|ツイート主のスクリーンネーム|
|name|string|ツイート主の名前|
|is_promoted|boolean|広告であるかどうか|
|is_retweeted|boolean|公式リツイートであるかどうか|
|retweeter_user_id_str|string<br />null|リツイート主のユーザID|
|retweeter_screen_name|string<br />null|リツイート主のスクリーンネーム|
|retweeter_name|string<br />null|リツイート主の名前|
|stream_type|string| "home" "connect" "discover" "search" の何れか<br />それぞれ「ホーム」「通知」「見つける」「検索」の意味|

**ミュートしたい場合は`true`を返し，そうでない場合は`false`を返します．**  

## 設定例

#### 何もしない (規定値)

```javascript
return false;
```

#### 反原発タグをミュート

```javascript
return text.indexOf('#反原発') !== -1;
```
