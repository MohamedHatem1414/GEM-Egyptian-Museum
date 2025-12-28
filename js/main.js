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

/* ================= تسجيل الزيارة (في الصفحة الرئيسية فقط) ================= */
async function logVisitOnce() {
  // بنشيك لو الزيارة اتسجلت قبل كدة في الجلسة دي
  if (!sessionStorage.getItem("VISIT_LOGGED")) {
    try {
      await addDoc(collection(db, "visits"), {
        timestamp: serverTimestamp()
      });
      sessionStorage.setItem("VISIT_LOGGED", "true");
      console.log("تم تسجيل زيارة جديدة من الصفحة الرئيسية ✅");
    } catch (e) {
      console.error("خطأ في تسجيل الزيارة:", e);
    }
  }
}

const cardsContainer = document.querySelector(".cards");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
let allArtifacts = [];

/* ================= تحميل القطع ================= */
async function loadArtifacts() {
  if (!cardsContainer) return; // عشان ميدي الغلط لو الصفحة مفيهاش كونتينر
  cardsContainer.innerHTML = "<p>جاري التحميل...</p>";
  try {
    const snapshot = await getDocs(collection(db, "artifacts"));
    allArtifacts = [];
    snapshot.forEach(d => {
      allArtifacts.push({ id: d.id, ...d.data() });
    });
    displayArtifacts(allArtifacts);
  } catch (e) {
    console.error("Error loading artifacts:", e);
  }
}

function displayArtifacts(list) {
  if (!cardsContainer) return;
  if (list.length === 0) {
    cardsContainer.innerHTML = "<p>لا توجد نتائج</p>";
    return;
  }
  cardsContainer.innerHTML = list.map(item => `
    <div class="card">
      <img src="${item.image}">
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    </div>
  `).join("");
}

/* ================= البحث ================= */
async function handleSearch() {
  const text = searchInput.value.trim().toLowerCase();
  if (!text) return displayArtifacts(allArtifacts);
  const filtered = allArtifacts.filter(a => a.name.toLowerCase().includes(text));
  
  // تحديث عداد البحث في قاعدة البيانات
  for (const item of filtered) {
    await updateDoc(doc(db, "artifacts", item.id), { searchCount: increment(1) });
  }
  displayArtifacts(filtered);
}

/* ================= تشغيل الأكواد عند تحميل الصفحة ================= */
document.addEventListener("DOMContentLoaded", () => {
  // 1. تسجيل الزيارة
  logVisitOnce();
  
  // 2. تحميل البيانات
  loadArtifacts();

  // 3. تفعيل البحث
  if (searchBtn) searchBtn.onclick = handleSearch;
  if (searchInput) {
    searchInput.addEventListener("keydown", e => { 
      if (e.key === "Enter") handleSearch(); 
    });
  }
});