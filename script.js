// ✅ 0. DOMContentLoaded 이후 실행
document.addEventListener("DOMContentLoaded", () => {
  fetch('info-cards.html')
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById('info-card-container');
      if (container) {
        container.innerHTML = html;
        initializeApp(); // ✅ info-card 삽입 후 실행
      }
    })
    .catch(error => console.error('❌ info-cards.html 로드 실패:', error));
});

// ✅ 1. 전역 상태 변수
let currentSlide = 0;
let reviewData = {};

// ✅ 2. 초기화 함수
function initializeApp() {
  const isMapPage = document.getElementById("map") !== null;
  const previewCard = document.getElementById("info-preview-card");
  const fullCard = document.getElementById("info-full-card");

  // ✅ 2-1. preview → full 전환
  previewCard?.addEventListener("click", (e) => {
    if (!e.target.closest("button, a")) {
      const data = previewCard.dataset.locationData;
      if (data) showFullCard(JSON.parse(data));
    }
  });

  // ✅ 2-2. fullCard 내부 버튼: 돌아가기
document.getElementById("back-to-preview")?.addEventListener("click", () => {
  const isMapPage = document.getElementById("map") !== null; // 현재 페이지 판별
  const data = fullCard?.dataset.locationData;
  if (data) {
    const location = JSON.parse(data);
    if (isMapPage) {
      showPreviewCard(location); // 지도에서는 다시 preview 보여줌
    } else {
      fullCard.classList.add("hidden"); // 리스트에서는 그냥 full만 숨김
    }
  }
});

// ✅ previewCard 닫기 버튼 (X 버튼)
document.getElementById("close-preview")?.addEventListener("click", () => {
  previewCard.classList.add("hidden");
});

  // ✅ 2-3. 탭 전환
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");

      document.querySelectorAll(".tab-section").forEach(section => section.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("text-blue-600", "border-b-2", "border-blue-500");
        b.classList.add("text-gray-600");
      });

      document.getElementById(targetId)?.classList.remove("hidden");
      btn.classList.remove("text-gray-600");
      btn.classList.add("text-blue-600", "border-b-2", "border-blue-500");
    });
  });

  // ✅ 2-4. 지도 이동 버튼
  window.goToMapWithFocus = () => {
    const data = fullCard?.dataset.locationData;
    if (data) {
      const id = encodeURIComponent(JSON.parse(data).id);
      location.href = `map.html?id=${id}`;
    }
  };

  // ✅ 2-5. 지도 페이지 로직
  if (isMapPage) {
    const map = new kakao.maps.Map(document.getElementById("map"), {
      center: new kakao.maps.LatLng(37.544345, 127.056743),
      level: 3
    });

    let allMarkers = [];
    kakao.maps.event.addListener(map, 'click', () => {
      if (fullCard.classList.contains("hidden")) {
        previewCard.classList.add("hidden");
      }
    });

    fetch("data/restaurants.json")
      .then(res => res.json())
      .then(locations => {
        const focusId = new URLSearchParams(location.search).get("id");
        let focusTarget = null;

        locations.forEach(loc => {
          const marker = new kakao.maps.Marker({
            map,
            position: new kakao.maps.LatLng(loc.lat, loc.lng),
            title: loc.title
          });

          kakao.maps.event.addListener(marker, 'click', () => showPreviewCard(loc));
          if (focusId && loc.id === focusId) focusTarget = { loc, marker };
          allMarkers.push({ marker, data: loc });
        });

        if (focusTarget) {
          map.setCenter(new kakao.maps.LatLng(focusTarget.loc.lat, focusTarget.loc.lng));
          map.setLevel(2);
          showPreviewCard(focusTarget.loc);
          focusTarget.marker.setAnimation(kakao.maps.Animation.BOUNCE);
        }
      });
  }

  // ✅ 2-6. 리스트 페이지 로직
  else {
    const tabSeongsu = document.getElementById("tab-seongsu");
    const tabTestlab = document.getElementById("tab-testlab");
    const mapButton = document.getElementById("map-button");

    const loadCards = (jsonPath) => {
      fetch(jsonPath)
        .then(res => res.json())
        .then(locations => {
          const container = document.getElementById("card-list");
          container.innerHTML = "";

          locations.forEach(loc => {
            const card = document.createElement("div");
            card.className = "flex bg-white rounded-xl shadow p-4 items-start gap-4 cursor-pointer hover:bg-gray-50 transition";
            card.innerHTML = `
              <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img src="${loc.images?.[0] || ''}" class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col justify-between min-w-0 flex-grow">
                <h3 class="font-bold text-base text-gray-800 truncate">${loc.title}</h3>
                <p class="text-sm text-gray-600 line-clamp-2">${loc.description || ''}</p>
                <div class="flex gap-3 text-xs text-gray-700 pt-1">
                  <span class="flex items-center gap-1"><span class="text-yellow-400">⭐</span> 상위 <strong>${loc.rating_high ?? '-'}</strong></span>
                  <span class="flex items-center gap-1"><span class="text-yellow-400">⭐</span> 일반 <strong>${loc.rating_low ?? '-'}</strong></span>
                </div>
              </div>`;
            card.addEventListener("click", () => showFullCard(loc));
            container.appendChild(card);
          });
        });
    };

    tabSeongsu.addEventListener("click", () => {
      tabSeongsu.classList.add("border-black", "text-black");
      tabTestlab.classList.remove("border-black", "text-black");
      mapButton.classList.remove("hidden");
      loadCards("data/restaurants.json");
    });

    tabTestlab.addEventListener("click", () => {
      tabTestlab.classList.add("border-black", "text-black");
      tabSeongsu.classList.remove("border-black", "text-black");
      mapButton.classList.add("hidden");
      loadCards("data/testlab.json");
    });

    tabSeongsu.click();
  }

  // ✅ 2-7. 리뷰 데이터 불러오기
  fetch("data/review.json")
    .then(res => res.json())
    .then(data => {
      reviewData = data;
    });
}

