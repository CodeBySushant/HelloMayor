"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Mail,
  MailOpen,
  Phone,
  Calendar,
  FileText,
  CheckCheck,
  Loader2,
  Send,
} from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: number
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: string
  response_message: string
  responded_at: string
  created_at: string
}

export default function AdminMessagesPage() {
  const { language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [responseMessage, setResponseMessage] = useState("")
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact")
      const data = await res.json()
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filter === "all" || 
      (filter === "unread" && m.status === "unread") || 
      (filter === "read" && m.status !== "unread")
    return matchesSearch && matchesFilter
  })

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message)
    setResponseMessage(message.response_message || "")
    
    if (message.status === "unread") {
      try {
        await fetch("/api/contact", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: message.id, status: "read" }),
        })
        setMessages(messages.map(m => m.id === message.id ? { ...m, status: "read" } : m))
      } catch (error) {
        console.error("Failed to mark as read:", error)
      }
    }
  }

  const handleRespond = async () => {
    if (!selectedMessage || !responseMessage.trim()) return
    
    setResponding(true)
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedMessage.id, 
          status: "responded",
          response_message: responseMessage 
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(messages.map(m => m.id === selectedMessage.id ? data.data : m))
        setSelectedMessage(data.data)
      }
    } catch (error) {
      console.error("Failed to respond:", error)
    } finally {
      setResponding(false)
    }
  }

  const unreadCount = messages.filter((m) => m.status === "unread").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#003893]" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-gradient-nepal">
          {language === "en" ? "Contact Messages" : "सम्पर्क सन्देश"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "en"
            ? "View and respond to citizen inquiries"
            : "नागरिक सोधपुछ हेर्नुहोस् र जवाफ दिनुहोस्"}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-xl text-left transition-colors ${
            filter === "all" ? "bg-[#003893]/10 ring-2 ring-[#003893]" : "bg-white border"
          }`}
        >
          <p className="text-2xl font-bold">{messages.length}</p>
          <p className="text-xs text-muted-foreground">{language === "en" ? "Total" : "कुल"}</p>
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`p-4 rounded-xl text-left transition-colors ${
            filter === "unread" ? "bg-[#DC143C]/10 ring-2 ring-[#DC143C]" : "bg-white border"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{unreadCount}</p>
            {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-[#DC143C] animate-pulse" />}
          </div>
          <p className="text-xs text-muted-foreground">{language === "en" ? "Unread" : "नपढेको"}</p>
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`p-4 rounded-xl text-left transition-colors ${
            filter === "read" ? "bg-green-100 ring-2 ring-green-500" : "bg-white border"
          }`}
        >
          <p className="text-2xl font-bold">{messages.length - unreadCount}</p>
          <p className="text-xs text-muted-foreground">{language === "en" ? "Read" : "पढेको"}</p>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === "en" ? "Search messages..." : "सन्देश खोज्नुहोस्..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden"
      >
        <div className="divide-y">
          <AnimatePresence>
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleViewMessage(message)}
                className={`p-4 cursor-pointer transition-colors hover:bg-muted/30 ${
                  message.status === "unread" ? "bg-[#DC143C]/5" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      message.status !== "unread" ? "bg-muted" : "gradient-nepal"
                    }`}
                  >
                    {message.status !== "unread" ? (
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Mail className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium text-sm ${message.status === "unread" ? "font-semibold" : ""}`}>
                          {message.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{message.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.status === "unread" && (
                          <Badge className="bg-[#DC143C] text-white text-xs">
                            {language === "en" ? "New" : "नयाँ"}
                          </Badge>
                        )}
                        {message.status === "responded" && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {language === "en" ? "Responded" : "जवाफ दिइएको"}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(message.created_at), "MMM d")}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${message.status === "unread" ? "font-medium" : ""}`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {message.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMessages.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {language === "en" ? "No messages found" : "कुनै सन्देश फेला परेन"}
            </p>
          </div>
        )}
      </motion.div>

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-green-500" />
              {language === "en" ? "Message Details" : "सन्देश विवरण"}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className="h-12 w-12 rounded-full gradient-nepal flex items-center justify-center text-white font-semibold">
                  {selectedMessage.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedMessage.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {language === "en" ? "Phone" : "फोन"}
                  </p>
                  <p className="text-sm font-medium">{selectedMessage.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {language === "en" ? "Date" : "मिति"}
                  </p>
                  <p className="text-sm font-medium">{format(new Date(selectedMessage.created_at), "PPP")}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">{language === "en" ? "Subject" : "विषय"}</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">{language === "en" ? "Message" : "सन्देश"}</p>
                <div className="p-4 rounded-xl bg-muted text-sm leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>

              {selectedMessage.status === "responded" && selectedMessage.response_message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{language === "en" ? "Your Response" : "तपाईंको जवाफ"}</p>
                  <div className="p-4 rounded-xl bg-green-50 text-sm leading-relaxed border border-green-200">
                    {selectedMessage.response_message}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Label className="text-xs text-muted-foreground">
                  {language === "en" ? "Response" : "जवाफ"}
                </Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={language === "en" ? "Write your response..." : "आफ्नो जवाफ लेख्नुहोस्..."}
                  className="mt-1.5"
                  rows={4}
                />
                <Button 
                  onClick={handleRespond}
                  disabled={responding || !responseMessage.trim()}
                  className="w-full mt-3 gradient-nepal"
                >
                  {responding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {language === "en" ? "Send Response" : "जवाफ पठाउनुहोस्"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
