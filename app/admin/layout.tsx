"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  MessageSquareWarning,
  Mail,
  Bell,
  FileText,
  Hammer,
  Image,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", labelNe: "ड्यासबोर्ड" },
  { href: "/admin/complaints", icon: MessageSquareWarning, label: "Complaints", labelNe: "गुनासो" },
  { href: "/admin/messages", icon: Mail, label: "Messages", labelNe: "सन्देश" },
  { href: "/admin/notices", icon: Bell, label: "Notices", labelNe: "सूचना" },
  { href: "/admin/blogs", icon: FileText, label: "Blogs", labelNe: "ब्लग" },
  { href: "/admin/works", icon: Hammer, label: "Dev Works", labelNe: "विकास कार्य" },
  { href: "/admin/gallery", icon: Image, label: "Gallery", labelNe: "ग्यालरी" },
  { href: "/admin/reports", icon: BarChart3, label: "Reports", labelNe: "प्रतिवेदन" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/20 h-16 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-[#003893]">Admin Panel</span>
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-50 bg-black/50"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-border z-50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg gradient-nepal flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#003893]">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Ward Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "gradient-nepal text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {language === "en" ? item.label : item.labelNe}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-3">
            {/* Language Toggle */}
            <div className="flex items-center justify-center gap-1 p-1 rounded-lg bg-muted">
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === "en"
                    ? "bg-white shadow text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("ne")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  language === "ne"
                    ? "bg-white shadow text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                नेपाली
              </button>
            </div>

            <Link href="/">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {language === "en" ? "Back to Site" : "साइटमा फर्कनुहोस्"}
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
