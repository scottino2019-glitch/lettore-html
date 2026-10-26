export interface HtmlFile {
  id: string;
  name: string;
  title: string;
  category: string;
  subfolder: string;
  relativePath: string;
  content: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  tags?: string[];
}

export interface HtmlMetadata {
  title: string;
  description: string;
  charset: string;
  author: string;
  wordCount: number;
  readTimeMinutes: number;
  headings: { level: number; text: string; id: string }[];
  linksCount: number;
  imagesCount: number;
  scriptsCount: number;
  stylesheetsCount: number;
}

export type ViewMode = 'grid' | 'list' | 'folder-tree';
export type ReaderTab = 'preview' | 'read-mode' | 'source' | 'editor' | 'info';
export type DevicePreview = 'desktop' | 'tablet' | 'mobile';
export type ReaderTheme = 'pearl' | 'light' | 'sepia' | 'dark';
