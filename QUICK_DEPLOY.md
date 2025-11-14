# ⚡ Быстрый деплой на GitHub Pages

## Шаг 1: Установите зависимости
```bash
cd frontend
npm install
```

## Шаг 2: Настройте GitHub Pages
1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Pages**
3. В разделе **"Build and deployment"**:
   - Выберите **Source:** `GitHub Actions` (важно!)
   - НЕ выбирайте "Deploy from branch"
4. Сохраните

## Шаг 3: Закоммитьте и запушьте
```bash
git add .
git commit -m "Настройка деплоя на GitHub Pages"
git push
```

## Шаг 4: Проверьте деплой
1. Перейдите в **Actions** на GitHub
2. Дождитесь завершения workflow "Deploy to GitHub Pages"
3. Откройте сайт: `https://astap05.github.io/contract/`

---

## ⚠️ Если репозиторий называется не `contract`

Измените `base` в `frontend/vite.config.ts`:
```typescript
base: '/ваше-имя-репозитория/', // вместо '/contract/'
```

---

## 🔍 Проверка локально перед деплоем

```bash
cd frontend
npm run build
npm run preview
```

Откройте `http://localhost:5173/contract/` (обратите внимание на `/contract/` в конце!)

