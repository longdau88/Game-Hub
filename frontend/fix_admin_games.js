const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');

let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
vi['admin.actions'] = 'Thao tác';
vi['admin.approve'] = 'Duyệt';
vi['admin.reject'] = 'Từ chối';
vi['admin.previewGame'] = 'Xem trước Game';
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
en['admin.actions'] = 'Actions';
en['admin.approve'] = 'Approve';
en['admin.reject'] = 'Reject';
en['admin.previewGame'] = 'Preview Game';
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

const pagePath = path.join('frontend', 'app', '(admin)', 'admin', 'games', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

const newPreviewButton = `                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                                onClick={() => window.open(\`/game/play?id=\${game.id}\`, '_blank')}
                                title={t("admin.previewGame") || "Preview Game"}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button `;

pageContent = pageContent.replace(
  '                              <Button \n                                variant="ghost" \n                                size="icon" \n                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"',
  newPreviewButton + '\n                                variant="ghost" \n                                size="icon" \n                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"'
);

fs.writeFileSync(pagePath, pageContent);
console.log('done fixing admin game list');
