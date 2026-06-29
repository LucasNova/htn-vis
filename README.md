# htn-vis

Визуализатор UE HTN-модели гуманоидного AI.

## Структура

- `site/` - Vite + SolidJS приложение.
- `site/public/data/humanoid_ue_htn_model_v1.json` - текущая HTN-модель.
- `.github/workflows/deploy-pages.yml` - сборка и публикация статического сайта в GitHub Pages.

## Команды

```powershell
npm run dev
npm run build
npm run preview
```

Для GitHub Pages workflow собирает `site/dist` с base path `/htn-vis/`.
