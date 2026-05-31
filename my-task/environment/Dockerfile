FROM test-processmail

ENTRYPOINT []

WORKDIR /app/inboxAI

RUN mkdir -p /logs/verifier && \
    echo 0 > /logs/verifier/reward.txt && \
    chmod -R 0777 /logs

RUN git config --global user.email "expert@afterquery.com" && \
    git config --global user.name "Expert" && \
    git config --global --add safe.directory /app/inboxAI
