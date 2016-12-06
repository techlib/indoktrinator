var webpack = require('webpack')

module.exports = {
  entry: './indoktrinator/static/js/src/components/Router.jsx',
  output: {
    path: 'indoktrinator/static/dist',
    filename: 'app.bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015'],
          cacheDirectory: true,
          plugins: ['transform-react-inline-elements']
        },
        exclude: /(node_modules|bower_components)/,
      },
      {test: /\.css$/, loader: "style-loader!css-loader"}
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
  ]
};

/* vim:set sw=2 ts=2 et: */
