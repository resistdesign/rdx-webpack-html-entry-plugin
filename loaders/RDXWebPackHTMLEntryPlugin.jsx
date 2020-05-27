import HTMLConfig from './HTMLConfig';

const HTML_EXT_REGEX = /\.html?$/i;
const removeHTMLEntries = (context = '', entry = {}) => {
  for (const k in entry) {
    if (entry.hasOwnProperty(k) && HTML_EXT_REGEX.test(k)) {
      delete entry[k];
    }
  }
};

export default class RDXWebPackHTMLEntryPlugin {
  static PLUGIN_NAME = 'RDXWebPackHTMLEntryPlugin';
  static HTML_EXT_REGEX = HTML_EXT_REGEX;

  getModuleBuilder = compilation => module => {
    const {
      assets,
      compiler: {
        context: fullContextPath = ''
      } = {},
      inputFileSystem
    } = compilation;
    const {
      request: fullFilePath = ''
    } = module;

    console.log(Object.keys(compilation.compiler));

    if (HTML_EXT_REGEX.test(fullFilePath)) {
      const htmlConfig = new HTMLConfig({
        content: inputFileSystem.readFileSync(fullFilePath, {encoding: 'utf8'}),
        fullFilePath,
        fullContextPath
      });
      const {
        content = '',
        relativeHTMLPath
      } = htmlConfig.getCurrentData();

      assets[relativeHTMLPath] = {
        source: () => content,
        size: () => content.length
      };
    }
  };

  configureCompilation = compilation => {
    compilation.hooks.buildModule.tap(RDXWebPackHTMLEntryPlugin.PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.rebuildModule.tap(RDXWebPackHTMLEntryPlugin.PLUGIN_NAME, this.getModuleBuilder(compilation));
  };

  apply = (compiler) => {
    compiler.hooks.entryOption.tap(RDXWebPackHTMLEntryPlugin.PLUGIN_NAME, removeHTMLEntries);
    compiler.hooks.compilation.tap(RDXWebPackHTMLEntryPlugin.PLUGIN_NAME, this.configureCompilation);
  };
}
