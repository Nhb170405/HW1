"""
Minesweeper - AI Introduction Homework
Chạy server web và mở trình duyệt.
"""
from GUI.server import run_server

if __name__ == "__main__":
    print("Starting Minesweeper...")
    print("Press Ctrl+C to stop.")
    run_server(open_browser=True)