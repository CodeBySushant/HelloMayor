"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Camera, X, ChevronLeft, ChevronRight, Play, Image as ImageIcon, Loader2 } from "lucide-react"
import useSWR from "swr"

interface GalleryItem {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  description_np: string | null
  media_type: string
  media_url: string
  category: string | null
  is_featured: boolean
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const categories = [
  { id: "all", labelEn: "All", labelNe: "सबै" },
  { id: "development", labelEn: "Development", labelNe: "विकास" },
  { id: "events", labelEn: "Events", labelNe: "कार्यक्रम" },
  { id: "meetings", labelEn: "Meetings", labelNe: "बैठक" },
  { id: "community", labelEn: "Community", labelNe: "समुदाय" },
]

export default function GalleryPage() {
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const { data, isLoading } = useSWR<{ success: boolean; data: GalleryItem[] }>(
    `/api/gallery${activeCategory !== "all" ? `?category=${activeCategory}` : ""}`,
    fetcher
  )

  const galleryItems = data?.data || []

  const handleNext = () => {
    if (selectedItem !== null) {
      const currentIndex = galleryItems.findIndex(item => item.id === selectedItem)
      const nextIndex = (currentIndex + 1) % galleryItems.length
      setSelectedItem(galleryItems[nextIndex].id)
    }
  }

  const handlePrev = () => {
    if (selectedItem !== null) {
      const currentIndex = galleryItems.findIndex(item => item.id === selectedItem)
      const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length
      setSelectedItem(galleryItems[prevIndex].id)
    }
  }

  const selectedGalleryItem = galleryItems.find(item => item.id === selectedItem)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#003893]/[0.02]">
      <Header />
      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DC143C]/5 border border-[#DC143C]/10 mb-6">
              <Camera className="h-4 w-4 text-[#DC143C]" />
              <span className="text-sm font-medium text-[#003893]">
                {language === "en" ? "Photos & Videos" : "फोटो र भिडियो"}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#DC143C] to-[#003893] bg-clip-text text-transparent">
                {language === "en" ? "Media Gallery" : "मिडिया ग्यालरी"}
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "en"
                ? "Browse through photos and videos of our ward activities and development works"
                : "हाम्रो वडा गतिविधि र विकास कार्यहरूको फोटो र भिडियो हेर्नुहोस्"}
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-[#DC143C] to-[#003893] text-white"
                    : "border-[#003893]/20 text-[#003893] hover:bg-[#003893]/5"
                }`}
              >
                {language === "en" ? cat.labelEn : cat.labelNe}
              </Button>
            ))}
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
            </div>
          )}

          {/* Gallery Grid */}
          {!isLoading && galleryItems.length > 0 && (
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {galleryItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedItem(item.id)}
                    className={`relative cursor-pointer rounded-2xl overflow-hidden group ${
                      index % 5 === 0 ? "md:col-span-2 md:row-span-2" : ""
                    }`}
                  >
                    <div className={`bg-gradient-to-br from-[#003893]/20 to-[#DC143C]/20 ${
                      index % 5 === 0 ? "aspect-square" : "aspect-video"
                    } flex items-center justify-center`}>
                      {item.media_type === "video" ? (
                        <div className="relative">
                          <Play className="h-12 w-12 text-white/80" />
                          <div className="absolute inset-0 bg-[#003893]/20 rounded-full animate-ping" />
                        </div>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-[#003893]/30" />
                      )}
                    </div>
                    {item.is_featured && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-[#DC143C] text-white text-xs rounded-full">
                        {language === "en" ? "Featured" : "विशेष"}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {language === "np" && item.title_np ? item.title_np : item.title_en}
                        </p>
                        {item.media_type === "video" && (
                          <span className="inline-flex items-center gap-1 text-white/80 text-xs mt-1">
                            <Play className="h-3 w-3" />
                            Video
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!isLoading && galleryItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {language === "en" ? "No media found in this category." : "यस वर्गमा कुनै मिडिया फेला परेन।"}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={selectedItem !== null} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
              onClick={() => setSelectedItem(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            <div className="aspect-video bg-gradient-to-br from-[#003893]/40 to-[#DC143C]/40 flex items-center justify-center">
              {selectedGalleryItem?.media_type === "video" ? (
                <Play className="h-24 w-24 text-white/60" />
              ) : (
                <ImageIcon className="h-24 w-24 text-white/30" />
              )}
            </div>
            {selectedGalleryItem && (
              <div className="p-6 text-center">
                <h3 className="text-white text-xl font-semibold">
                  {language === "np" && selectedGalleryItem.title_np 
                    ? selectedGalleryItem.title_np 
                    : selectedGalleryItem.title_en}
                </h3>
                {selectedGalleryItem.description_en && (
                  <p className="text-white/70 mt-2">
                    {language === "np" && selectedGalleryItem.description_np 
                      ? selectedGalleryItem.description_np 
                      : selectedGalleryItem.description_en}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
