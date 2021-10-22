import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { camelCase, upperFirst, trim } from 'lodash';
import { Doc } from './types';
import pth from 'path';
import { loadDoc } from './load';
import docMap from './docs-map';

const getMainComponents = (doc: Doc) =>
  doc.componentNames || [upperFirst(camelCase(doc.dsd))];

const dsComponents: (Doc & { componentNames: string[] })[] = docMap.map(d => ({
  componentNames: getMainComponents(d),
  ...d,
}));

const staticImports = `
import { mdx } from '@mdx-js/react';
import { Playground as BklPlayground } from '@divriots/dockit-react/playground';
import { DemoFrame } from '~/demo-frame';
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
const commentsRegex = /^<!--(.*?)-->/gms;
const componentsHeaderRegex = /^\{\{"component":(.+?)\}\}/gms;
const demoPathRegex = /^\{\{"demo": "(.+?)"(.*?)\}\}/gms;
const mdLinksRegex = /\[(.+?)\]\((.+?)\)/gm;
const linkTagRegex = /\((.+?)\<(http.*?)\/\>\)/gm;
const highlightedCodeJsxRegex = /<HighlightedCode(.+?)\/>/gms;
const highlightedCodeImport = `import HighlightedCode from 'docs/src/modules/components/HighlightedCode';`;

const materialDefaultImportRegex =
  /^import ([^;]+?) from '@mui\/(material|core|icons-material)\/((?!colors).+?)';/gms;
const curlyBracesRegex = /\{|\}/gms;

const enhanceDoc = async (doc: Doc) => {
  const noComponentHeader = (doc?.muiDoc || '').replaceAll(
    componentsHeaderRegex,
    ''
  );
  const noMeta = noComponentHeader.replaceAll(metaRegex, '');
  const noComments = noMeta.replaceAll(commentsRegex, '');
  const noMdLinks = noComments.replaceAll(mdLinksRegex, (_, desc) => desc);
  const noLinkTag = noMdLinks.replaceAll(
    linkTagRegex,
    (_, name, link) => `${name} ${link}`
  );

  const componentImports: string[] = [];
  const demoComponents: { name: string; path: string; otherInfo: string }[] =
    [];

  const withDemos = noLinkTag.replaceAll(
    demoPathRegex,
    (_, demoPath, otherInfo) => {
      const componentName = pth.basename(demoPath, '.js');
      componentImports.push(
        `import ${componentName} from './${componentName}';`
      );

      demoComponents.push({ name: componentName, path: demoPath, otherInfo });

      return `$${componentName}`;
    }
  );

  const getSample = async (name: string, path: string, otherInfo: string) => {
    const sample = await loadDoc(path.replace('.js', '.tsx.preview'));

    // if (sample)
    //   return playgroundTemplate
    //     .replace('$scope', `${mainComponent}, ${name}`)
    //     .replace('$code', sample);

    const codeSample = sample || `<${name} />`;

    const demo = otherInfo.includes('"iframe": true')
      ? `<DemoFrame>
  <${name} />
</DemoFrame>
    `
      : `<${name} />`;

    return `${demo}
    
\`\`\`tsx
${codeSample}
\`\`\`
    `;
  };

  const getDemoContent = async (
    path: string
  ): Promise<{ content: string; type: 'jsx' | 'tsx' }> => {
    const retrievedContent = await loadDoc(path.replace('.js', '.tsx'));

    const { content, type } = retrievedContent
      ? { content: retrievedContent, type: 'tsx' }
      : { content: await loadDoc(path), type: 'jsx' };

    const withImports = content.replaceAll(
      materialDefaultImportRegex,
      (_, component: string, lib: string, componentPath: string) => {
        const alias = !component.startsWith('{') && component.split(/,| /g)[0];

        const noCurly = component.replaceAll(curlyBracesRegex, '');

        const aliasExists = alias && alias !== componentPath;
        const nameAsAlias = `${componentPath} as ${alias}`;

        const names = aliasExists
          ? noCurly.replace(alias, nameAsAlias)
          : noCurly;

        const wordRegex = (word: string) => new RegExp(`\\b${word}\\b`, `gm`);
        const ds =
          lib === 'material' &&
          dsComponents
            .map(d => ({
              ...d,
              componentNames: d.componentNames.filter(name =>
                wordRegex(name).test(names)
              ),
            }))
            .find(d => d.componentNames.length > 0);

        const dsImport = !!ds
          ? `import { ${ds.componentNames
              .map(n =>
                aliasExists && nameAsAlias.includes(n) ? nameAsAlias : n
              )
              .join(',')} } from '~/${ds.dsd}';`
          : '';

        const getMuiImport = () => {
          if (!ds) return `import { ${names} } from '@mui/${lib}';`;

          const others = ds.componentNames.reduce((acc, n) => {
            const withoutAlias =
              aliasExists && !!nameAsAlias ? acc.replace(nameAsAlias, '') : acc;
            return trim(
              withoutAlias.replace(wordRegex(n), '').trim(),
              ','
            ).trim();
          }, names);

          return others ? `import { ${others} } from '@mui/${lib}';` : '';
        };

        return [dsImport, getMuiImport()].filter(i => !!i).join('\n');
      }
    );

    const withAbsoluteSrc = withImports
      .replaceAll('src="/static', 'src="https://mui.com/static')
      .replaceAll('image="/static', 'image="https://mui.com/static');

    const withNoHighlightedCodeComponent = withAbsoluteSrc
      .replaceAll(highlightedCodeJsxRegex, '')
      .replaceAll(highlightedCodeImport, '');

    const withParticularFixes = path.includes('MusicPlayerSlider')
      ? withNoHighlightedCodeComponent.replace(
          `<Box sx={{ width: '100%', overflow: 'hidden' }}>`,
          `<Box sx={{ width: '100%', overflow: 'hidden', position: 'relative', padding: '1rem' }}>`
        )
      : withNoHighlightedCodeComponent;

    const withRelativeBoxes = withParticularFixes.replace(
      `<Box sx={{ display: 'flex' }}>`,
      `<Box sx={{ display: 'flex', position: 'relative' }}>`
    );

    return { content: withRelativeBoxes, type: type as 'tsx' | 'jsx' };
  };

  const demos = await Promise.all(
    demoComponents.map(async ({ name, path, otherInfo }) => ({
      name,
      ...(await getDemoContent(path)),
      sample: await getSample(name, path, otherInfo),
    }))
  );

  const withDemoSamples = demos.reduce(
    (acc, demo) => acc.replace(`$${demo.name}`, demo.sample),
    withDemos
  );

  const withClassName = withDemoSamples.replaceAll('class=', 'className=');

  const imports = componentImports.join('\n');

  const mainComponentImport = `import { ${getMainComponents(doc).join(
    ','
  )} } from '~/${doc.dsd}'`;

  return {
    dsdDoc: `${mainComponentImport}\n${imports}${staticImports}\n${withClassName}`,
    demos,
  };
};

// /src/[name].ts
const getComponentTsContent = (doc: Doc): string => {
  const names = getMainComponents(doc).join(',');
  return `export { ${names} } from '@mui/material';`;
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
