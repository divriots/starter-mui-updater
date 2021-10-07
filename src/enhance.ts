import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { camelCase, upperFirst } from 'lodash';
import { Doc } from './types';

const mdxLayoutImport = `
import { mdx } from '@mdx-js/react';
import { MdxLayout } from '~/layout';
export default MdxLayout;
`;

const metaRegex = /^---\n(.+?)---/gms;

// const codePreviewRegex = /^```html preview\n(.+?)```/gms;
// const codeSampleRegex = /^```html\n/gms;
// const componentMetaRegex = /\[component-.+?\]/gim;
// const scriptRegex = /^<script.*?>(.+?)<\/script>/gms;
// const shoelaceImportRegex = /import { registerIconLibrary }.*?;/gms;

// const iconsScriptDoc = /^<script>(\n\s*?fetch\('\/dist\/assets\/icons\/icons\.json'\).*?)<\/script>/gms;
// const iconInnerHtml = /^\s*?item.innerHTML = `\n.*?`;/gms;
// const iconSearchStyleRegex = /^<style>\n\s*?\.icon-search.*?<\/style>/gms;
// const linksRegex = /\[(.+?)\]\(.+?\)/g;

// const enhanceIconScriptDoc = (doc: string): string =>
//   doc
//     .replaceAll(iconsScriptDoc, (_, script) =>
//       script ? `\`\`\`js script${script}\`\`\`` : ''
//     )
//     .replace(
//       `fetch('/dist/assets/icons/icons.json')`,
//       `fetch('https://unpkg.com/@shoelace-style/shoelace/dist/assets/icons/icons.json')`
//     )
//     .replace(
//       iconInnerHtml,
//       `item.innerHTML = \`
//           <sl-icon src="https://unpkg.com/@shoelace-style/shoelace/dist/assets/icons/\${i.name}.svg" style="font-size: 1.5rem;"></sl-icon>
//         \`;
//   `
//     )
//     .replace(
//       iconSearchStyleRegex,
//       (style) => `\`\`\`html:html\n${style}\n\`\`\``
//     )
//     .replace(
//       `\n\`\`\`html:html
// <sl-icon src="/assets/images/shoe.svg" style="font-size: 8rem;"></sl-icon>
// \`\`\`\n`,
//       ''
//     );

const enhanceDoc = (doc: string = ''): string => {
  //   const withRenderedExamples = doc
  //     .replaceAll(componentMetaRegex, '')
  //     .replaceAll(codeSampleRegex, '```htm\n')
  //     .replaceAll(codePreviewRegex, (codeBlock, code) => {
  //       let scriptBlock = '';
  //       const htmlCode = code.replaceAll(
  //         scriptRegex,
  //         (_: string, script: string) => {
  //           const withImportFromModules = script.replaceAll(
  //             shoelaceImportRegex,
  //             ''
  //           );
  //           scriptBlock = scriptBlock.concat(withImportFromModules);
  //           return '';
  //         }
  //       );
  //       return `
  // ${
  //   htmlCode.trim()
  //     ? `\`\`\`html:html
  // ${htmlCode}\`\`\``
  //     : ''
  // }
  // ${
  //   scriptBlock.trim()
  //     ? `\`\`\`js script
  // window.addEventListener('load', () => {${scriptBlock}});
  // \`\`\``
  //     : ''
  // }
  // #### Code\n
  // ${codeBlock.replace('html preview', 'htm').replace('html', 'htm')}`;
  //     });

  //   const withEnhancedIconsScript = enhanceIconScriptDoc(
  //     withRenderedExamples
  //   ).replaceAll(linksRegex, (_: string, txt: string) => txt);

  return `${mdxLayoutImport}\n${doc.replaceAll(metaRegex, '')}`;
};

// /src/[name].ts
const getComponentTsContent = (doc: Doc): string => {
  const name = upperFirst(camelCase(doc.dsd));
  return `export { ${name} } from '@mui/material/${name}';`;
};

// /src/index.ts
const getIndexTsContent = (name: string = ''): string =>
  `export * from './${name}';`;

// // /index.ts
export const getIndexJsContent = (): string => `export * from './src/index';`;

export const enhance = async (docsMap: Doc[]): Promise<Doc[]> => {
  return docsMap.map((doc: Doc) => ({
    dsdDoc: enhanceDoc(doc.muiDoc),
    ts: getComponentTsContent(doc),
    index: getIndexTsContent(doc.dsd),
    rootIndex: getIndexJsContent(),
    ...doc,
  }));
};
