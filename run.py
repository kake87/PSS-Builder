"""
Точка входа для запуска приложения из корневой папки
"""
import sys
sys.path.insert(0, 'backend')

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
