"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import Cookies from "js-cookie";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAppDialog } from "../../../contexts/DialogContext";

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const { confirm, notify } = useAppDialog();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatNameEn, setNewCatNameEn] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [editCatModalOpen, setEditCatModalOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatNameEn, setEditCatNameEn] = useState("");
  const [editCatSlug, setEditCatSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const token = Cookies.get("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCategories(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/categories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug,
          nameTranslations: { vi: newCatName, en: newCatNameEn },
        }),
      });
      if (res.ok) {
        setNewCatName(""); setNewCatNameEn(""); setNewCatSlug("");
        await notify({ message: t("admin.categoryAdded"), variant: "success" });
        fetchData();
      } else {
        await notify({ message: t("admin.categoryAddFailed"), variant: "error" });
      }
    } catch (error) { console.error(error); }
  };

  const deleteCategory = async (id: number) => {
    if (!await confirm({ message: t("admin.categoryDeleteConfirm"), variant: "warning" })) return;
    try {
      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchData();
      else await notify({ message: t("admin.categoryDeleteFailed"), variant: "error" });
    } catch (error) { console.error(error); }
  };

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCatId) return;
    try {
      const res = await fetch(`${apiUrl}/api/categories/${editCatId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCatName,
          slug: editCatSlug,
          nameTranslations: { vi: editCatName, en: editCatNameEn },
        }),
      });
      if (res.ok) {
        setEditCatModalOpen(false);
        fetchData();
      } else {
        await notify({ message: t("admin.categoryUpdateFailed"), variant: "error" });
      }
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-medium">{t("common.loading") || "Đang tải..."}</p></div>;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Add Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">{t("admin.addNewCat")}</h3>
        <form onSubmit={addCategory} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.catName")} (VI) *</label>
            <input
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
              placeholder="VD: HÃ nh Ä‘á»™ng"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.catName")} (EN)</label>
            <input
              value={newCatNameEn}
              onChange={(e) => setNewCatNameEn(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
              placeholder="e.g. Action"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-zinc-500">{t("admin.catSlug")} *</label>
            <input
              required
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:border-primary"
              placeholder="e.g. action"
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-zinc-900 dark:text-white rounded-md font-medium transition-colors">
            {t("admin.btnCreateCat")}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold">{t("admin.categories")}</h3>
        </div>
        <ul className="divide-y divide-border">
          {categories.map((cat) => (
            <li key={cat.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-zinc-500">/{cat.slug}</p>
                {cat.nameTranslations?.en && (
                  <p className="text-xs text-blue-400 mt-0.5">EN: {cat.nameTranslations.en}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditCatId(cat.id);
                    setEditCatName(cat.nameTranslations?.vi || cat.name);
                    setEditCatNameEn(cat.nameTranslations?.en || "");
                    setEditCatSlug(cat.slug);
                    setEditCatModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md text-xs font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="p-6 text-center text-zinc-500">No categories yet.</li>
          )}
        </ul>
      </div>

      {/* Edit Modal */}
      {editCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t("admin.catEditTitle")}</h3>
              <form onSubmit={updateCategory}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-600 dark:text-zinc-400">{t("admin.catEditName")} (VI)</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-600 dark:text-zinc-400">{t("admin.catEditName")} (EN)</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                      value={editCatNameEn}
                      onChange={(e) => setEditCatNameEn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-600 dark:text-zinc-400">{t("admin.catEditSlug")}</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                      value={editCatSlug}
                      onChange={(e) => setEditCatSlug(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditCatModalOpen(false)}
                    className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 rounded-lg font-medium transition-colors"
                  >
                    {t("admin.btnCancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

