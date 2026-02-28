import random

class MinesweeperLogic:
    def __init__(self, rows, cols, num_mines):
        self.rows = rows
        self.cols = cols
        self.num_mines = num_mines
        self.game_over = False
        self.win = False
        
        # Mảng 2D lưu trữ trạng thái của từng ô
        # Mỗi ô có thể là một dictionary: {"is_mine": False, "adjacent": 0, "is_revealed": False, "is_flagged": False}
        self.board = self._generate_board()

    def _generate_board(self):
        """
        (Hàm nội bộ) Khởi tạo mảng 2D, đặt mìn ngẫu nhiên và tính số mìn lân cận cho mỗi ô.
        """
        pass # Todo: Khởi tạo mảng và rải mìn

    def reveal_cell(self, r, c):
        """
        Xử lý khi người chơi mở một ô[cite: 27].
        - Nếu ô đã cắm cờ hoặc đã mở: Không làm gì cả.
        - Nếu trúng mìn: Đổi self.game_over = True[cite: 30].
        - Nếu là ô số (>0): Đổi is_revealed = True.
        - Nếu là ô trống (0): Gọi self._dfs_flood_fill(r, c) để loang ra.
        """
        pass # Todo: Thực thi logic mở ô

    def _dfs_flood_fill(self, r, c):
        """
        (Hàm nội bộ) Thuật toán DFS bắt buộc của đồ án.
        Đệ quy duyệt qua các ô lân cận để tự động mở các vùng trống liên tiếp.
        Dừng lại khi chạm viền bàn cờ hoặc chạm vào ô có số.
        """
        pass # Todo: Cài đặt thuật toán DFS

    def toggle_flag(self, r, c):
        """
        Xử lý việc cắm cờ/rút cờ để đánh dấu mìn[cite: 28].
        """
        pass # Todo: Đảo ngược trạng thái is_flagged của ô (r, c)

    def check_win_condition(self):
        """
        Kiểm tra xem tất cả các ô không chứa mìn đã được mở hết chưa[cite: 29].
        Nếu rồi -> Đổi self.win = True.
        """
        pass # Todo: Quét mảng kiểm tra điều kiện thắng