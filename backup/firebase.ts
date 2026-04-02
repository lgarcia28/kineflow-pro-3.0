
import * as firebaseApp from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import * as firebaseAnalytics from 'firebase/analytics';

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

let app: any;
let db: any = null;
let analytics: any = null;
let storage: any = null;

if (isConfigValid) {
  try {
    const { initializeApp, getApps } = firebaseApp as any;
    const { getAnalytics, isSupported } = firebaseAnalytics as any;

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Firestore con persistencia avanzada
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true
    });

    // Inicializar Storage
    storage = getStorage(app);

    if (isSupported) {
      isSupported().then((yes: boolean) => {
          if (yes) analytics = getAnalytics(app);
      }).catch(() => {});
    }
  } catch (error) {
    console.error("Firebase init error:", error);
  }
}

export { db, analytics, storage, isConfigValid };
