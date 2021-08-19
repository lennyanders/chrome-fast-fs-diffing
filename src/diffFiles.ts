import { files } from './data';

export const diffFiles = (filesA: Record<string, SnaeFile>) => {
  const newFiles: Record<string, SnaeFile> = {};
  const removedFiles = { ...files };
  for (const key in filesA) {
    if (key in files) delete removedFiles[key];
    else newFiles[key] = filesA[key];
  }
  return { newFiles, removedFiles };
};
