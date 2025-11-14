# 🚀 Инструкция по деплою на GitHub Pages

## Проблема
GitHub Pages не может запустить Vite dev server напрямую. Нужно собрать проект и разместить собранные файлы.

## ✅ Решение

### Вариант 1: Автоматический деплой (рекомендуется)

1. **Установите зависимости** (если ещё не установлены):
   ```bash
   cd frontend
   npm install
   ```

2. **Проверьте настройки GitHub Pages:**
   - Перейдите в Settings → Pages
   - В разделе "Build and deployment" выберите:
     - **Source:** "GitHub Actions" (не "Deploy from branch"!)
   - Сохраните

3. **Закоммитьте и запушьте изменения:**
   ```bash
   git add .
   git commit -m "Настройка деплоя на GitHub Pages"
   git push
   ```

4. **Проверьте деплой:**
   - Перейдите в Actions → Deploy to GitHub Pages
   - Дождитесь завершения workflow
   - Сайт будет доступен по адресу: `https://astap05.github.io/contract/`

### Вариант 2: Ручной деплой

1. **Соберите проект:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Скопируйте содержимое папки `dist` в корень репозитория:**
   ```bash
   # Из корня проекта
   cp -r frontend/dist/* .
   # Или на Windows PowerShell:
   Copy-Item -Path frontend\dist\* -Destination . -Recurse
   ```

3. **Закоммитьте и запушьте:**
   ```bash
   git add .
   git commit -m "Деплой фронтенда"
   git push
   ```

4. **Настройте GitHub Pages:**
   - Settings → Pages
   - Source: "Deploy from branch"
   - Branch: `main` → `/ (root)`
   - Сохраните

## ⚠️ Важные моменты

1. **Base path:** В `vite.config.ts` указан `base: '/contract/'` — это путь вашего репозитория. Если репозиторий называется по-другому, измените это значение.

2. **Сервер для демо:** `server.mjs` не будет работать на GitHub Pages (это Node.js сервер). Демо-функционал, который использует `localhost:8787`, не будет работать в продакшене.

3. **Проверка локально:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```
   Откройте `http://localhost:5173/contract/` (обратите внимание на `/contract/` в конце!)

## 🔧 Если что-то не работает

1. **Проверьте base path в `vite.config.ts`:**
   - Должен совпадать с именем репозитория
   - Если репозиторий `contract`, то `base: '/contract/'`
   - Если репозиторий `my-project`, то `base: '/my-project/'`

2. **Проверьте Actions:**
   - Перейдите в Actions
   - Посмотрите логи сборки
   - Убедитесь, что нет ошибок

3. **Очистите кэш браузера:**
   - Нажмите Ctrl+Shift+R (или Cmd+Shift+R на Mac)
   - Или откройте в режиме инкогнито

4. **Проверьте консоль браузера:**
   - F12 → Console
   - Посмотрите на ошибки загрузки ресурсов

## 📝 Структура после сборки

После `npm run build` в папке `frontend/dist` будут:
- `index.html` — главная страница
- `assets/` — все JS и CSS файлы
- Другие статические ресурсы

Эти файлы и нужно разместить на GitHub Pages.

