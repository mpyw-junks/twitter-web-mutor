# twitter-customized-muting

カスタマイズ可能なミュート機能をTwitter公式Web版に提供

## なぜつくったか

- <del>(昔の黒歴史はさておき)</del> 最近私は健全なのでTwitterをするにしても公式の [twitter.com](https://twitter.com)、通称「Web」しか使わない。
- 例の[紐アニメ](http://danmachi.com/)の2話をまだ見ていないのでネタバレ実況が鬱陶しかった。でもWebには正規表現とかでミュートする機能がない。

![screenshot.2015-04-14 (1).png](https://qiita-image-store.s3.amazonaws.com/0/25060/a5f990a9-c6ea-8c58-3041-bd48cb337f62.png)

じゃあ作ろう

## いんすとーる

1. [「Download ZIP」](https://github.com/mpyw/twitter-customized-muting/archive/master.zip)で落としてきて展開
2. [chrome://extensions](chrome://extensions) を開く
3. 「デベロッパーモード」にチェックを入れる
4. 「パッケージ化されていない拡張機能を読み込む」で先ほど展開した **フォルダ** を選択<br /> (`manifest.json`などのファイルが直下にくるフォルダ)

## つかいかた

インストールすると勝手に変なタブが増えます。

![スクリーンショット 2015-04-15 11.41.28.png](https://qiita-image-store.s3.amazonaws.com/0/25060/f26a373a-4e34-962e-3654-5f95d464cb89.png)

但しタブをクリックしてもページ移動するのではなくプロンプトが出現するだけの超絶手抜き仕様です。文句がある人はぜひ勝手に改造してかっちょいいダイアログ出しちゃってください。プルリク大歓迎。

（但し今のところはjQuery使わない前提で書いてる）

![スクリーンショット 2015-04-15 11.39.54.png](https://qiita-image-store.s3.amazonaws.com/0/25060/2fd1bace-0751-1551-4cab-6c4dc1ab0ef6.png)

1行しかないので窮屈ですが、あとは下記の変数を用いて自由にJavaScript関数の内容を書いちゃってください。

|変数|型|意味|
|:--:|:--:|:--:|
|user_id_str|string|ツイート主のユーザID|
|screen_name|string|ツイート主のスクリーンネーム|
|name|string|ツイート主の名前|
|is_promotion|boolean|広告であるかどうか|
|is_retweet|boolean|公式リツイートであるかどうか|
|retweeter_user_id_str|string<br />null|リツイート主のユーザID|
|retweeter_screen_name|string<br />null|リツイート主のスクリーンネーム|
|retweeter_name|string<br />null|リツイート主の名前|
|stream_type|string| "home" "connect" "discover" "search" の何れか<br />それぞれ「ホーム」「通知」「見つける」「検索」の意味|

**ミュートしたい場合は`true`を返し、そうでない場合は`false`を返します。**  
最初は逆だったのですが、こちらの方が直感的だと感じたので後から変更しました。

## せっていれい

こうこくけしてえらいひとにおこられてもしりません  
(スマホでは公式アプリ使って広告ときどきポチポチしてるのでゆるしてください)

#### 何もしない (規定値)

```javascript
return false;
```
#### そして誰もいなくなった

```javascript
return true;
```

#### 広告鬱陶しいなぁ

```javascript
return is_promotion;
```

#### ダンまち実況やめれ

```javascript
return text.indexOf('#danmachi') !== -1;
```

#### @mpyw 公式RTうるせえ

```javascript
return retweeter_screen_name === 'mpyw';
```
