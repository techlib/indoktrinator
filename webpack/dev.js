var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: './indoktrinator/static/js/src/components/Router.jsx',
  output: {
    path: './indoktrinator/static/dist',
    filename: 'app.bundle.js'
  },
  module: {
    loaders: [
      {                             // Convert ES2015/React-code into ES5.
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          "cacheDirectory": false,
          "plugins": [
            'transform-react-inline-elements'
            ],
          "presets": ['react', "es2015"]
        },
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  }
};

/* vim:set sw=2 ts=2 et: */
