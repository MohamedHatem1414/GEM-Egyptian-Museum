import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";






const cardsContainer = document.querySelector(".cards");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let allArtifacts = [];


/* ================= تحميل كل القطع ================= */
async function loadArtifacts() {
  try {
    if (cardsContainer) cardsContainer.innerHTML = "<p>جاري تحميل القطع...</p>";
    
    const snapshot = await getDocs(collection(db, "artifacts"));
    allArtifacts = [];

    snapshot.forEach(d => {
      allArtifacts.push({ id: d.id, ...d.data() });
    });

    displayArtifacts(allArtifacts);
  } catch (error) {
    console.error("Error loading artifacts:", error);
  }
}

/* ================= عرض القطع ================= */
function displayArtifacts(list) {
  if (!cardsContainer) return;
  cardsContainer.innerHTML = "";

  if (list.length === 0) {
    cardsContainer.innerHTML = "<p>لا توجد نتائج</p>";
    return;
  }

  let htmlContent = "";
  list.forEach(data => {
    htmlContent += `
      <div class="card">
        <img src="${data.image}" loading="lazy">
        <h3>${data.name}</h3>
        <p>${data.description}</p>
      </div>
    `;
  });
  cardsContainer.innerHTML = htmlContent;
}

/* ================= البحث بزرار ================= */
async function handleSearch() {
  const text = searchInput.value.trim().toLowerCase();

  if (!text) {
    displayArtifacts(allArtifacts);
    return;
  }

  const filtered = allArtifacts.filter(item =>
    item.name.toLowerCase().includes(text)
  );

  for (const item of filtered) {
    await updateDoc(doc(db, "artifacts", item.id), {
      searchCount: increment(1)
    });
  }

  displayArtifacts(filtered);
}

/* ================= الأحداث والتشغيل ================= */
  loadArtifacts();

  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (searchInput) {
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleSearch();
    });
  }
