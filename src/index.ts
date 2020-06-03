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

class HTMLImportDependency extends ImportDependency {
  htmlImportName: string;
  htmlConfig: HTMLConfig;

  constructor(...args: any) {
    super(...args);
  }

  get type() {
    return 'import()';
  }

  updateHash(hash: any, chunkGraph: any) {
    super.updateHash(hash, chunkGraph);

    this.htmlConfig.updateHashForImportedDependency(
      this.htmlImportName,
      hash
    );
  }
}

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

class HTMLModule extends NormalModule {
  generator: any;

  constructor(...args: any) {
    super(...args);

    this.generator = new IgnoreGenerator();
  }

  shouldPreventParsing = () => true;
}

interface HTMLSourceOptions {
  htmlConfig?: HTMLConfig;
}

class HTMLSource {
  htmlConfig: HTMLConfig;

  constructor(options: HTMLSourceOptions = {}) {
    Object.assign(this, options);
  }

  source = () => {
    const {
      content = ''
    } = this.htmlConfig.getCurrentData();

    return content;
  };

  size = () => {
    const {
      content = ''
    } = this.htmlConfig.getCurrentData();

    return content.length;
  };
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
        relativeHTMLPath,
        entry,
        workerEntry
      } = htmlConfig.getCurrentData();
      const depMap = {
        ...entry,
        ...workerEntry
      };
      const currentAsset = compilation.getAsset(relativeHTMLPath);
      const assetSource = new HTMLSource({
        htmlConfig
      });

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
          const newDep = new HTMLImportDependency(dN);

          newDep.htmlImportName = dN;
          newDep.htmlConfig = htmlConfig;

          mod.addDependency(newDep);
        }
      }
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

  configureCompilation = (compilation: Compilation, {
    normalModuleFactory
  }: {
    normalModuleFactory: any
  }) => {
    compilation.hooks.buildModule.tap(PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.rebuildModule.tap(PLUGIN_NAME, this.getModuleBuilder(compilation));
    compilation.hooks.afterSeal.tap(PLUGIN_NAME, this.getDeadAssetRemover(compilation));
    compilation.dependencyFactories.set(
      HTMLImportDependency,
      normalModuleFactory
    );
  };

  apply = (compiler: Compiler) => {
    compiler.hooks.compilation.tap(PLUGIN_NAME, this.configureCompilation);
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (normalModuleFactory: NormalModuleFactory) => {
      normalModuleFactory.hooks.afterResolve.tap(PLUGIN_NAME, (resolveData: {
        request: string,
        createData: any
      }) => {
        const {
          request = '',
          createData
        } = resolveData;

        if (HTML_EXT_REGEX.test(request)) {
          // TODO: Fix HTML module configuration.
          return normalModuleFactory.hooks.module.call(
            new HTMLModule(createData),
            createData,
            resolveData
          );
        }
      });
    });
  };
}

export default RDXWebPackHTMLEntryPlugin;
