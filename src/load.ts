import 'core-js/stable';
import 'regenerator-runtime/runtime';
import fetch from 'node-fetch';
import { Doc } from './types';
import { join } from 'path';

const basePath =
  'https://raw.githubusercontent.com/mui-org/material-ui/master/docs/src';

export const loadDoc = async (path?: string): Promise<string> => {
  try {
    const completePath = join(basePath, path || '');
    const response = await fetch(completePath);
    if (response.ok) return await response.text();
    else {
      console.log(
        `fetch for ${completePath} failed with: ${await response.text()}`
      );
      return '';
    }
  } catch (error: any) {
    console.error('error loading doc for path', {
      path,
      error: error.response.body,
    });
    return '';
  }
};

export const load = async (docsMap: Doc[]): Promise<Doc[]> =>
  Promise.all(
    docsMap.map(async (doc: Doc) => ({
      muiDoc: await loadDoc(doc.muiPath),
      ...doc,
    }))
  );
