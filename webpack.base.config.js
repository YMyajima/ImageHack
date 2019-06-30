
const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const baseConfig = {
    // エントリーポイントの設定
    entry: {
        main: './src/script/main.js',
    },
    // 出力の設定
    output: {
        // 出力するファイル名
        filename: '[name].bundle.js',
        // 出力パス
        path: `${__dirname}/src/static/js`,
        // publicPath: '/static/js/'
    },
    module: {
        rules: [
            { 
                test: /\.handlebars$/, 
                loader: "handlebars-loader" 
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    },
                ]
            },
			{
				test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: 'url-loader?limit=10000',
			},
			{
				test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
				use: 'file-loader',
			},
			{
				test: /\.(css|scss)$/,
				use: [ 'style-loader', 'css-loader', 'sass-loader' ]
			}
        ]
    },
    plugins: [
		new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: `${__dirname}/../static/js/*`
        })
	]
};

module.exports = baseConfig;
