# Правила для AI-агентов

## Проект

Сервис бронирования «Календарь звонков»: `backend/` — Express 5 + TypeScript (ESM), `frontend/` — Next.js 16 (App Router) + Tailwind 4 + shadcn/ui. Данные хранятся в памяти процесса, БД нет.

## Окружение и команды

- Инструменты ставятся только через mise: `mise install`, затем `mise run setup` (зависимости + git-хуки `hk`).
- Пакетные скрипты работают лишь внутри mise-окружения: `mise exec -- pnpm --dir backend lint`. Прямой `pnpm lint` даст `command not found`.
- `mise run verify` — полная команда локально и в CI: `mise run check` плюс Playwright на Chromium. Её запускает джоба Verify в CI.
- `mise run check` — быстрый гейт перед завершением работы: `contract:check`, grep-аудит «только SDK», формат, oxlint, ESLint, типы, knip, тесты, секреты, typos, workflows, AGENTS.md.
- `mise run fix` — безопасные автоисправления; `mise run test` — оба набора тестов; `mise run security` — osv-scanner, история git, online-правила workflows (медленно, есть в CI по расписанию).
- `mise run contract:build` — генерация OpenAPI, SDK и бэкенд-типов из TypeSpec; `mise run contract:check` повторяет генерацию и падает на дрейфе (включая новые файлы).
- `mise run e2e` — сборка фронтенда, Playwright на Chromium и запуск бэкенда `dev:seeded`. В `mise run check` не входит: гейт должен оставаться быстрым, e2e живёт в `verify`. Перед первым запуском локально: `mise exec -- pnpm --dir frontend exec playwright install chromium`.
- Точечная проверка без прогона всего: `mise exec -- pnpm --dir backend test src/app.test.ts`, `mise exec -- pnpm --dir frontend test -- -t "часть названия"`, `mise exec -- hk run pre-push --all`.
- Хуки: pre-commit — быстрые шаги по изменённым файлам, pre-push — весь набор `hk`. Хук можно обойти `--no-verify`, но CI запускает `mise run check`, так что обход бесполезен.

## Структура и особенности

- Это три независимых пакета (`backend`, `frontend`, `contract`), общего pnpm-workspace и корневого `package.json` нет: команды выполнять с `--dir <пакет>`, у каждого свой lockfile. `backend/pnpm-workspace.yaml` и `contract/pnpm-workspace.yaml` — не workspace, а место, где pnpm 12 читает настройки пакета (`onlyBuiltDependencies`, `overrides`).
- Порты: фронтенд 3000 (`next dev`/`next start`), бэкенд 3001 (`PORT`, по умолчанию 3001). CORS разрешает только `http://localhost:3000`; переопределяется `CORS_ORIGIN`.
- `backend/src/app.ts` экспортирует `createApp({ store, now })` (middleware + роуты), `backend/src/index.ts` создаёт пустое хранилище и системные часы и слушает порт. Новые роуты добавлять в `app.ts` и описывать в TypeSpec.
- Бэкенд — ESM + `moduleResolution: nodenext`: в относительных импортах обязательны `.js` (`import { createApp } from './app.js'`). Это нужно для собранного `dist/`; `tsx` в dev резолвит их в `.ts`.
- `pnpm dev` в бэкенде запускает `tsx watch src/index.ts`, `pnpm dev:seeded` — `tsx src/dev-seeded.ts` с наполненным хранилищем. Node type stripping для этого не используется: он не резолвит `.js`-импорты в `.ts`.
- Сборка бэкенда по-прежнему `tsc` через `tsconfig.build.json` (тесты не попадают в `dist/`); `typecheck` проверяет и тесты, и сгенерированные типы.
- Тёмная тема во фронтенде — класс `.dark` на `<html>` (shadcn), а не `prefers-color-scheme`.
- Во фронтенде включён `cacheComponents`: `new Date()`, `Math.random()` и `crypto.randomUUID()` в серверных компонентах ломают пререндер при `next build`. Значения времени фиксируйте на сборке через `env` в `next.config.ts` (пример — `NEXT_PUBLIC_BUILD_YEAR`) или рендерите участок по запросу в `<Suspense>` с `await connection()`.

## Контракт и генерация

