import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { promises as fs } from 'fs';
import { Doc } from './types';
import path from 'path';

export const basePath = '../starter-mui/';

const rootIndex = { fileName: 'index.ts', dir: '' };
const index = { fileName: 'index.ts', dir: '/src' };
const component = { fileName: '${name}.ts', dir: '/src' };
const documentation = { fileName: 'doc.mdx', dir: '/doc' };

const saveDoc = async (doc: Doc): Promise<boolean> => {
  try {
    const tsPath = path.join(basePath, doc.dsd, component.dir);
    await fs.mkdir(tsPath, { recursive: true });
    await fs.writeFile(
      path.join(tsPath, component.fileName.replace('${name}', doc.dsd)),
      doc.ts || ''
    );

    const indexTsPath = path.join(basePath, doc.dsd, index.dir);
    await fs.mkdir(indexTsPath, { recursive: true });
    await fs.writeFile(path.join(indexTsPath, index.fileName), doc.index || '');

    const indexJsPath = path.join(basePath, doc.dsd, rootIndex.dir);
    await fs.mkdir(indexJsPath, { recursive: true });
    await fs.writeFile(
      path.join(indexJsPath, rootIndex.fileName),
      doc.rootIndex || ''
    );

    const docPath = path.join(basePath, doc.dsd, documentation.dir);
    await fs.mkdir(docPath, { recursive: true });
    await fs.writeFile(
      path.join(docPath, documentation.fileName),
      doc.dsdDoc || ''
    );

    return true;
  } catch (error) {
    console.log('error saving doc', doc.dsd, error);
    return false;
  }
};

export const save = async (docsMap: Doc[]): Promise<boolean[]> =>
  Promise.all(docsMap.map(saveDoc));
