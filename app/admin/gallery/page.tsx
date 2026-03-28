"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, Plus, Edit2, Trash2, Loader2, Search, Video, Star } from "lucide-react"
import useSWR from "swr"

interface GalleryItem {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  media_type: string
  media_url: string
  category: string | null
  is_featured: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminGalleryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data, isLoading } = useSWR<{ success: boolean; data: GalleryItem[] }>(
    "/api/gallery",
    fetcher
  )

  const items = data?.data || []

  const filteredItems = items.filter(item =>
    item.title_en.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">Gallery Management</h1>
          <p className="text-muted-foreground">Upload and manage media files</p>
        </div>
        <Button className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Upload Media
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search media..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No media found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden group hover:shadow-md transition-all">
                <div className="relative aspect-square bg-gradient-to-br from-[#003893]/20 to-[#DC143C]/20 flex items-center justify-center">
                  {item.media_type === "video" ? (
                    <Video className="h-10 w-10 text-[#003893]/40" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-[#003893]/40" />
                  )}
                  {item.is_featured && (
                    <span className="absolute top-2 left-2 p-1 bg-amber-500 rounded-full">
                      <Star className="h-3 w-3 text-white" />
                    </span>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="secondary" size="icon" className="h-7 w-7">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-7 w-7 text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm text-[#003893] line-clamp-1">{item.title_en}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{item.category || "uncategorized"}</Badge>
                    <Badge variant="secondary" className="text-xs">{item.media_type}</Badge>
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
