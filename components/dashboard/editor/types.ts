export interface MetadataFormProps {
  category: string;
  onCategoryChange: (category: string) => void;
  status: "Draft" | "Published";
  onStatusChange: (status: "Draft" | "Published") => void;
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
  icon: string;
  syntax: { prefix: string; suffix: string; placeholder?: string };
}

export interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
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
