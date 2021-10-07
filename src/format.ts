import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { exec } from 'child_process';

export const format = async (): Promise<any> => {
  let resolve: (arg: any) => any;
  let reject: (arg: any) => any;
  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  exec(`${process.cwd()}/src/format.sh`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`formatting error: ${error || stderr}`);
      reject(error || stderr);
      return;
    }

    console.log(`${stdout}`);
    resolve(stdout);
  });

  return p;
};
