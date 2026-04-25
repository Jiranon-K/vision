export interface MetadataFormProps {
  category: string;
  onCategoryChange: (category: string) => void;
  tag: string;
  onTagChange: (tag: string) => void;
  status: "Draft" | "Scheduled" | "Published";
  onStatusChange: (status: "Draft" | "Scheduled" | "Published") => void;
  scheduledDate: string;
  onScheduledDateChange: (date: string) => void;
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
