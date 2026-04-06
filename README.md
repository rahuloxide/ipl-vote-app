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
- Email/password signup and login
- Password reset email flow
- Role-based user profiles in Firestore
- Single admin workspace per admin
- Admin-managed matches and members
- Logged-in league dashboard
- IPL matches list per league
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
|   |   |-- AdminPanel.jsx
|   |   |-- AppHeader.jsx
|   |   |-- CreateLeagueCard.jsx
|   |   |-- Dashboard.jsx
|   |   |-- InvitesCard.jsx
|   |   |-- LeagueSwitcher.jsx
|   |   |-- LoadingState.jsx
|   |   |-- LoginCard.jsx
|   |   `-- MatchCard.jsx
|   |-- data
|   |   `-- defaultMatches.js
|   |-- services
|   |   |-- leagueService.js
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

### 3. Enable Firebase Authentication providers

1. In Firebase Console, open **Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Google**.
5. Enable **Email/Password**.
6. Save.

### 4. Create Firestore

1. Open **Firestore Database**.
2. Click **Create database**.
3. Start in production mode or test mode.
4. Choose a region.

### 5. Firestore data model used by this app

The app stores data in these collections:

- `leagues`
- `leagueMembers`
- `leagueRequests`
- `matches`
- `picks`
- `users`

### 6. Add environment variables

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

These rules support:

- users creating their own auth-backed profile document
- admins managing one default league workspace
- users requesting to join a league
- admins approving members and managing matches
- members making their own picks

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

- Google sign-in and email/password sign-in can both be enabled at the same time.
- On first login, the app creates a `users/{uid}` document with a default role.
- Admin users automatically get one default admin workspace.
- League access for regular users is handled through join requests.
- Each signed-in user stores their own picks in Firestore.
