// ✅ DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", () => {

  const previewCard = document.getElementById("info-preview-card");
  const fullCard = document.getElementById("info-full-card");

  const mapContainer = document.getElementById("map");
  const mapOption = {
    center: new kakao.maps.LatLng(37.544345, 127.056743), // 성수역 중심
    level: 3
  };

  const map = new kakao.maps.Map(mapContainer, mapOption);
  let allMarkers = [];
  let currentSlide = 0;
  let reviewData = {}; // 추후 확장

  // ✅ 지도 클릭 시 preview 정보창 닫기 (단 fullCard가 떠 있지 않을 때만)
  kakao.maps.event.addListener(map, 'click', () => {
    if (fullCard.classList.contains("hidden")) {
      previewCard.classList.add("hidden");
    }
  });

  // ✅ 1. 마커 표시 restaurants.json 불러오기 
  fetch("data/restaurants.json")
    .then(res => res.json())
    .then(locations => {
      locations.forEach(location => {
        const marker = new kakao.maps.Marker({
          map,
          position: new kakao.maps.LatLng(location.lat, location.lng),
          title: location.title
        });

        kakao.maps.event.addListener(marker, 'click', () => {
          showPreviewCard(location);
        });

        allMarkers.push({ marker, data: location });
      });
    });


    // ✅ 2. 리뷰 데이터 불러오기
fetch("data/review.json")
  .then(res => res.json())
  .then(data => {
    reviewData = data;
    console.log("✅ 리뷰 데이터 불러오기 성공:", reviewData);
  })
  .catch(err => {
    console.error("❌ 리뷰 데이터 불러오기 실패:", err);
  });


  // ✅ 3. preview-card 표시
  function showPreviewCard(location) {
    document.getElementById("preview-title").textContent = location.title;
    document.getElementById("preview-description").textContent = location.description || '';
    document.getElementById("preview-image").src =
      location.images && location.images.length > 0 ? location.images[0] : '';
    document.getElementById("info-preview-card").dataset.locationData = JSON.stringify(location);
    document.getElementById("info-preview-card").classList.remove("hidden");
    document.getElementById("info-full-card").classList.add("hidden");
  }

  // ✅ 4. full-card 전환
  function showFullCard(location) {
    document.getElementById("full-title").textContent = location.title;
    document.getElementById("full-description").textContent = location.description || '';
    document.getElementById("full-type").textContent = location.category || '정보 없음';

    initCarousel(location.images || []);

    // ✅ 5. 리뷰 렌더링 (항목별 평가 + 코멘트 + 총평)
const reviews = reviewData[location.id] || [];

if (reviews.length > 0) {
  document.getElementById("review-list").innerHTML = reviews.map(r => `
    <li class="review-card">
      <div class="review-header">
        <span>${r.작성자 || "익명"}</span>
        <span>${r.작성일 || "날짜 없음"}</span>
      </div>

      <div class="review-item">
        <strong>🍝 맛:</strong> ${r["맛"]}점
        <p class="comment">→ ${r["맛_코멘트"] || ""}</p>
      </div>

      <div class="review-item">
        <strong>💸 가성비:</strong> ${r["가성비"]}점
        <p class="comment">→ ${r["가성비_코멘트"] || ""}</p>
      </div>

      <div class="review-item">
        <strong>🎵 분위기:</strong> ${r["분위기"]}점
        <p class="comment">→ ${r["분위기_코멘트"] || ""}</p>
      </div>

      <div class="review-item">
        <strong>🧼 친절·위생:</strong> ${r["친절위생"]}점
        <p class="comment">→ ${r["친절위생_코멘트"] || ""}</p>
      </div>

      <div class="review-item">
        <strong>🌈 취향:</strong> ${r["개인취향"]}점
        <p class="comment">→ ${r["개인취향_코멘트"] || ""}</p>
      </div>

      <div class="review-summary">
        <strong>📝 총평</strong>
        <p>→ ${r["한줄평"] || ""}</p>
      </div>

       ${r["hasFullReview"] && r["id"] ? `
      <div class="review-full-button">
        <a class="write-review-btn" href="full_reviews/${r["id"]}.html" target="_blank">📄 전체 리뷰 보기</a>
      </div>
    ` : ""}



      <div class="review-footer">
        ⭐ 총점: <strong>${r["총점"]?.toFixed(1) ?? "?"}</strong>
      </div>
    </li>
  `).join('');
} else {
  document.getElementById("review-list").innerHTML = "<li>아직 리뷰가 없습니다.</li>";
}


    // 리뷰 작성 링크 설정
    const title = encodeURIComponent(location.title);
    const address = encodeURIComponent(location.address || '');
    const id = encodeURIComponent(location.id || '');
    const formURL = `https://docs.google.com/forms/d/e/1FAIpQLScRA9YMa1AcckQ9RvhfuRyWzG9WW77iTZm1qJhqc0HdObb5Dg/viewform?entry.1819958639=${title}&entry.844881344=${address}&entry.443612047=${id}`;
    document.getElementById("review-button").href = formURL;

    document.getElementById("info-full-card").dataset.locationData = JSON.stringify(location);
    document.getElementById("info-full-card").classList.remove("hidden");
    document.getElementById("info-preview-card").classList.add("hidden");
  }

  // ✅ 버튼 연결
  const viewFullBtn = document.getElementById("view-full-button");
  if (viewFullBtn) {
    viewFullBtn.addEventListener("click", () => {
      const data = document.getElementById("info-preview-card").dataset.locationData;
      if (data) {
        const location = JSON.parse(data);
        showFullCard(location);
      }
    });
  }

   const backButton = document.getElementById("back-to-preview");
  if (backButton) {
    backButton.addEventListener("click", () => {
      const data = document.getElementById("info-full-card").dataset.locationData;
      if (data) {
        const location = JSON.parse(data);
        showPreviewCard(location);
      }
    });
  }

  const closePreviewBtn = document.getElementById("close-preview");
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", () => {
      document.getElementById("info-preview-card").classList.add("hidden");
    });
  }

  previewCard.addEventListener("click", (e) => {
  // 버튼 클릭 등은 무시하고 전체 카드 배경 클릭만 허용
  if (e.target.closest("button, a")) return;

  const data = previewCard.dataset.locationData;
  if (data) {
    const location = JSON.parse(data);
    showFullCard(location);
  }
});



  // ✅ 이미지 캐러셀
  function initCarousel(images) {
    const container = document.getElementById("carousel-images");
    container.innerHTML = "";
    images.forEach((src) => {
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

  document.getElementById("carousel-prev").addEventListener("click", () => {
    const total = document.getElementById("carousel-images").children.length;
    currentSlide = Math.max(currentSlide - 1, 0);
    updateCarousel();
  });

  document.getElementById("carousel-next").addEventListener("click", () => {
    const total = document.getElementById("carousel-images").children.length;
    currentSlide = Math.min(currentSlide + 1, total - 1);
    updateCarousel();
  });
});





