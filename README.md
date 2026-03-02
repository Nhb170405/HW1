# 💣 Minesweeper - Homework 1

> **Môn học:** Nhập môn Trí tuệ Nhân tạo (AI Introduction)  
> **Trường:** Đại học Bách khoa TP.HCM (HCMUT)

## 📋 Mô tả dự án

Dự án hiện thực trò chơi **Minesweeper (Dò mìn)** — một trò chơi logic kinh điển với mục tiêu mở tất cả các ô không chứa bom trên bàn chơi. Người chơi sử dụng các con số trên ô đã mở (cho biết số bom ở 8 ô lân cận) để suy luận vị trí an toàn.

### Luật chơi

- **Mở ô (Reveal):** Click chuột trái để mở ô. Nếu ô chứa số, đó là số bom trong 8 ô kề (ngang, dọc, chéo).
- **Cắm cờ (Flag):** Click chuột phải hoặc chọn chế độ Flag để đánh dấu ô nghi ngờ chứa bom.
- **Mở rộng tự động:** Khi mở ô có giá trị 0 (không có bom lân cận), tất cả các ô kề cũng tự động được mở theo thuật toán DFS.
- **Thắng:** Mở tất cả các ô không chứa bom.
- **Thua:** Mở trúng ô chứa bom.

### Chế độ chơi

| Chế độ       | Kích thước | Số bom |
|:-------------|:----------:|:------:|
| Dễ           | 5×5        | 5      |
| Trung bình   | 9×9        | 10     |
| Khó          | 12×12      | 20     |
| Siêu khó     | 20×20      | 60     |
| Tùy chỉnh    | 5×5 → 30×30 | Tự chọn (< ⌈n²/2⌉) |

---

## 🧠 Thuật toán và Logic

### Cấu trúc dữ liệu

Trò chơi sử dụng lưới 2 chiều (`board[rows][cols]`), mỗi ô là một đối tượng `Cell` gồm:

```python
@dataclass
class Cell:
    is_mine: bool       # Ô có phải bom không
    mine_count: int     # Số bom ở 8 ô lân cận
    is_revealed: bool   # Đã được mở chưa
    is_flagged: bool    # Đã cắm cờ chưa
```

### Thuật toán chính

#### 1. Tạo bàn chơi (`_generate_board`)

- **Khi nào:** Chỉ tạo khi người chơi click ô đầu tiên (lazy generation).
- **Cơ chế:** Loại trừ ô được click và 8 ô lân cận khỏi danh sách ô có thể đặt bom → đảm bảo lần click đầu luôn an toàn và mở ra vùng trống.
- **Sau khi đặt bom:** Duyệt toàn bộ lưới, đếm số bom lân cận cho mỗi ô (`mine_count`).

#### 2. Mở ô trống — DFS (Depth-First Search)

Khi người chơi mở một ô có `mine_count = 0`, thuật toán **DFS đệ quy** sẽ tự động mở tất cả ô kề:

```python
def _open_blank_cell(self, r, c):
    def dfs(r, c):
        if self.board[r][c].is_revealed or self.board[r][c].is_flagged:
            return
        self.board[r][c].is_revealed = True
        if self.board[r][c].mine_count > 0:
            return  # Dừng tại ô có số
        for (nr, nc) in self._get_adjacents(r, c):
            dfs(nr, nc)
    dfs(r, c)
```

- **Điều kiện dừng:** Ô đã mở, ô đã cắm cờ, hoặc ô có số > 0.
- **Độ phức tạp:** O(n²) trong trường hợp xấu nhất (toàn bộ bàn trống).

#### 3. Kiểm tra thắng (`check_win_condition`)

- Duyệt toàn bộ lưới, nếu tất cả ô không phải bom đều đã mở → thắng.
- Độ phức tạp: O(n²).

#### 4. Tìm ô lân cận (`_get_adjacents`)

- Trả về danh sách tối đa 8 ô kề hợp lệ (nằm trong lưới) của ô `(r, c)`.

---

## 🎨 Giao diện (GUI)

