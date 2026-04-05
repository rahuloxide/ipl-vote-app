# IPL Vote App

A very simple React web app for voting on one IPL match: **CSK vs MI**.

## Features

- No login
- Two buttons: `Vote CSK` and `Vote MI`
- Vote count updates instantly on screen
- Votes are stored in browser local storage, so they stay after refresh on the same device/browser

## Tech Stack

- React
- Vite
- Browser local storage

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- vite.config.js
`-- src
    |-- App.jsx
    |-- main.jsx
    `-- styles.css
```

## How to Run Locally

1. Install **Node.js** 18 or newer from [https://nodejs.org/](https://nodejs.org/).
2. Open a terminal in this project folder:

   ```powershell
   cd C:\projects\project1
   ```

3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open the local URL shown in the terminal, usually:

   ```text
   http://localhost:5173
   ```

## How to Build for Production

```powershell
npm run build
```

This creates a `dist` folder with the production build.

## Free Deployment Options

### Option 1: Vercel

1. Push this project to GitHub.
2. Go to [https://vercel.com/](https://vercel.com/).
3. Sign in with GitHub.
4. Click **Add New Project**.
5. Import your repository.
6. Vercel should detect it as a Vite app automatically.
7. Click **Deploy**.

Default settings that usually work:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### Option 2: Netlify

1. Push this project to GitHub.
2. Go to [https://www.netlify.com/](https://www.netlify.com/).
3. Sign in and choose **Add new site**.
4. Import the GitHub repository.
5. Use these settings:

- Build command: `npm run build`
- Publish directory: `dist`

6. Click **Deploy site**.

## Notes

- This app uses **local storage**, so vote counts are shared only on the same browser/device.
- If you want real shared voting across all users online, the next step would be adding a small backend or a database service such as Firebase or Supabase.
