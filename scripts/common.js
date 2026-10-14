const modeToggle = document.getElementById('mode-toggle');

if (modeToggle) {
    if (localStorage.getItem('readingMode') === 'true') {
        modeToggle.checked = true;
        document.body.classList.add('reading-mode');
    }

    modeToggle.addEventListener('change', () => {
        document.body.classList.toggle('reading-mode');
        localStorage.setItem('readingMode', modeToggle.checked);
    });
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    window.location.reload();
}