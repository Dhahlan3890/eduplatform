import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  // Your Firebase config
    apiKey: "AIzaSyCl0k1M7ZI-QeFHdE5xfe0FiP4RUU942oA",
    authDomain: "eduzone-9661e.firebaseapp.com",
    projectId: "eduzone-9661e",
    storageBucket: "eduzone-9661e.firebasestorage.app",
    messagingSenderId: "380709703773",
    appId: "1:380709703773:web:f138f712c5fb5dd188bdb4",
    measurementId: "G-YDZ91E6FT0"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()