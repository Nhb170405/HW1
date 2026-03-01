# Import thư viện đồ họa (ví dụ: tkinter)
import tkinter as tk
from functools import partial
from logic import MinesweeperLogic

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
        # Top bar with status + restart
        if hasattr(self, 'top_bar') and self.top_bar:
            self.top_bar.destroy()
        self.top_bar = tk.Frame(self.master)
        self.top_bar.pack(padx=8, pady=(8, 2), fill='x')

        self.status_label = tk.Label(self.top_bar, text='Playing', anchor='w')
        self.status_label.pack(side='left')

        # Restart button with icon
        restart_icon = '🔁'
        self.restart_btn = tk.Button(self.top_bar, text=restart_icon, command=self.restart, width=3)
        self.restart_btn.pack(side='right')

        # Grid frame
        if hasattr(self, 'frame') and self.frame:
            self.frame.destroy()
        self.frame = tk.Frame(self.master)
        self.frame.pack(padx=8, pady=8)

        # store initial params for restart
        self._init_rows = self.logic.rows
        self._init_cols = self.logic.cols
        self._init_mines = getattr(self.logic, 'num_mines', None)

        for r in range(self.logic.rows):
            for c in range(self.logic.cols):
                btn = tk.Button(self.frame, width=3, height=1, text=' ', relief=tk.RAISED)
                btn.config(command=partial(self.on_left_click, r, c))
                # Right click
                btn.bind('<Button-3>', lambda e, rr=r, cc=c: self.on_right_click(rr, cc))
                btn.grid(row=r, column=c)
                self.buttons[(r, c)] = btn

        # Track whether we've already shown end-game state on UI
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

    def restart(self):
        """Restart the game: recreate logic and UI."""
        # recreate logic instance with same params
        try:
            self.logic = MinesweeperLogic(rows=self._init_rows, cols=self._init_cols, num_mines=self._init_mines)
        except Exception:
            # fallback: attempt to call __init__ on existing instance
            try:
                self.logic.__init__(self._init_rows, self._init_cols, self._init_mines)
            except Exception:
                pass

        # reset buttons dict and recreate grid
        for b in list(self.buttons.values()):
            try:
                b.destroy()
            except Exception:
                pass
        self.buttons.clear()
        self._notified_game_end = False
        self._create_grid()

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

        # end-game notifications shown on status label
        if getattr(self.logic, 'win', False) and not getattr(self, '_notified_game_end', False):
            self._notified_game_end = True
            # update status label
            if hasattr(self, 'status_label'):
                self.status_label.config(text='Bạn đã thắng! 🎉', fg='green')
        elif getattr(self.logic, 'game_over', False) and not getattr(self, '_notified_game_end', False):
            self._notified_game_end = True
            if hasattr(self, 'status_label'):
                self.status_label.config(text='Bạn thua 💥', fg='red')