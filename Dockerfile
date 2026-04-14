# ─── Stage 1: Build React Frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build
# Output goes to /app/static (via vite.config.js outDir: '../static')

# ─── Stage 2: Python Backend ──────────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built React app into /app/static (served by FastAPI)
COPY --from=frontend-build /app/static ./static/

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
