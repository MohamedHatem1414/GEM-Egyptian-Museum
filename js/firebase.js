// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOcjbb4EG_-ghXEwrl-v2oWwZtJGrLuJM",
  authDomain: "egyptian-museum-site.firebaseapp.com",
  projectId: "egyptian-museum-site",
  storageBucket: "egyptian-museum-site.appspot.com",
  messagingSenderId: "403485767440",
  appId: "1:403485767440:web:4200e6014d4097fbb49795"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
 