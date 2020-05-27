import Crypto from 'crypto';
import Path from 'path';
import Cheerio from 'cheerio';

const URL_REGEX = /^([a-z]|:)*?(?<!\/.)\/\/[a-z0-9-.]*?($|\/.*?$|\?.*?$)/gmi;
const HTML_PROCESSING_FLAGS = {
  BASE: 'base',
  PRELOAD: 'preload',
  PREFETCH: 'prefetch',
  WORKER: 'worker'
};
export const includeDotInRelativePath = (relativePath) => Path.isAbsolute(relativePath) ||
relativePath.indexOf(`..${Path.sep}`) === 0 ?
  relativePath :
  `.${Path.sep}${relativePath}`;
export const getEntryMapFromHTMLFileList = (htmlFileList = [], context = '') => htmlFileList
  .reduce((acc, k) => {
    const entry = includeDotInRelativePath(
      Path.relative(
        context,
        k
      )
    );

    return {
      ...acc,
      [entry]: entry
    };
  }, {});
export const getContentHash = (content = '') => {
  const hash = Crypto.createHash('sha256');

  hash.update(content, 'utf8');

  return hash.digest('hex');
};
export const getHTMLReferencePathProcessor = ({
                                                parser = {},
                                                attrName = '',
                                                contentHash = '',
                                                entry = {},
                                                workerEntry = {}
                                              } = {}) => function () {
  const elem = parser(this);
  const tagName = `${this.tagName}`.toLowerCase();
  const sourcePath = elem.attr(attrName) || '';
  const rel = `${elem.attr('rel')}`.toLowerCase();
  const asValue = `${elem.attr('as')}`.toLowerCase();
  const sourceIsWorker = asValue === HTML_PROCESSING_FLAGS.WORKER;

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

    elem.attr(attrName, `${sourcePath}?${contentHash}`);
  }
};

export default class HTMLConfig {
  content;
  fullFilePath;
  fullContextPath;

  constructor(config = {}) {
    Object.assign(this, config);
  }

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

    hrefNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'href'
    }));
    srcNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'src'
    }));
    metaAppConfigNodes.each(getHTMLReferencePathProcessor({
      ...baseHTMLReferencePathProcessorConfig,
      attrName: 'content'
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
