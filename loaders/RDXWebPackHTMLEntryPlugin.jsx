import FS from 'fs';
import HTMLConfig from './HTMLConfig';

export default class RDXWebPackHTMLEntryPlugin {
  static PLUGIN_NAME = 'RDXWebPackHTMLEntryPlugin';

  getModuleBuilder = compilation => module => {
    const {
      assets,
      compiler: {
        context: fullContextPath = ''
      } = {}
    } = compilation;
    const {
      request: fullFilePath = ''
    } = module;

    if (/\.html?$/i.test(fullFilePath)) {
      const htmlConfig = new HTMLConfig({
        content: FS.readFileSync(fullFilePath, {encoding: 'utf8'}),
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
