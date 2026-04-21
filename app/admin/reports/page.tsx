"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import {
  BarChart3, Plus, Edit2, Trash2, Loader2, Search,
  Download, Calendar, FileText, CloudUpload, X,
  CheckCircle2, AlertCircle, Eye, EyeOff,
} from "lucide-react"
import useSWR from "swr"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  description_np: string | null
  report_type: string
  fiscal_year: string
  file_url: string
  file_size: number
  download_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
}

interface ReportForm {
  title_en: string
  title_np: string
  description_en: string
  description_np: string
  report_type: string
  fiscal_year: string
  is_published: boolean
}

const EMPTY_FORM: ReportForm = {
  title_en: "", title_np: "",
  description_en: "", description_np: "",
  report_type: "annual", fiscal_year: "",
  is_published: false,
}

const REPORT_TYPES = [
  { value: "annual",    label: "Annual Report" },
  { value: "budget",    label: "Budget Report" },
  { value: "audit",     label: "Audit Report" },
  { value: "progress",  label: "Progress Report" },
  { value: "social",    label: "Social Audit" },
  { value: "other",     label: "Other" },
]

// Generate fiscal years: last 10 years in Nepali format
const FISCAL_YEARS = Array.from({ length: 10 }, (_, i) => {
  const base = 2081 - i
  return `${base}-${(base + 1).toString().slice(-2)}`
})

const fetcher = (url: string) => fetch(url).then(res => res.json())

