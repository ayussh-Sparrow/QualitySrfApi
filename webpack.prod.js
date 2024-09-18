const path = require('path')
const nodeExternals = require('webpack-node-externals')
const CopyPlugin = require('copy-webpack-plugin'); // Import CopyPlugin
const Dotenv = require('dotenv-webpack');
module.exports = {
  entry: {
    main: './app.js',
  },
  output: {
    path: path.join(__dirname, 'quality.Prod-1'),
    publicPath: '/',
    filename: '[name].js',
    clean:true
  },
  target: 'node',
  mode:'production',
  node: {
    // Need this when working with express, otherwise the build fails
    __dirname: false,   // if you don't put this is, __dirname
    __filename: false,  // and __filename return blank or /
  },
  externals: [nodeExternals()], // Need this to avoid error when working with Express
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'] // Transpile ES6 and above to ES5
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'package.json', to: 'package.json' }, // Adjust the source and destination paths as needed
      ],
    }),
    new Dotenv()
  ],
 
}