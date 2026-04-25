"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostRow as PostRowType } from "@/types/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EditIcon, DeleteIcon } from "@/components/ui/Icons";

interface PostRowProps {
  post: PostRowType;
  onDelete?: (id: string) => void;
}

export default function PostRow({ post, onDelete }: PostRowProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const statusStyles = {
    Published: "bg-brand-lime text-brand-dark",
    Draft: "bg-brand-gray text-brand-dark/50",
    Scheduled: "bg-brand-dark text-brand-lime",
  };

  const handleEdit = () => {
    router.push(`/dashboard/posts/${post.id}/edit`);
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    setShowConfirm(false);
  };

  return (
    <>
      <div className="post-row flex items-center justify-between bg-white rounded-[16px] border-2 border-brand-dark p-4 shadow-[4px_4px_0px_0px_#191A23] hover:-translate-y-1 hover:shadow-none transition-all duration-200 opacity-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-dark line-clamp-1">{post.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-brand-dark/50">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[post.status]}`}>
              {post.status}
            </span>
            <span className="px-2 py-0.5 bg-brand-gray rounded-full text-xs font-medium">
              {post.category}
            </span>
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-4">
          <span className="text-sm font-medium text-brand-dark/60 whitespace-nowrap">
            {post.views > 0 ? post.views.toLocaleString() : "-"} views
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="p-2 rounded-[10px] bg-brand-gray border-2 border-brand-dark/20 text-brand-dark/60 hover:border-brand-dark hover:text-brand-dark transition-all duration-200"
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-[10px] bg-brand-gray border-2 border-brand-dark/20 text-red-500 hover:border-red-500 hover:text-red-600 transition-all duration-200"
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="ลบ Post"
        message={`ต้องการลบ "${post.title}" หรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
