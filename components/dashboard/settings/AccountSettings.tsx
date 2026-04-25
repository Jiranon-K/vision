"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { changePasswordRequest } from "@/lib/api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}

function PasswordInput({ id, value, onChange, placeholder, error, disabled }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        className="pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-3 text-brand-dark/40 hover:text-brand-dark transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const passwordRequirements = useMemo(() => {
    return [
      { label: "At least 8 characters", met: newPassword.length >= 8 },
      { label: "At least 1 uppercase letter", met: /[A-Z]/.test(newPassword) },
      { label: "At least 1 lowercase letter", met: /[a-z]/.test(newPassword) },
      { label: "At least 1 number", met: /[0-9]/.test(newPassword) },
      { label: "At least 1 special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ];
  }, [newPassword]);

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const doPasswordsMatch = newPassword === confirmPassword;
  const isSameAsCurrent = newPassword && currentPassword && newPassword === currentPassword;
  
  const canSubmit = 
    isPasswordValid && 
    doPasswordsMatch && 
    !isSameAsCurrent &&
    currentPassword.length > 0 && 
    newPassword.length > 0 && 
    confirmPassword.length > 0;

  const handleChangePassword = async () => {
    if (!doPasswordsMatch) {
      toast.error("Passwords do not match!");
      return;
    }

    if (isSameAsCurrent) {
      toast.error("New password cannot be the same as current password.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await changePasswordRequest({ currentPassword, newPassword });
      if (res.ok) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    toast.info("Account deletion is disabled in demo mode.");
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardHeader>
          <CardTitle className="text-xl font-black text-brand-dark">Change Password</CardTitle>
          <CardDescription className="text-brand-dark/50">
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-bold text-brand-dark mb-2">
              Current Password
            </label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Enter current password"
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-bold text-brand-dark mb-2">
              New Password
            </label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Enter new password"
              disabled={isSaving}
              error={isSameAsCurrent ? "New password must be different from current" : undefined}
            />
            
            <div className="mt-3 p-3 bg-brand-gray/50 rounded-xl space-y-1.5 border border-brand-dark/5">
              <p className="text-[10px] uppercase tracking-wider font-black text-brand-dark/40 mb-1">Requirements</p>
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                    req.met ? "bg-brand-lime border-brand-dark" : "bg-white border-brand-dark/20"
                  }`}>
                    {req.met && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 3L3 5L7 1" stroke="#191A23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-bold transition-colors ${req.met ? "text-brand-dark" : "text-brand-dark/30"}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-bold text-brand-dark mb-2">
              Confirm New Password
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              disabled={isSaving}
              error={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : undefined}
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleChangePassword} variant="default" disabled={!canSubmit || isSaving}>
              {isSaving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-dark/60 mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="text-[10px] uppercase tracking-wider font-black">Careful Operations</span>
          </div>
          <CardTitle className="text-xl font-black text-brand-dark">Account Deletion</CardTitle>
          <CardDescription className="text-brand-dark/50">
            We're sorry to see you go. This action is permanent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-brand-gray/30 rounded-2xl border border-brand-dark/5">
            <div className="max-w-md">
              <p className="font-bold text-brand-dark text-sm">Delete this account permanently</p>
              <p className="text-xs text-brand-dark/50 mt-1 leading-relaxed">
                Once you delete your account, there is no going back. All your posts, data, and settings will be removed from our servers.
              </p>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-sm border-2 border-red-200 text-red-500 bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm"
            >
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmText="Yes, Delete My Account"
        cancelText="No, Keep It"
        danger={true}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
