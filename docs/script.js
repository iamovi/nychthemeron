// ─── THEME TOGGLE ───────────────────────────────────────────────────────────
const html = document.documentElement;
const toggleBtn = document.getElementById('themeToggle');

// Restore saved preference on load
const saved = localStorage.getItem('nychthemeron-theme') || localStorage.getItem('genjutsu-theme');
if (saved === 'light') html.classList.replace('dark', 'light');

toggleBtn.addEventListener('click', () => {
    if (html.classList.contains('dark')) {
        html.classList.replace('dark', 'light');
        localStorage.setItem('nychthemeron-theme', 'light');
    } else {
        html.classList.replace('light', 'dark');
        localStorage.setItem('nychthemeron-theme', 'dark');
    }
});



