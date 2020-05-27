require('resistdesign-babel-register');
const Path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {getEntryMapFromHTMLFileList} = require('./loaders/HTMLConfig');
const RDXWebPackHTMLEntryPlugin = require('./loaders/RDXWebPackHTMLEntryPlugin');

const context = Path.resolve(__dirname, 'src');
const htmlFullFilePathList = [
  Path.join(context, './index.html'),
  Path.join(context, './junk/index.html')
];

module.exports = {
  mode: 'development',
  entry: () => getEntryMapFromHTMLFileList(
    htmlFullFilePathList,
    context
  ),
  context,
  resolve: {
    extensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json'
    ]
  },
  output: {
    path: Path.resolve('./public')
  },
  plugins: [
    new CleanWebpackPlugin(),
    new RDXWebPackHTMLEntryPlugin()
  ],
  module: {
    rules: [
      {
        exclude: RDXWebPackHTMLEntryPlugin.HTML_EXT_REGEX,
        loader: require.resolve('file-loader'),
        options: {
          name: '[path][name].[ext]?[contenthash]',
          outputPath: ''
        }
      }
    ]
  }
};
