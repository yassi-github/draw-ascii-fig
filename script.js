// ページの読み込みが完了した
window.addEventListener("load", () => {
  // パネル数を返す
  function getPanelNum() {
    // 現在のパラメータからパネル数を取得
    let panelNumFromParam = Number(new URL(location).searchParams.get("n"));
    // 初期値
    let panelNum = 30;

    // 取得したパネル数指定が範囲内なら更新
    if (3 <= panelNumFromParam && panelNumFromParam <= 256) {
      panelNum = panelNumFromParam;
    }
    return panelNum;
  }

  // URIに入力値をつけて遷移
  function setUri() {
    // パネル数指定の入力値をHTMLから取得
    let paraValue = Number(document.getElementById("panelnum").value);
    // ページ遷移
    const URI = new URL(location);

    URI.searchParams.set("n", paraValue);
    window.location.href = URI.toString();
  }

  // 配列のディープコピー
  function arrayDeepCopy(array) {
    return JSON.parse(JSON.stringify(array));
  }

  // メイン処理
  function main(panelNum) {
    // textareaクリア
    document.getElementById("text-area").value = "";
    // canvasの取得
    const canvas = document.querySelector("#draw-area");
    const gridCanvas = document.querySelector("#grid-area");
    // contextを使ってcanvasに絵を書いていく
    const context = canvas.getContext("2d");
    const contextGridLine = gridCanvas.getContext("2d");

    // パネル数
    const PANEL_NUM_X = panelNum;
    const PANEL_NUM_Y = panelNum;
    // パネルごとの長さ
    const PLUS_NUM_X = canvas.offsetWidth / PANEL_NUM_X;
    const PLUS_NUM_Y = canvas.offsetHeight / PANEL_NUM_Y;

    // パネル数ぶんの0埋め2次元配列を作成
    let ZERO_ARRAY = new Array(PANEL_NUM_Y);

    for (let row = 0; row < PANEL_NUM_Y; row++) {
      ZERO_ARRAY[row] = new Array(PANEL_NUM_X).fill(0);
    }

    // 基本フィールドの作成
    let field = arrayDeepCopy(ZERO_ARRAY);
    // 描いた図形のパネル座標情報を記録していく配列
    let boxIdxStoreArray = new Array();
    // マスク図形のパネル座標情報を記録していく配列
    let maskBoxIdxList = new Array();
    // 図形フィールドのテキスト表現を格納する配列
    let ASCII_ARRAY = new Array(PANEL_NUM_Y);

    for (let row = 0; row < PANEL_NUM_Y; row++) {
      ASCII_ARRAY[row] = new Array(PANEL_NUM_X);
    }

    // 直前に描いたパネル位置を格納
    let boxIdxOldX = null;
    let boxIdxOldY = null;
    // 現在描いている図形のカーソル開始地点
    let startX = 0;
    let startY = 0;

    // delete/write mode
    // 0: delete mode
    // 1: write mode
    let mode = 1;

    // マウスがドラッグされているか
    let isDrag = false;
    // グリッド線があるかどうか
    let isgridLineOn = false;

    function curIdx2BoxIdxX(curX) {
      // カーソル位置がどこのパネルに属するか
      // OR 演算は、小数切り捨てのため
      return curX / PLUS_NUM_X | 0;
    }
    function curIdx2BoxIdxY(curY) {
      // カーソル位置がどこのパネルに属するか
      // OR 演算は、小数切り捨てのため
      return curY / PLUS_NUM_Y | 0;
    }

    // (sx, sy)から(ex, ey)を対角とする矩形の左上座標と右下座標を返す
    // return Tuple: [[ltx, lty], [rbx, rby]]
    function ltrbIdx(sx, sy, ex, ey) {
      // start(左上): (asx, asy)
      // end(右下): (aex, aey)
      let asx = 0;
      let asy = 0;
      let aex = 0;
      let aey = 0;

      if (sx > ex) {
        // r to l
        asx = ex;
        aex = sx;
        if (sy > ey) {
          // b to t
          asy = ey;
          aey = sy;
        } else {
          // t to b
          asy = sy;
          aey = ey;
        }
      } else {
        // l to r
        asx = sx;
        aex = ex;
        if (sy > ey) {
          // b to t
          asy = ey;
          aey = sy;
        } else {
          // t to b
          asy = sy;
          aey = ey;
        }
      }

      // store idx
      // [ [[asx, asy], [aex, aey]], ... ]
      let startIdxTuple = [asx, asy];
      let endIdxTuple = [aex, aey];

      return [startIdxTuple, endIdxTuple];
    }

    // カーソル位置x,yに属するパネルにdirectionに応じた方向の三角を描画する
    // direction:
    // 0: top, 1: right, 2: bottom, 3: left
    function fillTriangle(ctx, x, y, direction) {
      let startPointX, startPointY = null;
      let endPointX, endPointY = null;
      let tipPointX, tipPointY = null;

      switch (direction) {
      case 0:
        startPointX = curIdx2BoxIdxX(x) * PLUS_NUM_X;
        startPointY = (curIdx2BoxIdxY(y) + 1) * PLUS_NUM_Y;
        tipPointX = startPointX + (PLUS_NUM_X / 2 | 0);
        tipPointY = curIdx2BoxIdxY(y) * PLUS_NUM_Y;
        endPointX = (curIdx2BoxIdxX(x) + 1) * PLUS_NUM_X;
        endPointY = startPointY;
        break;
      case 1:
        startPointX = curIdx2BoxIdxX(x) * PLUS_NUM_X;
        startPointY = curIdx2BoxIdxY(y) * PLUS_NUM_Y;
        tipPointX = (curIdx2BoxIdxX(x) + 1) * PLUS_NUM_X;
        tipPointY = startPointY + (PLUS_NUM_Y / 2 | 0);
        endPointX = startPointX;
        endPointY = (curIdx2BoxIdxY(y) + 1) * PLUS_NUM_Y;
        break;
      case 2:
        startPointX = curIdx2BoxIdxX(x) * PLUS_NUM_X;
        startPointY = curIdx2BoxIdxY(y) * PLUS_NUM_Y;
        tipPointX = startPointX + (PLUS_NUM_X / 2 | 0);
        tipPointY = (curIdx2BoxIdxY(y) + 1) * PLUS_NUM_Y;
        endPointX = (curIdx2BoxIdxX(x) + 1) * PLUS_NUM_X;
        endPointY = startPointY;
        break;
      case 3:
        startPointX = (curIdx2BoxIdxX(x) + 1) * PLUS_NUM_X;
        startPointY = curIdx2BoxIdxY(y) * PLUS_NUM_Y;
        tipPointX = curIdx2BoxIdxX(x) * PLUS_NUM_X;
        tipPointY = startPointY + (PLUS_NUM_Y / 2 | 0);
        endPointX = (curIdx2BoxIdxX(x) + 1) * PLUS_NUM_X;
        endPointY = (curIdx2BoxIdxY(y) + 1) * PLUS_NUM_Y;
        break;
      default:
        console.error("invalid arrow direction value(must be 0~3):", direction);
        break;
      }

      ctx.beginPath();
      ctx.moveTo(startPointX, startPointY);
      ctx.lineTo(tipPointX, tipPointY);
      ctx.lineTo(endPointX, endPointY);
      ctx.fill();
    }

    // カーソル位置を受け取り，そこが属するパネルを塗りつぶす
    // フィールド配列の書き換えも行う
    function drawFillBox(drawMode, x, y) {
      // カーソル位置がどこのパネルに属するか
      // OR 演算は、小数切り捨てのため
      let xIdx = x / PLUS_NUM_X | 0;
      let yIdx = y / PLUS_NUM_Y | 0;

      // write mode
      if (drawMode == 1) {
        // フィールド配列を書き換え
        field[yIdx][xIdx] = drawMode;
        // 四角形描画
        context.fillRect(xIdx * PLUS_NUM_X, yIdx * PLUS_NUM_Y, PLUS_NUM_X, PLUS_NUM_Y);
      } else {
        // delete mode
        field[yIdx][xIdx] = drawMode;
        // 四角形のサイズで消す
        context.clearRect(xIdx * PLUS_NUM_X, yIdx * PLUS_NUM_Y, PLUS_NUM_X, PLUS_NUM_Y);
      }
    }

    // カーソル座標(startx, starty)から(endx, endy)を対角とする矩形の四辺を描画する
    function drawBigRectSides(drawMode, curStartX, curStartY, curEndX, curEndY) {
      let ltrbIdxTuple = ltrbIdx(curStartX, curStartY, curEndX, curEndY);
      let ltx = ltrbIdxTuple[0][0];
      let lty = ltrbIdxTuple[0][1];
      let rbx = ltrbIdxTuple[1][0];
      let rby = ltrbIdxTuple[1][1];

      for (let xIdx = ltx; xIdx < rbx; xIdx++) {
        // 上辺
        drawFillBox(drawMode, xIdx, lty);
        // 下辺
        drawFillBox(drawMode, xIdx, rby);
      }
      for (let yIdx = lty; yIdx < rby; yIdx++) {
        // 右辺
        drawFillBox(drawMode, ltx, yIdx);
        // 左辺
        drawFillBox(drawMode, rbx, yIdx);
      }
    }

    // 指定パネル位置の矩形を消す
    function removeBox(boxIdxX, boxIdxY) {
      context.clearRect(boxIdxX * PLUS_NUM_X, boxIdxY * PLUS_NUM_Y, PLUS_NUM_X, PLUS_NUM_Y);
    }

    // (sx, sy)から(ex, ey)範囲の矩形を消す
    function removeBoxesRect(sx, sy, ex, ey) {
      let ltrbIdxTuple = ltrbIdx(sx, sy, ex, ey);
      let ltx = ltrbIdxTuple[0][0];
      let lty = ltrbIdxTuple[0][1];
      let rbx = ltrbIdxTuple[1][0];
      let rby = ltrbIdxTuple[1][1];

      context.clearRect(ltx, lty, rbx - ltx, rby - lty);
    }

    // カーソルで描く
    function draw(x, y) {
      // マウスがドラッグされていなかったら処理を中断する。
      if (!isDrag) {
        return;
      }

      let xIdx = curIdx2BoxIdxX(x);
      let yIdx = curIdx2BoxIdxY(y);

      // 直前に描いたパネルとカーソル位置が一致しないなら描く
      if (xIdx != boxIdxOldX || yIdx != boxIdxOldY) {
        // 中身は消しちゃう
        removeBoxesRect(startX, startY, x, y);
        // startX,Yから現在のx,yまでを対角とする矩形の四辺を描く
        drawBigRectSides(mode, startX, startY, x, y);

        // 描いたら位置情報を更新
        boxIdxOldX = xIdx;
        boxIdxOldY = yIdx;
      }
    }

    // canvas上に書いた絵を全部消し，配列もゼロ埋めする
    function clear() {
      // clear
      context.clearRect(0, 0, canvas.width, canvas.height);
      // 0埋め
      field = arrayDeepCopy(ZERO_ARRAY);
      // textareaも空にする
      document.getElementById("text-area").value = "";
      // ws埋め
      for (let row = 0; row < PANEL_NUM_Y; row++) {
        ASCII_ARRAY[row].fill(" ");
      }
      // boxIdxStoreArrayらも初期化
      boxIdxStoreArray = new Array();
      maskBoxIdxList = new Array();
    }

    function modeString(mode) {
      switch (mode) {
      case 0:
        return "ChangeMode:🎨";
      case 1:
        return "ChangeMode:🧹";
      default:
        return "?";
      }
    }

    function switchMode() {
      mode += 1;
      // reset to 0 if expired max mode counter
      if (mode > 1) {
        mode = 0;
      }
      document.querySelector("#switch-button").innerText = modeString(mode);
    }

    // グリッド線を描画するか消すか
    function modifyGridLine() {
      // 書かれてたら消す
      if (isgridLineOn) {
        contextGridLine.clearRect(0, 0, canvas.width, canvas.height);
        // グリッド線なしに
        isgridLineOn = false;
        document.getElementById("grid-button").innerHTML = "ShowGrid";
        return;
      }
      // 描画する
      // 縦線
      for (let i = 0; i < canvas.offsetWidth / PLUS_NUM_X | 0; i++) {
        contextGridLine.beginPath();
        contextGridLine.moveTo(i * PLUS_NUM_X, 0);
        contextGridLine.lineTo(i * PLUS_NUM_X, canvas.offsetHeight);
        contextGridLine.closePath();
        contextGridLine.stroke();
      }
      // 横線
      for (let i = 0; i < canvas.offsetHeight / PLUS_NUM_Y | 0; i++) {
        contextGridLine.beginPath();
        contextGridLine.moveTo(0, i * PLUS_NUM_Y);
        contextGridLine.lineTo(canvas.offsetHeight, i * PLUS_NUM_Y);
        contextGridLine.closePath();
        contextGridLine.stroke();
      }
      // 書けました
      isgridLineOn = true;
      document.getElementById("grid-button").innerHTML = "HideGrid";
    }

    // マウスのドラッグを開始したらisDragをtrueにしてdraw関数内で描画処理が途中で止まらないようにする
    function dragStart(x, y) {
      isDrag = true;
      // カーソル位置は画面の左上が原点だけど，キャンバスで扱うのはキャンバスの左上が原点座標なので，差分を吸収する
      startY = y - canvas.offsetTop;
      startX = x - canvas.offsetLeft;
    }

    function storeBoxIdxRect(boxSx, boxSy, boxEx, boxEy) {
      boxIdxStoreArray.push([[boxSx, boxSy], [boxEx, boxEy]]);
    }

    // mask図形もboxIdxStoreArrayに入るがそのarrayのidxはmaskIdxListに保持しておく
    function storeBoxIdxRectMask(boxSx, boxSy, boxEx, boxEy) {
      maskBoxIdxList.push(boxIdxStoreArray.length);
      storeBoxIdxRect(boxSx, boxSy, boxEx, boxEy);
    }

    // マウスのドラッグが終了した、もしくはマウスがcanvas外に移動した
    function dragEnd(endX, endY) {
      // 既に終わっているなら何もしない(カーソルがキャンバス領域外に出たときも発動してしまうので)
      if (!isDrag) return;
      isDrag = false;

      // boxのidx
      let boxStartX = curIdx2BoxIdxX(startX);
      let boxStartY = curIdx2BoxIdxY(startY);
      let boxEndX = curIdx2BoxIdxX(endX);
      let boxEndY = curIdx2BoxIdxY(endY);

      switch (mode) {
      case 0:
        // delete mode
        // マスクに追加
        storeBoxIdxRectMask(boxStartX, boxStartY, boxEndX, boxEndY);
        break;
      case 1:
        // write mode
        // 描いた矩形の開始座標と終了座標をboxIdxStoreArrayに追加
        storeBoxIdxRect(boxStartX, boxStartY, boxEndX, boxEndY);

        // startXとendXが同じなら上下線
        // startYとendYが同じなら横線
        // こういう直線は矢印として描画する
        // その場で動かない場合は矢印ではない
        if (boxStartX == boxEndX) {
          if (boxStartY == boxEndY) {
            // その場で動かない
            break;
          }
          // 上下線
          removeBox(boxEndX, boxEndY);
          if (boxStartY > boxEndY) {
            // ↑
            fillTriangle(context, endX, endY, 0);
            break;
          }
          // ↓
          fillTriangle(context, endX, endY, 2);
          break;
        }
        if (boxStartY == boxEndY) {
          // 横線
          removeBox(boxEndX, boxEndY);
          if (boxStartX > boxEndX) {
            // ←
            fillTriangle(context, endX, endY, 3);
            break;
          }
          // →
          fillTriangle(context, endX, endY, 1);
          break;
        }
        break;
      default:
        console.error("invalid mode(must be 0~1", mode);
        break;
      }
    }

    // play時の処理
    function play() {
      // init
      document.getElementById("text-area").value = "";
      // 全部wsで埋める(既存図形に影響せず移動するため)
      for (let row = 0; row < PANEL_NUM_Y; row++) {
        ASCII_ARRAY[row].fill(" ");
      }

      // boxIdxStoreArrayをなめる
      for (let storeIdx = 0; storeIdx < boxIdxStoreArray.length; storeIdx++) {
        // l: left, r: right
        // t: top, b: bottom
        // raw: 入力開始終了位置保持したやつ
        let rawStartX = boxIdxStoreArray[storeIdx][0][0];
        let rawStartY = boxIdxStoreArray[storeIdx][0][1];
        let rawEndX = boxIdxStoreArray[storeIdx][1][0];
        let rawEndY = boxIdxStoreArray[storeIdx][1][1];
        // adj: 左上右下に正規化したやつ
        let correctStoreIdxTuple = ltrbIdx(rawStartX, rawStartY, rawEndX, rawEndY);
        let adjLtx = correctStoreIdxTuple[0][0];
        let adjLty = correctStoreIdxTuple[0][1];
        let adjRbx = correctStoreIdxTuple[1][0];
        let adjRby = correctStoreIdxTuple[1][1];

        // 左上座標に移動(なにも配置しない)
        let currentIdx = [adjLtx, adjLty];

        // マスク範囲のやつは消す

        if (maskBoxIdxList.includes(storeIdx)) {
          // wsで埋める
          for (; currentIdx[1] <= adjRby; currentIdx[1]++) {
            for (; currentIdx[0] <= adjRbx; currentIdx[0]++) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = " ";
            }
            currentIdx[0] = adjLtx;
          }
          continue;
        }

        // Arrow

        if (rawStartX == rawEndX) {
          if (rawStartY > rawEndY) {
            // b to t
            ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "^";
            for (currentIdx[1] += 1; currentIdx[1] < adjRby; currentIdx[1]++) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "|";
            }
            continue;
          }
          if (rawStartY < rawEndY) {
            // t to b
            for (; currentIdx[1] < adjRby; currentIdx[1]++) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "|";
            }
            ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "v";
            continue;
          }
        }
        if (rawStartY == rawEndY) {
          if (rawStartX > rawEndX) {
            // r to l
            ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "<";
            for (currentIdx[0] += 1; currentIdx[0] < adjRbx; currentIdx[0]++) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "-";
            }
            continue;
          }
          if (rawStartX < rawEndX) {
            // l to r
            for (; currentIdx[0] < adjRbx; currentIdx[0]++) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "-";
            }
            ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = ">";
            continue;
          }
        }

        // Rect

        // 左上に+、そこから右上手前まで-、右上は+を配置
        ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "+";
        for (currentIdx[0] += 1; currentIdx[0] < adjRbx; currentIdx[0]++) {
          ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "-";
        }
        // currentIdx[0] += 1;
        ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "+";
        currentIdx[0] = adjLtx;
        // 左x下まで下るときにx座標位置には|を、その他にはwhite spaceを配置
        for (currentIdx[1] += 1; currentIdx[1] < adjRby; currentIdx[1]++) {
          for (; currentIdx[0] <= adjRbx; currentIdx[0]++) {
            if (currentIdx[0] == adjLtx || currentIdx[0] == adjRbx) {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "|";
            } else {
              ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = " ";
            }
          }
          currentIdx[0] = adjLtx;
        }
        // 左下に+、右下手前まで-、右下は+を配置
        // currentIdx[1] += 1;
        ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "+";
        for (currentIdx[0] += 1; currentIdx[0] < adjRbx; currentIdx[0]++) {
          ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "-";
        }
        // currentIdx[0] += 1;
        ASCII_ARRAY[currentIdx[1]][currentIdx[0]] = "+";
        // 後入れのものほど手前にくるのでこれでよい
      }

      // write

      for (let y = 0; y < ASCII_ARRAY.length; y++) {
        document.getElementById("text-area").value += ASCII_ARRAY[y].join("") + "\n";
      }
    }

    // マウス操作やボタンクリック時のイベント処理を定義する
    function initEventHandler() {
      document.querySelector("#panelnum-button").addEventListener("click", setUri);
      document.querySelector("#play-button").addEventListener("click", play);
      document.querySelector("#clear-button").addEventListener("click", clear);
      document.querySelector("#switch-button").addEventListener("click", switchMode);
      document.querySelector("#grid-button").addEventListener("click", modifyGridLine);

      canvas.addEventListener("mousedown", (event) => {
        dragStart(event.layerX, event.layerY);
      });
      canvas.addEventListener("mouseup", (event) => {
        dragEnd(event.layerX, event.layerY);
      });
      canvas.addEventListener("mouseout", (event) => {
        dragEnd(event.layerX, event.layerY);
      });
      canvas.addEventListener("mousemove", (event) => {
        draw(event.layerX, event.layerY);
      });
      canvas.addEventListener("mousedown", (event) => {
        draw(event.layerX, event.layerY);
      });
    }

    // gridLineは描いとく
    modifyGridLine();
    // change mode button string
    document.querySelector("#switch-button").innerText = modeString(mode);
    // イベント処理を初期化する
    initEventHandler();
  }

  // パネル数をパラメータから取得
  // パネル数を指定し、メイン処理開始
  main(getPanelNum());
});
