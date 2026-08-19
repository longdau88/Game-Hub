const fs = require('fs');
const path = require('path');

const pagePath = path.join('frontend', 'app', '(creator)', 'creator', 'games', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add imports
if (!content.includes('useRouter')) {
  content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { useRouter } from "next/navigation";');
}
if (!content.includes('useAppDialog')) {
  content = content.replace('import { useLanguage } from "@/contexts/LanguageContext";', 'import { useLanguage } from "@/contexts/LanguageContext";\nimport { useAppDialog } from "@/contexts/DialogContext";');
}

// 2. Add hooks
if (!content.includes('const router = useRouter();')) {
  content = content.replace('const { t } = useLanguage();', 'const { t } = useLanguage();\n  const router = useRouter();\n  const { notify, confirm } = useAppDialog();');
}

// 3. Add handleDelete
if (!content.includes('const handleDelete =')) {
  const handleDeleteStr = `
  const handleDelete = async (id: string) => {
    if (await confirm({ title: t("creator.deleteConfirmTitle") || "Delete Game", description: t("creator.deleteConfirmDesc") || "Are you sure you want to delete this game? This action cannot be undone." })) {
      try {
        await fetchAPI(\`/games/\${id}\`, { method: 'DELETE' });
        setGames(games.filter(g => g.id !== id));
        notify({ message: t("creator.deleteSuccess") || "Game deleted successfully", variant: "success" });
      } catch (err: any) {
        notify({ message: err.message || t("creator.deleteFailed") || "Failed to delete game", variant: "error" });
      }
    }
  };
`;
  content = content.replace('const filteredGames = games.filter', handleDeleteStr + '\n  const filteredGames = games.filter');
}

// 4. Update buttons
const oldButtons = `                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="ghost" size="sm" title="Analytics">
                      <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Edit">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-error">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>`;

const newButtons = `                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="ghost" size="sm" title={t("creator.analytics") || "Analytics"} onClick={() => router.push('/creator/analytics')}>
                      <BarChart2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" title={t("creator.edit") || "Edit"} onClick={() => router.push(\`/profile/edit-game/\${game.id}\`)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-error" title={t("creator.delete") || "Delete"} onClick={() => handleDelete(game.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>`;

content = content.replace(oldButtons, newButtons);
fs.writeFileSync(pagePath, content);

// 5. Update locales
const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.analytics'] = 'Thống kê';
vi['creator.edit'] = 'Chỉnh sửa';
vi['creator.delete'] = 'Xoá';
vi['creator.deleteConfirmTitle'] = 'Xoá Game';
vi['creator.deleteConfirmDesc'] = 'Bạn có chắc chắn muốn xoá game này không? Hành động này không thể hoàn tác.';
vi['creator.deleteSuccess'] = 'Xoá game thành công';
vi['creator.deleteFailed'] = 'Xoá game thất bại';

en['creator.analytics'] = 'Analytics';
en['creator.edit'] = 'Edit';
en['creator.delete'] = 'Delete';
en['creator.deleteConfirmTitle'] = 'Delete Game';
en['creator.deleteConfirmDesc'] = 'Are you sure you want to delete this game? This action cannot be undone.';
en['creator.deleteSuccess'] = 'Game deleted successfully';
en['creator.deleteFailed'] = 'Failed to delete game';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done fixing creator games list');
