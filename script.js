// ページの読み込みが完了した
window.addEventListener('load', () => {
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
    let paraValue = Number(document.getElementById('panelnum').value);

    // ページ遷移
    const URI = new URL(location)
    URI.searchParams.set("n", paraValue);
    window.location.href = URI.toString();
  }


  // パネル数をパラメータから取得，変更
  // パネル数を指定し、メイン処理開始
  main(getPanelNum());

  // ボタンクリックで入力値パネル数に更新
  document.querySelector('#panelnum-button').addEventListener('click', setUri);


  // メイン処理
  function main(panelNum) {
    // textareaクリア
    document.getElementById("text-area").value = "";
    // canvasの取得
    const canvas = document.querySelector('#draw-area');
    const gridCanvas = document.querySelector('#grid-area');
    // contextを使ってcanvasに絵を書いていく
    const context = canvas.getContext('2d');
    const contextGridLine = gridCanvas.getContext('2d');

    // パネル数 横
    const PANEL_NUM_X = panelNum;
    // パネル数 縦
    const PANEL_NUM_Y = panelNum;


    // パネル数ぶんの0埋め2次元配列を作成
    let ZERO_ARRAY = new Array(PANEL_NUM_Y);
    for (let row = 0; row < PANEL_NUM_Y; row++) {
      ZERO_ARRAY[row] = new Array(PANEL_NUM_X).fill(0);
    }

    // 基本フィールドの作成
    let field = JSON.parse(JSON.stringify(ZERO_ARRAY));

    // パネルごとの長さ
    const PLUS_NUM_X = canvas.offsetWidth / PANEL_NUM_X;
    const PLUS_NUM_Y = canvas.offsetHeight / PANEL_NUM_Y;

    // マウスがドラッグされているか(クリックされたままか)判断するためのフラグ
    let isDrag = false;
    // グリッド線があるかどうか
    let isgridLineOn = false;
    // 非表示機能ボタンとして機能するか(falseだと表示させる機能を持つようになる)
    let isHideButton = true;
    // プレイ中か
    let isPlaying = false;
    // 死滅したor固定されたか
    let isEnd = false;



    // 引数の場所にあるパネルの周囲1パネルの範囲に1(生存パネル)がなんぼあるか
    // function countNearLiving(fieldY, fieldX) {
    //   // カウント用変数
    //   let count = 0;
    //   for (let i = -1; i < 2; i++) {
    //     // フィールドの範囲外は処理を飛ばす
    //     if ((fieldY == 0 && i == -1) || (fieldY == PANEL_NUM_Y - 1 && i == 1)) {
    //       continue;
    //     }
    //     for (let j = -1; j < 2; j++) {
    //       // フィールドの範囲外は処理を飛ばす
    //       if ((fieldX == 0 && j == -1) || (fieldX == PANEL_NUM_X - 1 && j == 1)) {
    //         continue;
    //       }
    //       // 9パネルすべてをカウント
    //       count += field[fieldY + i][fieldX + j];
    //     }
    //   }

    //   // 自身のフィールド値のため
    //   let me = 0;
    //   // 自パネルが生存しているならそのぶんはカウントしない(countから自分を引く)
    //   if (field[fieldY][fieldX] != 0) {
    //     me = field[fieldY][fieldX];
    //   }

    //   return count - me;
    // }


    // 次の世代を求める
    // const calNextLife = async () => {
    //   // 次世代のフィールドのため
    //   let fieldNext = JSON.parse(JSON.stringify(field));

    //   // 現在のフィールドの全パネルについて
    //   for (let i = 0; i < field.length; i++) {
    //     for (let j = 0; j < field[0].length; j++) {
    //       // 周囲1パネルの生存数
    //       let nearLivingNum = countNearLiving(i, j);

    //       // 生存数に応じて次世代がどうなるか変わる
    //       if (field[i][j] == 0 && nearLivingNum == 3) {
    //         // 生誕
    //         fieldNext[i][j] = 1;
    //       } else if (field[i][j] == 1 && (nearLivingNum <= 1 || nearLivingNum >= 4)) {
    //         // 過疎 or 過密 (死)
    //         fieldNext[i][j] = 0;
    //       } else {
    //         // 生存（そのまま）
    //       }
    //     }
    //   }

    //   // 現在のフィールド状態から継続か否かが決定する
    //   if (JSON.stringify(field) === JSON.stringify(ZERO_ARRAY)) {
    //     // 全員死滅時
    //     isPlaying = false;
    //     isEnd = true;
    //     // 内部フィールド配列とcanvasをゼロクリア
    //     clear();
    //     // ボタンに結果を表示
    //     document.getElementById("play-button").innerHTML = "滅亡した";
    //     // すぐにPLAYに変わるといけないので、1.5秒(1500 ms)待つ
    //     setTimeout(() => {
    //       document.getElementById("play-button").innerHTML = "PLAY";
    //     }, 1500);

    //   } else if (JSON.stringify(field) === JSON.stringify(fieldNext)) {
    //     // 固定された時
    //     isPlaying = false;
    //     isEnd = true;
    //     // ボタンに結果を表示
    //     document.getElementById("play-button").innerHTML = "固定された";
    //     setTimeout(() => {
    //       document.getElementById("play-button").innerHTML = "PLAY";
    //     }, 1500);

    //   } else {
    //     // それ以外はなにもせず処理を続行する
    //   }

    //   // フィールド配列に次世代のフィールド状態を反映
    //   field = JSON.parse(JSON.stringify(fieldNext));
    // };


    // canvas描画処理

    // 直前に描いたときのパネル位置を格納
    let xIdxOld = null;
    let yIdxOld = null;

    // delete/write mode
    // 0: delete mode
    // 1: write mode
    let mode = 1;

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

      // 直前に描いたパネルとカーソル位置が一致しないなら描く
      // if (xIdx != xIdxOld || yIdx != yIdxOld) {
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

        // // 描いたら位置情報を更新
        // xIdxOld = xIdx;
        // yIdxOld = yIdx;
      // }
    }

    function drawBoxesRect(drawMode, startX, startY, endX, endY) {
      if (startX > endX) {
        // wrote from right to left
        for (let xIdx = endX; xIdx < startX; xIdx++) {
          drawFillBox(drawMode, xIdx, startY);
          drawFillBox(drawMode, xIdx, endY);
        }
      } else {
        // wrote from left to right
        for (let xIdx = startX; xIdx < endX; xIdx++) {
          drawFillBox(drawMode, xIdx, startY);
          drawFillBox(drawMode, xIdx, endY);
        }
      }

      if (startY > endY) {
        // wrote from bottom to top
        for (let yIdx = endY; yIdx < startY; yIdx++) {
          drawFillBox(drawMode, startX, yIdx);
          drawFillBox(drawMode, endX, yIdx);
        }
      } else {
        // wrote from top to bottom
        for (let yIdx = startY; yIdx < endY; yIdx++) {
          drawFillBox(drawMode, startX, yIdx);
          drawFillBox(drawMode, endX, yIdx);
        }
      }
    }

    // 指定パネル位置の図形を消す
    function removeBox(boxIdxX, boxIdxY) {
      context.clearRect(boxIdxX * PLUS_NUM_X, boxIdxY * PLUS_NUM_Y, PLUS_NUM_X, PLUS_NUM_Y);
    }

    function removeBoxesRect(sx, sy, ex, ey) {
      // drawBoxesRect(0, sx, sy, ex, ey);
      context.clearRect(sx, sy, ex - sx, ey - sy);
    }

    // fieldから四角を作成描画
    function fillAllBoxFromArray() {
      // 全てのフィールド要素について
      for (let i = 0; i < PANEL_NUM_Y; i++) {
        for (let j = 0; j < PANEL_NUM_X; j++) {
          // 0でなかったら描画
          if (field[i][j] != 0) {
            context.fillRect(j * PLUS_NUM_X, i * PLUS_NUM_Y, PLUS_NUM_X, PLUS_NUM_Y);
          }
        }
      }
    }

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

    // カーソルで描く
    function draw(x, y) {
      // マウスがドラッグされていなかったら処理を中断する。
      if (!isDrag) {
        return;
      }
      // カーソル位置は画面の左上が原点だけど，キャンバスで扱うのはキャンバスの左上が原点座標なので，差分を吸収する
      let endY = y - canvas.offsetTop;
      let endX = x - canvas.offsetLeft;


      let xIdx = curIdx2BoxIdxX(x);
      let yIdx = curIdx2BoxIdxY(y);
      // 直前に描いたパネルとカーソル位置が一致しないなら描く
      if (xIdx != xIdxOld || yIdx != yIdxOld) {
        // 中身は消しちゃう
        if (startX > endX) {
          // r to l
          if (startY > endY) {
            // b to t
            removeBoxesRect(x, y, startX, startY);
          } else {
            removeBoxesRect(x, y, startX, startY);
          }
        } else {
          if (startY > endY) {
            removeBoxesRect(startX, startY, x, y);
          } else {
            removeBoxesRect(startX, startY, x, y);
          }
        }

        // startX,Yから現在のx,yまでを対角とする矩形を描く
        drawBoxesRect(mode, startX, startY, x, y);

        // 描いたら位置情報を更新
        xIdxOld = xIdx;
        yIdxOld = yIdx;
      }
    }

    // canvas上に書いた絵を全部消し，配列もゼロ埋めする
    function clear() {
      // PLAY中にボタン押されたらPLAY終了(中断処理)
      if (isPlaying) {
        isPlaying = false;
        isEnd = false;
        document.getElementById("play-button").innerHTML = "PLAY";
        return;
      }
      // clear
      context.clearRect(0, 0, canvas.width, canvas.height);
      // 0埋め
      field = JSON.parse(JSON.stringify(ZERO_ARRAY));
      // textareaも空にする
      document.getElementById("text-area").value = "";
      // ws埋め
      for (let row = 0; row < PANEL_NUM_Y; row++) {
        ASCII_ARRAY[row].fill(" ");
      }
      // idxStoreArrayらも初期化
      idxStoreArray = new Array();
      maskIdxList = new Array();
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
      document.querySelector('#switch-button').innerText = modeString(mode);
    }

    // canvas上の図形を全部消すだけ
    function remove() {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // グリッド線の描画
    function drawGridLine() {
      // グリッド線書かれてないなら
      if (!isgridLineOn) {
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
      }
    }


    // グリッド線を消す
    function clearGridLine() {
      contextGridLine.clearRect(0, 0, canvas.width, canvas.height);
      // グリッド線なしに
      isgridLineOn = false;
    }


    // グリッド線を描画するか消すか，ボタン1つで機能するように
    function modifyGridLine() {
      // hideButtonとされるとき
      if (isHideButton) {
        // hideButtonとして機能
        clearGridLine();
        // 次回はhideButtonではなくなる
        isHideButton = false;
        document.getElementById("grid-button").innerHTML = "ShowGrid";
        return;
      } else {
        // hideButtonでないとき
        // hideButtonでないもの(drawbutton)として機能
        drawGridLine();
        document.getElementById("grid-button").innerHTML = "HideGrid";
        // 次回はhideButtonとなる
        isHideButton = true;
      }
    }

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let boxStartX = 0;
    let boxStartY = 0;
    let boxEndX = 0;
    let boxEndY = 0;

    // マウスのドラッグを開始したらisDragをtrueにしてdraw関数内で描画処理が途中で止まらないようにする
    function dragStart(x, y) {
      isDrag = true;
      // カーソル位置は画面の左上が原点だけど，キャンバスで扱うのはキャンバスの左上が原点座標なので，差分を吸収する
      startY = y - canvas.offsetTop;
      startX = x - canvas.offsetLeft;
      // boxのidx
      boxStartX = curIdx2BoxIdxX(x);
      boxStartY = curIdx2BoxIdxY(y);
    }

    let idxStoreArray = new Array();
    let maskIdxList = new Array();

    // mask図形もidxStoreArrayに入るがそのarrayのidxはmaskIdxListに保持しておく
    function storeBoxIdxRectMask(sx, sy, ex, ey) {
      // input start: (sx, sy)
      // input end: (ex, ey)
      maskIdxList.push(idxStoreArray.length);
      storeBoxIdxRect(sx, sy, ex, ey);
    }

    function storeBoxIdxRect(sx, sy, ex, ey) {
      // input start: (sx, sy)
      // input end: (ex, ey)
      idxStoreArray.push([[sx, sy], [ex, ey]]);
    }

    // startが左上、endが右下になるように調整
    // return Tuple: [[ltx, lty], [rbx, rby]]
    function correctStoreIdx(sx, sy, ex, ey) {
      // start(左上): (asx, asy)
      // end(右下): (aex, aey)
      let asx = asy = aex = aey = 0;
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
      let idxTuple = [startIdxTuple, endIdxTuple];
      return idxTuple;
    }
    
    
    // マウスのドラッグが終了したら、もしくはマウスがcanvas外に移動したらisDragのフラグをfalseにしてdraw関数内でお絵かき処理が中断されるようにする
    function dragEnd(x, y) {
      // 既に終わっているなら何もしない(カーソルがキャンバス領域外に出たときも発動してしまうので)
      if (!isDrag) return;

      isDrag = false;
      // カーソル位置は画面の左上が原点だけど，キャンバスで扱うのはキャンバスの左上が原点座標なので，差分を吸収する
      endY = y - canvas.offsetTop;
      endX = x - canvas.offsetLeft;
      // boxのidx
      boxEndX = curIdx2BoxIdxX(x);
      boxEndY = curIdx2BoxIdxY(y);

      switch (mode) {
        case 0:
          // delete mode
          // マスクに追加
          storeBoxIdxRectMask(boxStartX, boxStartY, boxEndX, boxEndY);
          break;
        case 1:
          // write mode
          // 描いた矩形の左上座標と右下座標をidxStoreArrayに追加
          storeBoxIdxRect(boxStartX, boxStartY, boxEndX, boxEndY);

          // startXとendXが同じなら上下線
          // startYとendYが同じなら横線
          // こういう直線は矢印として描画する
          // その場で動かない場合は矢印ではない
          if (boxStartX == boxEndX) {
            // 上下線
            if (boxStartY > boxEndY) {
              // bottom to top
              removeBox(boxEndX, boxEndY);
              fillTriangle(context, x, y, 0);
            }
            if (boxStartY < boxEndY) {
              // top to bottom
              removeBox(boxEndX, boxEndY);
              fillTriangle(context, x, y, 2);
            }
          }
          if (boxStartY == boxEndY) {
            // 横線
            if (boxStartX > boxEndX) {
              // right to left
              removeBox(boxEndX, boxEndY);
              fillTriangle(context, x, y, 3);
            }
            if (boxStartX < boxEndX) {
              // left to right
              removeBox(boxEndX, boxEndY);
              fillTriangle(context, x, y, 1);
            }
          }
          break;
        default:
          console.error("invalid mode(must be 0~1", mode);
          break;
      }
    }


    // wait関数 msec待つ asyncの関数で使える
    const wait = (msec) => {
      return new Promise((resolve) => {
        setTimeout(() => { resolve(msec) }, msec);
      });
    };

    // パネル数ぶんの2次元配列を作成
    let ASCII_ARRAY = new Array(PANEL_NUM_Y);
    for (let row = 0; row < PANEL_NUM_Y; row++) {
      ASCII_ARRAY[row] = new Array(PANEL_NUM_X);
    }

    // play時の処理
    function play() {
      // init
      document.getElementById("text-area").value = "";
      // 全部wsで埋める(既存図形に影響せず移動するため)
      for (let row = 0; row < PANEL_NUM_Y; row++) {
        ASCII_ARRAY[row].fill(" ");
      }

      // loop:
      for (let storeIdx = 0; storeIdx < idxStoreArray.length; storeIdx++) {
        // l: left, r: right
        // t: top, b: bottom
        // raw: 入力位置保持した生
        let rawStartX = idxStoreArray[storeIdx][0][0];
        let rawStartY = idxStoreArray[storeIdx][0][1];
        let rawEndX = idxStoreArray[storeIdx][1][0];
        let rawEndY = idxStoreArray[storeIdx][1][1];
        // adj: 左上右下
        let correctStoreIdxTuple = correctStoreIdx(rawStartX, rawStartY, rawEndX, rawEndY);
        let adjLtx = correctStoreIdxTuple[0][0];
        let adjLty = correctStoreIdxTuple[0][1];
        let adjRbx = correctStoreIdxTuple[1][0];
        let adjRby = correctStoreIdxTuple[1][1];
        // 左上座標に移動(なにも配置しない)
        let currentIdx = [adjLtx, adjLty];
        
        // マスク範囲のやつは消す

        if (maskIdxList.includes(storeIdx)) {
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

    // 色変更
    context.fillStyle = 'rgb(0,0,0)';

    // gridLineは描いとく
    drawGridLine();

    // change mode button string
    document.querySelector('#switch-button').innerText = modeString(mode);


    // マウス操作やボタンクリック時のイベント処理を定義する
    function initEventHandler() {

      const playButon = document.querySelector('#play-button');
      playButon.addEventListener('click', play);

      const clearButton = document.querySelector('#clear-button');
      clearButton.addEventListener('click', clear);

      const switchButton = document.querySelector('#switch-button');
      switchButton.addEventListener('click', () => {
        switchMode();
      });

      const modifyGridLineButton = document.querySelector('#grid-button');
      modifyGridLineButton.addEventListener('click', modifyGridLine);

      canvas.addEventListener('mousedown', (event) => {
        dragStart(event.layerX, event.layerY);
      });
      canvas.addEventListener('mouseup', (event) => {
        dragEnd(event.layerX, event.layerY);
      });
      canvas.addEventListener('mouseout', (event) => {
        dragEnd(event.layerX, event.layerY);
      });
      canvas.addEventListener('mousemove', (event) => {
        draw(event.layerX, event.layerY);
      });
      canvas.addEventListener('mousedown', (event) => {
        draw(event.layerX, event.layerY);
      });
    }

    // イベント処理を初期化する
    initEventHandler();
  }
});
