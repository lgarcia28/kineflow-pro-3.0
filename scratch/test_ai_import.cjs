try {
  const ai = require('firebase/ai');
  console.log("Success! imported firebase/ai:", ai);
} catch (e) {
  console.error("Failed to import firebase/ai:", e.message);
}
