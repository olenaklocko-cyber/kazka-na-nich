# 🌙 Казка на ніч

Унікальна дитяча казка за 10 секунд — з імʼям твоєї дитини, її улюбленцем і
повчальним уроком. Навчальний продукт **Рівень 7 «Випускний: продукт у світі»**
(проєкт Олени, курс AI-розробки).

🔗 **Живий продукт:** https://kazka-na-nich.vercel.app
📖 **Гайд «за 5 хвилин»:** див. [ГАЙД.md](ГАЙД.md) або вкладку «📖 Підтримка» всередині застосунку
📝 **Що мінялося:** [CHANGELOG.md](CHANGELOG.md)
🆘 **Підтримка і статус:** вкладка «📖 Підтримка» → https://kazka-na-nich.vercel.app/#pidtrymka

## Що вміє

- 🎂 **Персональна казка** — імʼя дитини, герой (котик, дракончик, робот…),
  тема і повчальний урок; 12 мов
- 🎙 **Голосове введення** — розкажи замість того, щоб друкувати
- 🔒 **Pro за $4.99** — оплата LiqPay, ліміт 3 безкоштовні казки, HMAC-токени
- 📈 **Аналітика** — воронка, A/B-тест кнопки, відгуки → задачі (вкладка «Аналітика»)
- 🌍 **Open Source** — внесок у free-programming-books (вкладка «Open Source»)
- ⚙️ **Інфраструктура** — Docker «однією командою», dev/stage/prod (вкладка «Інфраструктура»)
- 📖 **Підтримка** — статус сервісів, гайд, форма звернень (вкладка «Підтримка»)

## Швидкий старт

**Варіант 1 — просто користуватися (без встановлення):**
відкрий https://kazka-na-nich.vercel.app і створи першу казку.

**Варіант 2 — запустити локально (потрібен Node 20+):**

```bash
git clone https://github.com/olenaklocko-cyber/kazka-na-nich.git
cd kazka-na-nich
npm ci
cp .env.example .env   # впиши свої ключі (див. «Секрети» нижче)
npm run dev            # сайт: http://localhost:5173
```

**Варіант 3 — у Docker (одна команда, з нуля на чистій машині):**

```bash
git clone https://github.com/olenaklocko-cyber/kazka-na-nich.git
cd kazka-na-nich
cp .env.example .env   # впиши ключі
docker compose up --build   # сайт: http://localhost:3002
```

Повний поетапний гайд — у [ГАЙД.md](ГАЙД.md).

## Архітектура

| Шар | Технологія | Де живе |
|---|---|---|
| Фронтенд | React 19 + Vite + TypeScript | `src/` |
| Dev-сервер / Docker-сервер | Node (tsx), один файл | `server/server.ts` |
| Прод-API | Vercel Serverless Functions | `api/*.ts` |
| Спільна бізнес-логіка (оплата, ліміти, токени) | чистий TypeScript | `shared/pro.ts` |
| Хмара | Vercel (прод + Preview) | kazka-na-nich.vercel.app |
| Контейнер | Docker (Alpine, 2 етапи) | `Dockerfile`, `docker-compose.yml` |

Один і той самий код API працює в трьох місцях: локально (3002), у контейнері
(3002) і на Vercel (serverless) — через `shared/pro.ts`.

## Секрети

Усі ключі — лише в серверному середовищі (`.env` локально / Vercel Environment
Variables). У git їх **немає і не буде** (перевірено: `.gitignore`).

| Змінна | Тип | Навіщо |
|---|---|---|
| `LLM_API_KEY` | 🔒 секрет | Ключ Google Gemini — генерація тексту казок |
| `PRO_SECRET` | 🔒 секрет | Підпис Pro-токенів |
| `LIQPAY_PUBLIC_KEY` | 🌐 публічний | Каса LiqPay |
| `LIQPAY_PRIVATE_KEY` | 🔒 секрет | Підпис запитів до LiqPay |
| `APP_URL` | конфіг | Куди LiqPay повертати після оплати |
| `SERVER_PORT` | конфіг | Порт локального/Docker-сервера (3002) |

Шаблон без значень: [.env.example](.env.example)

## Оплата (для тестів)

LiqPay у **sandbox**-режимі: тестова картка `4242 4242 4242 4242`, термін
`12/30`, будь-який CVV. Активний Pro зараз — до 18.11.2026.

## Підтримка і звернення

- **Статус сервісів** — вкладка «📖 Підтримка» у застосунку
  (перевіряє API живий/ні у реальному часі)
- **Знайшов помилку чи маєш ідею** — кнопка «Створити звернення» у вкладці
  «Підтримка» відкриває готову форму на GitHub Issues
  (https://github.com/olenaklocko-cyber/kazka-na-nich/issues)
- **Шаблони звернень:** `.github/ISSUE_TEMPLATE/` (баг / ідея / питання)

## Розробка

```bash
npm run dev     # паралельно сервер (3002) + Vite (5173)
npm run build   # tsc + vite build → dist/
npm run start   # прод-режим одним процесом (віддає dist/ + API)
npm run lint    # oxlint
```

## Ліцензія

Навчальний продукт. Код — MIT (див. [LICENSE](LICENSE)).
Внесок у free-programming-books — CC-BY-SA (правила upstream-проєкту).
