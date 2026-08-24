"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Plus, Pencil, Trash2, CheckSquare } from "lucide-react";
import { fetchAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppDialog } from "@/contexts/DialogContext";

export default function QuestManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetType: "play_game",
    targetValue: 1,
    rewardXp: 10,
    frequency: "DAILY"
  });
  
  const { t, locale } = useLanguage();
  const { notify, confirm } = useAppDialog();
  const isVi = locale === 'vi';

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/gamification/admin/quests');
      const data = Array.isArray(res) ? res : (res.data || []);
      setQuests(data);
    } catch (err) {
      console.error("Failed to fetch quests", err);
      notify({ message: isVi ? "Không thể tải danh sách nhiệm vụ" : "Failed to fetch quests", variant: "error" });
      setQuests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (quest: any = null) => {
    if (quest) {
      setEditingQuest(quest);
      setFormData({
        title: quest.title || "",
        description: quest.description || "",
        targetType: quest.targetType || "play_game",
        targetValue: quest.targetValue || 1,
        rewardXp: quest.rewardXp || 10,
        frequency: quest.frequency || "DAILY"
      });
    } else {
      setEditingQuest(null);
      setFormData({
        title: "",
        description: "",
        targetType: "play_game",
        targetValue: 1,
        rewardXp: 10,
        frequency: "DAILY"
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetType) {
      notify({ message: isVi ? "Vui lòng điền đủ thông tin" : "Please fill required fields", variant: "warning" });
      return;
    }
    
    setSaving(true);
    try {
      if (editingQuest) {
        await fetchAPI(`/gamification/admin/quests/${editingQuest.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        notify({ message: isVi ? "Cập nhật thành công" : "Quest updated successfully", variant: "success" });
      } else {
        await fetchAPI('/gamification/admin/quests', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        notify({ message: isVi ? "Tạo thành công" : "Quest created successfully", variant: "success" });
      }
      setModalOpen(false);
      fetchQuests();
    } catch (err) {
      console.error(err);
      notify({ message: isVi ? "Có lỗi xảy ra" : "An error occurred", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({ 
      message: isVi ? "Bạn có chắc muốn xóa nhiệm vụ này không?" : "Are you sure you want to delete this quest?", 
      variant: "error" 
    });
    if (!isConfirmed) return;

    try {
      await fetchAPI(`/gamification/admin/quests/${id}`, { method: 'DELETE' });
      notify({ message: isVi ? "Xóa thành công" : "Quest deleted", variant: "success" });
      fetchQuests();
    } catch (err) {
      notify({ message: isVi ? "Không thể xóa nhiệm vụ" : "Failed to delete quest", variant: "error" });
    }
  };

  if (!mounted) return null;

  const filteredQuests = quests.filter(q => 
    q.title?.toLowerCase().includes(search.toLowerCase()) || 
    q.targetType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-primary" />
            {isVi ? "Quản lý Nhiệm vụ" : "Quest Management"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {isVi ? "Quản lý các nhiệm vụ hàng ngày cho người dùng." : "Manage daily quests for users."}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="font-bold">
          <Plus className="w-4 h-4 mr-2" />
          {isVi ? "Tạo Nhiệm vụ" : "Create Quest"}
        </Button>
      </div>

      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="border-b border-border p-4 bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={isVi ? "Tìm kiếm nhiệm vụ..." : "Search quests..."} 
              className="pl-9 bg-background border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>{isVi ? "Tên Nhiệm vụ" : "Title"}</TableHead>
                  <TableHead>{isVi ? "Tần suất" : "Frequency"}</TableHead>
                  <TableHead>{isVi ? "Loại / Target" : "Target Type"}</TableHead>
                  <TableHead className="text-center">{isVi ? "Mục tiêu" : "Value"}</TableHead>
                  <TableHead className="text-center">{isVi ? "Phần thưởng" : "Reward XP"}</TableHead>
                  <TableHead className="text-right">{isVi ? "Hành động" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {isVi ? "Đang tải..." : "Loading..."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {isVi ? "Không tìm thấy nhiệm vụ nào." : "No quests found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuests.map((q) => (
                    <TableRow key={q.id} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">#{q.id}</TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground">{q.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{q.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold ${
                          q.frequency === 'WEEKLY' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                          q.frequency === 'MONTHLY' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          q.frequency === 'LIFETIME' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {q.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {q.targetType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{q.targetValue}</TableCell>
                      <TableCell className="text-center font-bold text-success">+{q.rewardXp} XP</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(q)} className="text-blue-500 hover:bg-blue-500/10">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-error hover:bg-error/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-[425px] overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">{editingQuest ? (isVi ? "Sửa Nhiệm vụ" : "Edit Quest") : (isVi ? "Tạo Nhiệm vụ" : "Create Quest")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isVi ? "Thiết lập thông tin cho nhiệm vụ." : "Set up quest details."}
              </p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 px-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">{isVi ? "Tiêu đề" : "Title"}</label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder={isVi ? "VD: Chơi một Game" : "E.g. Play a Game"}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">{isVi ? "Mô tả (không bắt buộc)" : "Description (optional)"}</label>
                <Input 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{isVi ? "Tần suất" : "Frequency"}</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.frequency}
                    onChange={e => setFormData({...formData, frequency: e.target.value})}
                  >
                    <option value="DAILY">{isVi ? "Hàng Ngày (DAILY)" : "Daily (DAILY)"}</option>
                    <option value="WEEKLY">{isVi ? "Hàng Tuần (WEEKLY)" : "Weekly (WEEKLY)"}</option>
                    <option value="MONTHLY">{isVi ? "Hàng Tháng (MONTHLY)" : "Monthly (MONTHLY)"}</option>
                    <option value="LIFETIME">{isVi ? "Trọn Đời (LIFETIME)" : "Lifetime (LIFETIME)"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{isVi ? "Loại Mục tiêu" : "Target Type"}</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.targetType}
                    onChange={e => setFormData({...formData, targetType: e.target.value})}
                  >
                    <option value="play_game">{isVi ? "Chơi Game" : "Play Game"}</option>
                    <option value="rate_game">{isVi ? "Đánh giá Game" : "Rate Game"}</option>
                    <option value="login">{isVi ? "Đăng nhập" : "Login"}</option>
                    <option value="add_friend">{isVi ? "Kết bạn" : "Add Friend"}</option>
                    <option value="follow_creator">{isVi ? "Theo dõi Creator" : "Follow Creator"}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{isVi ? "Số lượng yêu cầu" : "Target Value"}</label>
                  <Input 
                    type="number" min="1"
                    value={formData.targetValue} 
                    onChange={e => setFormData({...formData, targetValue: parseInt(e.target.value) || 1})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">{isVi ? "Phần thưởng XP" : "Reward XP"}</label>
                  <Input 
                    type="number" min="1"
                    value={formData.rewardXp} 
                    onChange={e => setFormData({...formData, rewardXp: parseInt(e.target.value) || 10})} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  {isVi ? "Hủy" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
                  {isVi ? "Lưu lại" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
