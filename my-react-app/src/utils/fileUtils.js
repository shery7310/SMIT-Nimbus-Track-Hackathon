export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3MB — keep localStorage happy

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Reads a FileList/array of File objects into attachment records
// ({ id, name, type, size, dataUrl, createdAt }), skipping anything over
// the size limit. Calls onAttachment for each successfully-read file and
// onError(message) for anything skipped or unreadable.
export function readFilesAsAttachments(files, { onAttachment, onError }) {
  Array.from(files || []).forEach((file) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      onError?.(`"${file.name}" is over ${formatFileSize(MAX_ATTACHMENT_BYTES)} — skipped.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onAttachment?.({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result,
        createdAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => onError?.(`Couldn't read "${file.name}".`);
    reader.readAsDataURL(file);
  });
}