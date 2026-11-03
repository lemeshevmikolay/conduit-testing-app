# Виклики для запуску та наповнення Conduit

Дата: 2026-10-23
Каталог: `D:\core\conduit`

## Простий запуск зараз

Спершу створено MySQL контейнер і Docker volume:

```powershell
docker compose up -d db
```

Застосунок зараз запущено командою:

```powershell
npm run dev
```

Цей скрипт виконує `npm run db:up` (`docker compose up -d --wait db`), після healthcheck запускає API та frontend разом через `node scripts/dev.js`.

Перезапустити лише демо seed можна так:

```powershell
npm run db:seed
```

## Попередній запуск до MySQL

На початку перевірив порти, змінні середовища й Docker:

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 3000,3001,3306,5173 } | Select-Object LocalAddress,LocalPort,OwningProcess
docker ps
Get-ChildItem Env: | Where-Object { $_.Name -match '^(PORT|DEV_DB_|NODE_ENV|VITE_)' } | Sort-Object Name
Test-NetConnection 127.0.0.1 -Port 3306 -InformationLevel Quiet
```

MySQL на `127.0.0.1:3306` був недоступний, а `.env` порожній. Тимчасова спроба загального скрипту з SQLite не спрацювала через Windows `cmd` обробку лапок у старій команді `concurrently`:

```powershell
$env:DEV_DB_USERNAME=''; $env:DEV_DB_PASSWORD=''; $env:DEV_DB_NAME=':memory:'; $env:DEV_DB_HOSTNAME=''; $env:DEV_DB_DIALECT='sqlite'; $env:DEV_DB_LOGGING='false'; npm run dev
```

Окремий backend відкрив порт, але не міг створити таблиці: рядок `false` був переданий Sequelize як функція логування. Його було зупинено `Ctrl+C`:

```powershell
$env:DEV_DB_USERNAME=''; $env:DEV_DB_PASSWORD=''; $env:DEV_DB_NAME=':memory:'; $env:DEV_DB_HOSTNAME=''; $env:DEV_DB_DIALECT='sqlite'; $env:DEV_DB_LOGGING='false'; npm run dev -w backend
```

Перевірочний обхідний запуск локального backend та старого frontend:

```powershell
$env:DEV_DB_USERNAME=''; $env:DEV_DB_PASSWORD=''; $env:DEV_DB_NAME=':memory:'; $env:DEV_DB_HOSTNAME=''; $env:DEV_DB_DIALECT='sqlite'; $env:DEV_DB_LOGGING='false'; node -e "const c=require('./backend/config/config'); c.development.logging=false; require('./backend/index.js')"
npm run dev -w frontend
```

Ці процеси зупинено після підключення MySQL у Docker.

## Створена схема та перевірки

У MySQL створено сім таблиць: `Users`, `Articles`, `Comments`, `Tags`, `TagList`, `Favorites`, `Followers`. Є 50 статей, 10 демо-профілів, 67 коментарів, теги, підписки й обрані статті. Seed є повторно виконуваним і додає відсутній контент.

Під час перевірки виконував такі команди:

```powershell
node --check backend\index.js
node --check backend\config\config.js
node --check backend\controllers\articles.js
node --check backend\helper\helpers.js
node --check backend\seed\demo.js
node --check scripts\dev.js
npm run build -w frontend
Invoke-RestMethod 'http://localhost:3001/api/articles?limit=50'
Invoke-RestMethod 'http://localhost:3001/api/tags'
Invoke-RestMethod 'http://localhost:3001/api/articles/ukr-tech-01/comments'
```

Збірка frontend успішна; маршрути розділені на чанки, головний JS-чанк близько 281 КБ (gzip близько 95 КБ). API повертає 50 статей, дані демо-входу працюють, обрані Habr матеріали мають посилання на джерела.