- Источник истины — TypeSpec: `contract/main.tsp`, эмиттеры перечислены в `contract/tspconfig.yaml`. Руками контракт не правится нигде, кроме `.tsp`.
- Сгенерированные пути: `contract/openapi/**` (OpenAPI 3.0.0 с `seal-object-schemas: true`), `frontend/src/lib/api/generated/**` (клиентский SDK, включая собранный `dist/`), `backend/src/generated/**` (типы из OpenAPI). Править их руками запрещено: генерация перезапишет файлы, а `contract:check` упадёт.
- Порядок изменения контракта: правится `main.tsp` → `mise run contract:build` → только потом код бэкенда и фронтенда. Обе стороны идут от сгенерированных артефактов.
- Бэкенд-роуты Express 5 пишутся руками по типам из `backend/src/generated/openapi.d.ts`; официальный серверный генератор TypeSpec не подключён — причина в `contract/README.md`.
- `mise run contract:check` повторяет генерацию и сравнивает рабочее дерево по трём путям, включая новые файлы (забытая генерация и правка сгенерированного не проходят). Он входит в `mise run check`.
- Сгенерированное исключено из ESLint, oxlint, oxfmt, knip и покрытия, но проверяется `tsc` (`typecheck` обоих пакетов).
- Все запросы к API идут через сгенерированный SDK. `frontend/src/lib/api.ts` — единственное место с базовым URL (`NEXT_PUBLIC_API_URL`, дефолт `http://localhost:3001`) и маппингом ошибок в `ApiError`; там нет вызовов. Прямой `fetch`, `XMLHttpRequest`, `axios`, `ofetch`, `ky`, `got`, `node:http`, `node:https` запрещены ESLint и grep-аудитом `mise run sdk:check`.

## Тесты

- Vitest в обоих пакетах, покрытие v8 с порогом 60 % (lines/functions/branches/statements); `test:coverage` включён в `mise run check`.
- Отчёты пишутся в `coverage/` — каталог в `.gitignore` и в ignore у ESLint/oxlint.
- Фронтенд: jsdom + Testing Library, alias `@/*`; тесты рядом с кодом (`*.test.tsx`). Маршрутные тесты, проверяющие несколько страниц сразу, живут в `src/app/`. Покрытие считает `src/**/*.ts` и `*.tsx`, исключая тесты, `src/test/**`, вендорный `src/components/ui` и сгенерированный SDK.
- Бэкенд: HTTP-контракт проверяется supertest через `createApp` с фиксированными часами и свежим хранилищем; contract compliance в `backend/src/app.contract.test.ts` валидирует реальные ответы по `contract/openapi/openapi.json` (и код, и тело). Сгенерированные типы исключены из покрытия.
- E2E: Playwright в `frontend/e2e` (`*.spec.ts`), только Chromium, запускается против production-сборки (`next build && next start`) и бэкенда `dev:seeded` на 3001. Спеки исключены из Vitest.

## Линтеры и форматтер

- Бэкенд — oxlint (`--deny-warnings`), фронтенд — ESLint `eslint-config-next` (`--max-warnings=0`); форматирование — oxfmt для обоих.
- oxlint намеренно пропускает `backend/src/generated/**`, oxfmt — `contract/openapi/**`, `contract/tsp-output/**`, `frontend/src/lib/api/generated/**`, `backend/src/generated/**`; ESLint и knip — SDK. Это сгенерированный код, а не исходники.
- Обновлять сгенерированное нужно через `mise run contract:build`, а не правкой файлов: иначе `contract:check` красный.
- oxfmt намеренно пропускает `.github/workflows/hexlet-check.yml` и `pnpm-lock.yaml` — не «исправляйте» это.
- Не отключайте правило, чтобы протолкнуть изменение. Исключение — только узкое (путь + правило), с причиной и датой пересмотра, например `.github/jactionlint.yaml`.

## Зависимости