### Công nghệ sử dụng

- **HTML5** — Cấu trúc trang
- **CSS3** — Thiết kế giao diện, responsive, theme, animations
- **JavaScript (ES6+)** — Logic game phía client, tương tác UI
- **Python HTTP Server** — Serve static files và API endpoint

### Cấu trúc giao diện

Giao diện được tổ chức thành nhiều **màn hình (screens)**, chuyển đổi bằng JavaScript:

| Màn hình | Mô tả |
|:---------|:------|
| `screen-menu` | Menu chính — chọn chế độ chơi |
| `screen-custom` | Cấu hình chế độ tùy chỉnh (slider kích thước + số bom) |
| `screen-game` | Bàn chơi chính với grid, stats bar, toolbar |
| `screen-win` | Màn hình chiến thắng (điểm, thời gian, thống kê) |
| `screen-lose` | Màn hình thua (thời gian, số bom còn lại) |
| `screen-settings` | Cài đặt giao diện, âm thanh, rung |
| `screen-leaderboard` | Bảng xếp hạng thành tích |

### Tính năng giao diện

- **Responsive design:** Tự động scale phù hợp mọi kích thước màn hình (mobile, tablet, desktop).
- **Dark/Light mode:** Chuyển đổi giao diện sáng/tối, lưu preference vào localStorage.
- **Custom scrollbar:** Scrollbar bo tròn gradient xanh lá → xanh dương, phù hợp tone màu.
- **Kiểu bàn chơi:** Classic, Matrix, Wooden — thay đổi giao diện grid.
- **Kiểu bom:** 💣 Bomb, ⭐ Star, 💀 Skull.
- **Màu số:** Classic, Neon, Pastel.
- **Toast notifications:** Sử dụng Toastify.js cho thông báo nhẹ nhàng.
- **Web sidebar:** Desktop hiển thị sidebar với tools và stats bên cạnh bàn chơi.

### Auto-scale Grid

Kích thước ô tự động tính toán dựa trên viewport:

```javascript
const availW = maxW - gridPad;
const availH = maxH - gridPad;
let ts = Math.floor(Math.min(availW / game.cols, availH / game.rows) - gridGap);
ts = Math.max(12, Math.min(ts, 60)); // clamp 12px — 60px
```

---

## 🔌 API

### Server (`GUI/server.py`)

Python HTTP server chạy tại `http://127.0.0.1:8888`, phục vụ:

1. **Static files:** Serve `index.html`, `style.css`, `app.js`, `sound_effect/` từ thư mục `GUI/`.
2. **Scores API:** Quản lý thành tích người chơi qua `scores.json`.

### API Endpoints

| Method | Endpoint | Mô tả |
|:-------|:---------|:------|
| `GET` | `/api/scores` | Lấy toàn bộ thành tích |
| `POST` | `/api/scores` | Lưu/cập nhật thành tích (body: JSON) |
| `DELETE` | `/api/scores` | Xóa toàn bộ thành tích |
| `OPTIONS` | `/api/scores` | CORS preflight |

### Cấu trúc dữ liệu scores

```json
{
    "easy": {
        "recent": [
            { "score": 250, "time": 20 },
            { "score": 192, "time": 26 }
        ],
        "best": { "score": 250, "time": 20 }
    },
    "medium": { "recent": [], "best": null },
    "custom": { ... }
}
```

- **recent:** Tối đa 5 kết quả gần nhất (score, time).
- **best:** Thành tích tốt nhất (score cao nhất).
- **Tính điểm:** `score = max(100, round(1000 × numMines / elapsedSeconds))`

### Luồng gọi API (Frontend → Server)

```
[Người chơi thắng] → saveScoreToServer()
    → GET /api/scores (lấy scores hiện tại)
    → Cập nhật recent[] + best
    → POST /api/scores (gửi lại toàn bộ)

[Xem thành tích] → renderLeaderboard()
    → GET /api/scores → render HTML

[Xóa thành tích] → resetScores()
    → showConfirmModal() → DELETE /api/scores
```

