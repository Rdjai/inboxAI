FROM node:22.17.1-bookworm-slim

WORKDIR /workspace

COPY . .

WORKDIR /workspace/server
RUN npm ci --ignore-scripts

WORKDIR /workspace
ENV NODE_ENV=test

CMD ["bash", "my-task/tests/test.sh"]
