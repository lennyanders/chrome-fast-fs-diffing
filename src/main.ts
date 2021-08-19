import { nanoid } from 'nanoid';
import { rootDirectoryHandles, files } from './data';
import { diffFiles } from './diffFiles';
import { getFileHandlesFromRootDirectories } from './getAllFileHandlesFromDirectory';
import { getDirectoryRelation, DirectoryRelationType } from './getDirectoryRelation';
import { reparentDirectoryFiles } from './reparentDirectoryFiles';

document.getElementById('import')?.addEventListener(
  'click',
  async () => {
    try {
      const directoryHandle = await showDirectoryPicker();

      const directoryInfo = await getDirectoryRelation(directoryHandle);
      console.log(directoryInfo);

      switch (directoryInfo.type) {
        case DirectoryRelationType.DirectoryIsNew: {
          rootDirectoryHandles[nanoid()] = directoryHandle;
          break;
        }
        case DirectoryRelationType.DirectoryIsAlreadyImportet: {
          if (!confirm('You already imported this directory, do you want to re-scan it?')) return;
          break;
        }
        case DirectoryRelationType.DirectoryIsInsideImportetDirectory: {
          return alert(
            `this directory is already inside of "${
              rootDirectoryHandles[directoryInfo.key].name
            }" you don't need to import it`,
          );
        }
        case DirectoryRelationType.DirectoryIsParentOfImportetDirectories: {
          if (
            !confirm(
              `this directory is a parent of the following directories: "${directoryInfo.parentOfDirectories
                .map(({ key }) => rootDirectoryHandles[key].name)
                .join(', ')}", should these get replaced by "${directoryHandle.name}"?`,
            )
          ) {
            return;
          }
          const key = nanoid();
          for (const { key: oldKey, pathDifference } of directoryInfo.parentOfDirectories) {
            reparentDirectoryFiles(key, oldKey, pathDifference);
            delete rootDirectoryHandles[oldKey];
          }
          rootDirectoryHandles[key] = directoryHandle;
          console.log(Object.fromEntries(Object.entries({ ...files }).slice(0, 10)));
          break;
        }
        default: {
          throw 'this should not happen';
        }
      }

      console.time('get All files');
      const fileHandles = await getFileHandlesFromRootDirectories();
      console.timeEnd('get All files');

      console.time('diff files');
      const { newFiles, removedFiles } = diffFiles(fileHandles);
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
