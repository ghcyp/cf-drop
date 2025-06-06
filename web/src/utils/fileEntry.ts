export async function getFilesFromDataTransfer(dataTransfer?: DataTransfer | null): Promise<File[]> {
  if (!dataTransfer) return [];

  const files: File[] = [];
  const parts = await Promise.all(Array.from(dataTransfer.items || []).map(getFilesFromDataTransferItem));
  for (const part of parts) files.push(...part);
  return files;
}

export async function getFilesFromDataTransferItem(item: DataTransferItem) {
  const entry = item.webkitGetAsEntry?.();
  const allFiles: File[] = [];
  if (entry?.isDirectory) {
    const dir = entry as FileSystemDirectoryEntry;
    await readDirectory(dir, allFiles, `${dir.name}/`);
    return allFiles;
  }

  if (entry?.isFile) {
    const file = await getFile(entry as FileSystemFileEntry);
    allFiles.push(file);
    return allFiles;
  }

  if (!entry && item.kind === 'file') {
    const file = item.getAsFile()
    if (file) return [file];
  }  

  return [];
}

function readDirectory(directory: FileSystemDirectoryEntry, allFiles: File[], pathPrefix: string): Promise<void> {
  return new Promise((resolve) => {
    const reader = directory.createReader();
    reader.readEntries(async (entries) => {
      for (const entry of entries) {
        if (entry.isDirectory) {
          await readDirectory(entry as FileSystemDirectoryEntry, allFiles, `${pathPrefix}${entry.name}/`);
        } else if (entry.isFile) {
          const originalFile = await getFile(entry as FileSystemFileEntry);
          const file = new File(
            [originalFile],
            `${pathPrefix}${entry.name}`,
            {
              type: originalFile.type,
              lastModified: originalFile.lastModified,
            }
          );
          allFiles.push(file);
        }
      }
      resolve();
    });
  });
}

function getFile(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file((file) => {
      resolve(file);
    }, reject);
  });
}