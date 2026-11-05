# Локальний запуск Conduit

У корені проєкту має бути `.env`. Якщо файла ще немає, створіть його з прикладу:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Переконайтеся, що запущено Docker Desktop. Потім з кореня проєкту виконайте:

```powershell
npm install
npm run dev
```

`npm run dev` дочекається готовності MySQL та Elasticsearch/Kibana у Docker, запустить API та frontend і заповнить нову базу демонстраційними даними. Схема бази створюється backend автоматично.

Відкрийте `http://localhost:3000`. API доступний на `http://localhost:3001`. Кожна JSON-відповідь API містить `requestId`, а також UUID у заголовку `X-Request-Id`, щоб його було зручно копіювати під час дебагу.

Повторно додати відсутній демонстраційний контент: `npm run db:seed`. Зупинити MySQL і зберегти дані: `npm run db:down`. Дані зберігаються у Docker volume `conduit_conduit_mysql_data`.

Відкрийте Kibana за адресою `http://localhost:5601`. Під час `npm run dev` автоматично створюється data view **Conduit API logs** для `conduit-logs-*` з часовим полем `@timestamp`. У **Discover** кожен HTTP-запит представлений одним структурованим записом: метод, шлях і query, безпечний request/response body, статус, тривалість, request ID і список SQL-запитів з тривалістю. Для пошуку пов'язаних подій використовуйте KQL `http.request.id: "<UUID>"`; UUID є в заголовку `X-Request-Id` та JSON полі `requestId`. Паролі й токени маскуються, довгі payload-и скорочуються, а літеральні SQL рядки замінюються на `?`. Зміни через `POST`, `PUT`, `PATCH` і `DELETE` також зберігаються у таблиці `ApiAuditLogs` з ID цільового ресурсу, payload, часом, UUID, методом, шляхом і статусом. Elasticsearch доступний на `http://localhost:9200`. Для зупинки Elastic Stack виконайте `npm run observability:down`; його дані зберігаються у Docker volume `conduit_conduit_elasticsearch_data`.

`DEV_DB_LOGGING=true` позначає повільні SQL-запити полем `slow` у списку `db.queries` (поріг `DB_SLOW_QUERY_MS`, типовий 500 мс). Записи логуються одним JSON рядком у stdout і відправляються в Elasticsearch пакетами; якщо Elasticsearch тимчасово недоступний, API продовжує працювати.

## Демо-вхід

Пароль для всіх профілів: `ConduitDemo2026!`.

| Проєкт | Email |
| --- | --- |
| Grammarly | `grammarly@conduit.local` |
| GitLab | `gitlab@conduit.local` |
| MacPaw | `macpaw@conduit.local` |
| Readdle | `readdle@conduit.local` |
| Preply | `preply@conduit.local` |
| Ajax Systems | `ajax@conduit.local` |
| Uklon | `uklon@conduit.local` |
| Petcube | `petcube@conduit.local` |
| Helsi | `helsi@conduit.local` |
| monobank | `monobank@conduit.local` |

Це вигадані демо-профілі, а не офіційні акаунти компаній. Пароль призначений лише для локальної розробки.
