document.addEventListener('DOMContentLoaded', () => {
  const lazyVideos = document.querySelectorAll('video[data-src]');
  if (!lazyVideos.length) return;

  const loadVideo = (video) => {
    if (video.src) return;

    video.src = video.dataset.src;
    video.removeAttribute('data-src');
    video.load();
    video.play?.().catch(() => {});
  };

  if (!('IntersectionObserver' in window)) {
    lazyVideos.forEach(loadVideo);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        loadVideo(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '450px 0px' }
  );

  lazyVideos.forEach((video) => observer.observe(video));
});
