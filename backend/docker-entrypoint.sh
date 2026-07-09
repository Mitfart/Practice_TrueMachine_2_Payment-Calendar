#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
  export APP_KEY="$(php artisan key:generate --show --no-ansi)"
fi

php artisan migrate --force
exec php artisan serve --host=0.0.0.0 --port=8000