---

## 🔊 Hiệu ứng âm thanh

### Công nghệ

Sử dụng **Web Audio API** với **pre-decoded AudioBuffer** cho latency gần 0ms:

```javascript
// Pre-load: fetch → decode → lưu buffer
fetch(url)
    .then(res => res.arrayBuffer())
    .then(buf => ctx.decodeAudioData(buf))
    .then(decoded => { sfxBuffers[key] = decoded; });

// Phát: tạo BufferSource → connect gain → start
const source = ctx.createBufferSource();
source.buffer = sfxBuffers[key];
source.connect(gainNode);
source.start(0); // Phát ngay lập tức
```

### Danh sách hiệu ứng

| File | Ngữ cảnh |
|:-----|:---------|
| `mixkit-game-ball-tap-2073.wav` | Mở ô thành công (ô số) |
| `mixkit-short-explosion-1694.wav` | Mở trúng bom |
| `mixkit-game-level-completed-2059.wav` | Chiến thắng |
| `mixkit-player-losing-or-failing-2042.wav` | Thua cuộc (phát sau explosion) |
| `mixkit-unlock-game-notification-253.wav` | Bật chế độ âm thanh/nhạc |

### Nhạc nền (Ambient Music)

Nhạc nền được tạo **procedurally** bằng Web Audio API — chuỗi hợp âm (chord progression) lặp lại:

```
C major → A minor → D minor → B dim → C major → F major → D minor → G major
```

### Điều khiển

- **Thanh trượt âm lượng SFX:** 0% — 100% (custom styled slider).
- **Thanh trượt âm lượng nhạc nền:** 0% — 100%.
- **Toggle bật/tắt** riêng biệt cho SFX và nhạc nền.
- **Rung (Vibration):** Pattern vibration `[100, 50, 200, 50, 300]ms` khi nổ bom (mobile).
- Tất cả settings được lưu vào `localStorage`.

---

## 📁 Cấu trúc thư mục

```
HW1/
├── main.py                  # Entry point — khởi chạy server
├── logic.py                 # Logic game (Python, tham khảo)
├── README.md                # Tài liệu dự án
├── GUI/
│   ├── server.py            # HTTP server + Scores API
│   ├── index.html           # Giao diện HTML chính
│   ├── style.css            # Styles, themes, responsive, animations
│   ├── app.js               # Game logic (JS), UI, sound, music
│   ├── scores.json          # Dữ liệu thành tích
│   ├── gui.py               # GUI Tkinter (phiên bản cũ, không sử dụng)
│   └── sound_effect/        # Hiệu ứng âm thanh (.wav)
│       ├── mixkit-game-ball-tap-2073.wav
│       ├── mixkit-short-explosion-1694.wav
│       ├── mixkit-game-level-completed-2059.wav
│       ├── mixkit-player-losing-or-failing-2042.wav
│       └── mixkit-unlock-game-notification-253.wav
```

---

## 🚀 Hướng dẫn chạy

### Yêu cầu

- **Python 3.8+** (không cần cài thêm thư viện bên ngoài)
- **Trình duyệt web** (Chrome, Edge, Firefox, Safari)

### Cách chạy

```bash
# 1. Di chuyển đến thư mục dự án
cd HW1

# 2. Chạy chương trình
python main.py
```

Server sẽ tự động:
- Khởi chạy tại `http://127.0.0.1:8888`
- Mở trình duyệt web đến trang game

### Dừng chương trình

Nhấn `Ctrl + C` trong terminal để dừng server.

---

## 🛠️ Thư viện & Dependencies

### Backend (Python)
- `http.server` — HTTP server (built-in)
- `json` — Xử lý JSON (built-in)
- `webbrowser` — Mở trình duyệt (built-in)
- `threading` — Timer mở trình duyệt (built-in)

### Frontend (CDN)
- **Google Fonts:** Nunito, Inter, Roboto Mono
- **Material Icons Round:** Icon hệ thống
- **Toastify.js:** Toast notifications
