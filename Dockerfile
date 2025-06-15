# Use official ARM64-compatible k6 image
FROM grafana/k6:master-with-browser

# Install optional tools (curl, xz) and Node.js for scripting if needed
RUN apt-get update && \
    apt-get install -y curl xz-utils && \
    curl -LO https://nodejs.org/dist/v22.16.0/node-v22.16.0-linux-arm64.tar.xz && \
    tar -xJf node-v22.16.0-linux-arm64.tar.xz -C /opt && \
    rm node-v22.16.0-linux-arm64.tar.xz && \
    mv /opt/node-v22.16.0-linux-arm64 /opt/node

# Set PATH for Node.js
ENV PATH="/opt/node/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy your test and runner script
COPY index.js run.sh ./

# Optional: Copy and install dependencies if you use Node.js (package.json)
COPY package.json ./
RUN [ -f package.json ] && npm install || echo "No package.json, skipping npm install"

# Make runner executable
RUN chmod +x run.sh

# Set default entrypoint
ENTRYPOINT ["bash", "./run.sh"]
