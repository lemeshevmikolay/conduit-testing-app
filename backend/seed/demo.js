const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { Op } = require("sequelize");
const { bcryptHash } = require("../helper/bcrypt");
const { User, Article, Tag, Comment } = require("../models");
const testingContent = require("./testingContent");

const authors = [
  { username: "Grammarly", email: "grammarly@conduit.local", name: "Grammarly", initials: "G", colors: ["#15a889", "#087c74"], bio: "Демо-профіль, натхненний Grammarly. Теми: мовні технології, доступність і продукти на основі ШІ." },
  { username: "GitLab", email: "gitlab@conduit.local", name: "GitLab", initials: "GL", colors: ["#fc6d26", "#e24329"], bio: "Демо-профіль, натхненний GitLab. Теми: DevSecOps, open source і розподілена розробка." },
  { username: "MacPaw", email: "macpaw@conduit.local", name: "MacPaw", initials: "MP", colors: ["#6e68d9", "#3c52b8"], bio: "Демо-профіль, натхненний MacPaw. Теми: продуктова розробка, приватність і досвід користувачів." },
  { username: "Readdle", email: "readdle@conduit.local", name: "Readdle", initials: "R", colors: ["#3478f6", "#1856c9"], bio: "Демо-профіль, натхненний Readdle. Теми: мобільні застосунки, синхронізація й інструменти для роботи." },
  { username: "Preply", email: "preply@conduit.local", name: "Preply", initials: "P", colors: ["#7354eb", "#4b35c9"], bio: "Демо-профіль, натхненний Preply. Теми: освітні продукти, маркетплейси й персоналізоване навчання." },
  { username: "AjaxSystems", email: "ajax@conduit.local", name: "Ajax Systems", initials: "A", colors: ["#303741", "#15191f"], bio: "Демо-профіль, натхненний Ajax Systems. Теми: надійні пристрої, embedded-розробка й кібербезпека." },
  { username: "Uklon", email: "uklon@conduit.local", name: "Uklon", initials: "U", colors: ["#f7cc32", "#f28b24"], bio: "Демо-профіль, натхненний Uklon. Теми: геопродукти, платформи реального часу й інженерія мобільності." },
  { username: "Petcube", email: "petcube@conduit.local", name: "Petcube", initials: "PC", colors: ["#e86072", "#ba355a"], bio: "Демо-профіль, натхненний Petcube. Теми: IoT, відео та пристрої." },
  { username: "Helsi", email: "helsi@conduit.local", name: "Helsi", initials: "H", colors: ["#21a9a2", "#137d8b"], bio: "Демо-профіль, натхненний Helsi. Теми: цифрова медицина, приватність і доступність сервісів." },
  { username: "monobank", email: "monobank@conduit.local", name: "monobank", initials: "m", colors: ["#292a30", "#101114"], bio: "Демо-профіль, натхненний monobank. Теми: фінтех, платіжні системи й цифрові сервіси." },
];

