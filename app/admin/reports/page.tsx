"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Plus, Edit2, Trash2, Loader2, Search, Download, Calendar, FileText } from "lucide-react"
import useSWR from "swr"

interface Report {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  report_type: string
  fiscal_year: string
  file_url: string
  file_size: number
  download_count: number
  is_published: boolean
  published_at: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminReportsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useSWR<{ success: boolean; data: Report[] }>(
    "/api/reports",
    fetcher
  )

  const reports = data?.data || []

  const filteredReports = reports.filter(report =>
    report.title_en.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">Reports Management</h1>
          <p className="text-muted-foreground">Upload and manage ward reports</p>
        </div>
        <Button className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Upload Report
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#DC143C]/10 to-[#003893]/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#003893]" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#003893] text-sm mb-2 line-clamp-2">{report.title_en}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={report.is_published ? "default" : "secondary"}>
                      {report.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{report.report_type}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      FY {report.fiscal_year}
                    </span>
                    <span>{formatFileSize(report.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {report.download_count} downloads
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-full">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
