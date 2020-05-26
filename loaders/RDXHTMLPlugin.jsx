import FS from 'fs';
import HTMLConfig from './HTMLConfig';

export default class RDXHTMLPlugin {
  static PLUGIN_NAME = 'RDXHTMLPlugin';
  htmlFullFilePathList;

  constructor(config = {}) {
    Object.assign(this, config);

    this.htmlFullFilePathList = this.htmlFullFilePathList || [];
  }

  apply = (compiler) => {
    compiler.hooks.entryOption.tap(
      RDXHTMLPlugin.PLUGIN_NAME,
      (context, entry) => {
        const htmlConfigMap = this.htmlFullFilePathList
          .reduce((acc, fullHTMLFilePath = '') => {
            const htmlConfig = new HTMLConfig({
              content: '',
              fullFilePath: fullHTMLFilePath,
              fullContextPath: context
            });
            const updateContent = () => {
              htmlConfig.content = FS.readFileSync(fullHTMLFilePath, {encoding: 'utf8'});
            };

            return {
              ...acc,
              [fullHTMLFilePath]: {
                htmlConfig,
                updateContent
              }
            };
          }, {});
      }
    );
    compiler.hooks.compilation.tap(
      RDXHTMLPlugin.PLUGIN_NAME,
      compilation => {
        compilation.hooks.buildModule.tap(
          RDXHTMLPlugin.PLUGIN_NAME,
          module => {
            const htmlConfig = {};
          }
        );
      }
    );
  };
}
