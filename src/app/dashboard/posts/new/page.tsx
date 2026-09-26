"use client";

import { PostEditorForm } from "@/features/editor";
import { useAuth } from "@/features/auth";

export default function NewPostPage() {
  const { isLoading, isAuthed } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  if (!isAuthed) {
    return null;
  }

  return <PostEditorForm mode="create" />;
}
