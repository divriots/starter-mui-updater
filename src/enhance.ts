import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { camelCase, upperFirst } from 'lodash';
import { Doc } from './types';
import pth from 'path';
import { loadDoc } from './load';

const staticImports = `
import { mdx } from '@mdx-js/react';
import { Playground as BklPlayground } from '@divriots/dockit-react/playground';
import { MdxLayout } from '~/layout';
export default MdxLayout;
`;

const playgroundTemplate = `<BklPlayground
scope={{ $scope }}
code={\`
$code
\`}
/>`;

const metaRegex = /^---\n(.+?)---/gms;
const componentsHeaderRegex = /^\{\{"component":(.+?)\}\}/gms;
const demoPathRegex = /^\{\{"demo": "(.+?)"(.*?)\}\}/gms;
const materialDefaultImportRegex =
  // /^import ([^;]+?) from '@mui\/(material|core)\/((?!styled).+?)';/gms;
  /^import ([^;]+?) from '@mui\/(material|core)\/((?!(styled|colors)).+?)';/gms;
const curlyBracesRegex = /\{|\}/gms;

const getMainComponent = (doc: Doc) =>
  doc.componentName || upperFirst(camelCase(doc.dsd));

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

    return `$${componentName}`;
  });

  const getSample = async (name: string, path: string) => {
    const sample = await loadDoc(path.replace('.js', '.tsx.preview'));

    // if (sample)
    //   return playgroundTemplate
    //     .replace('$scope', `${mainComponent}, ${name}`)
    //     .replace('$code', sample);

    const codeSample = sample || `<${name} />`;

    return `<${name} />
    
    \`\`\`tsx
    ${codeSample}
    \`\`\`
    `;
  };

  const getDemoContent = async (path: string) =>
    (await loadDoc(path.replace('.js', '.tsx'))).replaceAll(
      materialDefaultImportRegex,
      (_, component: string, lib: string) =>
        `import { ${component.replaceAll(
          curlyBracesRegex,
          ''
        )} } from '@mui/${lib}';`
    );

  const demos = await Promise.all(
    demoComponents.map(async ({ name, path }) => ({
      name,
      content: await getDemoContent(path),
      sample: await getSample(name, path),
    }))
  );

  const withDemoSamples = demos.reduce(
    (acc, demo) => acc.replace(`$${demo.name}`, demo.sample),
    withDemos
  );

  const withClassName = withDemoSamples.replaceAll('class=', 'className=');

  const imports = componentImports.join('\n');

  const mainComponentImport = `import { ${getMainComponent(doc)} } from '~/${
    doc.dsd
  }'`;

  return {
    dsdDoc: `${mainComponentImport}\n${imports}${staticImports}\n${withClassName}`,
    demos,
  };
};

// /src/[name].ts
const getComponentTsContent = (doc: Doc): string => {
  const name = getMainComponent(doc);
  return `export { ${name} } from '@mui/material';`;
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
