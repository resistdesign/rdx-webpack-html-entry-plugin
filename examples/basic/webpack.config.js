const Path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {RDXWebPackHTMLEntryPlugin, HTML_EXT_REGEX} = require('../../dist');

module.exports = {
  mode: 'development',
  entry: {
    'index.html': './index.html',
    'odd-ball.htm': './odd-ball.htm',
    'other/index.html': './other/index.html'
  },
  context: Path.resolve(__dirname, 'src'),
  resolve: {
    extensions: [
      '.js',
      '.json'
    ]
  },
  output: {
    path: Path.resolve('./public')
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['**/*']
    }),
    new RDXWebPackHTMLEntryPlugin()
  ],
  module: {
    rules: [
      {
        exclude: HTML_EXT_REGEX,
        loader: require.resolve('file-loader'),
        options: {
          name: '[path][name].[ext]?[contenthash]',
          outputPath: ''
        }
      }
    ]
  }
};
