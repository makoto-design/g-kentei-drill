/* M2-01: 理解を助ける図と段階的な補足。生成AIを実行せず端末内で表示する。 */
(function () {
  'use strict';
  var extra = {
    supervised: {
      diagramText: '学習時は「広さ30㎡・駅距離5分 → 実際の家賃7万円」のように入力と正解のペアを使う。学習したモデルに、新しい物件の特徴量を渡すと予測家賃が出る。予測時は正解家賃を入力しない。',
      moreSteps: [
        ['1. 同じ表でも列の役割が違う', '物件ごとに「広さ30㎡、駅距離5分、家賃7万円」のような行を集めます。家賃を予測したいなら、広さと駅距離が入力側、家賃が正解側です。この教本は入力側の各項目を特徴量、正解側を教師データと呼んでいます。'],
        ['2. 正解は、規則を学ぶために使う', 'モデルの予測が6万円で実際は7万円だったなら、1万円のずれがあります。このような予測と正解の関係を使って、入力から答えを出す規則を学びます。具体的にどう規則を決めるかは手法によって異なります。'],
        ['3. 学習と予測を分けて考える', '学習では答え付きの例を用意します。学習後、新しい物件を予測するときに渡すのは特徴量です。新しい物件の正解があらかじめ必要なら、未知の家賃を当てる目的を果たせません。']
      ],
      exampleSteps: [
        ['別の場面：メールの仕分け', '過去のメールに「スパム／通常」という正解ラベルが付いているとします。本文から取り出した特定の単語の出現などを入力、正解ラベルを答えとしてペアにします。'],
        ['何を学ぶ？', '「この単語があれば必ずスパム」と人が全部決めるのではなく、どんな特徴の組合せが各ラベルと結び付きやすいかを、多くの例から学びます。1通だけの特殊な表現を丸暗記することが目的ではありません。'],
        ['新着メールではどうなる？', 'まだ判定していないメールから、学習時と同じ種類の特徴量を取り出し、モデルに渡します。出てくるのが予測ラベルです。過去の「正解ラベル」と新着メールの「予測ラベル」は、役割が違います。']
      ]
    },
    tasks: {
      diagramText: '同じ物件情報からでも、家賃7.2万円という連続値を予測するなら回帰、安い・普通・高いというカテゴリを選ぶなら分類。入力ではなく出力の役割で判定する。',
      moreSteps: [
        ['1. 先に「欲しい答え」を書く', '「家賃7.2万円」のように量そのものを求めるなら回帰です。「安い・普通・高い」のどれかを選ぶなら分類です。どちらも広さや駅距離を入力にできるので、入力だけでは区別できません。'],
        ['2. 数字の見た目に惑わされない', 'カテゴリを「安い＝0、普通＝1、高い＝2」と番号にしても、役割は種類の選択です。番号を付けたから回帰に変わるわけではありません。手書き数字の0〜9も、認識する課題ではカテゴリです。'],
        ['3. 途中の数値と最終目的も別', '分類モデルが「スパムの確率0.8」を計算することはあります。数値が途中に登場しても、カテゴリを判定する課題なら分類です。手法の出力形式と、解きたい問題の目的を一緒に確認しましょう。']
      ],
      exampleSteps: [
        ['別の場面：同じ製品の検査', '画像から「傷の長さは2.3mm」と量を見積もる課題は回帰です。2.2mm、2.4mmなど、値の差そのものに意味があります。'],
        ['問いを変えると分類になる', '同じ画像で「傷あり・汚れあり・問題なし」から選ぶなら多クラス分類です。さらに「合格／不合格」だけなら2値分類。使ったカメラではなく、求める答えによって問題が変わります。'],
        ['境目を確認する', '「傷が3mm以上なら不合格」という判定も考えられます。長さを予測する部分は回帰、その値から合否を決める部分はカテゴリへの判定です。1つの処理の中に両方の役割がある場合も、段階を分けると整理できます。']
      ]
    },
    linear: {
      diagramText: '説明用の式は家賃（万円）=0.1×広さ（㎡）+3。30㎡→6万円、40㎡→7万円、60㎡→9万円。グラフの直線上が予測、周囲の点が学習データの例。全点が線に一致する必要はない。',
      moreSteps: [
        ['1. 係数は「変化の効き方」', '説明用の式「家賃＝0.1×広さ＋3」を見ます。広さが10㎡増えると、予測家賃は1万円増えます。0.1が直線の傾き、3が切片です。この式では、広さによる増減を一定の割合として表しています。'],
        ['2. 学習時に式を決める', '本番の学習では、人がこの0.1と3を固定で教えるのではなく、過去の広さと家賃から係数を求めます。たとえば予測が7万円でも実際は7.5万円ならずれがあり、そうしたずれを考えて全体に合う式を決めます。'],
        ['3. 予測時には式を使う', '学習が終われば40㎡を式へ入れて、0.1×40＋3＝7万円と計算できます。「線を学ぶ段階」と「線から値を読む段階」を区別してください。学習で見たことのない広さでも式で予測できますが、正確さが保証されるわけではありません。']
      ],
      exampleSteps: [
        ['別の場面：気温とアイスの売上', '説明用に「売上個数＝5×気温−50」という式が学習できたとします。20℃なら50個、25℃なら75個、30℃なら100個。気温が5℃上がるごとに25個増える関係を表しています。'],
        ['グラフと式を対応させる', '横軸が気温、縦軸が売上です。予測の点をつなぐと直線になり、傾き5は「気温が1℃上がると5個増える」に対応します。雨や曜日の影響で実際の売上が直線からずれることもあります。'],
        ['式の限界も見る', 'この式に極端に低い気温を入れると負の個数になりますが、現実に負の個数を売るわけではありません。式は実際の関係を単純化したもの。学んだ範囲から大きく外れた場面でも、そのまま正しいとは限りません。']
      ]
    },
    multiple: {
      diagramText: '単回帰は「広さ」1項目から家賃を予測。重回帰は「広さ・駅距離・築年数」の複数項目から同じ家賃を予測。どちらも出力は1つ。物件の件数はこの区別に関係しない。',
      moreSteps: [
        ['1. 行数ではなく、入力の列を数える', '物件1,000件の表でも、家賃を予測する入力列が広さだけなら単回帰です。1,000という数は事例の件数。「重回帰」の「重」を決める数ではありません。正解の家賃の列も入力として数えません。'],
        ['2. 手がかりごとに係数を持つ', '重回帰は「家賃＝a×広さ＋b×駅距離＋c×築年数＋基準値」のような形です。a、b、cは、それぞれの項目が予測値にどう効くかを表す係数です。出力の家賃が1つでも、入力が複数なら重回帰になります。'],
        ['3. 何を固定した比較かを意識する', '広さの係数を考えるときは、ほかの入力を同じにしたまま広さを変えるイメージです。「広い物件は駅から遠い」など入力同士の関係もあり得るため、係数を見てすぐ現実の因果関係が証明されたとは言えません。']
      ],
      exampleSteps: [
        ['別の場面：電力使用量を予測する', '気温だけを入力するなら単回帰です。過去365日分を使っても、入力項目は気温1つなので単回帰のままです。'],
        ['建物の大きさも使う', '同じ気温でも大きい建物ほど電力を使いそうなら、建物面積を追加します。さらに利用人数も加えれば、入力は気温・面積・人数の3項目。電力使用量という1つの出力を、3つの手がかりで見積もる重回帰です。'],
        ['よくある取り違え', '「出力が電力1つだから単回帰」「365日使うから重回帰」は、どちらも数える対象が違います。入力の種類を数えると迷いません。入力を増やせば必ず良い予測になる、という意味でもありません。']
      ]
    },
    logistic: {
      diagramText: '入力→線形のスコア→シグモイド関数で0〜1の確率→しきい値でカテゴリ判定。確率0.7でも基準0.5ならスパム、基準0.8なら通常。基準を変えても予測確率0.7自体は変わらない。',
      moreSteps: [
        ['1. スコアと確率は同じではない', '入力に重みを掛けて足したスコアは、−2や3など、0〜1の外の値にもなります。「スパム確率−200％」では意味が通りません。そこで二値分類では、シグモイド関数という変換で0〜1に収めます。'],
        ['2. 確率を判定に使う', '変換後が0.7なら、スパムである確率を70％と見積もったということです。基準を0.5にすればスパムと判定。基準を0.8にすれば、同じ0.7でも通常側になります。基準は分類の判断に使う値です。'],
        ['3. 名前より用途で区別する', '線形回帰で家賃7万円を予測するのとは違い、ここではどちらのカテゴリに属するかを判断します。計算途中で確率という数値を出しても、ロジスティック回帰が分類に使う手法である点は変わりません。']
      ],
      exampleSteps: [
        ['別の場面：顧客の解約予測', '利用回数や契約期間などから、ある顧客の解約確率を0.6と予測したとします。これは「6日後に解約」でも「必ず解約」でもなく、解約カテゴリに属する見込みを60％と表した値です。'],
        ['確率から対応対象を選ぶ', 'たとえば基準0.5以上の顧客を「解約しそう」とするなら、この顧客は対象です。基準を0.8へ上げると対象から外れます。変わったのは判断の基準であり、モデルが出した0.6を0.8に書き換えたわけではありません。'],
        ['問いが変われば役割も変わる', '「解約する／しない」を当てたいのか、「解約まで何日か」を当てたいのかを分けましょう。前者が今回の分類の例。後者の具体的な日数を求める課題とは、欲しい出力が違います。']
      ]
    },
    'ar-var': {
      diagramText: 'ARは売上の昨日・一昨日から今日の売上を予測。VARは売上と来客数など複数系列それぞれの過去を使い、複数系列の現在をまとめてモデル化する。時点が複数でも系列が1つならAR。',
      moreSteps: [
        ['1. 時点と系列を分ける', '昨日と一昨日は「別の時点」ですが、どちらも売上なら「同じ系列」です。ARは同じ系列自身の過去を使います。過去を2日、3日と増やしても、系列を増やしたことにはなりません。'],
        ['2. 重み付き和を数字で見る', '説明用に「今日の売上＝0.7×昨日＋0.3×一昨日」とします。昨日100、一昨日80なら、70＋24＝94です。実際のARモデルは定数項や誤差も扱いますが、ここでは自分の過去を入力にする部分に注目します。'],
        ['3. VARは系列の組を広げる', '売上だけでなく来客数も一緒に扱うなら、今日の売上を両系列の過去から表し、今日の来客数も両系列の過去から表す形に広げられます。互いの過去を予測に使うことと、因果関係が証明されることは別です。']
      ],
      exampleSteps: [
        ['別の場面：気温と電力需要', 'ある地域の気温を、その地域の昨日・一昨日の気温から予測するのがARの例です。何日分使うかという選択と、何種類の指標を扱うかという選択を分けてください。'],
        ['2つの系列を一緒にモデル化', '気温と電力需要の2系列をVARで扱うなら、気温の式にも電力需要の式にも、両方の過去の値を入力できます。図の「複数系列」は、測定日が2つあるという意味ではありません。'],
        ['教本の例につなぐ', '教本では金利・物価・為替を挙げています。金利の過去だけを見るARから、複数指標の過去をまとめて扱うVARへ広げるイメージです。「自己＝自動で学習」「ベクトル＝過去の日数が多い」ではありません。']
      ]
    },
    margin: {
      diagramText: '2群を分ける境界を移動する図。点の横位置100と210が各群の最寄り。境界x=125なら最小距離25、x=155なら最小距離55。片側へ寄せず両側の最小距離を広げる。図は直線分離できる場合の模式図。',
      moreSteps: [
        ['1. 分けられる線は1本ではない', '赤の集まりと青の集まりの間に隙間があるなら、その隙間の中の何本もの線が今のデータを正しく分けられます。「正解した件数が同じ」だけでは、どの境界を選ぶか決まりません。'],
        ['2. 一番危うい点までの余裕を見る', '境界が赤の点すれすれなら、少し位置が変わった赤い点は青側に入りそうです。赤側だけでなく青側も見て、境界から一番近い点までの距離を大きくします。遠くの点との平均距離ではありません。'],
        ['3. それがマージン最大化', '図のボタンで境界を動かすと、最寄りの点までの余裕が変わります。ここはきれいに直線分離できる場合の説明です。マージンを取ることで未知のデータへの強さを目指しますが、どんな新しい点も必ず正解する保証ではありません。']
      ],
      exampleSteps: [
        ['別の場面：2色のボールと仕切り', '赤いボールを左、青いボールを右に置きます。赤のすぐ右に仕切りを置いても、現時点では全て正しく分けられます。しかし赤いボールが少し右へ動くと越えてしまいます。'],
        ['仕切りを中央へ寄せる', '左右の最寄りのボールから距離を取る位置なら、小さな動きに対して余裕があります。右へ寄せすぎると今度は青側が狭くなるので、「片側を広くする」だけでは不十分です。'],
        ['データへ戻して理解する', 'ボールの位置が特徴量、色が正解カテゴリ、仕切りが分類境界に対応します。今ある点を分けるだけでなく、その境界の選び方にも基準を持たせるのがSVMの工夫です。']
      ]
    },
    mapping: {
      diagramText: '変換前は中央の赤丸を青い四角が囲み、直線1本では分けられない。中心に近いほど高い座標を全点に同じ規則で追加すると、赤丸は上、青四角は下になり平面で分けられる。色ラベルは変換に使わない。',
      moreSteps: [
        ['1. 境界の位置だけでは解決しない', '中央の赤を青が囲む配置では、まっすぐな境界を動かしても2群を分けられません。前のマージン最大化は「分けられる線のどれを選ぶか」の話で、この配置をそのまま直線で分ける力を与えるわけではありません。'],
        ['2. 元の入力から新しい座標を作る', 'ここでは中心からの距離を使い、「中心に近いほど高い」という同じ規則を全点に適用します。赤だから持ち上げるのではありません。新しい点も位置さえ分かれば同じ計算ができることが重要です。'],
        ['3. 平面と曲線は同じ判定を表す', '持ち上げた後は、高さの境目で上下に分けられます。その境目を元の平面で見ると、中央を囲む円です。変換後の平らな境界が、元の空間では曲がった境界に対応します。厳密には特徴写像と、その空間の内積を求めるカーネル関数は区別します。']
      ],
      exampleSteps: [
        ['別の配置：数直線の中央と両端', '位置xが−2、−1、0、1、2の5点を考えます。中央の−1、0、1をA、両端の−2、2をBにしたいとき、数直線を1か所で区切るだけでは両端のBをまとめられません。'],
        ['全点に同じ計算をする', 'x²を作ると、順に4、1、0、1、4になります。Aは0か1、Bは4。そこで「x²が2より小さいならA」とすれば分けられます。A・Bのラベルを見て数字を変えたのではなく、全点を二乗しただけです。'],
        ['元の位置ではどう見える？', 'x²＜2は、元の数直線では−√2と√2の間にあるという意味です。変換後の1つの基準が、元の空間では両側に境界を持つ判定に対応しています。変換で分けやすさが変わることを確認しましょう。']
      ]
    },
    kernel: {
      diagramText: '明示的な方法は入力→高次元の全座標を作る→内積。カーネルトリックは入力2点→カーネル関数→同じ内積。写像φ(x)=(x,x²)、x=2,y=3なら内積2×3+4×9=42、K(x,y)=xy+(xy)²でも6+36=42。',
      moreSteps: [
        ['1. 必要なのは座標そのものとは限らない', '高次元の空間で分類境界を求める計算を、データ同士の内積を使う形に書ける場合があります。そのとき、すべての高次元座標を保存しなくても、必要な内積の値が分かれば計算を進められます。'],
        ['2. 小さな計算例で確かめる', '説明用に、数xを（x, x²）へ変換します。2は（2,4）、3は（3,9）。内積は対応する成分を掛けて足すので、2×3＋4×9＝42です。元の入力からK(x,y)＝xy＋(xy)²を計算しても、6＋36＝42になります。'],
        ['3. 同じ結果を別の経路で得る', 'この例では小さな差ですが、変換後の成分が非常に多いと、全部の座標を作らずに済む利点が出ます。必要な内積を直接求めるのがカーネルトリック。「高次元の効果を使う」と「高次元の座標を実際に全部作る」は別です。']
      ],
      exampleSteps: [
        ['別のたとえ：合計だけ必要な計算', '各項目を並べた長い明細をすべて作ってから合計する方法と、同じ合計を直接求める式を使う方法を考えます。合計しか後の処理で使わないなら、明細を毎回作らずに済む余地があります。'],
        ['どこがカーネルに対応する？', '高次元の座標の並びが明細、必要な内積が合計、同じ値を直接求める式がカーネル関数に対応します。これは計算経路のたとえで、カーネルが単なる足し算という意味ではありません。'],
        ['SVMのもう1つの工夫と分ける', 'この近道は計算の仕方の工夫です。一方、境界の両側に余裕を取る基準がマージン最大化。カーネルトリックが「どの境界が良いか」を代わりに決めるのではなく、それぞれが別の役割を持ちます。']
      ]
    }
  };
  window.CONVERSATION_DATA.units.forEach(function (u) { Object.assign(u, extra[u.id]); });
  function box(label, value) { return '<div class="cv-vbox"><small>' + label + '</small><strong>' + value + '</strong></div>'; }
  function arrow() { return '<div class="cv-varrow" aria-hidden="true">↓</div>'; }
  function svg(label, inner) { return '<svg viewBox="0 0 320 240" role="img" aria-label="' + label + '">' + inner + '</svg>'; }
  function t(x,y,label,cls) { return '<text x="'+x+'" y="'+y+'" class="'+(cls||'')+'">'+label+'</text>'; }
  function choice(mode,label,active) { return '<button type="button" data-visual="'+mode+'" aria-pressed="'+(mode===active)+'">'+label+'</button>'; }
  function escapeText(value) { return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function panel(label, value, active) { return '<div class="cv-vbox' + (active ? ' is-active' : '') + '"><small>' + escapeText(label) + '</small><strong>' + value + '</strong></div>'; }
  function signed(value) { return (value >= 0 ? '+' : '−') + Math.abs(value); }
  function expandedFigure(unit, mode) {
    var spec = unit.diagramSpec, body = '', controls = '';
    var selected = spec.modes && (spec.modes.find(function (item) { return item.id === mode; }) || spec.modes[0]);
    if (selected) controls = spec.modes.map(function (item) { return choice(item.id, escapeText(item.label), selected.id); }).join('');
    if (spec.kind === 'tree-path') {
      var near = selected.id === 'near';
      body = panel('条件1 · 今回は「はい」', '広さ50㎡以上？', true) +
        '<div class="cv-tree-option"><span class="cv-branch-label">いいえ · 今回は通らない</span>' + panel('予測', '家賃6万円') + '</div>' +
        '<div class="cv-tree-option is-active"><span class="cv-branch-label">はい · 今回通る経路</span>' + panel('条件2', '駅10分以内？', true) +
        '<div class="cv-branch"><div class="cv-tree-option' + (near ? ' is-active' : '') + '"><span class="cv-branch-label">はい' + (near ? ' · 通る' : '') + '</span>' + panel('予測', '家賃10万円', near) + '</div>' +
        '<div class="cv-tree-option' + (!near ? ' is-active' : '') + '"><span class="cv-branch-label">いいえ' + (!near ? ' · 通る' : '') + '</span>' + panel('予測', '家賃8万円', !near) + '</div></div></div>' +
        panel(selected.label + 'の最終予測', escapeText(selected.result), true) + '<p class="cv-diagram-note">新しい物件の正解家賃は入力しません。表示は予測値です。</p>';
    } else if (spec.kind === 'aggregate') {
      body = '<div class="cv-diagram-stack">' + selected.predictions.map(function (prediction, i) { return panel('モデル' + (i + 1) + 'の予測', escapeText(prediction)); }).join('') + '</div>' + arrow() +
        panel(selected.id === 'classification' ? '多数決 · 最終予測' : '単純平均 · 最終予測', escapeText(selected.result), true) + '<p class="cv-diagram-note">まとめても、必ず当たるとは限りません。</p>';
    } else if (spec.kind === 'bootstrap') {
      body = panel('元データ · 正解付きの訓練例', 'A・B・C・D・E') + '<p class="cv-diagram-note">引いたら元に戻し、重複を許して抽出します。</p><div class="cv-diagram-stack">' + spec.samples.map(function (sample, i) {
        return '<div class="cv-bootstrap-row">' + panel('標本' + (i + 1), '<span class="cv-chip-row">' + sample.map(function (item) {
          var repeat = sample.filter(function (v) { return v === item; }).length > 1;
          return '<span class="cv-chip' + (repeat ? ' is-repeat' : '') + '">' + escapeText(item) + (repeat ? '<small>重複</small>' : '') + '</span>';
        }).join('') + '</span>') + '<span class="cv-varrow" aria-hidden="true">→</span>' + panel('この標本から学ぶ', 'モデル' + (i + 1)) + '</div>';
      }).join('') + '</div><p class="cv-diagram-note">各モデルは互いの結果を待たずに学べる。</p>' + arrow() + panel('学習後 · 同じ新しい対象への予測を持ち寄る', '平均・多数決でまとめる', true);
    } else if (spec.kind === 'forest-features') {
      body = panel('① 訓練例（行）を重複ありで抽出', '標本ごとに別々の決定木を学ぶ') + arrow() +
        panel('② 分岐の候補（列）もランダムに選ぶ', 'すべての特徴量を毎回の候補にしない') + '<p class="cv-diagram-note">' + escapeText(selected.label) + '</p><div class="cv-feature-list">' + spec.features.map(function (feature) {
          var candidate = selected.selected.includes(feature);
          return panel(candidate ? '候補' : 'この分岐では候補外', escapeText(feature), candidate);
        }).join('') + '</div><p class="cv-diagram-note">各分岐で候補を選ぶ。木全体で固定ではありません。</p>' + arrow() + panel('複数の木の予測', '平均・多数決でまとめる');
    } else if (spec.kind === 'boosting-chain') {
      body = '<p class="cv-diagram-note">学習中の図です。正解が分かる訓練データで比べます。</p>' + panel('①', '最初のモデルを学ぶ') + arrow() + panel('正解付きの訓練例で確認', '予測と正解を比べる') + arrow() + panel('②', '弱点を補うモデルを追加') + arrow() + panel('モデル1＋2', '組み合わせた予測を確認') + arrow() + panel('③', 'さらに補うモデルを追加') + '<div class="cv-vdivider">作ったモデルをすべて組み合わせる</div>' + panel('最終予測', 'モデル1 ＋ モデル2 ＋ モデル3<br>作ったモデルの組合せ', true) + '<p class="cv-diagram-note">「＋」は組み合わせる意味です。最後のモデルだけに置き換えません。</p>';
    } else if (spec.kind === 'residual') {
      body = '<div class="cv-vcolumns">' + panel('訓練例の正解', selected.actual + '万円') + panel('現在の予測', selected.prediction + '万円') + '</div>' + arrow() +
        panel('実際の残差＝正解−予測', selected.actual + ' − ' + selected.prediction + ' ＝ ' + signed(selected.residual) + '万円') + arrow() +
        panel('追加モデルの補正予測', signed(selected.correction) + '万円') + arrow() +
        panel('更新後の予測', selected.prediction + ' ＋（' + signed(selected.correction) + '）＝ ' + selected.updated + '万円', true) +
        '<p class="cv-diagram-note">残ったずれ：' + selected.actual + ' − ' + selected.updated + ' ＝ ' + signed(selected.remaining) + '万円<br>' + (selected.correction > 0 ? '正の補正を足して、予測を上げます。' : '負の補正を足して、予測を下げます。') + '</p>';
    } else if (spec.kind === 'comparison-map') {
      body = '<table><caption>モデルを作るときの違い</caption><thead><tr><th scope="col">比較する点</th><th scope="col">バギング</th><th scope="col">ブースティング</th></tr></thead><tbody>' + spec.rows.map(function (row) {
        return '<tr><th scope="row">' + escapeText(row[0]) + '</th><td>' + escapeText(row[1]) + '</td><td>' + escapeText(row[2]) + '</td></tr>';
      }).join('') + '</tbody></table><p class="cv-diagram-note">分散・偏りは主な狙いの整理です。改善を保証するものではありません。</p><div class="cv-methods"><h3>この講の地図</h3>' + panel('式の形', '線形回帰・ロジスティック回帰・AR／VAR') + panel('境界', 'SVM') + panel('分岐と組合せ', '決定木 → 複数の木を組み合わせる<br>ランダムフォレスト・勾配ブースティング') + '</div>';
    }
    return '<figure class="cv-visual" data-diagram="' + escapeText(unit.id) + '"><div class="cv-vcontrols" aria-label="図の切り替え">' + controls + '</div>' + body + '<figcaption aria-live="polite">' + escapeText(spec.caption) + '</figcaption></figure>';
  }
  function figure(id,mode) {
    var unit = window.CONVERSATION_DATA.units.find(function (item) { return item.id === id; });
    if (unit && unit.diagramSpec) return expandedFigure(unit, mode);
    var body='',cap='',controls='';
    if(id==='supervised') {
      body='<div class="cv-vcolumns">'+box('入力・特徴量','広さ30㎡<br>駅距離5分')+box('学習時の正解','家賃7万円')+'</div>'+arrow()+box('たくさんのペアから','予測する規則を学ぶ')+'<div class="cv-vdivider">学習後、新しい物件では</div>'+box('入力だけを渡す','広さ40㎡・駅距離8分')+arrow()+box('モデルが出す','予測家賃');
      cap='学習するときは答え付き。新しい物件を予測するときは、未知の家賃を渡しません。';
    } else if(id==='tasks') {
      body=box('同じ入力','広さ・駅距離・築年数')+arrow()+'<div class="cv-vcolumns">'+box('回帰：量を当てる','家賃 7.2万円')+box('分類：種類を選ぶ','安い／普通／高い')+'</div>';
      cap='同じ情報を使っても、何を出力したいかで問題の種類が変わります。';
    } else if(id==='linear') {
      mode=mode||'40';var x=Number(mode);if(![30,40,60].includes(x))x=40;var price=x*.1+3,px=50+x*3,py=205-x*2;
      controls=choice('30','30㎡',String(x))+choice('40','40㎡',String(x))+choice('60','60㎡',String(x));
      body=svg('広さを変えると直線上の予測家賃が変わる', '<path d="M50 30V205H300" class="cv-axis"/><path d="M50 205L290 45" class="cv-line"/><g class="cv-data"><circle cx="85" cy="171" r="5"/><circle cx="113" cy="151" r="5"/><circle cx="203" cy="110" r="5"/><circle cx="260" cy="57" r="5"/></g><path d="M50 '+py+'H'+px+'V205" class="cv-dash"/><circle cx="'+px+'" cy="'+py+'" r="7" class="cv-pred"/>'+t(5,20,'家賃（万円）')+t(215,234,'広さ（㎡）')+t(20,py+5,price.toFixed(0))+t(px-10,225,x)+t(63,40,'家賃＝0.1×広さ＋3'));
      cap=x+'㎡を式へ入れると '+price.toFixed(0)+'万円。直線が予測、周囲の小さな点は学習データの例です。';
    } else if(id==='multiple') {
      body='<div class="cv-vcolumns"><div>'+box('単回帰の入力','広さ')+arrow()+box('出力','家賃')+'</div><div>'+box('重回帰の入力','広さ<br>駅距離<br>築年数')+arrow()+box('出力','家賃')+'</div></div>';
      cap='増えたのは入力項目。予測する家賃は、どちらも1つです。';
    } else if(id==='logistic') {
      mode=mode==='0.8'?'0.8':'0.5';controls=choice('0.5','基準 0.5',mode)+choice('0.8','基準 0.8',mode);
      body=box('特徴量から計算','スコア（0〜1の外もある）')+arrow()+box('シグモイド関数で変換','スパムの確率 0.7')+arrow()+box('基準 '+mode+' と比較','判定：'+(mode==='0.5'?'スパム':'通常メール'));
      cap='基準を変えても確率0.7は同じ。確率を計算する段階と、分類を決める段階は別です。';
    } else if(id==='ar-var') {
      body='<div class="cv-vcolumns"><div>'+box('AR：1系列','売上の<br>昨日・一昨日')+arrow()+box('予測','今日の売上')+'</div><div>'+box('VAR：複数系列','売上 ＋ 来客数の<br>昨日・一昨日')+arrow()+box('まとめて予測','今日の売上<br>今日の来客数')+'</div></div>';
      cap='過去の日数ではなく、扱う系列の種類に注目しましょう。';
    } else if(id==='margin') {
      mode=mode==='wide'?'wide':'narrow';var bx=mode==='wide'?155:125;
      controls=choice('narrow','点のすれすれ',mode)+choice('wide','余裕を広く',mode);
      body=svg('境界を移動して最も近い点までの余裕を比較する模式図','<rect x="100" y="35" width="110" height="150" class="cv-band"/><path d="M100 35V185 M210 35V185" class="cv-dash"/><g class="cv-red"><circle cx="70" cy="60" r="7"/><circle cx="85" cy="145" r="7"/><circle cx="100" cy="110" r="7"/></g><g class="cv-blue"><rect x="203" y="103" width="14" height="14"/><rect x="238" y="53" width="14" height="14"/><rect x="248" y="143" width="14" height="14"/></g><path d="M'+bx+' 30V190" class="cv-line"/><path d="M100 110H'+bx+'" class="cv-distance"/>'+t(14,22,'● グループA')+t(182,22,'■ グループB')+t(30,223,mode==='wide'?'両側の最寄りの点から余裕を取る':'片側の最寄りの点に近すぎる'));
      cap='色付きの短い横線が最寄りの点までの距離。境界を動かし、この最小距離を広げるのがマージン最大化です。';
    } else if(id==='mapping') {
      mode=mode==='after'?'after':'before';controls=choice('before','① 元の平面',mode)+choice('after','② 高さを追加',mode);
      var pts= mode==='before' ? '<g class="cv-red"><circle cx="150" cy="110" r="8"/><circle cx="170" cy="125" r="8"/><circle cx="150" cy="140" r="8"/></g><g class="cv-blue"><rect x="85" y="115" width="14" height="14"/><rect x="215" y="115" width="14" height="14"/><rect x="150" y="55" width="14" height="14"/><rect x="150" y="175" width="14" height="14"/></g><path d="M160 35V200" class="cv-dash"/>'+t(18,225,'直線を動かしても、中央だけ分けられない') : '<path d="M35 200H290 M35 200V30" class="cv-axis"/><path d="M45 150H285" class="cv-line"/><g class="cv-red"><circle cx="145" cy="80" r="8"/><circle cx="165" cy="95" r="8"/><circle cx="185" cy="85" r="8"/></g><g class="cv-blue"><rect x="58" y="173" width="14" height="14"/><rect x="98" y="175" width="14" height="14"/><rect x="223" y="173" width="14" height="14"/><rect x="263" y="175" width="14" height="14"/></g>'+t(5,20,'追加した高さ')+t(190,143,'仕切りの平面')+t(30,226,'横から見ると、上下で分かれる');
      body=svg('中心に近いほど高さを加える変換の前後',pts);
      cap=mode==='before'?'赤が中央、青が外側。まずはボタンで高さを加えてみてください。':'色を使わず、元の位置から全点に同じ規則で高さを追加しています。模式図では横から見た平面が線に見えます。';
    } else if(id==='kernel') {
      body='<div class="cv-vcolumns"><div>'+box('全座標を作る方法','2 → (2, 4)<br>3 → (3, 9)')+arrow()+box('内積','2×3＋4×9<br>＝42')+'</div><div>'+box('カーネルで直接','K(x,y)<br>＝xy＋(xy)²')+arrow()+box('元の2と3から計算','6＋36<br>＝42')+'</div></div>';
      cap='結果は同じ42。右側は変換後の全座標を作らずに内積を求めています。';
    }
    return '<figure class="cv-visual"><div class="cv-vcontrols" aria-label="図の切り替え">'+controls+'</div>'+body+'<figcaption>'+cap+'</figcaption></figure>';
  }
  window.CV_FIGURE = figure;
})();
