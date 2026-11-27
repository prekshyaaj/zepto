import os
import sys
from pathlib import Path

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
import uvicorn

load_dotenv(PROJECT_ROOT / ".env")


if __name__ == "__main__":
    is_deploy = "PORT" in os.environ
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0" if is_deploy else "127.0.0.1",
        port=int(os.getenv("PORT", "8000")),
        reload=not is_deploy,
        reload_dirs=[str(PROJECT_ROOT / "backend")] if not is_deploy else None,
    )
