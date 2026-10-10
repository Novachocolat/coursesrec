FROM python:3.12-slim

WORKDIR /srv
RUN pip install --no-cache-dir faster-whisper==1.2.1 fastapi==0.115.6 "uvicorn[standard]==0.34.0" python-multipart==0.0.20 requests "av==15.1.0"

COPY server.py .
ENV HF_HOME=/models
EXPOSE 9000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "9000"]
