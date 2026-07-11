import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

async function createNotification({ userId, message, threadId }) {
  if (!userId) return;
  await addDoc(collection(db, "notifications"), {
    userId: userId,
    message: message,
    threadId: threadId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export default createNotification;
