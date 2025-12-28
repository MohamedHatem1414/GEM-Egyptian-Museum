import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= نظام حماية لوحة التحكم (الدخول) ================= */
  const authOverlay = document.getElementById("adminAuthOverlay");
  const passInput = document.getElementById("adminPassInput");
  const loginBtn = document.getElementById("loginAdminBtn");
  const authError = document.getElementById("authError");

  const CORRECT_PASSWORD = "1"; // يمكنك تغيير الباسورد من هنا

  // لجعل الباسورد يظهر دائماً عند الدخول (حتى لو سجل دخول قبل كدة)
  // قمت بتعليق السطور التالية لضمان طلب الباسورد في كل مرة
  /*
  if (localStorage.getItem("isLoggedIn") === "true") {
    if (authOverlay) authOverlay.style.display = "none";
  }
  */

  if (loginBtn) {
    loginBtn.onclick = () => {
      if (passInput.value === CORRECT_PASSWORD) {
        authOverlay.style.display = "none";
        localStorage.setItem("isLoggedIn", "true"); // حفظ حالة الدخول
      } else {
        authError.style.display = "block"; // إظهار رسالة خطأ
        passInput.style.borderColor = "red";
      }
    };
  }

  /* ================= إحصائيات الزيارات (تم تعديل الحساب هنا) ================= */
  const dailyVisitsEl = document.getElementById("dailyVisits");
  const weeklyVisitsEl = document.getElementById("weeklyVisits");
  const monthlyVisitsEl = document.getElementById("monthlyVisits");

  async function loadStats() {
    try {
      const snapshot = await getDocs(collection(db, "visits"));
      const now = new Date();
      
      let daily = 0;
      let weekly = 0;
      let monthly = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.toDate) {
          const visitDate = data.timestamp.toDate();
          const diffInMs = now - visitDate;
          const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

          // حساب دقيق للزيارات بناءً على الأيام
          if (diffInDays <= 1) daily++;
          if (diffInDays <= 7) weekly++;
          if (diffInDays <= 30) monthly++;
        }
      });

      if (dailyVisitsEl) dailyVisitsEl.textContent = daily;
      if (weeklyVisitsEl) weeklyVisitsEl.textContent = weekly;
      if (monthlyVisitsEl) monthlyVisitsEl.textContent = monthly;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  /* ================= القطع الأثرية ================= */

  const nameInput = document.getElementById("name");
  const imageInput = document.getElementById("image");
  const descInput = document.getElementById("description");
  const addBtn = document.getElementById("addBtn");

  const artifactsList = document.getElementById("artifactsList");
  const adminSearchInput = document.getElementById("searchInput");
  const searchList = document.getElementById("searchList");

  let editId = null;
  let allArtifacts = [];

  async function loadArtifacts() {
    if (!artifactsList) return;
    artifactsList.innerHTML = "<p style='text-align:center;'>جاري تحميل البيانات...</p>";
    allArtifacts = [];

    try {
      const snapshot = await getDocs(collection(db, "artifacts"));
      snapshot.forEach(d => {
        allArtifacts.push({ id: d.id, ...d.data() });
      });
      renderArtifacts(allArtifacts);
    } catch (error) {
      console.error("Error fetching artifacts:", error);
    }
  }

  function renderArtifacts(list) {
    if (!artifactsList) return;
    artifactsList.innerHTML = "";

    if (list.length === 0) {
      artifactsList.innerHTML = "<p>لا توجد نتائج</p>";
      return;
    }

    list.forEach(data => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <img src="${data.image}" loading="lazy">
        <h3>${data.name}</h3>
        <p>${data.description}</p>
        <button class="edit">تعديل ✏️</button>
        <button class="delete">حذف ❌</button>
      `;

      div.querySelector(".edit").onclick = () => {
        nameInput.value = data.name;
        imageInput.value = data.image;
        descInput.value = data.description;
        editId = data.id;
        addBtn.textContent = "حفظ التعديل";
        
        // تعديل: السكرول هنا يركز على الفورم في نص الشاشة
        nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInput.focus();
      };

      div.querySelector(".delete").onclick = async () => {
        if (!confirm("متأكد من الحذف؟")) return;
        await deleteDoc(doc(db, "artifacts", data.id));
        alert("تم حذف القطعة بنجاح ✅"); 
        loadArtifacts();
        loadTopSearches();
      };

      artifactsList.appendChild(div);
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      const image = imageInput.value.trim();
      const description = descInput.value.trim();

      if (!name || !image || !description) {
        alert("املأ كل البيانات");
        return;
      }

      try {
        if (editId) {
          await updateDoc(doc(db, "artifacts", editId), {
            name,
            image,
            description
          });
          alert("تم التعديل ✅");
          editId = null;
          addBtn.textContent = "إضافة قطعة";
        } else {
          await addDoc(collection(db, "artifacts"), {
            name,
            image,
            description,
            searchCount: 0,
            createdAt: serverTimestamp()
          });
          alert("تمت الإضافة ✅");
        }

        nameInput.value = "";
        imageInput.value = "";
        descInput.value = "";

        loadArtifacts();
        loadTopSearches();
      } catch (error) {
        console.error("Error saving artifact:", error);
      }
    });
  }

  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", () => {
      const text = adminSearchInput.value.trim().toLowerCase();
      if (!text) return renderArtifacts(allArtifacts);

      const filtered = allArtifacts.filter(a =>
        a.name.toLowerCase().includes(text)
      );
      renderArtifacts(filtered);
    });
  }

  async function loadTopSearches() {
    if (!searchList) return;
    searchList.innerHTML = "";

    try {
      const q = query(
        collection(db, "artifacts"),
        orderBy("searchCount", "desc"),
        limit(5)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        searchList.innerHTML = "<li>لا توجد بيانات بحث</li>";
        return;
      }

      snapshot.forEach(d => {
        const data = d.data();
        if ((data.searchCount || 0) > 0) {
          const li = document.createElement("li");
          li.textContent = `${data.name} — ${data.searchCount}`;
          searchList.appendChild(li);
        }
      });
    } catch (error) {
      console.error("Error loading top searches:", error);
    }
  }

  /* ================= القاعات (تعديل وحذف) ================= */

  const hallName = document.getElementById("hallName");
  const hallImage = document.getElementById("hallImage");
  const hallDesc = document.getElementById("hallDesc");
  const addHallBtn = document.getElementById("addHallBtn");
  const hallsList = document.getElementById("hallsList");

  let editHallId = null;

  async function loadHallsAdmin() {
    if (!hallsList) return;
    hallsList.innerHTML = "<p style='text-align:center;'>جاري تحميل القاعات...</p>";

    try {
      const snapshot = await getDocs(collection(db, "halls"));

      if (snapshot.empty) {
        hallsList.innerHTML = "<p>لا توجد قاعات حاليًا</p>";
        return;
      }

      hallsList.innerHTML = "";
      snapshot.forEach(d => {
        const hall = d.data();
        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
          <img src="${hall.image}" loading="lazy">
          <h3>${hall.name}</h3>
          <p>${hall.description}</p>
          <button class="edit-hall">تعديل ✏️</button>
          <button class="delete-hall">حذف ❌</button>
        `;

        div.querySelector(".edit-hall").onclick = () => {
          hallName.value = hall.name;
          hallImage.value = hall.image;
          hallDesc.value = hall.description;
          editHallId = d.id;
          addHallBtn.textContent = "حفظ تعديل القاعة";
          
          // تعديل: السكرول هنا يركز على فورم القاعات في نص الشاشة
          hallName.scrollIntoView({ behavior: "smooth", block: "center"  });
          hallName.focus();
        };

        div.querySelector(".delete-hall").onclick = async () => {
          if (!confirm("متأكد من حذف القاعة؟")) return;
          await deleteDoc(doc(db, "halls", d.id));
          alert("تم حذف القاعة بنجاح ✅"); 
          loadHallsAdmin();
        };

        hallsList.appendChild(div);
      });
    } catch (error) {
      console.error("Error loading halls:", error);
    }
  }

  if (addHallBtn) {
    addHallBtn.addEventListener("click", async () => {
      const name = hallName.value.trim();
      const image = hallImage.value.trim();
      const description = hallDesc.value.trim();

      if (!name || !image || !description) {
        alert("املأ كل بيانات القاعة");
        return;
      }

      try {
        if (editHallId) {
          await updateDoc(doc(db, "halls", editHallId), {
            name,
            image,
            description
          });
          alert("تم تعديل القاعة ✅");
          editHallId = null;
          addHallBtn.textContent = "إضافة قاعة";
        } else {
          await addDoc(collection(db, "halls"), {
            name,
            image,
            description,
            createdAt: serverTimestamp()
          });
          alert("تمت إضافة القاعة ✅");
        }

        hallName.value = "";
        hallImage.value = "";
        hallDesc.value = "";

        loadHallsAdmin();
      } catch (error) {
        console.error("Error saving hall:", error);
      }
    });
  }

  /* ================= تسجيل الخروج ================= */
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("isLoggedIn");
      location.reload();
    };
  }

  /* ================= تشغيل الوظائف بترتيب يضمن التحميل ================= */
  async function initAdmin() {
    await loadArtifacts();
    await loadTopSearches();
    await loadHallsAdmin();
    await loadStats();
  }

  initAdmin();
});