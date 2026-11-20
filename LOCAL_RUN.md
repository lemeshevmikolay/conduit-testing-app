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

Відкрийте `http://localhost:3000`. API доступний на `http://localhost:3001`. Кожна JSON-відповідь API містить `requestId` і `flowId`; відповідні UUID повертаються в `X-Request-Id` та `X-Flow-Id`.

Повторно додати відсутній демонстраційний контент: `npm run db:seed`. Зупинити MySQL і зберегти дані: `npm run db:down`. Дані зберігаються у Docker volume `conduit_conduit_mysql_data`.

Відкрийте Kibana за адресою `http://localhost:5601`. Під час `npm run dev` створюється data view **Conduit API logs** для `conduit-logs-v2-*`. Кожен документ має лише `@timestamp`, `message`, `application`, `flow_id` і `level`. Один flow має до п'яти головних подій: `FRONT REQUEST` → `BACK ACCEPTED` → одна агрегована `DB REQUEST` → одна агрегована `DB RESPONSE` → `BACK METHOD RESPONSE`. DB-повідомлення містять повний список SQL та відповідні результати. Trace-повідомлення містять повні headers, body та DB result без маскування й обрізання. Значення `application`: `front`, `back` або `db`. Знайдіть весь потік через KQL `flow_id: "<UUID>"`, а компонент фільтруйте через `application: front`, `application: back` чи `application: db`. У Discover сортуйте `@timestamp` за зростанням для читання потоку від запиту до відповіді. Старі індекси `conduit-logs-*` лишаються для історії; новий data view показує мінімалістичні документи. `X-Request-Id` і `X-Flow-Id` повертаються в HTTP-відповіді. Зміни через `POST`, `PUT`, `PATCH` і `DELETE` також зберігаються у таблиці `ApiAuditLogs`. Elasticsearch доступний на `http://localhost:9200`. Для зупинки Elastic Stack виконайте `npm run observability:down`; його дані зберігаються у Docker volume `conduit_conduit_elasticsearch_data`.

Trace-записи логуються одним JSON рядком у stdout і відправляються в Elasticsearch пакетами; якщо Elasticsearch тимчасово недоступний, API продовжує працювати.

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
