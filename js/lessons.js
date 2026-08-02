/* 自動生成ファイル。直接編集しない。
   原本は g-kentei-study の lessons/*.md。 */
window.LESSON_DATA = {
  "lessons": [
    {
      "id": "M1-01",
      "module": "M1",
      "title": "AIの定義と3度のブーム",
      "minutes": 40,
      "sections": [
        {
          "heading": "この講で答えられるようになること",
          "html": "<ul><li>「AIの定義は何か」と聞かれたとき、<strong>なぜ即答できないのか</strong>を説明できる</li><li>3度のブームを「時期・中心技術・終わった理由」の3点セットで言える</li><li>第1次と第2次の<strong>終わった理由を取り違えない</strong></li></ul>"
        },
        {
          "heading": "話の流れ",
          "html": "<h4>名前が先にできた</h4>\n<p>1956年、アメリカのダートマス大学で1ヶ月半の研究集会が開かれた。<strong>ダートマス会議</strong>である。提案者はジョン・マッカーシー。ここで<strong>artificial intelligence（人工知能）</strong>という言葉が初めて使われた。会議では、ニューウェルとサイモンが作った<strong>ロジック・セオリスト</strong>が実演された。数学の定理を自動で証明するプログラムで、世界初のAIプログラムとされる。</p>\n<p>ここで押さえるべきは、<strong>「知能とは何か」の合意がないまま名前だけ決まった</strong>ことだ。そして70年経った今も合意はない。<strong>AIの定義は研究者ごとに異なり、統一されたものは存在しない</strong>。これは豆知識ではなく、そのまま出題される。「AIの定義は国際標準で定められている」という選択肢は誤りになる。</p>\n<h4>第1次ブーム：ルールを人が書いた（1950年代後半〜1960年代）</h4>\n<p>中心技術は<strong>探索と推論</strong>だった。迷路の解き方、パズルの解き方を、可能な手を順に試して探す。これはうまくいった。ただし、<strong>ルールが明確で単純化された問題</strong>に限る。こうした問題を<strong>トイプロブレム（おもちゃの問題）</strong>と呼ぶ。</p>\n<p>現実の問題は違った。条件が多く、情報が欠けていて、組み合わせが爆発する。迷路は解けても、病気の診断はできない。<strong>現実の問題を解くには、ルールを人が書ききれなかった。</strong>これが第1次の限界であり、1度目の冬が来た。</p>\n<h4>第2次ブーム：知識を人が書いた（1980年代）</h4>\n<p>反省はこうだった。汎用の探索が駄目なら、<strong>専門知識を詰め込めばいい</strong>。こうして生まれたのが<strong>エキスパートシステム</strong>である。専門家の知識を「もし〜ならば〜」というルールの形で書き、それを使って推論させる。</p>\n<p>代表例が<strong>MYCIN</strong>。感染症の診断を支援するシステムで、専門医に近い精度を出したと報告された。さらに野心的だったのが<strong>Cyc（サイク）プロジェクト</strong>。人間の一般常識をすべて記述しようという試みで、1984年に始まり、今も完了していない。</p>\n<p>ここでも壁にぶつかる。専門家の知識は暗黙的で、言葉にしにくい。書き出せても、量が膨大で、しかも古くなるため保守し続けなければならない。<strong>知識を人手で記述し維持することが困難だった。</strong>これを<strong>知識獲得のボトルネック</strong>と呼ぶ。2度目の冬の主因はこれである。</p>\n<blockquote><strong>ここが最頻出の引っかけ。</strong> 第1次が終わったのは「トイプロブレムしか解けなかったから」、 第2次が終わったのは「知識獲得のボトルネック」。この2つを入れ替えた選択肢が定番。</blockquote>\n<h4>第3次ブーム：人が書くのをやめた（2010年代〜）</h4>\n<p>決定打は2012年だった。画像認識の大会<strong>ILSVRC</strong>で、ディープラーニングを使った<strong>AlexNet</strong>が、2位に10ポイント以上の差をつけて圧勝した。それまでの手法の延長では説明のつかない差だった。</p>\n<p>何が変わったのか。従来の機械学習では、「画像の何を手がかりにするか」を人間が決めていた。輪郭を見るのか、色の分布を見るのか——この設計作業を<strong>特徴量設計</strong>という。これは職人技で、分野ごとに専門家が必要だった。</p>\n<p>ディープラーニングは、<strong>この特徴量設計をデータから自動で獲得する</strong>。人が手がかりを教えなくても、大量の画像から「見るべき特徴」を自分で作り出す。ここが従来手法との本質的な違いであり、第3次ブームの正体である。</p>\n<p>その後、2016年に<strong>AlphaGo</strong>が囲碁のプロ棋士に勝ち、2022年に<strong>ChatGPT</strong>が公開されてブームは加速したが、<strong>起点はあくまで2012年のILSVRC</strong>。ここも問われる。</p>\n<h4>通して読むと</h4>\n<p>3度のブームは、技術が違うだけではない。<strong>行き詰まった理由が毎回違う</strong>。そして毎回、その行き詰まりが次の技術を生む動機になっている。</p>\n<ul><li>第1次：ルールを人が書いた → 書ききれなかった</li><li>第2次：知識を人が書いた → 書ききれなかった</li><li>第3次：データから学習させた → <strong>人が書くのをやめた</strong></li></ul>\n<p>つまりAIの歴史は「<strong>人間が手で与える部分を、どこまで機械に肩代わりさせるか</strong>」の歴史として読める。年号を丸暗記するより、この因果で覚えるほうが遥かに落ちにくい。</p>\n<p>この軸は、製品をAIらしさで4段階に分ける<strong>AIのレベル1〜4</strong>とも重なる。レベル1は単純な制御、レベル2はルールと探索、レベル3は機械学習、レベル4はディープラーニング。上に行くほど、人が手で決める部分が減っていく。</p>"
        },
        {
          "heading": "年表",
          "html": "<div class=\"tablewrap\"><table><thead><tr><th>年</th><th>出来事</th><th>なぜ重要か</th></tr></thead><tbody><tr><td data-label=\"年\">1950</td><td data-label=\"出来事\">チューリングが論文で「機械は考えられるか」を論じる</td><td data-label=\"なぜ重要か\">ダートマス会議より<strong>前</strong>。順番の引っかけに使われる</td></tr><tr><td data-label=\"年\">1956</td><td data-label=\"出来事\">ダートマス会議（マッカーシー）</td><td data-label=\"なぜ重要か\">「artificial intelligence」の初出。第1次の起点</td></tr><tr><td data-label=\"年\">1956</td><td data-label=\"出来事\">ロジック・セオリスト（ニューウェル＆サイモン）</td><td data-label=\"なぜ重要か\">世界初のAIプログラムとされる</td></tr><tr><td data-label=\"年\">1966</td><td data-label=\"出来事\">ELIZA</td><td data-label=\"なぜ重要か\">対話プログラム。意味を理解してはいない</td></tr><tr><td data-label=\"年\">1970年代</td><td data-label=\"出来事\">1度目の冬</td><td data-label=\"なぜ重要か\">原因はトイプロブレムの限界</td></tr><tr><td data-label=\"年\">1980年代</td><td data-label=\"出来事\">エキスパートシステム、MYCIN</td><td data-label=\"なぜ重要か\">第2次の中心技術</td></tr><tr><td data-label=\"年\">1984</td><td data-label=\"出来事\">Cycプロジェクト開始</td><td data-label=\"なぜ重要か\">常識をすべて記述する試み。知識記述の限界の象徴</td></tr><tr><td data-label=\"年\">1990年代</td><td data-label=\"出来事\">2度目の冬</td><td data-label=\"なぜ重要か\">原因は知識獲得のボトルネック</td></tr><tr><td data-label=\"年\">2012</td><td data-label=\"出来事\">ILSVRC で AlexNet が圧勝</td><td data-label=\"なぜ重要か\"><strong>第3次の起点</strong></td></tr><tr><td data-label=\"年\">2016</td><td data-label=\"出来事\">AlphaGo がプロ棋士に勝利</td><td data-label=\"なぜ重要か\">加速させたが起点ではない</td></tr><tr><td data-label=\"年\">2022</td><td data-label=\"出来事\">ChatGPT 公開</td><td data-label=\"なぜ重要か\">第3次の中の生成AI局面</td></tr></tbody></table></div>"
        },
        {
          "heading": "用語の整理",
          "html": "<p>本文で出てきた語の確認。ここで初めて見る語はないはずなので、詰まったら本文に戻ること。</p>\n<div class=\"tablewrap\"><table><thead><tr><th>用語</th><th>ひとことで</th><th>試験ではこう問われる</th></tr></thead><tbody><tr><td data-label=\"用語\">AIの定義</td><td data-label=\"ひとことで\">研究者ごとに異なり、統一されたものはない</td><td data-label=\"試験ではこう問われる\">「定義が存在しないこと」自体が正解の選択肢になる</td></tr><tr><td data-label=\"用語\">AIのレベル1〜4</td><td data-label=\"ひとことで\">1:単純な制御 2:ルール・探索 3:機械学習 4:ディープラーニング</td><td data-label=\"試験ではこう問われる\">製品の事例を提示してレベルを判定させる</td></tr><tr><td data-label=\"用語\">ダートマス会議</td><td data-label=\"ひとことで\">1956年、「artificial intelligence」の初出</td><td data-label=\"試験ではこう問われる\">年号ずらし（1946/1966）との組み合わせ</td></tr><tr><td data-label=\"用語\">ロジック・セオリスト</td><td data-label=\"ひとことで\">定理を自動証明する、世界初とされるAIプログラム</td><td data-label=\"試験ではこう問われる\">第2次のシステムと時代を入れ替えられる</td></tr><tr><td data-label=\"用語\">トイプロブレム</td><td data-label=\"ひとことで\">ルールが明確で単純化された問題</td><td data-label=\"試験ではこう問われる\"><strong>第1次</strong>が終わった理由として問われる</td></tr><tr><td data-label=\"用語\">エキスパートシステム</td><td data-label=\"ひとことで\">専門知識をルールで書いて推論させる仕組み</td><td data-label=\"試験ではこう問われる\">機械学習（データから獲得）との方向の違い</td></tr><tr><td data-label=\"用語\">MYCIN</td><td data-label=\"ひとことで\">感染症診断のエキスパートシステム</td><td data-label=\"試験ではこう問われる\">ELIZA（第1次の対話プログラム）と混同させる</td></tr><tr><td data-label=\"用語\">Cycプロジェクト</td><td data-label=\"ひとことで\">一般常識をすべて記述しようとした長期計画</td><td data-label=\"試験ではこう問われる\">知識記述の限界の象徴として</td></tr><tr><td data-label=\"用語\">知識獲得のボトルネック</td><td data-label=\"ひとことで\">専門知識を人手で記述・保守しきれない問題</td><td data-label=\"試験ではこう問われる\"><strong>第2次</strong>が終わった理由。最頻出</td></tr><tr><td data-label=\"用語\">ILSVRC / AlexNet</td><td data-label=\"ひとことで\">2012年、DLが画像認識大会で圧勝した</td><td data-label=\"試験ではこう問われる\">第3次の起点。AlphaGo・ChatGPTと入れ替えられる</td></tr><tr><td data-label=\"用語\">特徴量設計</td><td data-label=\"ひとことで\">何を手がかりにするかを人が決める作業</td><td data-label=\"試験ではこう問われる\">DLがこれを自動化した点が「本質的な違い」</td></tr></tbody></table></div>"
        },
        {
          "heading": "実務との接続",
          "html": "<p>日々LLMを使っていると「AIは自然言語で指示すれば動く」のが当たり前に見える。試験が問うのは、<strong>なぜそこに至るまで60年かかったか</strong>のほうだ。</p>\n<ul><li>プロンプトにルールを細かく書き込んで破綻した経験 → <strong>第2次エキスパートシステムの縮小再生産</strong></li><li>RAGで社内知識を整備する労力 → <strong>知識獲得のボトルネックの現代版</strong>。人が知識を書く仕事は消えていない</li><li>ファインチューニングなしでタスクが解ける → 特徴量設計を人がやらなくてよくなった帰結</li></ul>\n<p>この対応づけができていれば、M1は暗記ではなく理解で解ける。</p>"
        },
        {
          "heading": "混同ペア",
          "html": "<p>出題者が入れ替えてくる組み合わせ。左右を逆にした選択肢が来たら誤り。</p>\n<div class=\"tablewrap\"><table><thead><tr><th>これ</th><th>と、これ</th></tr></thead><tbody><tr><td data-label=\"これ\">第1次の終わり＝<strong>トイプロブレム</strong>しか解けなかった</td><td data-label=\"と、これ\">第2次の終わり＝<strong>知識獲得のボトルネック</strong></td></tr><tr><td data-label=\"これ\">ダートマス会議＝<strong>1956年</strong></td><td data-label=\"と、これ\">チューリングの論文＝<strong>1950年</strong>（会議より前）</td></tr><tr><td data-label=\"これ\">第3次の起点＝<strong>ILSVRC 2012</strong>（AlexNet）</td><td data-label=\"と、これ\">加速させた出来事＝AlphaGo 2016 / ChatGPT 2022</td></tr><tr><td data-label=\"これ\">MYCIN＝第2次の<strong>エキスパートシステム</strong></td><td data-label=\"と、これ\">ELIZA＝第1次の<strong>対話プログラム</strong>（理解はしていない）</td></tr><tr><td data-label=\"これ\">レベル3＝<strong>機械学習</strong>を使う（例：決定木の推薦）</td><td data-label=\"と、これ\">レベル4＝<strong>ディープラーニング</strong>（特徴を自動獲得）</td></tr><tr><td data-label=\"これ\">「中国語の部屋」＝<strong>サール</strong>の主張</td><td data-label=\"と、これ\">チューリングテスト＝<strong>チューリング</strong>（M1-02で扱う）</td></tr></tbody></table></div>"
        },
        {
          "heading": "この講の要点3行",
          "html": "<ul><li>AIに統一定義はなく、<strong>それ自体が出題対象</strong></li><li>3度のブームは「時期・中心技術・終わった理由」の3点セット。特に<strong>第1次＝トイプロブレム／第2次＝知識獲得のボトルネック</strong>の取り違えが最頻出</li><li>DLの本質は<strong>特徴量設計の自動化</strong>。これがAI史全体の「人手の肩代わり」という流れの到達点</li></ul>"
        }
      ]
    }
  ]
};