const articles = [
  ["Anthropic прибрала параметри sampling із нової версії Claude API", "Зміна версії API може непомітно зламати інтеграції, які покладаються на temperature та top_p. Перед міграцією варто перевірити SDK, зафіксувати версію API й прогнати репрезентативні запити.", "ai api integration", "https://habr.com/ru/companies/bothub/news/1098574/"],
  ["Чому фінансові сервіси обмежують самостійність ШІ-агентів", "Агенти, що мають доступ до рахунків, можуть виконувати дії поза очікуваннями власника. У фінансових сценаріях потрібні вузькі дозволи, підтвердження критичних операцій і зрозумілий журнал дій.", "ai security fintech", "https://habr.com/ru/news/1098690/"],
  ["Безпечне оновлення залежностей після інцидентів у пакетних реєстрах", "Поточні зміни в менеджерах пакетів нагадують: перевірка залежностей має бути частиною релізу. Lock-файли, provenance, ізоляція build-скриптів і відкладене оновлення знижують ризик ланцюга постачання.", "security npm supply-chain", "https://habr.com/ru/news/1098556/"],
  ["Відновлення хмарного сервісу: як вимірювати готовність до аварії", "Історія відновлення великого хмарного середовища показує, що резервна копія сама по собі не гарантує доступність. Командам потрібні перевірені сценарії відновлення, узгоджені RTO та RPO й комунікація зі споживачами.", "cloud reliability sre", "https://habr.com/ru/news/1098646/"],
  ["Відкритий моноширинний шрифт як інструмент доступності для розробників", "Нові шрифти для коду дають нагоду переоцінити читабельність терміналів і редакторів. Лігатури, кирилиця, розрізнення схожих символів та ліцензія мають значення для реального робочого середовища.", "open-source developer-tools accessibility", "https://habr.com/ru/news/1097280/"],
  ["Чому щільніша DRAM-комірка не завжди означає кращу пам’ять", "Фізичне масштабування напівпровідників впирається у виробничі обмеження. Рішення про архітектуру варто оцінювати за виходом придатних кристалів, енергоспоживанням і вартістю, а не лише за теоретичною щільністю.", "hardware semiconductors research", "https://habr.com/ru/companies/selectel/news/1098474/"],
  ["Disaster recovery для аналітичних баз даних: план без магії", "План аварійного відновлення має описувати не лише резервування, а й послідовність повернення сервісів, перевірку цілісності та розподіл ролей. Регулярне навчання команди знаходить прогалини до реального інциденту.", "database postgres reliability", "https://habr.com/ru/companies/greengage/news/1098580/"],
  ["Інструменти для програмування мають коректно працювати з мовами команди", "Вибір шрифту, термінала та редактора впливає на читабельність коду. Підтримка української кирилиці, однакових гліфів у різних середовищах і відкритої ліцензії спрощує спільну конфігурацію команди.", "open-source developer-tools", "https://habr.com/ru/news/1097280/"],
  ["Як підготувати npm-проєкт до компрометації залежності", "Захист починається з найменших привілеїв у CI. Не запускайте сторонні install-скрипти без потреби, скануйте зміни lock-файлу й зберігайте секрети поза процесом збірки.", "security npm devops", "https://habr.com/ru/news/1098556/"],
  ["Межі дозволів для ШІ-агента: від читання до незворотної дії", "Агент має отримувати рівно ті інструменти, які потрібні для задачі. Доступ до читання не повинен автоматично давати право на переказ, видалення чи публікацію.", "ai security product", "https://habr.com/ru/news/1098690/"],
  ["План міграції API, який не ламає клієнтів", "Перед зміною контракту зафіксуйте підтримувані версії, перевірте реальні запити в логах і випустіть сумісний перехідний шар. Метрики помилок після релізу допомагають знайти клієнтів, яких не покрили тести.", "api architecture testing", "https://habr.com/ru/search/?q=API%20%D0%BC%D0%B8%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D1%8F&target_type=posts"],
  ["Практичний чекліст для запуску функції на базі генеративного ШІ", "Спочатку визначте, де модель може помилятися і як це помітить користувач. Додайте оцінювання якості, контроль персональних даних, обмеження витрат та зрозумілий шлях до людської перевірки.", "ai product privacy", "https://habr.com/ru/search/?q=LLM%20%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%BA%D1%82&target_type=posts"],
  ["Реліз без простою: сумісність схеми бази між двома версіями застосунку", "Розділіть зміну таблиць на розширення та прибирання. Спершу додайте нове поле, навчіть код читати обидва формати, перенесіть дані, а застарілу схему видаляйте окремим релізом.", "database migrations reliability", "https://habr.com/ru/search/?q=%D0%BC%D0%B8%D0%B3%D1%80%D0%B0%D1%86%D0%B8%D0%B8%20%D0%B1%D0%B0%D0%B7%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85&target_type=posts"],
  ["Як зменшити кількість запитів у стрічці статей", "Пагінація не допомагає, якщо для кожного запису окремо завантажувати автора, теги й реакції. Пакетні агрегати та попереднє завантаження пов’язаних сутностей тримають кількість запитів сталою.", "sql performance api", "https://habr.com/ru/search/?q=SQL%20N%2B1&target_type=posts"],
  ["Кешування з перевіркою свіжості для часто читаних API", "Кеш корисний, коли команда знає, як його інвалідовувати. Визначте строк життя, ключі за параметрами запиту, поведінку після помилки й метрики hit ratio до того, як додавати ще один шар.", "cache backend performance", "https://habr.com/ru/search/?q=%D0%BA%D1%8D%D1%88%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20API&target_type=posts"],
  ["Що логувати, щоб відновити послідовність подій під час інциденту", "Корисний журнал містить кореляційний ідентифікатор, часову мітку та дію без зайвих персональних даних. Структуровані події легше зіставляти між сервісами й використовувати для розбору інциденту.", "observability security backend", "https://habr.com/ru/search/?q=observability%20%D0%BB%D0%BE%D0%B3%D0%B8&target_type=posts"],
  ["Пошукова видача, яка враховує мову та намір користувача", "Для багатомовного пошуку важливо нормалізувати запит, підтримувати форми слів і не змішувати мови без потреби. Перевіряйте якість на реальних запитах українською, включно з помилками введення.", "search localization product", "https://habr.com/ru/search/?q=%D0%BF%D0%BE%D0%B8%D1%81%D0%BA%20%D0%BB%D0%BE%D0%BA%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F&target_type=posts"],
  ["Стабільні ключі ідемпотентності для повторних платежів", "Клієнт може повторити запит після таймауту, навіть якщо перша операція вже завершилась. Ключ ідемпотентності та унікальне обмеження перетворюють повтор на безпечне повернення результату.", "payments api reliability", "https://habr.com/ru/search/?q=%D0%B8%D0%B4%D0%B5%D0%BC%D0%BF%D0%BE%D1%82%D0%B5%D0%BD%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%BF%D0%BB%D0%B0%D1%82%D0%B5%D0%B6%D0%B8&target_type=posts"],
  ["Вимірюємо затримку застосунку з погляду користувача", "Середня швидкість приховує повільний хвіст. Відстежуйте перцентилі, окремо вимірюйте мережу й сервер, а бюджет затримки розподіляйте між критичними ділянками сценарію.", "performance frontend sre", "https://habr.com/ru/search/?q=Web%20Vitals%20%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D0%BE%D1%81%D1%82%D1%8C&target_type=posts"],
  ["Коли моноліт прискорює продуктову команду", "На ранній стадії один процес може бути простішим у розгортанні та налагодженні. Відокремлюйте компоненти тоді, коли з’являється вимірювана межа навантаження або незалежний цикл розробки.", "architecture backend product", "https://habr.com/ru/search/?q=%D0%BC%D0%BE%D0%BD%D0%BE%D0%BB%D0%B8%D1%82%20%D0%BC%D0%B8%D0%BA%D1%80%D0%BE%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81%D1%8B&target_type=posts"],
  ["Керування секретами у локальній розробці та CI", "Паролі не мають потрапляти до репозиторію, логів чи збірки frontend. Зберігайте локальні значення в ігнорованому .env, надавайте приклад без секретів і періодично змінюйте ключі.", "security devops secrets", "https://habr.com/ru/search/?q=%D1%81%D0%B5%D0%BA%D1%80%D0%B5%D1%82%D1%8B%20CI%20CD&target_type=posts"],
  ["Модель загроз для мобільного застосунку з біометричним входом", "Біометрія допомагає підтвердити дію на пристрої, але не замінює серверну авторизацію. Визначте захист токенів, повторну автентифікацію для ризикових операцій та дії після втрати пристрою.", "mobile security identity", "https://habr.com/ru/search/?q=%D0%B1%D0%B8%D0%BE%D0%BC%D0%B5%D1%82%D1%80%D0%B8%D1%8F%20%D0%BC%D0%BE%D0%B1%D0%B8%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F%20%D0%B1%D0%B5%D0%B7%D0%BE%D0%BF%D0%B0%D1%81%D0%BD%D0%BE%D1%81%D1%82%D1%8C&target_type=posts"],
  ["Надійні push-сповіщення без дублювання", "Доставка повідомлень може повторюватися або затримуватися. Зберігайте стан відправлення, використовуйте ключі дедуплікації та давайте користувачу керувати категоріями сповіщень.", "mobile messaging reliability", "https://habr.com/ru/search/?q=push%20%D1%83%D0%B2%D0%B5%D0%B4%D0%BE%D0%BC%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F%20%D0%B4%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BA%D0%B0&target_type=posts"],
  ["Захист персональних даних у продуктовій аналітиці", "Подія має відповідати на конкретне продуктове запитання. Не передавайте ідентифікатори й чутливі поля без потреби, документуйте строк зберігання та надайте командам контрольований доступ.", "privacy analytics security", "https://habr.com/ru/search/?q=%D0%BF%D0%B5%D1%80%D1%81%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D0%B5%20%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0&target_type=posts"],
  ["Доступність інтерфейсу починається з клавіатури", "Перевірте логічний порядок фокуса, видимий індикатор і коректні назви елементів для скринрідера. Ці зміни покращують користування сервісом і для людей, які не використовують мишу.", "accessibility frontend ux", "https://habr.com/ru/search/?q=web%20accessibility%20%D0%BA%D0%BB%D0%B0%D0%B2%D0%B8%D0%B0%D1%82%D1%83%D1%80%D0%B0&target_type=posts"],
  ["Перевірка контрасту та читабельності у темній темі", "Темна тема не означає просто інверсію кольорів. Перевірте контраст тексту, помітність помилок і поведінку графіків, а вибір теми збережіть між сесіями.", "accessibility design frontend", "https://habr.com/ru/search/?q=dark%20mode%20%D0%B4%D0%BE%D1%81%D1%82%D1%83%D0%BF%D0%BD%D0%BE%D1%81%D1%82%D1%8C&target_type=posts"],
  ["Як тестувати сценарії, що залежать від геолокації", "Реальні координати погано відтворюють граничні випадки. Створіть набір контрольованих точок, змоделюйте втрату сигналу й перевірте, як інтерфейс пояснює невизначеність.", "maps mobile testing", "https://habr.com/ru/search/?q=%D0%B3%D0%B5%D0%BE%D0%BB%D0%BE%D0%BA%D0%B0%D1%86%D0%B8%D1%8F%20%D1%82%D0%B5%D1%81%D1%82%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5&target_type=posts"],
  ["Оновлення IoT-пристрою, яке можна безпечно відкотити", "Підписаний пакет, перевірка сумісності та резервний образ допомагають пережити невдале оновлення. Спершу розгорніть прошивку на невеликій групі пристроїв і перевірте телеметрію.", "iot embedded security", "https://habr.com/ru/search/?q=OTA%20%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%20IoT&target_type=posts"],
  ["Збір телеметрії з пристроїв із нестабільним інтернетом", "Пристрій має буферизувати обмежений обсяг подій, позначати час вимірювання й відправляти дані повторно без дублікатів. Визначте, які дані можна втратити, а які треба зберегти.", "iot data reliability", "https://habr.com/ru/search/?q=IoT%20%D1%82%D0%B5%D0%BB%D0%B5%D0%BC%D0%B5%D1%82%D1%80%D0%B8%D1%8F&target_type=posts"],
  ["Надійна синхронізація офлайн-змін між кількома пристроями", "Офлайн режим потребує правил вирішення конфліктів і видимого статусу синхронізації. Виберіть модель даних, у якій повторне застосування операції безпечне.", "sync offline mobile", "https://habr.com/ru/search/?q=offline%20first%20%D1%81%D0%B8%D0%BD%D1%85%D1%80%D0%BE%D0%BD%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F&target_type=posts"],
  ["Відстеження помилки від кнопки до серверного логу", "Кореляційний ідентифікатор варто створити на межі запиту й передавати між сервісами. Він допомагає знайти потрібні логи, не записуючи повний запит користувача.", "observability tracing backend", "https://habr.com/ru/search/?q=distributed%20tracing%20%D0%BB%D0%BE%D0%B3%D0%B8&target_type=posts"],
  ["Черги задач: як вибрати повтори та dead-letter політику", "Повтор без затримки може збільшити перевантаження. Використовуйте обмежене число спроб із backoff, ідемпотентний обробник і чергу для задач, що потребують ручного розбору.", "queues backend reliability", "https://habr.com/ru/search/?q=message%20queue%20retry%20dead%20letter&target_type=posts"],
  ["Пошук регресій продуктивності у frontend-збірці", "Розмір bundle варто вимірювати в CI й порівнювати між релізами. Розділення маршрутів, видалення невикористаних залежностей та відкладене завантаження зменшують перший екран.", "frontend performance javascript", "https://habr.com/ru/search/?q=frontend%20bundle%20%D0%BE%D0%BF%D1%82%D0%B8%D0%BC%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F&target_type=posts"],
  ["План резервного копіювання, який команда справді перевіряє", "Визначте власника копій, частоту, шифрування та строк зберігання. Тестове відновлення в ізольованому середовищі показує, чи є знімок придатним для роботи.", "backup disaster-recovery database", "https://habr.com/ru/search/?q=backup%20restore%20%D0%B1%D0%B0%D0%B7%D0%B0%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85&target_type=posts"],
  ["Поступове розгортання змін за допомогою feature flags", "Прапорець дозволяє обмежити аудиторію нової функції, але з часом накопичує зайві гілки коду. Для кожного прапорця запишіть власника, умови вимкнення і дату видалення.", "release product devops", "https://habr.com/ru/search/?q=feature%20flags%20%D1%80%D0%B5%D0%BB%D0%B8%D0%B7&target_type=posts"],
  ["Перевірки якості даних перед запуском звіту", "Кількість рядків, null-частка та часові межі часто ловлять проблеми до користувача. Перетворіть очікування щодо даних на автоматичні перевірки поруч із pipeline.", "data engineering analytics", "https://habr.com/ru/search/?q=data%20quality%20%D0%BA%D0%BE%D0%BD%D1%82%D1%80%D0%BE%D0%BB%D1%8C%20%D0%B4%D0%B0%D0%BD%D0%BD%D1%8B%D1%85&target_type=posts"],
  ["Схема подій, яка не блокує еволюцію аналітики", "Версійована схема подій дозволяє змінювати продукт без непомітної зміни значення метрик. Не перейменовуйте поля без перехідного періоду та документуйте обов’язкові атрибути.", "analytics data architecture", "https://habr.com/ru/search/?q=event%20schema%20analytics&target_type=posts"],
  ["Як зменшити час холодного старту backend-сервісу", "Профілюйте час імпорту, підключення до бази й прогріву кешу окремо. Відкладене завантаження необов’язкових модулів і контроль повторних спроб пришвидшують готовність процесу.", "backend performance nodejs", "https://habr.com/ru/search/?q=node.js%20cold%20start%20backend&target_type=posts"],
  ["Валідація запитів на межі API: чіткі помилки замість збоїв", "Типи, довжини рядків і допустимі значення треба перевіряти до роботи з базою. Однакова структура помилок спрощує frontend і допомагає клієнтам виправити введення.", "api validation backend", "https://habr.com/ru/search/?q=REST%20API%20%D0%B2%D0%B0%D0%BB%D0%B8%D0%B4%D0%B0%D1%86%D0%B8%D1%8F&target_type=posts"],
  ["Як не перевантажити базу під час підрахунку реакцій", "Підрахунок лічильників для кожного елемента окремим запитом має високу ціну. Агрегуйте дані для всієї сторінки й додайте індекси на зовнішні ключі таблиці зв’язку.", "database sql performance", "https://habr.com/ru/search/?q=SQL%20aggregate%20index%20performance&target_type=posts"],
  ["Керування сесіями після зміни пароля або втрати пристрою", "Користувачу потрібен спосіб завершити активні сесії. Визначте строк життя токена, процедуру відкликання й повторну перевірку перед особливо чутливими діями.", "authentication security sessions", "https://habr.com/ru/search/?q=session%20management%20authentication%20security&target_type=posts"],
  ["Захист webhook від повторного надсилання та підміни", "Перевіряйте підпис на початковому тілі запиту, відхиляйте прострочені мітки часу й зберігайте ідентифікатор події для дедуплікації. Обробник має швидко підтвердити прийом і працювати повторювано.", "webhooks security api", "https://habr.com/ru/search/?q=webhook%20signature%20security&target_type=posts"],
  ["Мультитенантна база без випадкового витоку між клієнтами", "Tenant ID має проходити через кожен запит до даних, а не додаватися лише у frontend. Перевірте доступ окремими тестовими клієнтами й додайте обмеження на рівні сервісного шару.", "database security multitenancy", "https://habr.com/ru/search/?q=multi-tenant%20database%20security&target_type=posts"],
  ["Зрозуміла локалізація дат, валют і помилок", "Локалізація охоплює формат, часовий пояс і зміст повідомлення. Зберігайте моменти часу в UTC, форматуйте їх для користувача й тестуйте переходи літнього часу.", "localization ux frontend", "https://habr.com/ru/search/?q=i18n%20localization%20timezone&target_type=posts"],
  ["Контроль вартості запитів до моделей у production", "Ліміти за користувачем і сценарієм захищають продукт від неочікуваних витрат. Вимірюйте затримку, кількість токенів і частку повторних запитів перед оптимізацією промптів.", "ai cost monitoring product", "https://habr.com/ru/search/?q=LLM%20cost%20monitoring&target_type=posts"],
  ["Людська перевірка там, де автоматизація може нашкодити", "Для високоризикових рішень визначте поріг упевненості й передавайте сумнівні випадки фахівцю. Інтерфейс має пояснювати, чому потрібне підтвердження і що буде після нього.", "ai safety ux product", "https://habr.com/ru/search/?q=human%20in%20the%20loop%20AI&target_type=posts"],
  ["Архівування подій без втрати історії користувача", "Після завершення строку активного зберігання дані можна переносити в дешевше сховище. Заздалегідь перевірте пошук за архівом, політики видалення і відновлення.", "storage data architecture", "https://habr.com/ru/search/?q=data%20archiving%20storage&target_type=posts"],
  ["Надійний імпорт даних із повторюваних CSV-файлів", "Імпорт має виявляти повтори, показувати помилки по рядках і фіксувати контрольну суму джерела. Попередній перегляд допомагає користувачу виправити дані до запису.", "data import csv product", "https://habr.com/ru/search/?q=CSV%20data%20import%20validation&target_type=posts"],
  ["Транзакції для змін, що зачіпають кілька таблиць", "Коли операція оновлює сутність і пов’язані записи, транзакція зберігає узгоджений стан. Визначте порядок блокувань і поведінку при повторі транзакції.", "database transactions backend", "https://habr.com/ru/search/?q=database%20transactions%20consistency&target_type=posts"],
  ["Тести контракту між frontend і backend без крихких макетів", "Перевірка формату реальної відповіді виявляє несумісні зміни ще до релізу. Тримайте контракт близько до API й тестуйте обов’язкові поля, статуси та помилки.", "testing api frontend", "https://habr.com/ru/search/?q=API%20contract%20testing&target_type=posts"],
  ["Підготовка до пікового навантаження на сервіс бронювання", "Навантажувальний тест має відтворювати конкуренцію за популярний ресурс, а не лише багато незалежних запитів. Відстежуйте блокування бази, черги та частку невдалих бронювань.", "load-testing database scalability", "https://habr.com/ru/search/?q=load%20testing%20database%20scalability&target_type=posts"],
  ["Метрики надійності, які допомагають команді пріоритезувати роботу", "SLO переводить очікування щодо сервісу в вимірювану ціль. Бюджет помилок допомагає вирішити, коли команда може випускати нові функції, а коли слід спершу виправити стабільність.", "sre slo reliability", "https://habr.com/ru/search/?q=SLO%20error%20budget&target_type=posts"],
  ["План відновлення доступу до акаунта без слабкого запасного шляху", "Відновлення акаунта часто стає слабшою ланкою за основний вхід. Оцініть канали підтвердження, сповіщення про зміну даних і захист від соціальної інженерії.", "identity security authentication", "https://habr.com/ru/search/?q=account%20recovery%20security&target_type=posts"],
  ["Оптимізація пошуку в каталозі за реальними запитами", "Індекси потрібно підбирати за частими фільтрами та сортуванням. Вивчайте план виконання запиту на реальних обсягах і уникайте широкого вибору полів, які не показує інтерфейс.", "database search performance", "https://habr.com/ru/search/?q=database%20index%20query%20optimization&target_type=posts"],
  ["Покроковий реліз мобільної версії з контролем збоїв", "Поширюйте оновлення поступово й порівнюйте crash-free сесії між версіями. Заздалегідь підготуйте сервер до кількох версій клієнта, що працюють одночасно.", "mobile release reliability", "https://habr.com/ru/search/?q=mobile%20app%20staged%20rollout&target_type=posts"],
  ["Як оформити документацію для чергової зміни команди", "Операційна інструкція має відповідати на питання: як помітити проблему, як безпечно зменшити вплив і кого повідомити. Перевіряйте її під час навчальних інцидентів.", "sre documentation operations", "https://habr.com/ru/search/?q=runbook%20incident%20response&target_type=posts"],
  ["Відкритий код у продукті: облік ліцензій і походження пакетів", "Команда має розуміти, які сторонні компоненти потрапляють у реліз і на яких умовах. Автоматизований список залежностей та перевірка ліцензій знижують ризик на етапі постачання.", "open-source security compliance", "https://habr.com/ru/search/?q=SBOM%20open%20source%20licenses&target_type=posts"],
  ["Дизайн API для клієнта, який може тимчасово зникнути з мережі", "Клієнт має передавати контрольовані повтори, а сервер — давати достатньо інформації для відновлення стану. Час очікування, ключ повтору й кінцевий статус мають бути частиною контракту.", "api mobile offline reliability", "https://habr.com/ru/search/?q=API%20offline%20retry%20mobile&target_type=posts"],
  ["Як команді переглядати архітектуру без надмірної бюрократії", "Короткий запис рішення фіксує контекст, альтернативи й наслідки. Це допомагає майбутній команді зрозуміти, чому обрано поточний підхід і за яких умов рішення варто переглянути.", "architecture teamwork documentation", "https://habr.com/ru/search/?q=architecture%20decision%20records&target_type=posts"],
];

