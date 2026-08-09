"use client";

import AutosaveStatusSlot, { type AutosaveStatus } from "./AutosaveStatusSlot";
import PostStatusSlot from "./PostStatusSlot";
import EditorModeSwitchSlot from "./EditorModeSwitchSlot";
import SaveNowAction from "./SaveNowAction";
import type { EditorMode } from "./types";

export interface EditorBottomBarProps {
  status: "Draft" | "Published";
  autosaveStatus: AutosaveStatus;
  autosaveLastSavedAt: number | null;
  dirty: boolean;
  saving: boolean;
  showSave: boolean;
  onSave: () => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

// Below md the top bar is a single non-wrapping row with no space left for
// state, so it carries only back · switch · details · Publish and everything
// else moves down here — within a thumb's reach, which is where a phone
// wants the mode switch anyway. Absent entirely at desktop.
export default function EditorBottomBar({
  status,
  autosaveStatus,
  autosaveLastSavedAt,
  dirty,
  saving,
  showSave,
  onSave,
  mode,
  onModeChange,
}: EditorBottomBarProps) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-t border-border-subtle bg-surface px-3 md:hidden">
      <AutosaveStatusSlot status={autosaveStatus} lastSavedAt={autosaveLastSavedAt} />
      <div className="hidden sm:block">
        <PostStatusSlot status={status} />
      </div>

      <div className="min-w-0 flex-1" />

      {/* Tablet only. A phone's bottom bar carries the mode switch and
          nothing that competes with it for the thumb. */}
      {showSave && (
        <div className="hidden sm:block">
          <SaveNowAction visible={dirty} saving={saving} onClick={onSave} />
        </div>
      )}

      {/* Write / Preview only: Split needs two measures and never appears at
          a width that has just one. Above sm the switch is in the top bar,
          so this half of the bar withdraws rather than duplicating it. */}
      <div className="sm:hidden">
        <EditorModeSwitchSlot mode={mode} onModeChange={onModeChange} splitAvailable={false} />
      </div>
    </div>
  );
}
