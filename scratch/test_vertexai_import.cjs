try {
  const vertexai = require('@google/firebase-vertexai');
  console.log("Success! imported @google/firebase-vertexai:", vertexai);
} catch (e) {
  console.error("Failed to import @google/firebase-vertexai:", e.message);
}
