import { nanoid } from 'nanoid';

interface SnaeFile {
  rootDirectory: string;
  directoryHandle: FileSystemDirectoryHandle;
  fileHandle: FileSystemFileHandle;
}

const rootDirectoryHandles: Record<string, FileSystemDirectoryHandle> = {};
const files: Record<string, SnaeFile> = {};

const getDirectoryKey = async (directoryHandle: FileSystemDirectoryHandle) => {
  for (const [key, existingDirectoryHandle] of Object.entries(rootDirectoryHandles)) {
    if (
      directoryHandle.name === existingDirectoryHandle.name &&
      (await directoryHandle.isSameEntry(existingDirectoryHandle))
    ) {
      return key;
    }

    if (await existingDirectoryHandle.resolve(directoryHandle)) {
      return alert(
        `this directory is already inside of "${existingDirectoryHandle.name}" you don't need to import it`,
      );
    }

    // TODO: a folder could be a parent of multiple folders, so all of them would need to be updated
    const relativePaths = await directoryHandle.resolve(existingDirectoryHandle);
    if (relativePaths) {
      const update = confirm(
        `this directory is a parent of "${existingDirectoryHandle.name}" should that get replaced with "${directoryHandle.name}"?`,
      );
      if (update) {
        for (const [fileKey, file] of Object.entries(files)) {
          if (!fileKey.startsWith(key)) continue;
          delete files[fileKey];
          files[fileKey.replace(key, `${key}/${relativePaths.join('/')}`)] = file;
        }
        rootDirectoryHandles[key] = directoryHandle;
        return key;
      }
      return;
    }
  }
  const key = nanoid();
  rootDirectoryHandles[key] = directoryHandle;
  return key;
};

const getAllFileHandlesFromDirectory = async ({
  directoryHandle,
  path = directoryHandle.name,
  rootDirectory = path,
}: {
  directoryHandle: FileSystemDirectoryHandle;
  path: string;
  rootDirectory?: string;
}) => {
  const fileSystemHandles: Record<string, SnaeFile> = {};
  const promises: Promise<Record<string, SnaeFile>>[] = [];
  for await (const fileSystemHandle of directoryHandle.values()) {
    if (fileSystemHandle.kind === 'directory') {
      promises.push(
        getAllFileHandlesFromDirectory({
          directoryHandle: fileSystemHandle,
          path: `${path}/${fileSystemHandle.name}`,
          rootDirectory,
        }),
      );
    } else {
      fileSystemHandles[`${path}/${fileSystemHandle.name}`] = {
        rootDirectory,
        directoryHandle,
        fileHandle: fileSystemHandle,
      };
    }
  }
  Object.assign(fileSystemHandles, ...(await Promise.all(promises)));

  return fileSystemHandles;
};

const diffFiles = (filesA: Record<string, SnaeFile>, filesB: Record<string, SnaeFile>) => {
  const newFiles: Record<string, SnaeFile> = {};
  const removedFiles = { ...filesB };
  for (const key in filesA) {
    if (key in filesB) delete removedFiles[key];
    else newFiles[key] = filesA[key];
  }
  return { newFiles, removedFiles };
};

document.getElementById('import')?.addEventListener(
  'click',
  async () => {
    try {
      const directoryHandle = await showDirectoryPicker();

      const key = await getDirectoryKey(directoryHandle);
      if (!key) return;

      console.time('get All files');
      const fileHandles = await getAllFileHandlesFromDirectory({ directoryHandle, path: key });
      console.timeEnd('get All files');

      console.time('diff files');
      const { newFiles, removedFiles } = diffFiles(fileHandles, files);
      console.timeEnd('diff files');

      for (const key in removedFiles) delete files[key];
      Object.assign(files, newFiles);

      console.log({ newFiles, removedFiles });
      console.log(Object.keys(files).length);
      console.log(Object.fromEntries(Object.entries(files).slice(0, 10)));
    } catch (_error) {}
  },
  { passive: true },
);
