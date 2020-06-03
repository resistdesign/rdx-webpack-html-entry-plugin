import Crypto from 'crypto';
import Path from 'path';
import Cheerio from 'cheerio';
import has = Reflect.has;

const URL_REGEX = /^([a-z]|:)*?(?<!\/.)\/\/[a-z0-9-.]*?($|\/.*?$|\?.*?$)/gmi;
const HTML_PROCESSING_FLAGS = {
  BASE: 'base',
  PRELOAD: 'preload',
  PREFETCH: 'prefetch',
  WORKER: 'worker'
};
export const includeDotInRelativePath = (relativePath: string) => Path.isAbsolute(relativePath) ||
relativePath.indexOf(`..${Path.sep}`) === 0 ?
  relativePath :
  `.${Path.sep}${relativePath}`;
export const getContentHash = (content = '') => {
  const hash = Crypto.createHash('sha256');

  hash.update(content, 'utf8');

  return hash.digest('hex');
};
export const getHTMLReferencePathProcessor = ({
                                                parser,
                                                attrName = '',
                                                contentHash = '',
                                                entry = {},
                                                workerEntry = {},
                                                importHashMap = {}
                                              }: {
  parser: Function,
  attrName: string,
  contentHash: string,
  entry: { [key: string]: string },
  workerEntry: { [key: string]: string },
  importHashMap: { [key: string]: any }
}) => function () {
  const elem = parser(this);
  const tagName = `${this.tagName}`.toLowerCase();
  const sourcePath = elem.attr(attrName) || '';
  const rel = `${elem.attr('rel')}`.toLowerCase();
  const asValue = `${elem.attr('as')}`.toLowerCase();
  const sourceIsWorker = asValue === HTML_PROCESSING_FLAGS.WORKER;

  // TODO: Detect package paths?
  if (
    // Skip the base tag.
    tagName !== HTML_PROCESSING_FLAGS.BASE &&
    // Skip URLs and preloaded content.
    !sourcePath.match(URL_REGEX) &&
    (
      // TRICKY: Skip preloaded/prefetched files *except* workers.
      sourceIsWorker ||
      (
        rel !== HTML_PROCESSING_FLAGS.PRELOAD &&
        rel !== HTML_PROCESSING_FLAGS.PREFETCH
      )
    )
  ) {
    if (sourceIsWorker) {
      // Sort out Web Workers for separate compilation.
      workerEntry[sourcePath] = sourcePath;
    } else {
      entry[sourcePath] = sourcePath;
    }

    elem.attr(attrName, `${sourcePath}?${importHashMap[sourcePath] || contentHash}`);
  }
};

export interface HTMLConfigOptions {
  content?: string,
  fullFilePath: string,
  fullContextPath: string
}

export default class HTMLConfig {
  content: string;
  fullFilePath: string;
  fullContextPath: string;
  importHashMap: { [key: string]: any } = {};

  constructor(options: HTMLConfigOptions) {
    Object.assign(this, options);
  }

  updateHashForImportedDependency = (name: string, hash: any) => {
    this.importHashMap[name] = hash;
  };

  getCurrentData = () => {
    const contentHash = getContentHash(this.content);
    const parser = Cheerio.load(this.content);
    const hrefNodes = parser('[href]:not(a)');
    const srcNodes = parser('[src]');
    const metaAppConfigNodes = parser('meta[name="msapplication-config"]');
    const relativeHTMLPath = includeDotInRelativePath(
      Path.relative(
        this.fullContextPath,
        this.fullFilePath
      )
    );
    const entry = {};
    const workerEntry = {};
    const baseHTMLReferencePathProcessorConfig = {
      parser,
      contentHash,
      entry,
      workerEntry
    };

    console.log('HTML IMPORT MAP:', this.importHashMap);

    hrefNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'href',
      importHashMap: this.importHashMap
    }));
    srcNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'src',
      importHashMap: this.importHashMap
    }));
    metaAppConfigNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'content',
      importHashMap: this.importHashMap
    }));

    return {
      contentHash,
      content: parser.html(),
      relativeHTMLPath,
      entry,
      workerEntry
    };
  };
}
