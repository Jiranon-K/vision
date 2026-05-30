"use client";

import { useParams } from "next/navigation";
import PostEditorForm from "@/components/dashboard/editor/PostEditorForm";
import { useAuth } from "@/hooks/useAuth";

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const { isLoading, isAuthed, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  if (!isAuthed) {
    return null;
  }

  return <PostEditorForm mode="edit" postId={postId} currentUser={user} />;
}
