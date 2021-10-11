import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { promises as fs } from 'fs';
import { Doc } from './types';
import path from 'path';
import { uniq } from 'lodash';

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

    await Promise.all(
      (doc.demos || []).map(({ name, content }) =>
        fs.writeFile(path.join(docPath, `${name}.tsx`), content)
      )
    );

    return true;
  } catch (error) {
    console.log('error saving doc', doc.dsd, error);
    return false;
  }
};

const updateStudioConfig = async (docsMap: Doc[]) => {
  const studioConfigPath = `${basePath}/studio.config.json`;

  const studioConfig = JSON.parse(
    (await fs.readFile(studioConfigPath)).toString()
  );

  const newMenu = studioConfig.packages.menu.map((menuEntry: any) => {
    if (!Array.isArray(menuEntry)) return menuEntry;

    const [category, items] = menuEntry;

    return category === 'components'
      ? [category, uniq([...items, ...docsMap.map((doc) => doc.dsd)])]
      : [category, items];
  });

  await fs.writeFile(
    studioConfigPath,
    JSON.stringify(
      { packages: { ...studioConfig.packages, menu: newMenu } },
      null,
      2
    )
  );
};

export const save = async (docsMap: Doc[]): Promise<boolean[]> => {
  await updateStudioConfig(docsMap);
  return Promise.all(docsMap.map(saveDoc));
};
