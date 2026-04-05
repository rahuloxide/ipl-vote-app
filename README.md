# IPL Vote App

A clean React + Firebase app for IPL winner picks.

## Stack

- React
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Features

- Google login
- Logged-in dashboard
- IPL matches list
- Pick a winner for each match
- Picks saved in Firestore
- Component-based code structure

## Project Structure

```text
.
|-- .env.example
|-- firebase.json
|-- firestore.rules
|-- index.html
|-- package.json
|-- src
|   |-- components
|   |   |-- AppHeader.jsx
|   |   |-- Dashboard.jsx
|   |   |-- LoadingState.jsx
|   |   |-- LoginCard.jsx
|   |   `-- MatchCard.jsx
|   |-- data
|   |   `-- defaultMatches.js
|   |-- services
|   |   `-- matchService.js
|   |-- App.jsx
|   |-- firebase.js
|   |-- main.jsx
|   `-- styles.css
`-- vite.config.js
```

## Firebase Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**.
3. Finish the project creation flow.

### 2. Create a web app in Firebase

1. Inside your Firebase project, click **Add app**.
2. Choose **Web**.
3. Register the app.
4. Copy the Firebase config values.

### 3. Enable Google Authentication

1. In Firebase Console, open **Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Google**.
5. Save.

### 4. Create Firestore

1. Open **Firestore Database**.
2. Click **Create database**.
3. Start in production mode or test mode.
4. Choose a region.

### 5. Add environment variables

Create a file named `.env` in the project root and copy values from `.env.example`.

Example:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Local Run Instructions

1. Open a terminal in the project folder:

   ```powershell
   cd C:\projects\project1
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the app:

   ```powershell
   npm run dev
   ```

4. Open the local URL shown in the terminal, usually:

   ```text
   http://localhost:5173
   ```

## Firestore Rules

This project includes starter rules in `firestore.rules`.

Apply them with Firebase CLI after connecting your project.

## Deploy to Firebase Hosting

### 1. Install Firebase CLI

```powershell
npm install -g firebase-tools
```

### 2. Login to Firebase

```powershell
firebase login
```

### 3. Connect this folder to your Firebase project

```powershell
firebase use --add
```

Choose your Firebase project when prompted.

### 4. Build the app

```powershell
npm run build
```

### 5. Deploy Firestore rules

```powershell
firebase deploy --only firestore:rules
```

### 6. Deploy Hosting

```powershell
firebase deploy --only hosting
```

After deploy, Firebase will give you a live URL you can share.

## Notes

- Matches are seeded automatically the first time the Firestore `matches` collection is empty.
- Each signed-in user stores their own picks in Firestore.
- For production, you can tighten Firestore rules further if you want admin-only match management.
