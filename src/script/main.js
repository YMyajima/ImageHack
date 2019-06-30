var $ = require("jquery");
var sort = require('fast-sort/sort.es5.min.js');
import "../style/main.scss";

(function() {
    // 画像の最大ファイルサイズ（20MB）
    var maxSize = 20 * 1024 * 1024;

    function eventInit() {
        var dropArea = document.getElementById('dropArea');
        var output = document.getElementById('output');
        // ドラッグ中の要素がドロップ要素に重なった時
        dropArea.addEventListener('dragover', function (ev) {
            ev.preventDefault();

            // ファイルのコピーを渡すようにする
            ev.dataTransfer.dropEffect = 'copy';

            dropArea.classList.add('dragover');
        });
        // ドラッグ中の要素がドロップ要素から外れた時
        dropArea.addEventListener('dragleave', function () {
            dropArea.classList.remove('dragover');
        });

        // ドロップ要素にドロップされた時
        dropArea.addEventListener('drop', function (ev) {
            ev.preventDefault();

            dropArea.classList.remove('dragover');
            output.textContent = '';

            // ev.dataTransfer.files に複数のファイルのリストが入っている
            organizeFiles(ev.dataTransfer.files);
        });

        $('#dropArea').on('click', function(e) {
            $('#fileInput').click();
        });

        // ファイル参照で画像を追加した場合
        $('#fileInput').on('change', function (ev) {
            output.textContent = '';

            // ev.target.files に複数のファイルのリストが入っている
            organizeFiles(ev.target.files);

            // 値のリセット
            fileInput.value = '';
        });
    }

    // ドロップされたファイルの整理
    function organizeFiles(files) {
        var length = files.length;
        var file;

        for (var i = 0; i < length; i++) {
            // file には Fileオブジェクト というローカルのファイル情報を含むオブジェクトが入る
            file = files[i];
            // 画像以外は無視
            if (!file || file.type.indexOf('image/') < 0) {
                console.log("skip file.", file)
                continue;
            }
            console.log("load file.", file);

            // 指定したサイズを超える画像は無視
            if (file.size > maxSize) {
                console.log("over file size.", file);
                continue;
            }

            // 画像出力処理へ進む
            outputImage(file);
        }
    }

    function outputImage(blob) {
        var image = new Image();

        // File/BlobオブジェクトにアクセスできるURLを生成
        var blobURL = URL.createObjectURL(blob);

        // src にURLを入れる
        image.src = blobURL;

        // 画像読み込み完了後
        image.addEventListener('load', function () {
            // File/BlobオブジェクトにアクセスできるURLを開放
            URL.revokeObjectURL(blobURL);

            // #output へ出力
            output.appendChild(image);
            var colors = takeImageColors(image, blob.type, image.width, image.height);
            sort(colors).desc(u => u.h);
            drawImage(colors, image.width, image.height, '#sortedImage');
            var result = smoothingImage(colors, image.width, image.height);
            drawImage(result.colors, result.width, result.height, '#smoothImage');
        });
    }

    function drawImage(colors, width, height, targetElementName) {
        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = width;
        tmpCanvas.height = height;
        var tmpContext = tmpCanvas.getContext("2d");
        var x = 0;
        var y = 0;
        for (var i = 0; i < colors.length; i++) {
            if (i > 0 && i % width === 0) {
                y++;
                x = 0;
            }
            var color = colors[i];
            var fillStyle = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + Math.round(color.a / 255 * 10) / 10 +')';
            tmpContext.fillStyle = fillStyle;
            tmpContext.fillRect(x, y, 1, 1);
            x++
        }
        console.log(tmpCanvas.toDataURL());
        var targetElement = $(targetElementName);
        targetElement.attr('src', tmpCanvas.toDataURL());
    }

    function smoothingImage(colors, width, height) {
        // 3 * 3の座標で平滑化する
        var vector = [
            [{x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1}],
            [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}],
            [{x: -1, y: 1}, {x: 0, y: 1}, {x: 1, y: 1}],
        ];
        var resultColors = [];
        var fixWidth = width - 1;
        var fixHeight = height - 1;
        for (var i = 0; i < colors.length; i++) {
            // 一次元から二次元軸で考えるためにx, y値を求める
            var x = i % width;
            var y = Math.floor(i / width);

            if (x === 0 || x === fixWidth) {
                continue;
            } else if (y === 0 || y === fixHeight) {
                continue;
            }
            var smoothTargetColors = [];
            for (var vyi = 0; vyi < vector.length; vyi++) {
                for( var vxi = 0; vxi < vector[vyi].length; vxi++) {
                    var vx = vector[vyi][vxi].x;
                    var vy = vector[vyi][vxi].y;
                    var nx = x + vx;  // 座標移動後のx座標を求める
                    var ny = y + vy;  // 座標移動後のy座標を求める
                    var ni = nx + ny * width;  // x,yの二次元座標から一次元座標を求める
                    smoothTargetColors.push(
                        Object.create(colors[ni])
                    );
                }
            }
            var tmpColor = {
                r: 0,
                g: 0,
                b: 0,
                a: 0,
                h: 0,
                s: 0,
                v: 0,
                hex: "",
            };
            for (var si = 0; si < smoothTargetColors.length; si++) {
                // 平均値を計算する
                var targetColor = smoothTargetColors[si];
                tmpColor.r += targetColor.r;
                tmpColor.g += targetColor.g;
                tmpColor.b += targetColor.b;
                tmpColor.a += targetColor.a;
                tmpColor.h += targetColor.h;
                tmpColor.s += targetColor.s;
                tmpColor.v += targetColor.v;
            }
            tmpColor.r = Math.round(tmpColor.r / smoothTargetColors.length);
            tmpColor.g = Math.round(tmpColor.g / smoothTargetColors.length);
            tmpColor.b = Math.round(tmpColor.b / smoothTargetColors.length);
            tmpColor.a = Math.round(tmpColor.a / smoothTargetColors.length);
            tmpColor.h = Math.round(tmpColor.h / smoothTargetColors.length);
            tmpColor.s = Math.round(tmpColor.s / smoothTargetColors.length);
            tmpColor.v = Math.round(tmpColor.v / smoothTargetColors.length);
            tmpColor.hex = makeHexColor(
                tmpColor.r,
                tmpColor.g,
                tmpColor.b,
                tmpColor.a
            );
            resultColors.push(tmpColor);
        }
        var result = {
            colors: resultColors,
            width: width - 2,
            height: height - 2,
        };
        return result;
    }

    function takeImageColors(image_src, mime_type, width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        // Draw (Resize)
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image_src, 0, 0, width, height);
        var colors = [];
        for (var yi = 0; yi < height; yi++) {
            for (var xi = 0; xi < width; xi++) {
                var imageData = ctx.getImageData(xi, yi, 1, 1);
                var r = imageData.data[0];  // r
                var g = imageData.data[1];  // g
                var b = imageData.data[2];  // b
                var a = imageData.data[3];  // a
                var hex = makeHexColor(r, g, b, a);
                var hsv = toHSV(r, g, b);
                colors.push({
                    r: r,
                    g: g,
                    b: b,
                    a: a,
                    h: hsv.h,
                    s: hsv.s,
                    v: hsv.v,
                    hex: hex,
                })
            }
        }
        return colors;
    }

    function makeHexColor(r, g, b, a) {
        var hexR = r.toString(16).padStart(2, '0');
        var hexG = g.toString(16).padStart(2, '0');
        var hexB = b.toString(16).padStart(2, '0');
        var hexA = a.toString(16).padStart(2, '0');
        var hex = '#' + hexR + hexG + hexB + hexA;
        return hex;
    }

    function toHSV(r, g, b) {
        var max = Math.max(r, g, b);
	    var min = Math.min(r, g, b);
        var diff = max - min ;
        var hsv = {
            h: null,
            s: null,
            v: null
        };
        if (max === 0) {
            hsv.h = 0;
            hsv.s = 0;
            hsv.v = 0;
            return hsv;
        }
        if (max === min) {
            hsv.h = 0;
        } else if (max === r) {
            hsv.h = 60 * ((g - b) / diff);
        } else if (max === g) {
            hsv.h = 60 * ((b - r) / diff) + 120;
        } else if (max === b) {
            hsv.h = 60 * ((r - g) / diff) + 240;
        }
        if (hsv.h < 0) {
            hsv.h += 360;
        }
        hsv.s = diff / max * 255;
        hsv.v = max;
        hsv.h = Math.round(hsv.h);
        hsv.s = Math.round(hsv.s);
        hsv.v = Math.round(hsv.v);
        return hsv;
    }

    $(document).ready(function(){
        console.log("called main.js");
        eventInit();
    });
})();