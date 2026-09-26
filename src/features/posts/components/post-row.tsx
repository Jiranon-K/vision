"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PostRow as PostRowType } from "../types";
import { allows } from "../contract";
import { cn } from "@/shared/lib/utils";
import ConfirmDialog from "@/shared/ui/confirm-dialog";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { LockIcon } from "@/shared/ui/icons";
import { DeliveredBadge } from "@/features/followers";

interface PostRowProps {
  post: PostRowType;
  onDelete?: (id: string) => void;
}

const statusTone = {
  Published: "brand",
  Draft: "neutral",
} as const;

const rowAction = "px-3 py-1.5 text-sm";

export default function PostRow({ post, onDelete }: PostRowProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const canEdit = allows(post, "edit");
  const canDelete = allows(post, "delete");
  const readOnly = !canEdit && !canDelete;
  const open = () => router.push(`/dashboard/posts/${post.id}/edit`);

  return (
    <>
      <div
        className={cn(
          "post-row overflow-hidden rounded-2xl border-2 bg-surface opacity-0 shadow-hard transition-all",
          "hover:-translate-y-0.5 hover:shadow-hard-lg",
          post.withheld ? "border-warning" : "border-border-strong",
        )}
      >
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="line-clamp-1 font-semibold text-foreground">{post.title}</h3>
              {readOnly && (
                <Badge tone="neutral" appearance="outline" size="sm" className="shrink-0 border font-medium">
                  <LockIcon className="h-3 w-3" />
                  Read-only
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-text-muted">
              <Badge tone={statusTone[post.status]} size="sm" className="font-medium">
                {post.status}
              </Badge>
              <Badge tone="neutral" size="sm" className="font-medium">
                {post.category}
              </Badge>
              <span>{post.date}</span>
              <span>{post.readTime}</span>
              {post.delivery && <DeliveredBadge delivery={post.delivery} size="sm" />}
            </div>
          </div>

          <span className="whitespace-nowrap text-sm font-medium text-text-muted">
            {post.views > 0 ? post.views.toLocaleString() : "-"} views
          </span>

          {readOnly ? (
            <Button variant="outline" onClick={open} aria-label={`Open ${post.title}`} className={rowAction}>
              Open
            </Button>
          ) : (
            <div className="flex shrink-0 gap-2">
              {canEdit && (
                <Button variant="outline" onClick={open} aria-label={`Edit ${post.title}`} className={rowAction}>
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  onClick={() => setShowConfirm(true)}
                  aria-label={`Delete ${post.title}`}
                  className={rowAction}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {post.withheld && (
          <Alert
            tone="warning"
            role="note"
            aria-label="Withheld"
            className="rounded-none border-0 border-t-2 px-4 py-2.5 motion-safe:animate-fade-in"
          >
            <span className="font-semibold">Withheld by Vision.</span> Readers can&apos;t see this Post.
            {canEdit && " You can still edit it, but publishing won't bring it back."}
          </Alert>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="ลบ Post"
        message={`ต้องการลบ "${post.title}" หรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        danger
        onConfirm={() => {
          onDelete?.(post.id);
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
