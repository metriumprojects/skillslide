// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase Config
// const firebaseConfig = {
//   apiKey: "AIzaSyBhJjIPLBaJkovUQ-NhCCIbVe8Lr8jLEfo",
//   authDomain: "courses-8e162.firebaseapp.com",
//   // authDomain: "skillask.com",

//   projectId: "courses-8e162",
//   storageBucket: "courses-8e162.firebasestorage.app",
//   messagingSenderId: "381593736766",
//   appId: "1:381593736766:web:dab2b255c10262732ce36f",
//   measurementId: "G-BQLREX1VQY",
// };

const firebaseConfig = {
  apiKey: "AIzaSyDFmGR1rmRi7sESa2Og-jqX6VYAIpNWfEg",
  authDomain: "skillslide-9e19a.firebaseapp.com",
  projectId: "skillslide-9e19a",
  storageBucket: "skillslide-9e19a.firebasestorage.app",
  messagingSenderId: "263362679815",
  appId: "1:263362679815:web:6b372cb9e0d197007886a2",
  measurementId: "G-QLG1HX4F76"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth + Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
