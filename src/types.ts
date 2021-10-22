export type Doc = {
  dsd: string;
  componentNames?: string[];
  dsdDoc?: string;
  category: string;

  muiPath: string;
  muiDoc?: string;

  ts?: string; // src/[name].ts
  index?: string; // src/index.ts
  rootIndex?: string; // /index.ts
  demos?: { name: string; content: string; type: 'jsx' | 'tsx' }[];
};
