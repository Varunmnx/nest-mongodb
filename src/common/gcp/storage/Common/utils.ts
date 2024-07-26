import { FileCategory, FolderNames } from '@/common/enums/file.enum';

export function _getFolderNameFromCategory(fileCategory?: FileCategory) {
  return FolderNames[fileCategory] || 'dumb';
}
