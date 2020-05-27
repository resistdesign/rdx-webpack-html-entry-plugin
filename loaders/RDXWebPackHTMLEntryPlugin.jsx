import HTMLConfig from './HTMLConfig';
import ImportDependency from 'webpack/lib/dependencies/ImportDependency';

const HTML_EXT_REGEX = /\.html?$/i;

export default class RDXWebPackHTMLEntryPlugin {
  static PLUGIN_NAME = 'RDXWebPackHTMLEntryPlugin';
  static HTML_EXT_REGEX = HTML_EXT_REGEX;

  getModuleBuilder = compilation => mod => {
    const {
      assets,
      compiler: {
        context: fullContextPath = ''
      } = {},
      inputFileSystem
    } = compilation;
    const {
      dependencies = [],
      request: fullFilePath = ''
    } = mod;

    console.log('>>>   INFO:', Object.keys(compilation.compiler));

    if (HTML_EXT_REGEX.test(fullFilePath)) {
      const htmlConfig = new HTMLConfig({
        content: inputFileSystem.readFileSync(fullFilePath, {encoding: 'utf8'}),
        fullFilePath,
        fullContextPath
      });
      const {
        content = '',
        relativeHTMLPath,
        entry,
        workerEntry
      } = htmlConfig.getCurrentData();
      const depMap = {
        ...entry,
        ...workerEntry
      };

      assets[relativeHTMLPath] = {
        source: () => content,
        size: () => content.length
      };

      for (const dN in depMap) {
        if (depMap.hasOwnProperty(dN)) {
          const newDep = new ImportDependency(dN);

          dependencies.push(newDep);
        }
      }

      mod.type = 'asset/resource';
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
