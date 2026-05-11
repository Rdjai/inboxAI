FROM us-docker.pkg.dev/afterqueryai/silver-repo-images/inboxai-txffi:v1@sha256:155705a8c713eaf3caf526807981ecafd55e0c328874625b259f2707fa6c4586

WORKDIR /workspace

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*

COPY . .

WORKDIR /workspace/server
RUN npm ci --ignore-scripts

WORKDIR /workspace
ENV NODE_ENV=test

CMD ["sh", "my-task/tests/test.sh"]
