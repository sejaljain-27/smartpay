import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

// Hardcoded for now based on backend .env, or should be in frontend .env
const GOOGLE_CLIENT_ID = "41416818858-s3hpnctkk1ep7rkngosspka2e2tjips3.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
