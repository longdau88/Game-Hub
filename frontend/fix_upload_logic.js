const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'games', 'new', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing states
const stateAddition = `  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);`;

content = content.replace(/  const \[selectedCategories, setSelectedCategories\] = useState<string\[\]>\(\[\]\);/, `  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);\n${stateAddition}`);

// 2. Update inputs in Step 1
content = content.replace(/<Input \n                    id="title" \n                    placeholder=/g, '<Input \n                    id="title" \n                    value={title}\n                    onChange={(e) => setTitle(e.target.value)}\n                    placeholder=');
content = content.replace(/<textarea \n                    id="description" \n                    rows=\{4\}/g, '<textarea \n                    id="description" \n                    value={description}\n                    onChange={(e) => setDescription(e.target.value)}\n                    rows={4}');
content = content.replace(/<Input id="tags" placeholder="cyberpunk, platformer, 2d" \/>/g, '<Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cyberpunk, platformer, 2d" />');

// 3. Update visibility toggle in Step 3
content = content.replace(/<div className="w-12 h-6 rounded-full bg-success relative cursor-pointer">/g, '<div onClick={() => setIsPublic(!isPublic)} className={`w-12 h-6 rounded-full relative cursor-pointer ${isPublic ? "bg-success" : "bg-muted"}`}>');
content = content.replace(/<div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" \/>/g, '<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? "right-1" : "left-1"}`} />');

// 4. Update handleSubmit
const newHandleSubmit = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      alert("Please select a game package (.zip)");
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
      alert(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(/  const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1500\);\n  \};/, newHandleSubmit);

fs.writeFileSync(file, content);
console.log('done updating upload logic');
