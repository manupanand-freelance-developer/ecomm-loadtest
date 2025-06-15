# # Use official ARM64-compatible k6 image
# FROM grafana/k6:master-with-browser

# # Install optional tools (curl, xz) and Node.js for scripting if needed
# RUN apt-get update && \
#     apt-get install -y curl xz-utils && \
#     curl -LO https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-arm64.tar.xz && \
#     tar -xJf node-v22.16.0-linux-arm64.tar.xz -C /opt && \
#     rm node-v22.16.0-linux-arm64.tar.xz && \
#     mv /opt/node-v22.16.0-linux-arm64 /opt/node

# # Set PATH for Node.js
# ENV PATH="/opt/node/bin:$PATH"

# # Set working directory
# WORKDIR /app

# # Copy your test and runner script
# COPY index.js run.sh ./

# # Optional: Copy and install dependencies if you use Node.js (package.json)
# COPY package.json ./
# RUN [ -f package.json ] && npm install || echo "No package.json, skipping npm install"

# # Make runner executable
# RUN chmod +x run.sh

# # Set default entrypoint
# ENTRYPOINT ["bash", "./run.sh"]
# ---------- Stage 1: Node.js + tools ----------
FROM debian:bullseye-slim AS builder

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl xz-utils  && \
    curl -LO https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-arm64.tar.xz && \
    tar -xJf node-v22.16.0-linux-arm64.tar.xz -C /opt && \
    rm node-v22.16.0-linux-arm64.tar.xz && \
    mv /opt/node-v22.16.0-linux-arm64 /opt/node
RUN  apt-get install -y bash
ENV PATH="/opt/node/bin:$PATH"

WORKDIR /app

# Copy files and install dependencies if needed
COPY package.json ./
RUN [ -f package.json ] && npm install || echo "No package.json"

COPY index.js run.sh ./
RUN chmod +x run.sh

# ---------- Stage 2: Final Runtime Layer ----------
FROM grafana/k6:master-with-browser

# Copy Node.js from builder stage
COPY --from=builder /opt/node /opt/node
ENV PATH="/opt/node/bin:$PATH"

# Copy app files
COPY --from=builder /app /app
WORKDIR /app

# Set entrypoint
ENTRYPOINT ["bash", "./run.sh"]

