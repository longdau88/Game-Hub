const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'games', 'new', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Import useAppDialog
if (!content.includes('useAppDialog')) {
  content = content.replace(
    'import { useLanguage } from "@/contexts/LanguageContext";',
    'import { useLanguage } from "@/contexts/LanguageContext";\nimport { useAppDialog } from "@/contexts/DialogContext";'
  );
}

// 2. Extract notify
if (!content.includes('const { notify } = useAppDialog();')) {
  content = content.replace(
    'const { t } = useLanguage();',
    'const { t } = useLanguage();\n  const { notify } = useAppDialog();'
  );
}

// 3. Update alert to notify
const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      notify({ message: t("creator.selectZipFile") || "Please select a game package (.zip)", variant: "error" });
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title || "Untitled");
      formData.append('description', description);
      if (selectedCategories.length > 0) {
        formData.append('categoryIds', selectedCategories.join(','));
      }
      formData.append('tags', tags);
      formData.append('visibility', isPublic ? "public" : "private");
      formData.append('gameFile', zipFile);
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      await fetchAPI('/games/upload', {
        method: 'POST',
        body: formData,
      });

      router.push("/creator/games");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || t("creator.uploadFailed") || "Upload failed";
      if (msg.includes("does not contain an index.html")) {
        msg = t("creator.errorNoIndexHtml") || msg;
      } else if (msg.includes("Invalid zip file format")) {
        msg = t("creator.errorInvalidZip") || msg;
      }
      notify({ message: msg, variant: "error" });
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(/  const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1500\);\n  \};|  const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/, newHandleSubmit);

fs.writeFileSync(file, content);

// 4. Update locales
const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.selectZipFile'] = 'Vui lòng chọn gói game (.zip)';
vi['creator.uploadFailed'] = 'Tải lên thất bại';
vi['creator.errorNoIndexHtml'] = 'File ZIP không chứa file index.html ở thư mục gốc';
vi['creator.errorInvalidZip'] = 'Định dạng file ZIP không hợp lệ';

en['creator.selectZipFile'] = 'Please select a game package (.zip)';
en['creator.uploadFailed'] = 'Upload failed';
en['creator.errorNoIndexHtml'] = 'Zip file does not contain an index.html at the root';
en['creator.errorInvalidZip'] = 'Invalid zip file format';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done fixing upload popup and translation');
