import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { camelCase, upperFirst } from 'lodash';
import { Doc } from './types';
import pth from 'path';
import { loadDoc } from './load';

const mdxImport = `
import { mdx } from '@mdx-js/react';
`;
const mdxLayoutImport = `
import { MdxLayout } from '~/layout';
export default MdxLayout;
`;

const metaRegex = /^---\n(.+?)---/gms;
const componentsHeaderRegex = /^\{\{"component":(.+?)\}\}/gms;
const demoPathRegex = /^\{\{"demo": "(.+?)"(.*?)\}\}/gms;

const enhanceDoc = async (doc: Doc) => {
  const noComponentHeader = (doc?.muiDoc || '').replaceAll(
    componentsHeaderRegex,
    ''
  );
  const noMeta = noComponentHeader.replaceAll(metaRegex, '');

  const componentImports: string[] = [];
  const demoComponents: { name: string; path: string }[] = [];

  const withDemos = noMeta.replaceAll(demoPathRegex, (_, demoPath) => {
    const componentName = pth.basename(demoPath, '.js');
    componentImports.push(`import ${componentName} from './${componentName}';`);

    demoComponents.push({ name: componentName, path: demoPath });

    return `<${componentName} />`;
  });

  const withClassName = withDemos.replaceAll('class=', 'className=');

  const imports = componentImports.join('\n');

  const demos = await Promise.all(
    demoComponents.map(async ({ name, path }) => ({
      name,
      content: await loadDoc(path.replace('.js', '.tsx')),
    }))
  );

  return {
    dsdDoc: `${mdxImport}${imports}${mdxLayoutImport}\n${withClassName}`,
    demos,
  };
};

// /src/[name].ts
const getComponentTsContent = (doc: Doc): string => {
  const name = upperFirst(camelCase(doc.dsd));
  return `export { default as ${name} } from '@mui/material/${name}';`;
};

// /src/index.ts
const getIndexTsContent = (name: string = ''): string =>
  `export * from './${name}';`;

// /index.ts
export const getIndexJsContent = (): string => `export * from './src/index';`;

export const enhance = async (docsMap: Doc[]): Promise<Doc[]> => {
  return Promise.all(
    docsMap.map(async (doc: Doc) => ({
      ...(await enhanceDoc(doc)),
      ts: getComponentTsContent(doc),
      index: getIndexTsContent(doc.dsd),
      rootIndex: getIndexJsContent(),
      ...doc,
    }))
  );
};
