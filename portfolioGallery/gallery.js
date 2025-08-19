// Automatically load all PNG images in the folder
const imageFilenames = [
  'Screenshot 2025-08-19 083758.png',
  'Screenshot 2025-08-19 083814.png',
  'Screenshot 2025-08-19 083921.png',
  'Screenshot 2025-08-19 084512.png',
  'Screenshot 2025-08-19 084606.png',
  'Screenshot 2025-08-19 084628.png',
  'Screenshot 2025-08-19 084657.png',
  'Screenshot 2025-08-19 084809.png',
  'Screenshot 2025-08-19 084827.png',
  'Screenshot 2025-08-19 084852.png',
  'Screenshot 2025-08-19 085624.png',
  'Screenshot 2025-08-19 085639.png',
  'Screenshot 2025-08-19 085707.png',
  'Screenshot 2025-08-19 085724.png',
  'Screenshot 2025-08-19 085757.png',
  'Screenshot 2025-08-19 085845.png',
  'Screenshot 2025-08-19 085922.png',
  'Screenshot 2025-08-19 085937.png',
  'Screenshot 2025-08-19 090002.png',
  'Screenshot 2025-08-19 090027.png',
  'Screenshot 2025-08-19 090055.png',
  'Screenshot 2025-08-19 090128.png',
  'Screenshot 2025-08-19 090222.png',
  'Screenshot 2025-08-19 090250.png',
  'Screenshot 2025-08-19 090327.png'
];
const images = imageFilenames.map(f => ({ src: f }));

function setupCarousel() {
  const carousel = document.getElementById('carousel3d');
  let selected = 0;
  const n = images.length;
  const theta = 360 / n;
  const carouselRadius = 700;

  function renderCarousel() {
    carousel.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const frame = document.createElement('div');
      frame.className = 'carousel-img-frame' + (i === selected ? ' active' : '');
      frame.style.transform = `rotateY(${i * theta}deg) translateZ(${carouselRadius}px)`;
      const img = document.createElement('img');
      img.src = images[i].src;
      img.alt = '';
      frame.appendChild(img);
      frame.onclick = () => openModal(images[i].src);
      carousel.appendChild(frame);
    }
    carousel.style.transform = `translateZ(-${carouselRadius}px) rotateY(${-selected * theta}deg)`;
  }

  document.getElementById('carouselLeft').onclick = function() {
    selected = (selected - 1 + n) % n;
    renderCarousel();
  };
  document.getElementById('carouselRight').onclick = function() {
    selected = (selected + 1) % n;
    renderCarousel();
  };

  renderCarousel();
}

// Modal for expanded image
const modal = document.createElement('div');
modal.className = 'image-modal';
modal.innerHTML = '<span class="close-modal">&times;</span><img class="modal-img" src="" alt="">';
document.body.appendChild(modal);
const modalImg = modal.querySelector('.modal-img');
const closeModal = modal.querySelector('.close-modal');

function openModal(src) {
  modalImg.src = src;
  modal.style.display = 'flex';
}
function closeModalFunc() {
  modal.style.display = 'none';
  modalImg.src = '';
}
closeModal.onclick = closeModalFunc;
modal.onclick = function(e) { if (e.target === modal) closeModalFunc(); };

function addTestMessage() {
  const carousel = document.getElementById('carousel3d');
  if (carousel) {
    const testDiv = document.createElement('div');
    testDiv.textContent = 'JS is running';
    testDiv.style.color = 'yellow';
    testDiv.style.fontSize = '2rem';
    testDiv.style.position = 'absolute';
    testDiv.style.top = '10px';
    testDiv.style.left = '10px';
    carousel.appendChild(testDiv);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    addTestMessage();
    setupCarousel();
  });
} else {
  addTestMessage();
  setupCarousel();
}
