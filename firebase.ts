import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
// 수정.
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);