import 'core-js/stable';
import 'regenerator-runtime/runtime';
import docsMap from './docs-map';
import { load } from './load';
import { enhance } from './enhance';
import { save } from './save';
import { format } from './format';

console.log('updating...');

const update = async () => {
  const docs = await load(docsMap);
  const enhanced = await enhance(docs);
  await save(enhanced);
  await format();
};

update().then(() => console.log('updated!'));
