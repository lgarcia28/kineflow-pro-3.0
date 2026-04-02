
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBEvk3PuZ-HvNxBcgndtunv7SP9IjxBJps",
  authDomain: "kineflow-pro2.firebaseapp.com",
  projectId: "kineflow-pro2",
  storageBucket: "kineflow-pro2.firebasestorage.app",
  messagingSenderId: "360109819538",
  appId: "1:360109819538:web:083451995f3f071e86884b",
  measurementId: "G-D6YV7K8Z9W"
};

const isPlaceholder = (val: string | undefined) => !val || val.includes('...') || val === 'undefined';
const isConfigValid = !isPlaceholder(firebaseConfig.apiKey) && !isPlaceholder(firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let storage: FirebaseStorage | null = null;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Firestore con persistencia avanzada
    db = initializeFirestore(app!, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });

    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);

    // Inicializar Storage
    storage = getStorage(app!);

    isSupported().then((yes: boolean) => {
        if (yes && app) analytics = getAnalytics(app);
    }).catch(() => {});
  } catch (error) {
    console.error("Firebase init error:", error);
  }
} else {
  console.warn("Firebase config is invalid or using placeholders. Firestore will be disabled.");
}

export { db, analytics, storage, isConfigValid };
