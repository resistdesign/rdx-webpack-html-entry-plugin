require('resistdesign-babel-register');
const Path = require('path');
const {getEntryMapFromHTMLFileList} = require('./loaders/HTMLConfig');
const RDXWebPackHTMLEntryPlugin = require('./loaders/RDXWebPackHTMLEntryPlugin');

const context = Path.resolve(__dirname, 'src');
const htmlFullFilePathList = [
  Path.join(context, './index.html'),
  Path.join(context, './junk/index.html')
];

module.exports = {
  mode: 'development',
  entry: getEntryMapFromHTMLFileList(
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
    new RDXWebPackHTMLEntryPlugin()
  ],
  module: {
    rules: [
      {
        exclude: /\.html$/i,
        loader: require.resolve('file-loader'),
        options: {
          name: '[path][name].[ext]?[contenthash]',
          outputPath: ''
        }
      }
    ]
  }
};
