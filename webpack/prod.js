var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')

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
        loader: 'babel-loader',
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

    new CopyWebpackPlugin([
      {
        from: { glob: './node_modules/patternfly/dist/img/*.*'},
        to: '../img',
        ignore: ['brand*', 'RH*', 'apple-touch*', 'favicon',
          'OpenShift*', 'kubernetes*', 'logo*'],
        flatten: true
      },
      {
        from: { glob: './node_modules/patternfly/dist/fonts/*.*'},
        to: '../fonts',
        flatten: true
      },
      {
        from: { glob: './node_modules/patternfly/dist/css/*.*'},
        to: '../css',
        flatten: true
      },
      {
        from: { glob: './node_modules/patternfly/dist/js/*.*'},
        to: '../js',
        flatten: true
      }
    ]),
  ]
};

/* vim:set sw=2 ts=2 et: */
