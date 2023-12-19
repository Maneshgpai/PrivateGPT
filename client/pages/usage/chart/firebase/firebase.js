import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB-DzRx2K3OCPbwMlOfIabZ8OyedFcaTIo",
  authDomain: "medcoder-123.firebaseapp.com",
  projectId: "medcoder-123",
  storageBucket: "medcoder-123.appspot.com",
  messagingSenderId: "626471768489",
  appId: "1:626471768489:web:bfe7a86232834611d3f4b8",
  measurementId: "G-12YNFHEPF6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally import analytics only on the client side
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
