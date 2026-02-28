import random
from typing import Optional
from dataclass import dataclass
import logging

@dataclass
class Cell:
    is_mine: bool = False
    mine_count: int = 0
    is_revealed: bool = False
    is_flagged: bool = False
    def __init__(self, is_mine=False):
        self.is_mine = is_mine

class MineSweeper:
    rows: int = 8
    cols: int = 8
    num_mines: Optional[int] = 10
    first_click: bool = False
    board: list[list[Cell]] = []

    def __init__(self, rows: int, cols: int, num_mines = None) -> None:
        self.rows = rows
        self.cols = cols
        self.num_mines  = num_mines
        self.game_over = False
        self.win = False
        self.first_click = False
        if num_mines and (num_mines > rows * cols or num_mines < 0):
            raise ValueError("Invalid number of mines")
        elif num_mines is None:
            self.num_mines = (rows * cols) // 6
        else:
            logging.warning("The number of mines might not be generated correctly if it's too high compared to the board size.") 
        self.board = [[Cell() for _ in range(self.cols)] for _ in range(self.rows)]
    
    def _valid_position(self, r, c) -> bool:
        return 0 <= r < self.rows and 0 <= c < self.cols

    def _get_adjacents(self, r, c) -> list[tuple[int, int]]:
        DC = [-1, 0, 1]
        DR = [-1, 0, 1]
        adjacents = []
        for dr in DR:
            for dc in DC:
                nr, nc = r + dr, c + dc
                if self._valid_position(nr, nc) and (dr, dc) != (0, 0):
                    adjacents.append((nr, nc))
        return adjacents

    def _generate_board(self, exclude: list[tuple[int, int]]) -> None:
        assert(self.num_mines)

        cells = [i for i in range(self.rows * self.cols) if (i // self.cols, i % self.cols) not in exclude]
        positions = random.sample(cells, min(self.num_mines, len(cells)))
        for pos in positions:
            r, c = divmod(pos, self.cols)
            self.board[r][c].is_mine = True

        for i in range(self.rows):
            for j in range(self.cols):
                if not self.board[i][j].is_mine:
                    continue
                for (nr, nc) in self._get_adjacents(i, j):
                    if self.board[nr][nc].is_mine:
                        continue
                    self.board[nr][nc].mine_count += 1
        
        logging.info(f"Board generated with {len(positions)} mines, excluding {exclude}")

    def reveal_cell(self, r, c) -> bool:
        if not self._valid_position(r, c):
            raise ValueError("Invalid cell position")
        if self.game_over or self.board[r][c].is_flagged or self.board[r][c].is_revealed:
            return False
        if not self.first_click:
            self._generate_board(exclude=[(r, c)] + self._get_adjacents(r, c)) # first always 0 mines
            self.first_click = True
        if self.board[r][c].is_mine:
            self.game_over = True
        if self.board[r][c].mine_count == 0:
            self._open_blank_cell(r, c)
        self.board[r][c].is_revealed = True
        return True

    def _open_blank_cell(self, r, c) -> None:
        def dfs(r, c): 
            if self.board[r][c].is_revealed or self.board[r][c].is_flagged:
                return
            self.board[r][c].is_revealed = True
            if self.board[r][c].mine_count > 0:
                return
            for (nr, nc) in self._get_adjacents(r, c):
                dfs(nr, nc)
        dfs(r, c)


    def toggle_flag(self, r, c) -> bool:
        if self.game_over or self.board[r][c].is_revealed:
            return False
        self.board[r][c].is_flagged = not self.board[r][c].is_flagged
        return True

    def check_win_condition(self) -> bool:
        for i in range(self.rows):
            for j in range(self.cols):
                if not self.board[i][j].is_mine and not self.board[i][j].is_revealed:
                    return False
        self.win = True
        self.game_over = True
        return True

