import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBEvk3PuZ-HvNxBcgndtunv7SP9IjxBJps",
  authDomain: "kineflow-pro2.firebaseapp.com",
  projectId: "kineflow-pro2",
  storageBucket: "kineflow-pro2.firebasestorage.app",
  messagingSenderId: "360109819538",
  appId: "1:360109819538:web:083451995f3f071e86884b",
  measurementId: "G-D6YV7K8Z9W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Migrando pacientes...");
  const pSnap = await getDocs(collection(db, "patients"));
  for (const d of pSnap.docs) {
    if (!d.data().tenantId) {
      await updateDoc(doc(db, "patients", d.id), { tenantId: "default_tenant" });
      console.log(`Paciente ${d.id} actualizado.`);
    }
  }

  console.log("Migrando turnos...");
  const aSnap = await getDocs(collection(db, "appointments"));
  for (const d of aSnap.docs) {
    if (!d.data().tenantId) {
      await updateDoc(doc(db, "appointments", d.id), { tenantId: "default_tenant" });
      console.log(`Turno ${d.id} actualizado.`);
    }
  }

  console.log("Migrando staff...");
  const sSnap = await getDocs(collection(db, "staff"));
  for (const d of sSnap.docs) {
    if (!d.data().tenantId) {
      await updateDoc(doc(db, "staff", d.id), { tenantId: "default_tenant" });
      console.log(`Staff ${d.id} actualizado.`);
    }
  }

  console.log("Migrando productos...");
  const prodSnap = await getDocs(collection(db, "products"));
  for (const d of prodSnap.docs) {
    if (!d.data().tenantId) {
      await updateDoc(doc(db, "products", d.id), { tenantId: "default_tenant" });
      console.log(`Producto ${d.id} actualizado.`);
    }
  }

  console.log("Migración completada.");
  process.exit(0);
}

migrate().catch(console.error);
