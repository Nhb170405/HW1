from logic import MinesweeperLogic
from GUI.gui import MinesweeperGUI
import tkinter as tk # hoặc thư viện đồ họa khác

if __name__ == "__main__":
    # Khởi tạo dữ liệu cốt lõi (ví dụ kích thước 9x9 với 10 mìn)
    game_logic = MinesweeperLogic(rows=9, cols=9, num_mines=10)
    
    # Khởi tạo cửa sổ
    root = tk.Tk()
    root.title("Minesweeper - DFS AI")
    
    # Nhúng logic vào GUI
    app = MinesweeperGUI(root, game_logic)
    
    # Vòng lặp chạy chương trình
    root.mainloop()