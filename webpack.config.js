const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const basePath = __dirname;
const srcPath = path.resolve(basePath,'src/')
module.exports = {
  mode: 'development',

  entry: {
      'live':path.resolve(basePath, 'src/live/index.js')
  },
  output: {
    filename: '[name].[chunkhash:7].js',
    chunkFilename: '[name].[chunkhash:7].js'
  },
  resolve:{
    alias:{
        '@':srcPath,
        // 'rem':path.resolve(staticPath, 'common/js/flexible/rem.js'),
    },
    extensions:[
        '.js',
        '.json'
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      name: 'common/index',
      cacheGroups: {
        default: {
            minChunks: 2,
            priority: -20,
            name: "common/default",
            chunks: "all",
            reuseExistingChunk: true,
        },
        vendors: {
            name: "common/vendors",
            chunks: "all",
            test: /[\\/]node_modules[\\/]/,
            priority: -10
        }
      }
    }
  },
  module:{
    rules:[
        {
            test: /\.css$/,
            use: ['style-loader','css-loader']
        },
        {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: [
                    'css-loader', 
                    'sass-loader',
                {
                    loader:"postcss-loader",
                    options: {
                        plugins: [
                            require("autoprefixer") 
                        ]
                    }
                }
            ]
            })
        },
        { 
            test:/\.(png|jpg|jpeg|gif)$/,
            use:[
                
                {// base64图片
                    loader:'url-loader',
                    options:{
                        outputPath:'image/',
                        limit: 1000
                    }
                },
                {// 压缩图片
                    loader:'img-loader',
                    options:{
                        pngquant:{ // png图片适用
                            quality: 80
                        }
                    }
                }
            ]
        },
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
            }  
        }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['dist'],{
        root: basePath, //根目录
        verbose: true, 
        dry: false,
    }),
    new ExtractTextPlugin({
        filename:'[name].[chunkhash:7].css'
    }),
    
    new HtmlWebpackPlugin({
        template:path.resolve(basePath, 'src/live/index.html'),
        chunks:['live','common/vendors','common/default'],
        minify:{
            collapseWhitespace:true
        }
    })
  ],
  devtool: 'inline-source-map',
  devServer: {
    host: '172.17.3.159',
    https:true,
    contentBase: path.join(basePath, 'dist'),
    compress: true,
    port: 9000
  }
};