// ✅ 3. preview-card 표시 함수
function showPreviewCard(loc) {
  document.getElementById("preview-title").textContent = loc.title;
  document.getElementById("preview-description").textContent = loc.description || '';
  document.getElementById("preview-image").src = loc.images?.[0] || '';
  document.getElementById("info-preview-card").dataset.locationData = JSON.stringify(loc);
  document.getElementById("info-preview-card").classList.remove("hidden");
  document.getElementById("info-full-card").classList.add("hidden");
}

// ✅ 4. full-card 표시 함수
function showFullCard(loc) {
  document.getElementById("full-title").textContent = loc.title;
  document.getElementById("full-description").textContent = loc.description || '';
  document.getElementById("full-type").textContent = loc.category || '정보 없음';
  document.getElementById("review-button").href = `https://docs.google.com/forms/d/e/1FAIpQLScRA9YMa1AcckQ9RvhfuRyWzG9WW77iTZm1qJhqc0HdObb5Dg/viewform?entry.1819958639=${encodeURIComponent(loc.title)}&entry.844881344=${encodeURIComponent(loc.address || '')}&entry.443612047=${encodeURIComponent(loc.id)}`;
  document.getElementById("info-full-card").dataset.locationData = JSON.stringify(loc);
  document.getElementById("info-full-card").classList.remove("hidden");
  document.getElementById("info-preview-card").classList.add("hidden");
  // ✅ 리뷰 탭을 기본으로 표시
  activateTab("review-tab");

  const reviews = reviewData[loc.id] || [];
  const container = document.getElementById("review-list");
  container.innerHTML = reviews.length ? reviews.map(r => `
    <li class="review-card">
      <div class="review-header"><span>${r.작성자 || "익명"}</span><span>${r.작성일 || "날짜 없음"}</span></div>
      <div class="review-item"><strong>🍝 맛:</strong> ${r["맛"]}점<p class="comment">→ ${r["맛_코멘트"] || ""}</p></div>
      <div class="review-item"><strong>💸 가성비:</strong> ${r["가성비"]}점<p class="comment">→ ${r["가성비_코멘트"] || ""}</p></div>
      <div class="review-item"><strong>🎵 분위기:</strong> ${r["분위기"]}점<p class="comment">→ ${r["분위기_코멘트"] || ""}</p></div>
      <div class="review-item"><strong>🧼 친절·위생:</strong> ${r["친절위생"]}점<p class="comment">→ ${r["친절위생_코멘트"] || ""}</p></div>
      <div class="review-item"><strong>🌈 취향:</strong> ${r["개인취향"]}점<p class="comment">→ ${r["개인취향_코멘트"] || ""}</p></div>
      <div class="review-summary"><strong>📝 총평</strong><p>→ ${r["한줄평"] || ""}</p></div>
      ${r["hasFullReview"] && r["id"] ? `<div class="review-full-button"><a class="write-review-btn" href="full_reviews/${r["id"]}.html" target="_blank">📄 전체 리뷰 보기</a></div>` : ""}
      <div class="review-footer">⭐ 총점: <strong>${r["총점"]?.toFixed(1) ?? "?"}</strong></div>
    </li>`).join('') : "<li>아직 리뷰가 없습니다.</li>";

  initCarousel(loc.images || []);
}

// ✅ 5. 캐러셀
function initCarousel(images) {
  const container = document.getElementById("carousel-images");
  container.innerHTML = "";
  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    container.appendChild(img);
  });
  currentSlide = 0;
  updateCarousel();
}

function updateCarousel() {
  const container = document.getElementById("carousel-images");
  const total = container.children.length;
  container.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.getElementById("carousel-prev").style.display = currentSlide === 0 ? "none" : "block";
  document.getElementById("carousel-next").style.display = currentSlide === total - 1 ? "none" : "block";
}

document.addEventListener("click", (e) => {
  if (e.target.id === "carousel-prev") {
    currentSlide = Math.max(currentSlide - 1, 0);
    updateCarousel();
  }
  if (e.target.id === "carousel-next") {
    const total = document.getElementById("carousel-images").children.length;
    currentSlide = Math.min(currentSlide + 1, total - 1);
    updateCarousel();
  }
});


// ✅ 여기까지가 DOMContentLoaded의 끝

// ✅ 탭 전환 기능
const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");

    // 1. 모든 섹션 숨기기
    tabSections.forEach(section => section.classList.add("hidden"));

    // 2. 모든 버튼 스타일 초기화
    tabButtons.forEach(btn => {
      btn.classList.remove("text-blue-600", "border-b-2", "border-blue-500");
      btn.classList.add("text-gray-600");
    });

    // 3. 클릭한 섹션만 보이기
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.remove("hidden");

    // 4. 클릭한 버튼 스타일 적용
    button.classList.remove("text-gray-600");
    button.classList.add("text-blue-600", "border-b-2", "border-blue-500");
  });
});

function goToMapWithFocus() {
  const data = document.getElementById("info-full-card")?.dataset.locationData;
  if (!data) return;

  const location = JSON.parse(data);
  const locationId = encodeURIComponent(location.id);
  window.location.href = `map.html?id=${locationId}`;
}






