const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
  navLinks.classList.toggle("open");

  const isOpen = navLinks.classList.contains("open");
  menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
  navLinks.classList.remove("open");
  menuBtnIcon.setAttribute("class", "ri-menu-line");
});

const scrollRevealOption = {
  origin: "bottom",
  distance: "50px",
  duration: 1000,
};

ScrollReveal().reveal(".header__image img", {
  ...scrollRevealOption,
  origin: "right",
});
ScrollReveal().reveal(".header__content p", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".header__content h1", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".header__btns", {
  ...scrollRevealOption,
  delay: 1500,
});

ScrollReveal().reveal(".destination__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".showcase__image img", {
  ...scrollRevealOption,
  origin: "left",
});
ScrollReveal().reveal(".showcase__content h4", {
  ...scrollRevealOption,
  delay: 500,
});
ScrollReveal().reveal(".showcase__content p", {
  ...scrollRevealOption,
  delay: 1000,
});
ScrollReveal().reveal(".showcase__btn", {
  ...scrollRevealOption,
  delay: 1500,
});

ScrollReveal().reveal(".banner__card", {
  ...scrollRevealOption,
  interval: 500,
});

ScrollReveal().reveal(".discover__card", {
  ...scrollRevealOption,
  interval: 500,
});

const swiper = new Swiper(".swiper", {
  slidesPerView: 3,
  spaceBetween: 20,
  loop: true,
});

const scrollContainer = document.querySelector(".container-scroll");
const scrollTitle = document.querySelector(".container-scroll__title");
const scrollCard = document.querySelector(".container-scroll__card");

if (scrollContainer && scrollTitle && scrollCard) {
  let ticking = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateScrollCardAnimation = () => {
    const rect = scrollContainer.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const totalRange = rect.height + viewportHeight;
    const rawProgress = (viewportHeight - rect.top) / totalRange;
    const progress = clamp(rawProgress, 0, 1);
    const isMobile = window.innerWidth <= 768;

    const rotateX = 20 * (1 - progress);
    const translateY = -100 * progress;
    const startScale = isMobile ? 0.7 : 1.05;
    const endScale = isMobile ? 0.9 : 1;
    const scale = startScale + (endScale - startScale) * progress;

    scrollTitle.style.transform = `translate3d(0, ${translateY}px, 0)`;
    scrollCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) scale(${scale})`;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollCardAnimation();
        ticking = false;
      });
      ticking = true;
    }
  };

  updateScrollCardAnimation();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollCardAnimation);
}
