"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfileRequest, updateProfileRequest } from "@/lib/api";
import { toast } from "sonner";

export default function ProfileSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [initialData, setInitialData] = useState({ name: "", bio: "", avatar: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfileRequest();
        if (res.ok) {
          const data = await res.json();
          const profileData = {
            name: data.name || "",
            bio: data.bio || "",
            avatar: data.avatar || "",
          };
          setName(profileData.name);
          setBio(profileData.bio);
          setAvatar(profileData.avatar);
          setEmail(data.email || "");
          setInitialData(profileData);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const isDirty = useMemo(() => {
    return (
      name !== initialData.name ||
      bio !== initialData.bio ||
      avatar !== initialData.avatar
    );
  }, [name, bio, avatar, initialData]);

  const nameError = useMemo(() => {
    if (name.length > 0 && name.length < 3) return "Name must be at least 3 characters.";
    if (name.length > 50) return "Name must be less than 50 characters.";
    return null;
  }, [name]);

  const bioError = useMemo(() => {
    if (bio.length > 200) return "Bio must be less than 200 characters.";
    return null;
  }, [bio]);

  const isValid = !nameError && !bioError && name.length >= 3;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfileRequest({ name, bio, avatar });
      if (res.ok) {
        toast.success("Profile updated successfully!");
        setInitialData({ name, bio, avatar });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
        <CardContent className="p-10 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="settings-section bg-white rounded-[20px] border-2 border-brand-dark shadow-[4px_4px_0px_0px_#191A23]">
      <CardHeader>
        <CardTitle className="text-xl font-black text-brand-dark">Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-brand-lime border-2 border-brand-dark flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-brand-dark">{name.charAt(0)}</span>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mb-2 px-4 py-2 bg-brand-dark text-white rounded-xl font-bold text-sm hover:bg-brand-dark/90 transition-colors"
            >
              Change Avatar
            </button>
            <p className="text-sm text-brand-dark/50">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        
        <div>
          <label htmlFor="name" className="block text-sm font-bold text-brand-dark mb-2">
            Full Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={isSaving}
            className={nameError ? "border-red-500" : ""}
          />
          {nameError && <p className="text-xs text-red-500 mt-1 font-bold">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-bold text-brand-dark mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled={true}
            className="bg-brand-gray/50 cursor-not-allowed"
          />
          <p className="text-xs text-brand-dark/40 mt-1">Email cannot be changed.</p>
        </div>

        
        <div>
          <label htmlFor="bio" className="block text-sm font-bold text-brand-dark mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            rows={3}
            disabled={isSaving}
            className={`w-full rounded-xl border-2 px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 resize-none disabled:opacity-50 ${
              bioError ? "border-red-500" : "border-border"
            }`}
          />
          <div className="flex justify-between mt-1">
            {bioError ? (
              <p className="text-xs text-red-500 font-bold">{bioError}</p>
            ) : (
              <div />
            )}
            <p className={`text-xs font-medium ${bio.length > 200 ? "text-red-500 font-bold" : "text-brand-dark/40"}`}>
              {bio.length}/200
            </p>
          </div>
        </div>

        
        <div className="pt-2">
          <Button onClick={handleSave} size="lg" disabled={isSaving || !isDirty || !isValid}>
            {isSaving ? "Saving..." : !isDirty ? "No Changes" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
