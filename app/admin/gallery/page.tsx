"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Video,
  Star,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import useSWR from "swr";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: number;
  title_en: string;
  title_np: string | null;
  description_en: string | null;
  description_np: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  category: string | null;
  event_date: string | null;
  is_featured: boolean;
  created_at: string;
}

interface UploadForm {
  title_en: string;
  title_np: string;
  description_en: string;
  description_np: string;
  category: string;
  event_date: string;
  is_featured: boolean;
}

const EMPTY_FORM: UploadForm = {
  title_en: "",
  title_np: "",
  description_en: "",
  description_np: "",
  category: "general",
  event_date: "",
  is_featured: false,
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "development", label: "Development" },
  { value: "events", label: "Events" },
  { value: "meetings", label: "Meetings" },
  { value: "community", label: "Community" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ─── Toast helper ─────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: "success" | "error" }[]
  >([]);

  const show = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now();
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    },
    []
  );

  return { toasts, show };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminGalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<string>("image");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editForm, setEditForm] = useState<UploadForm>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toasts, show: showToast } = useToast();

  // ── Data fetching ─────────────────────────────────────────────────────────

  const apiUrl =
    filterCategory !== "all"
      ? `/api/gallery?category=${filterCategory}&limit=100`
      : `/api/gallery?limit=100`;

  const { data, isLoading, mutate } = useSWR<{
    success: boolean;
    data: GalleryItem[];
  }>(apiUrl, fetcher);

  const items = data?.data || [];

  const filteredItems = items.filter((item) =>
    item.title_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadedUrl(null);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Auto-fill title from filename if empty
    if (!uploadForm.title_en) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setUploadForm((f) => ({ ...f, title_en: name }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ── Upload file to server ─────────────────────────────────────────────────

  const uploadFile = async (): Promise<{ url: string; media_type: string } | null> => {
    if (!selectedFile) return null;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Upload failed", "error");
        return null;
      }

      setUploadedUrl(data.url);
      setUploadedMediaType(data.media_type);
      return { url: data.url, media_type: data.media_type };
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Save new gallery item ─────────────────────────────────────────────────

  const handleSaveNew = async () => {
    if (!uploadForm.title_en.trim()) {
      showToast("Title (English) is required", "error");
      return;
    }
    if (!selectedFile && !uploadedUrl) {
      showToast("Please select a file to upload", "error");
      return;
    }

    setSavingItem(true);
    try {
      let mediaUrl = uploadedUrl;
      let mediaType = uploadedMediaType;

      // Upload file if not already done
      if (!mediaUrl && selectedFile) {
        const result = await uploadFile();
        if (!result) { setSavingItem(false); return; }
        mediaUrl = result.url;
        mediaType = result.media_type;
      }

      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...uploadForm,
          media_url: mediaUrl,
          thumbnail_url: mediaUrl,
          media_type: mediaType,
          event_date: uploadForm.event_date || null,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to save", "error");
        return;
      }

      showToast("Media uploaded successfully!", "success");
      setUploadOpen(false);
      resetUploadState();
      mutate();
    } finally {
      setSavingItem(false);
    }
  };

  const resetUploadState = () => {
    setUploadForm(EMPTY_FORM);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadedUrl(null);
    setUploadedMediaType("image");
  };

  // ── Edit item ─────────────────────────────────────────────────────────────

  const openEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setEditForm({
      title_en: item.title_en,
      title_np: item.title_np || "",
      description_en: item.description_en || "",
      description_np: item.description_np || "",
      category: item.category || "general",
      event_date: item.event_date ? item.event_date.split("T")[0] : "",
      is_featured: item.is_featured,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editForm.title_en.trim()) {
      showToast("Title (English) is required", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/gallery/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          event_date: editForm.event_date || null,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Update failed", "error");
        return;
      }

      showToast("Updated successfully!", "success");
      setEditOpen(false);
      setEditingItem(null);
      mutate();
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Delete failed", "error");
        return;
      }

      showToast("Deleted successfully!", "success");
      setDeleteTarget(null);
      mutate();
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto ${
                t.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">Gallery Management</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} item{items.length !== 1 ? "s" : ""} in gallery
          </p>
        </div>
        <Button
          onClick={() => { resetUploadState(); setUploadOpen(true); }}
          className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-14 w-14 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No media found</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Upload your first image or video to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
            >
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 border-border/60">
                {/* Media preview */}
                <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img
                      src={item.media_url}
                      alt={item.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement)!.style.display =
                          "flex";
                      }}
                    />
                  )}

                  {/* Fallback icon when image fails */}
                  <div
                    className="hidden w-full h-full items-center justify-center"
                    style={{ display: "none" }}
                  >
                    <ImageIcon className="h-10 w-10 text-slate-300" />
                  </div>

                  {/* Featured badge */}
                  {item.is_featured && (
                    <span className="absolute top-2 left-2 p-1 bg-amber-500 rounded-full shadow">
                      <Star className="h-3 w-3 text-white fill-white" />
                    </span>
                  )}

                  {/* Video badge */}
                  {item.media_type === "video" && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      <Video className="h-3 w-3" />
                      Video
                    </span>
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-md bg-white/90 hover:bg-white"
                      onClick={() => openEdit(item)}
                    >
                      <Edit2 className="h-3 w-3 text-[#003893]" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-md bg-white/90 hover:bg-white"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3 space-y-1.5">
                  <h3 className="font-semibold text-sm text-[#003893] line-clamp-1">
                    {item.title_en}
                  </h3>
                  {item.title_np && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.title_np}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs capitalize py-0">
                      {item.category || "general"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs py-0">
                      {item.media_type}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { if (!o) resetUploadState(); setUploadOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003893] text-xl">Upload Media</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-colors ${
                dragOver
                  ? "border-[#DC143C] bg-[#DC143C]/5"
                  : selectedFile
                  ? "border-green-400 bg-green-50"
                  : "border-border hover:border-[#003893]/40 hover:bg-[#003893]/[0.02]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              style={{ cursor: selectedFile ? "default" : "pointer" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = "";
                }}
              />

              {selectedFile ? (
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-slate-100">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedFile.type} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {uploadedUrl && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded to server
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setFilePreview(null);
                        setUploadedUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
                  <div className="p-3 bg-[#003893]/5 rounded-full">
                    <CloudUpload className="h-8 w-8 text-[#003893]/60" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Drop your file here, or{" "}
                      <span className="text-[#DC143C] underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports: JPEG, PNG, WebP, GIF, MP4, WebM · Max 50MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title_en">Title (English) <span className="text-red-500">*</span></Label>
                <Input
                  id="title_en"
                  placeholder="Enter title in English"
                  value={uploadForm.title_en}
                  onChange={(e) => setUploadForm((f) => ({ ...f, title_en: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title_np">Title (Nepali)</Label>
                <Input
                  id="title_np"
                  placeholder="नेपालीमा शीर्षक"
                  value={uploadForm.title_np}
                  onChange={(e) => setUploadForm((f) => ({ ...f, title_np: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc_en">Description (English)</Label>
                <Textarea
                  id="desc_en"
                  placeholder="Short description..."
                  rows={2}
                  value={uploadForm.description_en}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description_en: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc_np">Description (Nepali)</Label>
                <Textarea
                  id="desc_np"
                  placeholder="छोटो विवरण..."
                  rows={2}
                  value={uploadForm.description_np}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description_np: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event_date">Event Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={uploadForm.event_date}
                  onChange={(e) => setUploadForm((f) => ({ ...f, event_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Mark as Featured</p>
                  <p className="text-xs text-muted-foreground">Featured items appear at the top of the gallery</p>
                </div>
              </div>
              <Switch
                checked={uploadForm.is_featured}
                onCheckedChange={(v) => setUploadForm((f) => ({ ...f, is_featured: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setUploadOpen(false); resetUploadState(); }}
              disabled={savingItem || uploadingFile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNew}
              disabled={savingItem || uploadingFile || (!selectedFile && !uploadedUrl)}
              className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white min-w-[120px]"
            >
              {savingItem || uploadingFile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingFile ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003893] text-xl">Edit Media</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-5 py-2">
              {/* Current media preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                  {editingItem.media_type === "video" ? (
                    <video
                      src={editingItem.media_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={editingItem.media_url}
                      alt={editingItem.title_en}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Current media</p>
                  <p className="text-xs text-muted-foreground mt-0.5 break-all">
                    {editingItem.media_url}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {editingItem.media_type}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title (English) <span className="text-red-500">*</span></Label>
                  <Input
                    value={editForm.title_en}
                    onChange={(e) => setEditForm((f) => ({ ...f, title_en: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Title (Nepali)</Label>
                  <Input
                    value={editForm.title_np}
                    onChange={(e) => setEditForm((f) => ({ ...f, title_np: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (English)</Label>
                  <Textarea
                    rows={2}
                    value={editForm.description_en}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, description_en: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (Nepali)</Label>
                  <Textarea
                    rows={2}
                    value={editForm.description_np}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, description_np: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-sm">Mark as Featured</p>
                    <p className="text-xs text-muted-foreground">
                      Featured items appear at the top of the gallery
                    </p>
                  </div>
                </div>
                <Switch
                  checked={editForm.is_featured}
                  onCheckedChange={(v) => setEditForm((f) => ({ ...f, is_featured: v }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white min-w-[100px]"
            >
              {savingEdit ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this media?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deleteTarget?.title_en}&quot;</strong> will be permanently deleted from
              the gallery and removed from the server. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}