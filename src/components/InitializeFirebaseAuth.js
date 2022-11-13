import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, update } from 'firebase/database'
import { getStorage} from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_CONFIG_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_CONFIG_AUTH_DOMAIN,
  databaseURL : process.env.REACT_APP_FIREBASE_CONFIG_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_CONFIG_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_CONFIG_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_CONFIG_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_CONFIG_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app)
const auth = getAuth(app)
const bucket = getStorage(app)

async function writeAdminTxnInDatabase(activity, userAddress, txnHashes, admin){
  var txnDetails = {
    activity : activity,
    address : userAddress, 
    txnHashes : txnHashes,
    admin : admin,
    dateAndTime : new Date()
  }

 await update(ref(db, `adminTransactions/${Date.now()}`), txnDetails)
}

export {auth, db, bucket, writeAdminTxnInDatabase}