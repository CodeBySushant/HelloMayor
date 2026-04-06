"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, X, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
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
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const categories = [
  { id: "all", labelEn: "All", labelNp: "सबै" },
  { id: "events", labelEn: "Events", labelNp: "कार्यक्रम" },
  { id: "development", labelEn: "Development", labelNp: "विकास" },
  { id: "meetings", labelEn: "Meetings", labelNp: "बैठक" },
  { id: "community", labelEn: "Community", labelNp: "समुदाय" },
]

export function GallerySection() {
  const { t, language } = useLanguage()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  const { data, isLoading } = useSWR<{ success: boolean; data: GalleryItem[] }>(
    `/api/gallery?limit=6${activeCategory !== "all" ? `&category=${activeCategory}` : ""}`,
    fetcher
  )

  const galleryItems = data?.data || []

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
              {language === "en" ? "Photos and videos from our activities" : "हाम्रा गतिविधिहरूबाट फोटो र भिडियो"}
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
          </div>
        )}

        {/* Empty State */}
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
                className={`relative cursor-pointer rounded-2xl overflow-hidden group ${
                  index === 0 ? "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" : "aspect-square"
                }`}
              >
                {/* Placeholder Image */}
                <div
                  className={`absolute inset-0 ${
                    index % 3 === 0
                      ? "bg-gradient-to-br from-[#DC143C]/30 to-[#003893]/30"
                      : index % 3 === 1
                      ? "bg-gradient-to-br from-[#003893]/30 to-[#DC143C]/20"
                      : "bg-gradient-to-br from-[#003893]/20 to-[#DC143C]/30"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {item.media_type === "video" ? (
                    <Play className="h-12 w-12 text-white/40" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-white/30" />
                  )}
                </div>

                {/* Featured Badge */}
                {item.is_featured && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-[#DC143C] text-white text-xs rounded-full">
                    {language === "en" ? "Featured" : "विशेष"}
                  </span>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Video Play Button */}
                {item.media_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 text-[#DC143C] ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white font-medium text-sm">
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
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="max-w-4xl w-full">
              <div className="aspect-video rounded-2xl gradient-nepal flex items-center justify-center mb-4">
                {selectedItem.media_type === "video" ? (
                  <Play className="h-20 w-20 text-white/40" />
                ) : (
                  <ImageIcon className="h-20 w-20 text-white/30" />
                )}
              </div>
              <div className="text-center">
                <h3 className="text-white text-xl font-semibold">
                  {language === "np" && selectedItem.title_np ? selectedItem.title_np : selectedItem.title_en}
                </h3>
                {selectedItem.description_en && (
                  <p className="text-white/60 mt-2">
                    {selectedItem.description_en}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
