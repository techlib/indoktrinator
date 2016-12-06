// file: .scripts/translate.js
import * as fs from 'fs';
import {sync as globSync} from 'glob';
import {sync as mkdirpSync} from 'mkdirp';
import Translator from './../translator';
const MESSAGES_PATTERN = './indoktrinator/static/dist/messages/**/*.json';
const LANG_DIR = './indoktrinator/static/dist/lang/';
// Aggregates the default messages that were extracted from the example app's
// React components via the React Intl Babel plugin. An error will be thrown if
// there are messages in different components that use the same `id`. The result
// is a flat collection of `id: message` pairs for the app's default locale.
let defaultMessages = globSync(MESSAGES_PATTERN)
  .map((filename) => fs.readFileSync(filename, 'utf8'))
.map((file) => JSON.parse(file))
  .reduce((collection, descriptors) => {
    descriptors.forEach(({id, defaultMessage}) => {
      if (collection.hasOwnProperty(id)) {
        //throw new Error(`Duplicate message id: ${id}`);
      } else {
        collection[id] = defaultMessage;
      }
    });
    return collection;
  }, {});
mkdirpSync(LANG_DIR);
fs.writeFileSync(LANG_DIR + 'en-US.json', JSON.stringify(defaultMessages, null, 2));
fs.writeFileSync(LANG_DIR + 'cz.json', JSON.stringify(defaultMessages, null, 2));