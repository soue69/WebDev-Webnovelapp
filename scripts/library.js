const user = getCurrentUser();

if (user) {
    document.getElementById('auth-gate').style.display = 'none';
    document.getElementById('library-content').style.display = 'block';
    loadLibrary();
}

async function loadLibrary() {
    const response = await fetch(`/api/library/${user.id}`);
    if (!response.ok) return;

    const novels = await response.json();
    const grid = document.getElementById('saved-grid');

    if (novels.length > 0) {
        grid.innerHTML = novels.map(novel => `
            <div class="auth-card" style="max-width: 100%; text-align: left; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${novel.genre}</span>
                    <button onclick="removeFromLibrary(${novel.id})" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.3rem 0.8rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Remove</button>
                </div>
                <h3 style="margin-top: 0.5rem; font-size: 1.4rem;">${novel.title}</h3>
                <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.8rem;">By ${novel.author}</p>
                <p style="font-size: 0.95rem; margin-bottom: 1rem;">${novel.synopsis}</p>
                <details style="cursor: pointer; background: rgba(0,0,0,0.03); padding: 0.8rem; border-radius: 8px;">
                    <summary style="font-weight: 600;">Read Chapter 1</summary>
                    <p style="margin-top: 0.8rem; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">${novel.content}</p>
                </details>
            </div>
        `).join('');
    } else {
        grid.innerHTML = `<div class="content-placeholder"><p>Your saved shelf is empty. Explore books on the homepage!</p></div>`;
    }
}

async function removeFromLibrary(novelId) {
    const response = await fetch('/api/library/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, novel_id: novelId })
    });

    if (response.ok) {
        loadLibrary();
    }
}