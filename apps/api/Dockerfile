FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml /app/
RUN uv pip install -r <(uv pip compile pyproject.toml)
COPY app /app/app
ENV PORT=8000 HOST=0.0.0.0
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


