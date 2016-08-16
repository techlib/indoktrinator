var webpack = require('webpack')

module.exports = {
  devtool: 'eval',
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
    }
    ]},
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
};

/* vim:set sw=2 ts=2 et: */
