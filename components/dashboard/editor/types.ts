export interface MetadataFormProps {
  category: string;
  onCategoryChange: (category: string) => void;
  status: "Draft" | "Published";
  onStatusChange: (status: "Draft" | "Published") => void;
  coverImage: string;
  onCoverImageChange: (coverImage: string) => void;
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

export interface SplitEditorProps {
  value: string;
  onChange: (value: string) => void;
}
