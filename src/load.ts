import 'core-js/stable';
import 'regenerator-runtime/runtime';
import fetch from 'node-fetch';
import { Doc } from './types';
import { join } from 'path';

const basePath =
  'https://raw.githubusercontent.com/mui-org/material-ui/master/docs/src';

export const loadDoc = async (path?: string): Promise<string> => {
  try {
    const response = await fetch(join(basePath, path || ''));
    return await response.text();
  } catch (error) {
    console.log('error loading doc for path', {
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