- Версии фиксируются точно, без `^`: `mise exec -- pnpm --dir <пакет> add -E <пакет>`.
- `save-exact=true` в `.npmrc` pnpm 12 игнорирует — файл с этой настройкой бесполезен; настройки пакета (`overrides`, `onlyBuiltDependencies`) pnpm 12 читает только из `pnpm-workspace.yaml`.
- `contract/` держит TypeSpec-эмиттеры и `openapi-typescript`; обязательный override `@alloy-js/core` (одна версия на весь Alloy) описан в `contract/README.md`. Без него SDK-эмиттер не запускается.
- `.github/dependabot.yml` держит мажорные апдейты `typescript` и `eslint` во фронтенде: typescript-eslint не поддерживает TS 7, а eslint-config-next требует eslint 9.
- После изменения зависимостей запускайте `mise run security` перед PR: `check` уязвимости не сканирует, а джоб Security в CI валит сборку на свежих advisory (так всплыл `minimatch` GHSA-g3hv-75wg-m249).

## UI-компоненты

- `frontend/src/components/ui/*` — вендорный shadcn/ui: добавляйте через `mise exec -- pnpm dlx shadcn@latest add <component>`, руками правьте осознанно.
- Не добавляйте пакет `shadcn` в зависимости ради его Tailwind-CSS: он тянет `deepmerge@4.3.1` с неустранённым advisory, и osv-scanner валит `security`. Нужные кастомные варианты добавляйте локально.
- knip не проверяет экспорты этих файлов (исключение с причиной в `frontend/knip.config.ts`).

## Скиллы агентов

- `.agents/skills/*` — вендорные скиллы из [mattpocock/skills](https://github.com/mattpocock/skills), ставятся командой `npx skills@latest add mattpocock/skills` (версии — в `skills-lock.json`). Руками не правим: обновление перезапишет файлы.
- `.agents/` исключён из oxfmt (`.oxfmtrc.json`) и typos (`.typos.toml`), потому что это чужой текст «как есть»; остальные проверки (`secrets`, `knip`, тесты) его не касаются.
- Сетап скиллов уже выполнен — см. раздел «Agent skills» ниже. Повторно запускать `/setup-matt-pocock-skills` есть смысл только при смене трекера задач или полной перенастройке.

## Agent skills

- Трекер задач — GitHub Issues репозитория `oska-salova/ai-for-developers-project-386`, работа через `gh` CLI: `docs/agents/issue-tracker.md`.
- Метки триажа — пять канонических ролей: `docs/agents/triage-labels.md`.
- Доменные доки — single-context, `GLOSSARY.md` и `docs/adr/` в корне: `docs/agents/domain.md`.

## Не трогать

- `.github/workflows/hexlet-check.yml` — генерируется Хекслетом, помечен «DO NOT DELETE OR EDIT»; переименование репозитория тоже ломает проверку.
- `frontend/AGENTS.md` создаётся `next dev` и перезаписывается при каждом запуске; `frontend/next-env.d.ts` генерируется Next.js.
- Артефакты `frontend/.next/`, `frontend/coverage/`, `backend/dist/`, `node_modules/` — не редактировать и не коммитить.

## Коммиты

- Conventional Commits обязательны: commit-msg хук `hk` локально и шаг «Lint pull request title» в джобе Verify. Заголовок PR проверяется тем же `commitlint` и конфигом `commitlint.config.mjs`. Разрешённые типы: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
- Заголовки PR — те же Conventional Commits: при squash-merge заголовок становится коммитом в `main`, а release-please читает именно его.
- Коммит реализации ссылается на тикет, который он закрывает, для трассируемости: `feat: запись на свободный слот (#12)`. Номер нужен только для истории; issue закрывает трекер, а не сообщение коммита, и механической проверки `(#N)` нет.
- Релизные коммиты release-please и dependabot — без ссылки на тикет. При squash-merge ссылку на тикет желательно сохранить в заголовке PR.

## Релизы

- `.github/workflows/release-please.yml` на `push` в `main` готовит release-PR по Conventional Commits. `release-please-config.json` описывает два пакета (`backend`, `frontend`) с отдельными PR, текущие версии — в `.release-please-manifest.json`, `bootstrap-sha` отсекает историю до первого среза.
- Апрувит и мержит человек: action только создаёт и обновляет PR. Права выданы явно в джобе (`contents`, `issues`, `pull-requests` — `write`), default permissions репозитория остаются `read`; PAT и GitHub App не используются.
- Release-PR создаётся через `GITHUB_TOKEN`, поэтому CI на нём не запускается — это известное ограничение, а не поломка. Если включать branch protection, требовать только PR и апрув, без required checks.
