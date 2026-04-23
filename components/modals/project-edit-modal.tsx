"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Project } from "@/lib/types";
import { X, Upload, Smile } from "lucide-react";
import { toast } from "sonner";

const EMOJI_LIST = ["📁", "📊", "🎯", "🚀", "💻", "🎨", "📱", "⚙️", "🔧", "📈", "🎬", "🏆"];

interface ProjectEditModalProps {
  project: Project;
  onClose: () => void;
  onSave: (updates: { emoji?: string; logoUrl?: string | null; bannerUrl?: string | null }) => Promise<void>;
}

export function ProjectEditModal({ project, onClose, onSave }: ProjectEditModalProps) {
  const [selectedEmoji, setSelectedEmoji] = useState(project.emoji);
  const [logoUrl, setLogoUrl] = useState(project.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(project.bannerUrl || "");
  const [logoPreview, setLogoPreview] = useState(project.logoUrl || "");
  const [bannerPreview, setBannerPreview] = useState(project.bannerUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);
      formData.append("type", "logo");

      const res = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setLogoUrl(url);
      setLogoPreview(url);
      toast.success("Logo uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);
      formData.append("type", "banner");

      const res = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setBannerUrl(url);
      setBannerPreview(url);
      toast.success("Banner uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload banner");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        emoji: selectedEmoji,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-6">Edit Project</h2>

        {/* Emoji Selector */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Project Icon
          </label>
          <div className="flex gap-2 mb-3">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className={cn(
                  "w-10 h-10 text-xl rounded-lg transition-all",
                  selectedEmoji === emoji
                    ? "bg-blue-500 ring-2 ring-blue-300"
                    : "bg-slate-100 hover:bg-slate-200"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Project Logo
          </label>
          {logoPreview && (
            <div className="mb-3 relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setLogoUrl("");
                  setLogoPreview("");
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Logo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Banner Upload */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Project Banner
          </label>
          {bannerPreview && (
            <div className="mb-3 relative w-full h-24 rounded-lg overflow-hidden bg-slate-100">
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => {
                  setBannerUrl("");
                  setBannerPreview("");
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Banner</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading || isSaving}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
