// Set the popup dimensions for Chrome extension
document.addEventListener('DOMContentLoaded', () => {
  // Chrome doesn't allow direct resizing of popups, but we can set the body dimensions
  document.body.style.width = '380px';
  document.body.style.height = '700px';
  document.body.style.overflow = 'auto';
});
