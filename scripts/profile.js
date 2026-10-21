const currentUser = getCurrentUser();
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('id');

async function initProfile() {
    if (!targetUserId) {
        window.location.href = '/';
        return;
    }

    if (currentUser && String(currentUser.id) === String(targetUserId)) {
        window.location.href = '/pages/account.html';
        return;
    }

    const res = await fetch(`/api/user/${targetUserId}/profile`);
    if (!res.ok) {
        alert('Profile not found.');
        window.location.href = '/';
        return;
    }

    const targetUserData = await res.json();
    document.title = `${targetUserData.username} - LEVON`;
    document.getElementById('user-profile-name').innerText = targetUserData.username;
    document.getElementById('user-profile-bio').innerText = targetUserData.bio || 'No bio provided.';
    document.getElementById('user-works-count').innerText = targetUserData.works_count;
    document.getElementById('author-works-title').innerText = `${targetUserData.username}'s Published Stories`;

    const imgEl = document.getElementById('user-avatar-img');
    const letterEl = document.getElementById('user-avatar-letter');
    if (targetUserData.avatar) {
        imgEl.src = `/img/${targetUserData.avatar}`;
        imgEl.style.display = 'flex';
        letterEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none';
        letterEl.style.display = 'flex';
        letterEl.innerText = targetUserData.username.charAt(0).toUpperCase();
    }

    loadAuthorNovels(targetUserId);
}

async function loadAuthorNovels(authorId) {
    const res = await fetch(`/api/novels/user/${authorId}`);
    const grid = document.getElementById('author-works-grid');
    if (!res.ok) return;

    const novels = await res.json();
    if (novels.length === 0) {
        grid.innerHTML = `<div class="content-placeholder" style="height: 250px;"><p>No stories published by this author yet.</p></div>`;
        return;
    }

    grid.innerHTML = novels.map(novel => {
        const coverSrc = novel.cover_image ? `/img/${novel.cover_image}` : 'https://placehold.co/110x155/e2e8f0/64748b?text=Cover';
        const genreBadges = (novel.genre || '')
            .split(',')
            .map(g => g.trim())
            .filter(Boolean)
            .map(g => `<span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${g}</span>`)
            .join('');

        return `
            <div class="auth-card" style="max-width: 100%; text-align: left; margin-bottom: 1.5rem;">
                <div class="novel-card-layout">
                    <img src="${coverSrc}" alt="${novel.title} cover" class="novel-cover-thumb">
                    <div class="novel-card-info">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                                ${genreBadges}
                            </div>
                            <span style="font-size: 0.85rem; font-weight: 600;">❤️ ${novel.like_count}</span>
                        </div>
                        <h3 style="margin-top: 0.5rem; font-size: 1.4rem;">${novel.title}</h3>
                        <p style="font-size: 0.95rem; margin: 0.8rem 0 1.2rem;">${novel.synopsis}</p>
                        <a href="/pages/read.html?id=${novel.id}" class="tag active" style="text-decoration: none; display: inline-block; font-size: 0.85rem; padding: 0.4rem 1.2rem;">
                            📖 Read Novel
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

initProfile();