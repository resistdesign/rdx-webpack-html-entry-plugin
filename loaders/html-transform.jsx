import {getOptions} from 'loader-utils';

export default function () {
  const {
    resourcePath
  } = {...this};
  const {
    getContent
  } = getOptions(this);

  return getContent(resourcePath);
};
