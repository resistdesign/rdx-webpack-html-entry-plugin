import FS from 'fs';
import HTMLConfig from './HTMLConfig';

export default class RDXHTMLPlugin {
  static PLUGIN_NAME = 'RDXHTMLPlugin';

  getModuleBuilder = compilation => module => {
    const {
      context: fullContextPath = '',
      request: fullFilePath = ''
    } = module;

    if (/\.htm$/i.test(fullFilePath)) {
      const htmlConfig = new HTMLConfig({
        content: FS.readFileSync(fullFilePath, {encoding: 'utf8'}),
        fullFilePath,
        fullContextPath
      });
      const {
        content = '',
        relativeHTMLPath
      } = htmlConfig.getCurrentData();

      compilation.assets[relativeHTMLPath] = {
        source: () => content,
        size: () => content.length
      };
    }
  };

  configureCompilation = compilation => {
    compilation.hooks.buildModule.tap(RDXHTMLPlugin.PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.rebuildModule.tap(RDXHTMLPlugin.PLUGIN_NAME, this.getModuleBuilder(compilation));
  };

  apply = (compiler) => {
    compiler.hooks.compilation.tap(RDXHTMLPlugin.PLUGIN_NAME, this.configureCompilation);
  };
}
