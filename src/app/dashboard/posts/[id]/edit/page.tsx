"use client";

import { useParams } from "next/navigation";
import { PostEditorForm } from "@/features/editor";
import { useAuth } from "@/features/auth";

export default function EditPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const { isLoading, isAuthed } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-brand-gray" />;
  }

  if (!isAuthed) {
    return null;
  }

  return <PostEditorForm mode="edit" postId={postId} />;
}
