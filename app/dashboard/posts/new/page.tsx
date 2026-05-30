"use client";

import PostEditorForm from "@/components/dashboard/editor/PostEditorForm";
import { useAuth } from "@/hooks/useAuth";

export default function NewPostPage() {
  const { isLoading, isAuthed, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  if (!isAuthed) {
    return null;
  }

  return <PostEditorForm mode="create" currentUser={user} />;
}
