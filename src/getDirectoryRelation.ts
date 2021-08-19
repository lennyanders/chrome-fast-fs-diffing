import { rootDirectoryHandles } from './data';

export enum DirectoryRelationType {
  DirectoryIsNew,
  DirectoryIsAlreadyImportet,
  DirectoryIsInsideImportetDirectory,
  DirectoryIsParentOfImportetDirectories,
}

export const getDirectoryRelation = async (
  directoryHandle: FileSystemDirectoryHandle,
): Promise<
  | { type: DirectoryRelationType.DirectoryIsNew }
  | { type: DirectoryRelationType.DirectoryIsAlreadyImportet; key: string }
  | { type: DirectoryRelationType.DirectoryIsInsideImportetDirectory; key: string }
  | {
      type: DirectoryRelationType.DirectoryIsParentOfImportetDirectories;
      parentOfDirectories: { key: string; pathDifference: string[] }[];
    }
> => {
  const parentOfDirectories: { key: string; pathDifference: string[] }[] = [];
  for (const [key, existingDirectoryHandle] of Object.entries(rootDirectoryHandles)) {
    if (
      directoryHandle.name === existingDirectoryHandle.name &&
      (await directoryHandle.isSameEntry(existingDirectoryHandle))
    ) {
      return { type: DirectoryRelationType.DirectoryIsAlreadyImportet, key };
    }

    if (await existingDirectoryHandle.resolve(directoryHandle)) {
      return { type: DirectoryRelationType.DirectoryIsInsideImportetDirectory, key };
    }

    const pathDifference = await directoryHandle.resolve(existingDirectoryHandle);
    if (pathDifference) parentOfDirectories.push({ key, pathDifference });
  }

  if (parentOfDirectories.length) {
    return {
      type: DirectoryRelationType.DirectoryIsParentOfImportetDirectories,
      parentOfDirectories,
    };
  }

  return { type: DirectoryRelationType.DirectoryIsNew };
};
