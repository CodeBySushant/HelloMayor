"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquareWarning,
  Bell,
  FileText,
  Phone,
} from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  const { t, language } = useLanguage();

  const quickLinks = [
    {
      icon: MessageSquareWarning,
      label: t("fileComplaint"),
      href: "/complaints",
      gradient: "from-[#DC143C] to-[#DC143C]/80",
      description: language === "en" ? "Submit issues" : "समस्या पेश गर्नुहोस्",
    },
    {
      icon: Bell,
      label: t("viewNotices"),
      href: "/notices",
      gradient: "from-[#003893] to-[#003893]/80",
      description: language === "en" ? "Latest updates" : "नयाँ अपडेट",
    },
    {
      icon: FileText,
      label: t("readBlogs"),
      href: "/blogs",
      gradient: "from-[#DC143C] to-[#003893]",
      description: language === "en" ? "News & stories" : "समाचार र कथा",
    },
    {
      icon: Phone,
      label: t("contactUs"),
      href: "/contact",
      gradient: "from-[#003893] to-[#DC143C]",
      description: language === "en" ? "Get in touch" : "सम्पर्क गर्नुहोस्",
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#003893]/[0.03] via-white to-[#DC143C]/[0.03]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23003893' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated gradient blurs */}
      <motion.div
        className="absolute top-32 right-20 h-80 w-80 rounded-full bg-[#DC143C]/8 blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-[#003893]/8 blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.3, 0.5, 0.3],
          y: [0, -20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#DC143C]/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Nepal Flag - Desktop */}
      <motion.div
        className="absolute top-32 right-8 lg:right-24 hidden md:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src="/nepal-flag.gif" alt="Nepal Flag" width={32} height={40} />
        </motion.div>
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#003893]/10 shadow-sm mb-8"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#DC143C] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#DC143C]" />
            </span>
            <span className="text-sm font-medium text-[#003893]">
              {t("welcome")}
            </span>
            <img
              src="/nepal-flag.gif"
              alt="Nepal Flag"
              className="w-5 h-auto md:hidden"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-[#DC143C] via-[#003893] to-[#DC143C] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {t("portalName")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl lg:text-3xl text-[#003893] font-medium mb-4"
          >
            {t("heroSubtitle")}
          </motion.p>

          {/* Mission */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t("mission")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <Link href="/complaints">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-base bg-gradient-to-r from-[#DC143C] to-[#003893] hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MessageSquareWarning className="mr-2 h-5 w-5" />
                {t("fileComplaint")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/notices">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-14 text-base border-2 border-[#003893]/30 hover:border-[#003893] hover:bg-[#003893]/5 text-[#003893] transition-all hover:scale-105"
              >
                <Bell className="mr-2 h-5 w-5" />
                {t("viewNotices")}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Quick Link Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {quickLinks.map((item, index) => (
            <Link key={index} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.03, y: -6 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center cursor-pointer group border border-[#003893]/10 shadow-sm hover:shadow-lg hover:border-[#DC143C]/20 transition-all"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-[#003893] group-hover:text-[#DC143C] transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">
            {language === "en"
              ? "Scroll to explore"
              : "अन्वेषण गर्न स्क्रोल गर्नुहोस्"}
          </span>
          <div className="h-8 w-5 rounded-full border-2 border-[#003893]/30 flex justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-2 w-1 rounded-full bg-[#DC143C]"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
