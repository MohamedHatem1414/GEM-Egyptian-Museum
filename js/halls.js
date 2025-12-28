import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";





const hallsContainer = document.getElementById("hallsContainer");


async function loadHalls() {
  if (!hallsContainer) return;
  try {
    hallsContainer.innerHTML = "<p>جاري تحميل القاعات...</p>";
    const snapshot = await getDocs(collection(db, "halls"));
    hallsContainer.innerHTML = "";

    if (snapshot.empty) {
      hallsContainer.innerHTML = "<p>لا توجد قاعات حاليًا</p>";
      return;
    }

    let htmlContent = "";
    snapshot.forEach(d => {
      const hall = d.data();
      htmlContent += `
        <div class="hall-card">
          <img src="${hall.image}" loading="lazy">
          <h3>${hall.name}</h3>
          <p>${hall.description}</p>
        </div>
      `;
    });
    hallsContainer.innerHTML = htmlContent;
  } catch (error) { console.error(error); }
}

  loadHalls();
