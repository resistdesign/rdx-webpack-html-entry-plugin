require('resistdesign-babel-register');
const Path = require('path');
const RDXHTMLPlugin = require('./loaders/RDXHTMLPlugin');

const context = Path.resolve(__dirname, 'src');
const htmlFullFilePathList = [
  Path.join(context, './index.html'),
  Path.join(context, './junk/index.html')
];

module.exports = {
  mode: 'development',
  entry: {},
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
    new RDXHTMLPlugin({
      htmlFullFilePathList
    })
  ],
  module: {
    rules: [
      {
        loader: require.resolve('file-loader'),
        options: {
          name: '[path][name].[ext]?[contenthash]',
          outputPath: ''
        }
      }
    ]
  }
};