const comments = [
  "Дуже влучно про контроль меж і наслідків. Додали це до нашого чекліста перед релізом.",
  "Погоджуюсь: спершу потрібна метрика, і лише тоді можна чесно оцінювати оптимізацію.",
  "Корисний практичний розбір. Особливо важливо регулярно перевіряти сценарій відновлення.",
  "Дякую за конкретні кроки — поділився з командою платформи.",
  "Добре пояснено, чому комфорт користувача залежить від технічних деталей під капотом.",
  "Цікаво було б побачити окремий матеріал про те, як це масштабується на кілька регіонів.",
  "Підтримую пораду починати з найменших привілеїв. Це часто економить час під час інциденту.",
  "Забираю ідею з контрольованим поступовим розгортанням у наш процес.",
];

const makeAvatar = ({ initials, colors }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#g)"/><circle cx="64" cy="64" r="48" fill="none" stroke="white" stroke-opacity=".22" stroke-width="2"/><text x="64" y="75" fill="white" font-family="Arial,sans-serif" font-size="${initials.length > 1 ? 40 : 54}" font-weight="700" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

async function seedDemoData() {
  const password = await bcryptHash("ConduitDemo2026!");
  const seededAuthors = [];
  const allAuthors = [...authors, ...testingContent.authors];
  const demoArticles = articles.slice(0, 50);

  for (const author of allAuthors) {
    const [user] = await User.findOrCreate({
      where: { username: author.username },
      defaults: {
        username: author.username,
        email: author.email,
        bio: author.bio,
        image: makeAvatar(author),
        password,
        emailVerified: true,
      },
    });
    if (user.bio?.startsWith("Команда ") || !user.bio) {
      await user.update({ bio: author.bio });
    }
    if (!user.image) await user.update({ image: makeAvatar(author) });
    if (!user.emailVerified) await user.update({ emailVerified: true });
    seededAuthors.push(user);
  }

  for (let index = 0; index < demoArticles.length; index += 1) {
    const [title, description, tagString, sourceUrl] = demoArticles[index];
    const slug = `ukr-tech-${String(index + 1).padStart(2, "0")}`;
    const tags = tagString.split(" ");
    const sourceNote = sourceUrl.includes("habr.com/ru/news/")
      ? "Це авторський короткий огляд українською, підготовлений для демо стрічки за матеріалами джерела. Повний матеріал доступний на Habr."
      : "Це оригінальна редакційна нотатка для демонстраційної стрічки. Посилання веде до тематичного пошуку Habr для подальшого читання.";
    const body = `## Коротко\n\n${description}\n\n## На що звернути увагу\n\nПочніть із чітких меж задачі, перевірте рішення на репрезентативних сценаріях і домовтеся, якими метриками команда оцінить результат. Для змін із високим впливом додайте поступове розгортання та зрозумілий шлях відновлення.\n\n## Джерело\n\n${sourceNote} [Відкрити Habr](${sourceUrl})`;
    const [article, created] = await Article.findOrCreate({
      where: { slug },
      defaults: {
        slug,
        title,
        description,
        body,
        sourceUrl,
        userId: seededAuthors[index % seededAuthors.length].id,
      },
    });

    if (!created) continue;
    for (const name of tags) {
      const [tag] = await Tag.findOrCreate({ where: { name } });
      await article.addTagList(tag);
    }
  }

  const testingAuthors = seededAuthors.slice(-testingContent.authors.length);
  for (const [index, entry] of testingContent.articles.entries()) {
    const slug = `ukr-testing-${String(index + 1).padStart(3, "0")}`;
    const body = `## ${entry.title}\n\n${entry.description}\n\n## Практичне застосування\n\n${entry.practice}\n\n## Джерело\n\nОригінальний україномовний навчальний конспект. Для поглиблення теми перегляньте матеріали: [${entry.sourceName}](${entry.sourceUrl}).`;
    const [article, created] = await Article.findOrCreate({
      where: { slug },
      defaults: {
        slug,
        title: entry.title,
        description: entry.description,
        body,
        sourceUrl: entry.sourceUrl,
        userId: testingAuthors[index % testingAuthors.length].id,
      },
    });
    if (!created) continue;
    for (const name of entry.tags.split(" ")) {
      const [tag] = await Tag.findOrCreate({ where: { name } });
      await article.addTagList(tag);
    }
  }

  for (let index = 0; index < 50; index += 1) {
    const slug = `ukr-tech-${String(index + 1).padStart(2, "0")}`;
    const article = await Article.findOne({ where: { slug } });
    if (!article) continue;
    const count = index % 3 === 0 ? 2 : 1;
    for (let reply = 0; reply < count; reply += 1) {
      const author = seededAuthors[(index + reply + 1) % seededAuthors.length];
      const body = comments[(index + reply) % comments.length];
      const existing = await Comment.findOne({
        where: { articleId: article.id, userId: author.id, body },
      });
      if (!existing) {
        await Comment.create({ body, articleId: article.id, userId: author.id });
      }
    }
  }

  for (const user of seededAuthors) {
    const followed = seededAuthors.find((author) => author.id !== user.id);
    if (followed) await followed.addFollower(user);
  }

  const recent = await Article.findAll({
    where: { slug: { [Op.in]: demoArticles.map((_, index) => `ukr-tech-${String(index + 1).padStart(2, "0")}`) } },
    order: [["createdAt", "DESC"]],
    limit: 12,
  });
  for (const [index, article] of recent.entries()) {
    await article.addUser(seededAuthors[(index + 3) % seededAuthors.length]);
  }
  const commentCount = await Comment.count();
  console.log(`Demo content ready: ${demoArticles.length + testingContent.articles.length} articles (${testingContent.articles.length} testing notes), ${seededAuthors.length} authors, ${commentCount} comments.`);
}

module.exports = seedDemoData;

if (require.main === module) {
  const { sequelize } = require("../models");
  sequelize
    .authenticate()
    .then(() => sequelize.sync({ alter: process.env.NODE_ENV !== "production" }))
    .then(seedDemoData)
    .catch((error) => {
      console.error("Unable to seed demo content:", error);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}
