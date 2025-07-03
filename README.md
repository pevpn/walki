
# Walkie-Talkie Web App (PHP + SQLite)

## Requirements
- PHP 8.1+ with SQLite and sockets extensions
- Composer

## Setup

```bash
cd backend
composer install
sqlite3 db/database.sqlite < db/init.sql
php -S localhost:4000 -t .
```

Use Postman or frontend app to test `/api/register.php`, `/api/login.php`, etc.
