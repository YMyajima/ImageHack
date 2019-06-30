
// 開発用のコンフィグファイル

const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
// ↑ baseとなるconfigを読み込みます。

// webpack-base.config.jsに同様の設定値がある場合、こちらが優先される。
// baseの設定ファイルをマージします。マージにはwebpack-mergeというライブラリを使ってます。
const devConfig = merge(baseConfig, {
    devtool: 'inline-source-map',
});

module.exports = devConfig;
