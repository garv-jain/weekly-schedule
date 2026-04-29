# My Weekly Schedule

A simple, clean weekly schedule app for college students. Add classes and activities, filter by type, and export your schedule as a PNG.

## Features

- 7-day week view (Sat → Fri)
- Add classes and activities with custom colors
- Filter to show only classes or activities
- Export as PNG
- Your schedule auto-saves in the browser (localStorage)
- Dark mode support

## How to host on GitHub Pages

1. **Create a new GitHub repository**
   - Go to [github.com](https://github.com) and click **New repository**
   - Name it anything (e.g. `my-schedule`)
   - Set it to **Public**
   - Click **Create repository**

2. **Upload the files**
   - Click **Add file → Upload files**
   - Drag and drop all three files: `index.html`, `style.css`, `app.js`
   - Click **Commit changes**

3. **Enable GitHub Pages**
   - Go to your repo's **Settings** tab
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

4. **Visit your site**
   - After ~1 minute, your site will be live at:
   - `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and modal |
| `style.css` | All styling and dark mode |
| `app.js` | Schedule logic, storage, export |

## Customizing

- **Change default classes/activities**: Edit the `entries` array at the top of `app.js`
- **Add more colors**: Add color objects to `CLASS_COLORS` or `ACT_COLORS` in `app.js`
- **Change hours shown**: Edit `HOURS` in `app.js` (default: 8am–10pm)
