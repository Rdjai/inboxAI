FROM us-docker.pkg.dev/afterqueryai/silver-repo-images/inboxai-mwtll:v1@sha256:53b3aab3f93a35dcf937d2b703ed4803c84d500e419c8bd4993ddedaea07d315
ENTRYPOINT []

WORKDIR "/app/inboxAI"

RUN set -e \
    && git reset --hard 4a0d04f6a67a515acb2a6918f1da6a7d95f47c6b \
    && git clean -fd \
    && git checkout 4a0d04f6a67a515acb2a6918f1da6a7d95f47c6b

RUN yarn install --frozen-lockfile

RUN cd /app/inboxAI/server \
    && npm install --no-save jest@29.7.0 --no-audit --no-fund

RUN mkdir -p /logs/verifier
