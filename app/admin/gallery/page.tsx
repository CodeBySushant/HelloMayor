"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Video,
  Star,
  StarOff,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

interface GalleryItem {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  description_np: string | null
  media_type: string
  media_url: string
  thumbnail_url: string | null
  category: string | null
  event_date: string | null
  is_featured: boolean
  created_at: string
}

interface FormData {
  title_en: string
  title_np: string
  description_en: string
  description_np: string
  category: string
  event_date: string
  is_featured: boolean
  media_type: string
}

const EMPTY_FORM: FormData = {
  title_en: "",
  title_np: "",
  description_en: "",
  description_np: "",
  category: "general",
  event_date: "",
  is_featured: false,
  media_type: "image",
}

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "events", label: "Events" },
  { value: "development", label: "Development" },
  { value: "meetings", label: "Meetings" },
  { value: "community", label: "Community" },
  { value: "health", label: "Health" },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  events: "bg-purple-100 text-purple-700",
  development: "bg-green-100 text-green-700",
  meetings: "bg-blue-100 text-blue-700",
  community: "bg-amber-100 text-amber-700",
  health: "bg-rose-100 text-rose-700",
}

export default function AdminGalleryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null)

  // Form state
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, mutate } = useSWR<{ success: boolean; data: GalleryItem[] }>(
    "/api/gallery",
    fetcher
  )

  const items = data?.data || []

  const filteredItems = items.filter((item) => {
    const matchSearch = item.title_en.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === "all" || item.category === categoryFilter
    return matchSearch && matchCat
  })

  // Stats
  const imageCount = items.filter((i) => i.media_type === "image").length
  const videoCount = items.filter((i) => i.media_type === "video").length
  const featuredCount = items.filter((i) => i.is_featured).length

  // ── File selection ────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const isVideo = file.type.startsWith("video/")
    setFormData((prev) => ({ ...prev, media_type: isVideo ? "video" : "image" }))

    // Preview
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }, [previewUrl])

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // ── Open create dialog ────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null)
    setFormData(EMPTY_FORM)
    clearFile()
    setIsFormOpen(true)
  }

  // ── Open edit dialog ──────────────────────────────────────────
  const openEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setFormData({
      title_en: item.title_en,
      title_np: item.title_np ?? "",
      description_en: item.description_en ?? "",
      description_np: item.description_np ?? "",
      category: item.category ?? "general",
      event_date: item.event_date ?? "",
      is_featured: item.is_featured,
      media_type: item.media_type,
    })
    setPreviewUrl(item.media_url) // show current image as preview
    setSelectedFile(null)
    setIsFormOpen(true)
  }

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // ── Submit (create or edit) ───────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.title_en.trim()) {
      toast.error("Title (English) is required")
      return
    }
    if (!editingItem && !selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(selectedFile ? "Uploading to VPS..." : "Saving...")

    try {
      if (editingItem) {
        // ── EDIT: metadata only via PUT ──
        const res = await fetch("/api/gallery", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || "Update failed")
        toast.success("Gallery item updated!")
      } else {
        // ── CREATE: multipart form with file ──
        const fd = new FormData()
        fd.append("file", selectedFile!)
        fd.append("title_en", formData.title_en)
        fd.append("title_np", formData.title_np)
        fd.append("description_en", formData.description_en)
        fd.append("description_np", formData.description_np)
        fd.append("media_type", formData.media_type)
        fd.append("category", formData.category)
        fd.append("event_date", formData.event_date)
        fd.append("is_featured", String(formData.is_featured))

        const res = await fetch("/api/gallery", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || "Upload failed")
        toast.success("Media uploaded successfully!")
      }

      setIsFormOpen(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  // ── Quick featured toggle ─────────────────────────────────────
  const toggleFeatured = async (item: GalleryItem) => {
    try {
      const res = await fetch("/api/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, is_featured: !item.is_featured }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(item.is_featured ? "Removed from featured" : "Marked as featured!")
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Failed to update")
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/gallery?id=${deletingItem.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error)
      toast.success("Deleted successfully")
      setIsDeleteOpen(false)
      mutate()
    } catch (err: any) {
      toast.error(err.message || "Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">Gallery Management</h1>
          <p className="text-muted-foreground text-sm">Upload photos and videos to VPS storage</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: items.length, color: "text-[#003893]", bg: "bg-[#003893]/5" },
          { label: "Images", value: imageCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Videos", value: videoCount, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Featured", value: featuredCount, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className={`py-3 px-4 rounded-xl ${s.bg}`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all" ? "No media matches your filters" : "No media yet. Upload some!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.04 }}
                layout
              >
                <Card className="overflow-hidden group hover:shadow-md transition-all border-[#003893]/10">
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {item.media_type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                        <Video className="h-10 w-10 text-purple-400" />
                        <video
                          src={item.media_url}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                          muted
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <img
                        src={item.media_url}
                        alt={item.title_en}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    )}

                    {/* Featured badge */}
                    {item.is_featured && (
                      <span className="absolute top-2 left-2 p-1 bg-amber-500 rounded-full shadow">
                        <Star className="h-3 w-3 text-white fill-white" />
                      </span>
                    )}

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 shadow"
                        title={item.is_featured ? "Remove featured" : "Mark featured"}
                        onClick={() => toggleFeatured(item)}
                      >
                        {item.is_featured
                          ? <StarOff className="h-3 w-3 text-amber-500" />
                          : <Star className="h-3 w-3 text-amber-500" />
                        }
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 shadow"
                        onClick={() => openEdit(item)}
                      >
                        <Edit2 className="h-3 w-3 text-[#003893]" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 shadow"
                        onClick={() => { setDeletingItem(item); setIsDeleteOpen(true) }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>

                    {/* Type badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.media_type === "video"
                          ? "bg-purple-600 text-white"
                          : "bg-[#003893] text-white"
                      }`}>
                        {item.media_type}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-[#003893] line-clamp-1">{item.title_en}</h3>
                    {item.title_np && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.title_np}</p>
                    )}
                    <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full capitalize ${
                      categoryColors[item.category ?? "general"] ?? categoryColors.general
                    }`}>
                      {item.category ?? "general"}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Upload / Edit Dialog ───────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !isSubmitting && setIsFormOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003893]">
              {editingItem ? "Edit Media Details" : "Upload New Media"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File Drop Zone — only shown on create */}
            {!editingItem && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) {
                    const fakeEvent = { target: { files: [file] } } as any
                    handleFileSelect(fakeEvent)
                  }
                }}
                className="relative border-2 border-dashed border-[#003893]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#003893]/40 hover:bg-[#003893]/5 transition-all"
              >
                {previewUrl ? (
                  <div className="relative">
                    {formData.media_type === "video" ? (
                      <video src={previewUrl} className="max-h-40 mx-auto rounded-lg" controls />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile() }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-2">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-[#003893]/30" />
                    <p className="text-sm font-medium text-[#003893]">Click or drag & drop to upload</p>
                    <p className="text-xs text-muted-foreground">Images: JPG, PNG, WebP · Videos: MP4, WebM (max 100MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* When editing — show current media preview */}
            {editingItem && (
              <div className="rounded-xl overflow-hidden border border-[#003893]/10 bg-muted/30">
                {editingItem.media_type === "video" ? (
                  <video src={editingItem.media_url} className="w-full max-h-48 object-cover" controls />
                ) : (
                  <img src={editingItem.media_url} alt={editingItem.title_en} className="w-full max-h-48 object-cover" />
                )}
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Current file (cannot be changed — delete and re-upload to replace)
                </p>
              </div>
            )}

            {/* Title EN */}
            <div className="grid gap-1.5">
              <Label>Title (English) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setField("title_en", e.target.value)}
                placeholder="Ward Meeting 2081"
              />
            </div>

            {/* Title NP */}
            <div className="grid gap-1.5">
              <Label>Title (Nepali)</Label>
              <Input
                value={formData.title_np}
                onChange={(e) => setField("title_np", e.target.value)}
                placeholder="वडा बैठक २०८१"
              />
            </div>

            {/* Descriptions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Description (English)</Label>
                <Textarea
                  rows={2}
                  value={formData.description_en}
                  onChange={(e) => setField("description_en", e.target.value)}
                  placeholder="Brief description..."
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Description (Nepali)</Label>
                <Textarea
                  rows={2}
                  value={formData.description_np}
                  onChange={(e) => setField("description_np", e.target.value)}
                  placeholder="संक्षिप्त विवरण..."
                />
              </div>
            </div>

            {/* Category + Event Date */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setField("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setField("event_date", e.target.value)}
                />
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div>
                <p className="text-sm font-medium text-amber-800">Mark as Featured</p>
                <p className="text-xs text-amber-600">Featured items appear first in the gallery</p>
              </div>
              <button
                type="button"
                onClick={() => setField("is_featured", !formData.is_featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_featured ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  formData.is_featured ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress ?? "Saving..."}
                </>
              ) : editingItem ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Save Changes</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Upload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !isDeleting && setIsDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deletingItem?.title_en}"</strong> will be permanently deleted from the database and VPS storage. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                : <><XCircle className="h-4 w-4 mr-2" />Delete</>
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}