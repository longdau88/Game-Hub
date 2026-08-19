const fs = require('fs');

const updateLocale = (file, newKeys) => {
  const content = fs.readFileSync(file, 'utf-8');
  const data = JSON.parse(content);
  Object.assign(data, newKeys);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
};

const enKeys = {
  "friends.requests": "Friend Requests",
  "friends.followers": "Followers",
  "friends.accept": "Accept",
  "friends.reject": "Reject",
  "friends.noRequests": "You don't have any pending friend requests.",
  "friends.noFollowers": "You don't have any followers yet.",
  "friends.acceptSuccess": "Friend request accepted.",
  "friends.rejectSuccess": "Friend request rejected."
};

const viKeys = {
  "friends.requests": "Lời mời kết bạn",
  "friends.followers": "Người theo dõi",
  "friends.accept": "Chấp nhận",
  "friends.reject": "Từ chối",
  "friends.noRequests": "Bạn không có lời mời kết bạn nào.",
  "friends.noFollowers": "Bạn chưa có người theo dõi nào.",
  "friends.acceptSuccess": "Đã chấp nhận lời mời kết bạn.",
  "friends.rejectSuccess": "Đã từ chối lời mời kết bạn."
};

updateLocale('frontend/locales/en.json', enKeys);
updateLocale('frontend/locales/vi.json', viKeys);

console.log('Locales updated!');
