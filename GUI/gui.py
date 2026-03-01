# Import thư viện đồ họa (ví dụ: tkinter)
import tkinter as tk
from tkinter import messagebox
from functools import partial

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
        self.frame = tk.Frame(self.master)
        self.frame.pack(padx=8, pady=8)

        for r in range(self.logic.rows):
            for c in range(self.logic.cols):
                btn = tk.Button(self.frame, width=3, height=1, text=' ', relief=tk.RAISED)
                btn.config(command=partial(self.on_left_click, r, c))
                # Right click
                btn.bind('<Button-3>', lambda e, rr=r, cc=c: self.on_right_click(rr, cc))
                btn.grid(row=r, column=c)
                self.buttons[(r, c)] = btn

        # Track whether we've already shown end-game dialog to avoid repeats
        self._notified_game_end = False
        self._sync_ui_with_logic()

    def on_left_click(self, r, c):
        """
        Bắt sự kiện click trái.
        1. Gọi self.logic.reveal_cell(r, c)
        2. Gọi self.logic.check_win_condition()
        3. Gọi self._sync_ui_with_logic() để cập nhật lại màn hình
        """
        try:
            changed = self.logic.reveal_cell(r, c)
        except Exception:
            changed = False
        # check win
        try:
            self.logic.check_win_condition()
        except Exception:
            pass
        if changed:
            self._sync_ui_with_logic()

    def on_right_click(self, r, c):
        """
        Bắt sự kiện click phải.
        1. Gọi self.logic.toggle_flag(r, c)
        2. Gọi self._sync_ui_with_logic()
        """
        try:
            toggled = self.logic.toggle_flag(r, c)
        except Exception:
            toggled = False
        if toggled:
            self._sync_ui_with_logic()

    def _sync_ui_with_logic(self):
        """
        (Hàm nội bộ) Quét qua toàn bộ mảng self.logic.board.
        Nếu ô nào is_revealed = True -> Hiển thị số hoặc mìn lên nút bấm tương ứng.
        Nếu ô nào is_flagged = True -> Hiển thị icon lá cờ.
        Kiểm tra self.logic.game_over hoặc self.logic.win để hiện thông báo kết thúc.
        """
        # mapping for number colors (optional)
        num_colors = {
            1: 'blue', 2: 'green', 3: 'red', 4: 'darkblue', 5: 'brown', 6: 'cyan', 7: 'black', 8: 'grey'
        }

        for r in range(self.logic.rows):
            for c in range(self.logic.cols):
                cell = self.logic.board[r][c]
                btn = self.buttons.get((r, c))
                if not btn:
                    continue

                if cell.is_revealed:
                    btn.config(state=tk.DISABLED, relief=tk.SUNKEN, bg='#d9d9d9')
                    if cell.is_mine:
                        btn.config(text='💣', disabledforeground='black', bg='salmon')
                    else:
                        if cell.mine_count > 0:
                            color = num_colors.get(cell.mine_count, 'black')
                            btn.config(text=str(cell.mine_count), disabledforeground=color)
                        else:
                            btn.config(text='')
                else:
                    btn.config(state=tk.NORMAL, relief=tk.RAISED, bg='SystemButtonFace')
                    if cell.is_flagged:
                        btn.config(text='🚩', fg='red')
                    else:
                        btn.config(text='')

        # end-game notifications
        if getattr(self.logic, 'win', False) and not getattr(self, '_notified_game_end', False):
            self._notified_game_end = True
            messagebox.showinfo("You win!", "Chúc mừng — bạn đã thắng!")
        elif getattr(self.logic, 'game_over', False) and not getattr(self, '_notified_game_end', False):
            self._notified_game_end = True
            messagebox.showinfo("Game Over", "Bạn đã dẫm phải mìn — trò chơi kết thúc.")