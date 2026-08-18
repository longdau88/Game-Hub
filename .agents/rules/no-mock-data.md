---
description: Do not use mock data for UI components. Always fetch real data from APIs unless explicitly asked to use mocks.
---

# Quy tắc sử dụng dữ liệu thật (No Mock Data)

Từ nay về sau, tuyệt đối không được hardcode dữ liệu ảo (mock data) ra ngoài giao diện. 

**Quy tắc:**
1. Luôn ưu tiên gọi API (ví dụ sử dụng các hàm như `fetchAPI` trong `lib/api`) để lấy dữ liệu thực tế từ Database để render UI.
2. Tuyệt đối không tự ý dùng các dữ liệu giả định, text giả (placeholder), hoặc ảnh giả (như từ Unsplash, Dicebear...) nếu không được người dùng yêu cầu rõ ràng.
3. Nếu chưa rõ cấu trúc API hoặc thiếu endpoint, hãy ưu tiên viết logic gọi API (có thể tạm thời bị lỗi hoặc trả về rỗng) thay vì hardcode một object giả vào thẳng trong file `.tsx`.
4. Nếu thực sự cần mock data theo yêu cầu của user, hãy báo cáo rõ ràng.
