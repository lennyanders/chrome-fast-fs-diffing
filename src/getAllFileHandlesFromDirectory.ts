import { rootDirectoryHandles } from './data';

export const getFileHandlesFromRootDirectories = async (): Promise<Record<string, SnaeFile>> => {
  return Object.assign(
    {},
    ...(await Promise.all(
      Object.entries(rootDirectoryHandles).map(([path, directoryHandle]) =>
        getAllFileHandlesFromDirectory({ directoryHandle, path }),
      ),
    )),
  );
};

const getAllFileHandlesFromDirectory = async ({
  directoryHandle,
  path,
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
