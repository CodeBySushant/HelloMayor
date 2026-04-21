"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, X, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

interface GalleryItem {
  id: number
  title_en: string
  title_np: string | null
  description_en: string | null
  media_type: string
  media_url: string
  thumbnail_url: string | null
  category: string | null
  is_featured: boolean
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const categories = [
  { id: "all",         labelEn: "All",         labelNp: "सबै" },
  { id: "events",      labelEn: "Events",      labelNp: "कार्यक्रम" },
  { id: "development", labelEn: "Development", labelNp: "विकास" },
  { id: "meetings",    labelEn: "Meetings",    labelNp: "बैठक" },
  { id: "community",   labelEn: "Community",   labelNp: "समुदाय" },
]

export function GallerySection() {
  const { t, language } = useLanguage()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const apiUrl = `/api/gallery?limit=6${activeCategory !== "all" ? `&category=${activeCategory}` : ""}`
  const { data, isLoading } = useSWR<{ success: boolean; data: GalleryItem[] }>(apiUrl, fetcher)

  const galleryItems = data?.data || []

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedItem) return
    const idx = galleryItems.findIndex(i => i.id === selectedItem.id)
    setSelectedItem(galleryItems[(idx - 1 + galleryItems.length) % galleryItems.length])
  }
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedItem) return
    const idx = galleryItems.findIndex(i => i.id === selectedItem.id)
    setSelectedItem(galleryItems[(idx + 1) % galleryItems.length])
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-white to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl font-bold text-gradient-nepal">{t("mediaGallery")}</h2>
            <p className="text-muted-foreground mt-1">
              {language === "en"
                ? "Photos and videos from our activities"
                : "हाम्रा गतिविधिहरूबाट फोटो र भिडियो"}
            </p>
          </div>
          <Link href="/gallery">
            <Button variant="outline" className="rounded-full border-[#003893]/30 hover:border-[#003893]">
              {t("viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "gradient-nepal text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "np" ? cat.labelNp : cat.labelEn}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && galleryItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{language === "en" ? "No media found" : "कुनै मिडिया फेला परेन"}</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!isLoading && galleryItems.length > 0 && (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedItem(item)}
                className={`relative cursor-pointer rounded-2xl overflow-hidden group bg-slate-100 ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : "aspect-square"
                }`}
                style={index === 0 ? { minHeight: "300px" } : {}}
              >
                {/* Real media */}
                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    preload="metadata"
                    onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={e => {
                      const v = e.currentTarget as HTMLVideoElement
                      v.pause(); v.currentTime = 0
                    }}
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title_en}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={e => {
                      const el = e.currentTarget as HTMLImageElement
                      el.style.display = "none"
                      const fb = el.nextElementSibling as HTMLElement
                      if (fb) fb.style.display = "flex"
                    }}
                  />
                )}

                {/* Fallback when image URL is broken */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-[#003893]/20 to-[#DC143C]/20 items-center justify-center"
                  style={{ display: "none" }}
                >
                  <ImageIcon className="h-10 w-10 text-white/40" />
                </div>

                {/* Featured badge */}
                {item.is_featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-[#DC143C] text-white text-xs rounded-full z-10">
                    {language === "en" ? "Featured" : "विशेष"}
                  </span>
                )}

                {/* Video play icon */}
                {item.media_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="h-6 w-6 text-[#DC143C] ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform z-20">
                  <p className="text-white font-medium text-sm line-clamp-2">
                    {language === "np" && item.title_np ? item.title_np : item.title_en}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Lightbox */}
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {galleryItems.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <div className="aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center mb-4">
                {selectedItem.media_type === "video" ? (
                  <video
                    src={selectedItem.media_url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={selectedItem.media_url}
                    alt={selectedItem.title_en}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-white text-xl font-semibold">
                  {language === "np" && selectedItem.title_np
                    ? selectedItem.title_np
                    : selectedItem.title_en}
                </h3>
                {selectedItem.description_en && (
                  <p className="text-white/60 mt-2 text-sm">{selectedItem.description_en}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </section>
  )
}