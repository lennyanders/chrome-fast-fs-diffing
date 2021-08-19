import { files } from './data';

export const reparentDirectoryFiles = (
  newKey: string,
  oldKey: string,
  pathDifference: string[],
) => {
  for (const [fileKey, file] of Object.entries(files)) {
    if (!fileKey.startsWith(oldKey)) continue;
    delete files[fileKey];
    files[fileKey.replace(oldKey, `${newKey}/${pathDifference.join('/')}`)] = file;
  }
};
