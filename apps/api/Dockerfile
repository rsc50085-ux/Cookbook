FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml /app/
# Pre-compile requirements to a file (avoid bash process substitution)
RUN uv pip compile pyproject.toml -o requirements.txt
RUN uv pip sync requirements.txt
COPY app /app/app
ENV PORT=8000 HOST=0.0.0.0
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


