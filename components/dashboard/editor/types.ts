export interface MetadataFormProps {
  coverImage: string;
  onCoverImageChange: (coverImage: string) => void;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
  content: string;
  // Present once the Post has been saved, so an issued suggestion can be
  // attributed to it. Absent for a Post that has never been saved.
  postId?: string;
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  syntax: { prefix: string; suffix: string; placeholder?: string };
}

export interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface SlashMenuOption {
  id: string;
  label: string;
  // Lowercased text the query is matched against — usually just the label,
  // but gives room for a synonym (e.g. "hr" for Horizontal rule) without
  // changing what's displayed.
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  insertion: { before: string; after: string };
}

export interface MarkdownPreviewProps {
  content: string;
}

// Write is the default; Split is only ever reachable where the measure
// survives two panes (see EditorModeSwitchSlot for the breakpoint).
export type EditorMode = "write" | "split" | "preview";

export interface SplitEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: EditorMode;
}
