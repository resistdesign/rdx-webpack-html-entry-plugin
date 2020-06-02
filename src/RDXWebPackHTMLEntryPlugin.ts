import HTMLConfig from './HTMLConfig';
// @ts-ignore
import Compiler from 'webpack/lib/Compiler';
// @ts-ignore
import Compilation from 'webpack/lib/Compilation';
// @ts-ignore
import NormalModuleFactory, {} from 'webpack/lib/NormalModuleFactory';
// @ts-ignore
import NormalModule from 'webpack/lib/NormalModule';
// @ts-ignore
import ImportDependency from 'webpack/lib/dependencies/ImportDependency';
// @ts-ignore
import JavascriptGenerator from 'webpack/lib/JavascriptGenerator';

export const PLUGIN_NAME = 'RDXWebPackHTMLEntryPlugin';
export const HTML_EXT_REGEX = /\.html?$/i;
export const HTML_JS_EXT_REGEX = /\.html?\.js$/i;

class IgnoreGenerator extends JavascriptGenerator {
  static TYPES = new Set(['ignore']);

  getTypes() {
    return IgnoreGenerator.TYPES;
  }

  generate() {
    return {
      source: () => undefined,
      size: () => undefined
    };
  }
}

export class RDXWebPackHTMLEntryPlugin {
  getModuleBuilder = (compilation: Compilation) => (mod: NormalModule) => {
    const {
      compiler: {
        context: fullContextPath = ''
      } = {},
      inputFileSystem
    } = compilation;
    const {
      request: fullFilePath = ''
    } = mod;

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
      const currentAsset = compilation.getAsset(relativeHTMLPath);
      // TODO: Provide a source with dynamic methods so that content hashes can be updated from the import dependencies.
      const assetSource = mod.createSourceForAsset(relativeHTMLPath, content);

      if (!currentAsset) {
        compilation.emitAsset(
          relativeHTMLPath,
          assetSource
        );
      } else {
        compilation.updateAsset(
          relativeHTMLPath,
          assetSource
        );
      }

      for (const dN in depMap) {
        if (depMap.hasOwnProperty(dN)) {
          // TODO: Create a custom import dependency class that can update the content hashes on the HTMLConfig once loaded.
          const newDep = new ImportDependency(dN);

          mod.addDependency(newDep);
        }
      }

      mod.shouldPreventParsing = () => true;
    }
  };

  getDeadAssetRemover = (compilation: Compilation) => () => {
    const {
      assets = {}
    } = compilation;

    for (const aN in assets) {
      if (assets.hasOwnProperty(aN) && HTML_JS_EXT_REGEX.test(aN)) {
        delete assets[aN];
      }
    }
  };

  configureCompilation = (compilation: Compilation) => {
    compilation.hooks.buildModule.tap(PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.rebuildModule.tap(PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.afterSeal.tap(PLUGIN_NAME, this.getDeadAssetRemover(compilation));
  };

  apply = (compiler: Compiler) => {
    compiler.hooks.compilation.tap(PLUGIN_NAME, this.configureCompilation);
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory: NormalModuleFactory) => {
      normalModuleFactory.hooks.afterResolve.tap(PLUGIN_NAME, (result: {
        resource: string,
        generator: JavascriptGenerator
      }) => {
        const {
          resource = ''
        } = result;

        if (HTML_EXT_REGEX.test(resource)) {
          result.generator = new IgnoreGenerator();
        }
      });
    });
  };
}

export default RDXWebPackHTMLEntryPlugin;
