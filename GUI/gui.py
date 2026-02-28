# Import thư viện đồ họa (ví dụ: tkinter)
import tkinter as tk

class MinesweeperGUI:
    def __init__(self, master, logic_engine):
        self.master = master
        self.logic = logic_engine # Nhận instance của class MinesweeperLogic
        
        # Từ điển lưu trữ các UI elements (nút bấm) theo tọa độ (r, c)
        self.buttons = {} 
        
        self._create_grid()

    def _create_grid(self):
        """
        (Hàm nội bộ) Đọc self.logic.rows và self.logic.cols để vẽ lưới các nút bấm.
        Gắn sự kiện click chuột trái vào hàm on_left_click.
        Gắn sự kiện click chuột phải vào hàm on_right_click.
        """
        pass # Todo: Dùng vòng lặp tạo lưới giao diện

    def on_left_click(self, r, c):
        """
        Bắt sự kiện click trái.
        1. Gọi self.logic.reveal_cell(r, c)
        2. Gọi self.logic.check_win_condition()
        3. Gọi self._sync_ui_with_logic() để cập nhật lại màn hình
        """
        pass # Todo: Gọi logic và cập nhật

    def on_right_click(self, r, c):
        """
        Bắt sự kiện click phải.
        1. Gọi self.logic.toggle_flag(r, c)
        2. Gọi self._sync_ui_with_logic()
        """
        pass # Todo: Gọi logic và cập nhật

    def _sync_ui_with_logic(self):
        """
        (Hàm nội bộ) Quét qua toàn bộ mảng self.logic.board.
        Nếu ô nào is_revealed = True -> Hiển thị số hoặc mìn lên nút bấm tương ứng.
        Nếu ô nào is_flagged = True -> Hiển thị icon lá cờ.
        Kiểm tra self.logic.game_over hoặc self.logic.win để hiện thông báo kết thúc.
        """
        pass # Todo: Đồng bộ hiển thị