# Love Retold Recording App

A React-based audio recording interface for capturing personal memories and stories.

## Features

- **URL-based Session Management**: Validate recording sessions via unique URLs
- **Audio Recording**: Browser-based audio recording using MediaRecorder API
- **Firebase Integration**: Secure file upload to Firebase Storage
- **Mobile Responsive**: Optimized for mobile and desktop devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Progressive Web App**: Works offline and can be installed

## Prerequisites

- Node.js 18+
- Firebase project with:
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Authentication (Anonymous provider)

## Setup

1. **Clone and Install**
   ```bash
   cd recording-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

3. **Firebase Configuration**
   Update `.env` with your Firebase project details:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Usage

### Recording Flow

1. User receives recording link: `https://your-domain.com/record/{sessionId}`
2. App validates session and displays question
3. User records audio response
4. Recording is uploaded to Firebase Storage
5. Cloud Function processes recording and creates story

### Session States

- **Active**: Ready for recording
- **Completed**: Already recorded
- **Expired**: Link expired (7 days)
- **Removed**: Question deleted by user
- **Error**: Invalid or inaccessible session

## Browser Support

- Chrome 58+
- Firefox 53+
- Safari 14+
- Edge 79+

**Required APIs:**
- MediaRecorder API
- getUserMedia API
- Web Storage API
- Fetch API

## Architecture

```
src/
├── components/
│   ├── RecordingInterface.jsx  # Main recording component
│   ├── SessionValidator.jsx    # Session validation and routing
│   ├── StatusMessage.jsx       # User feedback messages
│   └── LoadingSpinner.jsx      # Loading states
├── services/
│   ├── firebase.js            # Firebase configuration
│   ├── session.js             # Session management
│   └── recording.js           # Audio recording and upload
├── styles/
│   └── main.css              # Responsive styles
├── App.jsx                   # Main app component
└── main.jsx                  # Entry point
```

## Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Other Platforms

The app can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Security

- Anonymous authentication for file uploads
- Session-based access control
- File upload validation
- CORS protection
- HTTPS enforcement

## Performance

- Code splitting and lazy loading
- Progressive Web App features
- Optimized bundle size
- Mobile-first responsive design
- Offline capability (limited)

## Troubleshooting

### Common Issues

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS (required for getUserMedia)
   - Try different browser

2. **Firebase Errors**
   - Verify environment variables
   - Check Firebase project configuration
   - Ensure anonymous auth is enabled

3. **Upload Failures**
   - Check network connection
   - Verify Firebase Storage rules
   - Check file size limits

### Debug Mode

Enable debug logging by adding to `.env`:
```
VITE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

Private project - All rights reserved.