const formatFileSize = (bytes: number) => {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" }[]>([])
  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, show }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploadedSize, setUploadedSize] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [editForm, setEditForm] = useState<ReportForm>(EMPTY_FORM)
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { toasts, show: showToast } = useToast()

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data, isLoading, mutate } = useSWR<{ success: boolean; data: Report[] }>(
    "/api/reports?all=true",
    fetcher
  )
  const reports = data?.data || []

  const filtered = reports.filter(r => {
    const matchSearch = r.title_en.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === "all" || r.report_type === filterType
    return matchSearch && matchType
  })

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadedUrl(null)
    if (!form.title_en) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setForm(f => ({ ...f, title_en: name }))
    }
  }

  const uploadFile = async (): Promise<{ url: string; size: number } | null> => {
    if (!selectedFile) return null
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", selectedFile)
      const res = await fetch("/api/reports/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error || "Upload failed", "error"); return null }
      setUploadedUrl(data.url)
      setUploadedSize(data.file_size)
      return { url: data.url, size: data.file_size }
    } finally {
      setUploading(false)
    }
  }

  // ── Save new ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.title_en.trim()) { showToast("Title (English) is required", "error"); return }
    if (!form.report_type)     { showToast("Report type is required", "error"); return }
    if (!form.fiscal_year)     { showToast("Fiscal year is required", "error"); return }
    if (!selectedFile && !uploadedUrl) { showToast("Please select a file to upload", "error"); return }

    setSaving(true)
    try {
      let fileUrl = uploadedUrl
      let fileSize = uploadedSize

      if (!fileUrl && selectedFile) {
        const result = await uploadFile()
        if (!result) { setSaving(false); return }
        fileUrl = result.url
        fileSize = result.size
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, file_url: fileUrl, file_size: fileSize }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error || "Failed to save", "error"); return }

      showToast("Report uploaded successfully!", "success")
      setUploadOpen(false)
      resetForm()
      mutate()
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setSelectedFile(null)
    setUploadedUrl(null)
    setUploadedSize(0)
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEdit = (r: Report) => {
    setEditingReport(r)
    setEditForm({
      title_en: r.title_en,
      title_np: r.title_np || "",
      description_en: r.description_en || "",
      description_np: r.description_np || "",
      report_type: r.report_type,
      fiscal_year: r.fiscal_year,
      is_published: r.is_published,
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingReport) return
    if (!editForm.title_en.trim()) { showToast("Title is required", "error"); return }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/reports/${editingReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error || "Update failed", "error"); return }
      showToast("Updated successfully!", "success")
      setEditOpen(false)
      mutate()
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/reports/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) { showToast(data.error || "Delete failed", "error"); return }
      showToast("Deleted successfully!", "success")
      setDeleteTarget(null)
      mutate()
    } finally {
      setDeleting(false)
    }
  }

  // ── Quick publish toggle ──────────────────────────────────────────────────

  const togglePublish = async (r: Report) => {
    const res = await fetch(`/api/reports/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title_en: r.title_en, title_np: r.title_np,
        description_en: r.description_en, description_np: r.description_np,
        report_type: r.report_type, fiscal_year: r.fiscal_year,
        is_published: !r.is_published,
      }),
    })
    const data = await res.json()
    if (data.success) {
      showToast(r.is_published ? "Unpublished" : "Published!", "success")
      mutate()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
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
              {t.type === "success"
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">Reports Management</h1>
          <p className="text-muted-foreground text-sm">
            {reports.length} report{reports.length !== 1 ? "s" : ""} total ·{" "}
            {reports.filter(r => r.is_published).length} published
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setUploadOpen(true) }}
          className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {REPORT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-14 w-14 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No reports found</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Upload your first report to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="hover:shadow-md transition-all h-full border-border/60">
                <CardContent className="p-5 flex flex-col h-full">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#DC143C]/10 to-[#003893]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-[#003893]" />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title={report.is_published ? "Unpublish" : "Publish"}
                        onClick={() => togglePublish(report)}
                      >
                        {report.is_published
                          ? <Eye className="h-4 w-4 text-green-600" />
                          : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openEdit(report)}
                      >
                        <Edit2 className="h-4 w-4 text-[#003893]" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteTarget(report)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-[#003893] text-sm mb-2 line-clamp-2 flex-1">
                    {report.title_en}
                  </h3>

                  {report.description_en && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {report.description_en}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant={report.is_published ? "default" : "secondary"} className="text-xs">
                      {report.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">
                      {REPORT_TYPES.find(t => t.value === report.report_type)?.label || report.report_type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      FY {report.fiscal_year}
                    </span>
                    <span>{formatFileSize(report.file_size)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {report.download_count} downloads
                    </span>
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#003893] hover:underline font-medium"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={uploadOpen} onOpenChange={o => { if (!o) resetForm(); setUploadOpen(o) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003893] text-xl">Upload Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-colors ${
                dragOver ? "border-[#DC143C] bg-[#DC143C]/5"
                : selectedFile ? "border-green-400 bg-green-50"
                : "border-border hover:border-[#003893]/40 cursor-pointer"
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f)
              }}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = "" }}
              />
              {selectedFile ? (
                <div className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#003893]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-[#003893]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatFileSize(selectedFile.size)}
                      {uploadedUrl && (
                        <span className="text-green-600 ml-2 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Uploaded
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadedUrl(null) }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
                  <div className="p-3 bg-[#003893]/5 rounded-full">
                    <CloudUpload className="h-8 w-8 text-[#003893]/60" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Drop your file here, or{" "}
                      <span className="text-[#DC143C] underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel · Max 20MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title (English) <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Report title in English"
                  value={form.title_en}
                  onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Title (Nepali)</Label>
                <Input
                  placeholder="नेपालीमा शीर्षक"
                  value={form.title_np}
                  onChange={e => setForm(f => ({ ...f, title_np: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description (English)</Label>
                <Textarea
                  placeholder="Brief description..."
                  rows={2}
                  value={form.description_en}
                  onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description (Nepali)</Label>
                <Textarea
                  placeholder="छोटो विवरण..."
                  rows={2}
                  value={form.description_np}
                  onChange={e => setForm(f => ({ ...f, description_np: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Report Type <span className="text-red-500">*</span></Label>
                <Select value={form.report_type} onValueChange={v => setForm(f => ({ ...f, report_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fiscal Year <span className="text-red-500">*</span></Label>
                <Select value={form.fiscal_year} onValueChange={v => setForm(f => ({ ...f, fiscal_year: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_YEARS.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-sm">Publish Immediately</p>
                  <p className="text-xs text-muted-foreground">Make visible to public on the reports page</p>
                </div>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setUploadOpen(false); resetForm() }}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploading || (!selectedFile && !uploadedUrl)}
              className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white min-w-[130px]"
            >
              {saving || uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? "Uploading..." : "Saving..."}</>
              ) : (
                <><CloudUpload className="h-4 w-4 mr-2" />Upload & Save</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ─────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003893] text-xl">Edit Report</DialogTitle>
          </DialogHeader>

          {editingReport && (
            <div className="space-y-5 py-2">
              {/* Current file info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border">
                <div className="h-10 w-10 rounded-xl bg-[#003893]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-[#003893]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Current file</p>
                  <p className="text-xs text-muted-foreground truncate">{editingReport.file_url}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(editingReport.file_size)}</p>
                </div>
                <a
                  href={editingReport.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#003893] hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> View
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title (English) <span className="text-red-500">*</span></Label>
                  <Input value={editForm.title_en} onChange={e => setEditForm(f => ({ ...f, title_en: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Title (Nepali)</Label>
                  <Input value={editForm.title_np} onChange={e => setEditForm(f => ({ ...f, title_np: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (English)</Label>
                  <Textarea rows={2} value={editForm.description_en} onChange={e => setEditForm(f => ({ ...f, description_en: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (Nepali)</Label>
                  <Textarea rows={2} value={editForm.description_np} onChange={e => setEditForm(f => ({ ...f, description_np: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Report Type</Label>
                  <Select value={editForm.report_type} onValueChange={v => setEditForm(f => ({ ...f, report_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fiscal Year</Label>
                  <Select value={editForm.fiscal_year} onValueChange={v => setEditForm(f => ({ ...f, fiscal_year: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FISCAL_YEARS.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Published</p>
                    <p className="text-xs text-muted-foreground">Visible to the public</p>
                  </div>
                </div>
                <Switch
                  checked={editForm.is_published}
                  onCheckedChange={v => setEditForm(f => ({ ...f, is_published: v }))}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white min-w-[110px]"
            >
              {savingEdit
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deleteTarget?.title_en}&quot;</strong> will be permanently deleted along
              with its file from the server. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}