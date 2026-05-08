#!/bin/bash

COMMITS=130
DAYS_BACK=160

echo "🔄 Starting real history creation..."

for i in $(seq 1 $COMMITS); do
    # Find any code/config file
    FILE=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.json" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) | shuf -n 1 2>/dev/null)

    if [ -z "$FILE" ]; then
        FILE="README.md"
        echo "Dummy change $i" >> "$FILE"
    else
        echo "// update $i - $(date)" >> "$FILE"
    fi

    git add "$FILE" 2>/dev/null

    # Random past date
    DAYS=$((RANDOM % DAYS_BACK))
    HOURS=$((RANDOM % 24))
    MINS=$((RANDOM % 60))
    PAST_DATE=$(date -d "$DAYS days ago $HOURS hours ago $MINS minutes ago" -u +"%Y-%m-%dT%H:%M:%S")

    GIT_COMMITTER_DATE="$PAST_DATE" git commit --date="$PAST_DATE" -m "minor update & improvements" --quiet

    echo "Commit $i/$COMMITS done"
    sleep 0.2
done

echo "✅ Done! Total commits should be around 130+ now"
