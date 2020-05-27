import HTMLConfig from './HTMLConfig';

export default class RDXWebPackHTMLEntryPlugin {
  static PLUGIN_NAME = 'RDXWebPackHTMLEntryPlugin';

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

    console.log(Object.keys(compilation));

    if (/\.html?$/i.test(fullFilePath)) {
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
    compiler.hooks.compilation.tap(RDXWebPackHTMLEntryPlugin.PLUGIN_NAME, this.configureCompilation);
  };
}
