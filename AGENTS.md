# Правила для AI-агентов

## Проект

Сервис бронирования «Календарь звонков»: `backend/` — Express 5 + TypeScript (ESM), `frontend/` — Next.js 16 (App Router) + Tailwind 4 + shadcn/ui. Данные хранятся в памяти процесса, БД нет.

## Окружение и команды

- Инструменты ставятся только через mise: `mise install`, затем `mise run setup` (зависимости + git-хуки `hk`).
- Пакетные скрипты работают лишь внутри mise-окружения: `mise exec -- pnpm --dir backend lint`. Прямой `pnpm lint` даст `command not found`.
- `mise run check` — обязательный гейт перед завершением работы (он же в CI): формат, oxlint, ESLint, типы, knip, тесты, секреты, typos, workflows, AGENTS.md.
- `mise run fix` — безопасные автоисправления; `mise run test` — оба набора тестов; `mise run security` — osv-scanner, история git, online-правила workflows (медленно, есть в CI по расписанию).
- `mise run e2e` — сборка фронтенда и Playwright на Chromium. В `mise run check` не входит: гейт должен оставаться быстрым, а e2e живёт отдельным job в CI. Перед первым запуском локально: `mise exec -- pnpm --dir frontend exec playwright install chromium`.
- Точечная проверка без прогона всего: `mise exec -- pnpm --dir backend test src/app.test.ts`, `mise exec -- pnpm --dir frontend test -- -t "часть названия"`, `mise exec -- hk run pre-push --all`.
- Хуки: pre-commit — быстрые шаги по изменённым файлам, pre-push — весь набор. Хук можно обойти `--no-verify`, но CI запускает `mise run check`, так что обход бесполезен.

## Структура и особенности

- Это два независимых пакета, общего pnpm-workspace и корневого `package.json` нет: команды выполнять с `--dir backend` / `--dir frontend`, у каждого свой lockfile.
- Порты: фронтенд 3000 (`next dev`/`next start`), бэкенд 3001 (`PORT`, по умолчанию 3001). CORS разрешает только `http://localhost:3000`; переопределяется `CORS_ORIGIN`.
- `backend/src/app.ts` экспортирует `app` (middleware + роуты) — тесты импортируют его без запуска сервера; `backend/src/index.ts` только слушает порт. Новые роуты добавлять в `app.ts`.
- Бэкенд — ESM + `moduleResolution: nodenext`: в относительных импортах обязательны `.js` (`import { app } from './app.js'`).
- `pnpm dev` в бэкенде запускает `.ts` нативно через Node 24 (type stripping): `enum`, `namespace` и parameter properties не поддерживаются.
- Сборка бэкенда идёт через `tsconfig.build.json` (тесты не попадают в `dist/`); `typecheck` проверяет и тесты.
- Тёмная тема во фронтенде — класс `.dark` на `<html>` (shadcn), а не `prefers-color-scheme`.

## Тесты

- Vitest в обоих пакетах, покрытие v8 с порогом 60 % (lines/functions/branches/statements); `test:coverage` включён в `mise run check`.
- Отчёты пишутся в `coverage/` — каталог в `.gitignore` и в ignore у ESLint/oxlint.
- Фронтенд: jsdom + Testing Library, alias `@/*`; тесты рядом с кодом (`*.test.tsx`).
- E2E: Playwright в `frontend/e2e` (`*.spec.ts`), только Chromium, запускается против production-сборки (`next build && next start`). Спеки исключены из Vitest; покрытие v8 считает `src/**/*.tsx` без вендорного `src/components/ui` и тестов.

## Линтеры и форматтер

- Бэкенд — oxlint (`--deny-warnings`), фронтенд — ESLint `eslint-config-next` (`--max-warnings=0`); форматирование — oxfmt для обоих.
- oxfmt намеренно пропускает `.github/workflows/hexlet-check.yml` и `pnpm-lock.yaml` — не «исправляйте» это.
- Не отключайте правило, чтобы протолкнуть изменение. Исключение — только узкое (путь + правило), с причиной и датой пересмотра, например `.github/jactionlint.yaml`.

## Зависимости

- Версии фиксируются точно, без `^`: `mise exec -- pnpm --dir <пакет> add -E <пакет>`.
- `save-exact=true` в `.npmrc` pnpm 12 игнорирует — файл с этой настройкой бесполезен.
- `.github/dependabot.yml` держит мажорные апдейты `typescript` и `eslint` во фронтенде: typescript-eslint не поддерживает TS 7, а eslint-config-next требует eslint 9.

## UI-компоненты

- `frontend/src/components/ui/*` — вендорный shadcn/ui: добавляйте через `mise exec -- pnpm dlx shadcn@latest add <component>`, руками правьте осознанно.
- Не добавляйте пакет `shadcn` в зависимости ради его Tailwind-CSS: он тянет `deepmerge@4.3.1` с неустранённым advisory, и osv-scanner валит `security`. Нужные кастомные варианты добавляйте локально.
- knip не проверяет экспорты этих файлов (исключение с причиной в `frontend/knip.config.ts`).

## Скиллы агентов

- `.agents/skills/*` — вендорные скиллы из [mattpocock/skills](https://github.com/mattpocock/skills), ставятся командой `npx skills@latest add mattpocock/skills` (версии — в `skills-lock.json`). Руками не правим: обновление перезапишет файлы.
- `.agents/` исключён из oxfmt (`.oxfmtrc.json`) и typos (`.typos.toml`), потому что это чужой текст «как есть»; остальные проверки (`secrets`, `knip`, тесты) его не касаются.
- Сетап скиллов уже выполнен — см. раздел «Agent skills» ниже. Повторно запускать `/setup-matt-pocock-skills` есть смысл только при смене трекера задач или полной перенастройке.

## Agent skills

### Issue tracker

Задачи и спеки живут в GitHub Issues репозитория `oska-salova/ai-for-developers-project-386`, работа через `gh` CLI. См. `docs/agents/issue-tracker.md`.

### Triage labels

Пять канонических ролей с дефолтными именами меток: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` и `docs/adr/` в корне репозитория. См. `docs/agents/domain.md`.

## Не трогать

- `.github/workflows/hexlet-check.yml` — генерируется Хекслетом, помечен «DO NOT DELETE OR EDIT»; переименование репозитория тоже ломает проверку.
- `frontend/AGENTS.md` создаётся `next dev` и перезаписывается при каждом запуске; `frontend/next-env.d.ts` генерируется Next.js.
- Артефакты `frontend/.next/`, `frontend/coverage/`, `backend/dist/`, `node_modules/` — не редактировать и не коммитить.

## Коммиты

- Conventional Commits обязательны: commit-msg хук и CI диапазона PR. Разрешённые типы: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
