"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Eye,
  Calendar,
  Star,
} from "lucide-react";
import useSWR, { mutate } from "swr";

interface Blog {
  id: number;
  title_en: string;
  title_np: string | null;
  slug: string;
  excerpt_en: string | null;
  content_en?: string; // ✅ ADD THIS
  author_name: string | null;
  category: string | null;
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  published_at: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminBlogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const [formData, setFormData] = useState({
    title_en: "",
    content_en: "",
    slug: "",
    category: "",
    is_featured: false,
  });

  const { data, isLoading } = useSWR<{ success: boolean; data: Blog[] }>(
    "/api/blogs",
    fetcher,
  );

  const blogs = data?.data || [];

  const filteredBlogs = blogs.filter((blog) =>
    blog.title_en.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this blog?")) return;

    const res = await fetch(`/api/blogs?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    console.log("DELETE:", data);

    if (!data.success) {
      alert("Delete failed");
      return;
    }

    mutate("/api/blogs");
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title_en: blog.title_en,
      content_en: blog.content_en || "",
      slug: blog.slug,
      category: blog.category || "",
      is_featured: blog.is_featured,
    });
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en.trim()) {
      alert("Title required");
      return;
    }

    const res = await fetch("/api/blogs", {
      method: editingBlog ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        editingBlog ? { ...formData, id: editingBlog.id } : formData,
      ),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "Failed");
      return;
    }

    mutate("/api/blogs");
    setIsOpen(false);
    setEditingBlog(null);

    setFormData({
      title_en: "",
      content_en: "",
      slug: "",
      category: "",
      is_featured: false,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003893]">
            Blogs Management
          </h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button
          onClick={() => {
            setEditingBlog(null);
            setFormData({
              title_en: "",
              content_en: "",
              slug: "",
              category: "",
              is_featured: false,
            });
            setIsOpen(true);
          }}
          className="bg-gradient-to-r from-[#DC143C] to-[#003893] text-white rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Blog Post
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold">
              {editingBlog ? "Edit Blog" : "Create Blog"}
            </h2>

            <Input
              placeholder="Title"
              value={formData.title_en}
              onChange={(e) => {
                const title = e.target.value;
                setFormData({
                  ...formData,
                  title_en: title,
                  slug: generateSlug(title),
                });
              }}
            />

            <Input placeholder="Slug" value={formData.slug} readOnly />

            <Input
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Featured</label>
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_featured: e.target.checked,
                  })
                }
              />
            </div>

            <textarea
              placeholder="Content"
              className="w-full border p-2 rounded min-h-[120px]"
              value={formData.content_en}
              onChange={(e) =>
                setFormData({ ...formData, content_en: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setEditingBlog(null);
                }}
              >
                Cancel
              </Button>

              <Button onClick={handleSubmit}>
                {editingBlog ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC143C]" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No blog posts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBlogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-2">
                      {blog.is_featured && (
                        <Badge className="bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge
                        variant={blog.is_published ? "default" : "secondary"}
                      >
                        {blog.is_published ? "Published" : "Draft"}
                      </Badge>
                      {blog.category && (
                        <Badge variant="outline" className="capitalize">
                          {blog.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(blog)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(blog.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#003893] mb-2 line-clamp-2">
                    {blog.title_en}
                  </h3>
                  {blog.excerpt_en && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {blog.excerpt_en}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(blog.published_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {blog.view_count} views
                      </span>
                    </div>
                    {blog.author_name && (
                      <span className="text-[#003893]">
                        By {blog.author_name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
