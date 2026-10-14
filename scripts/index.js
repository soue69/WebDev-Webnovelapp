const currentUser = getCurrentUser();
let allNovels = [];
let savedIds = new Set();
let likedIds = new Set();
let currentFilter = 'popular';
let selectedGenre = 'All';

async function initPage() {
    if (currentUser) {
        const [libRes, likeRes] = await Promise.all([
            fetch(`/api/library/${currentUser.id}`),
            fetch(`/api/likes/user/${currentUser.id}`)
        ]);
        if (libRes.ok) {
            const saved = await libRes.json();
            savedIds = new Set(saved.map(n => n.id));
        }
        if (likeRes.ok) {
            const liked = await likeRes.json();
            likedIds = new Set(liked);
        }
    }
    fetchNovels();
}

async function fetchNovels() {
    const response = await fetch('/api/novels');
    if (!response.ok) return;
    allNovels = await response.json();
    setupGenrePills();
    renderNovels();
}

function setupGenrePills() {
    const genres = ['All', ...new Set(allNovels.map(n => n.genre.trim()))];
    const pillContainer = document.getElementById('genre-pills');
    pillContainer.innerHTML = genres.map(g => `
        <button onclick="selectGenre('${g}')" class="tag ${selectedGenre === g ? 'active' : ''}" style="font-size: 0.8rem; padding: 0.3rem 0.8rem; background: ${selectedGenre === g ? '' : 'var(--nav-bg)'}">
            ${g}
        </button>
    `).join('');
}

function selectGenre(genre) {
    selectedGenre = genre;
    setupGenrePills();
    renderNovels();
}

function setFilter(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.tags-container .tag').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filterType}`).classList.add('active');

    const pillContainer = document.getElementById('genre-pills');
    pillContainer.style.display = (filterType === 'genre') ? 'flex' : 'none';

    renderNovels();
}

function renderNovels() {
    const grid = document.querySelector('.content-grid');
    const search = document.getElementById('search-input').value.toLowerCase();

    let filtered = [...allNovels];

    if (currentFilter === 'popular') {
        filtered.sort((a, b) => b.like_count - a.like_count);
    } else if (currentFilter === 'new') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (currentFilter === 'genre' && selectedGenre !== 'All') {
        filtered = filtered.filter(n => n.genre.toLowerCase() === selectedGenre.toLowerCase());
    }

    if (search) {
        filtered = filtered.filter(n => 
            n.title.toLowerCase().includes(search) || 
            n.author.toLowerCase().includes(search) || 
            n.genre.toLowerCase().includes(search)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="content-placeholder"><p>No novels found.</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(novel => {
        const isSaved = savedIds.has(novel.id);
        const isLiked = likedIds.has(novel.id);
        return `
            <div class="auth-card" style="max-width: 100%; text-align: left; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${novel.genre}</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="toggleLike(${novel.id})" style="background: ${isLiked ? '#ec4899' : 'var(--nav-bg)'}; color: ${isLiked ? '#fff' : 'inherit'}; border: 1px solid var(--nav-border); border-radius: 12px; padding: 0.3rem 0.8rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">
                            ❤️ ${novel.like_count}
                        </button>
                        <button onclick="toggleBookmark(${novel.id})" style="background: ${isSaved ? '#10b981' : 'var(--nav-bg)'}; color: ${isSaved ? '#fff' : 'inherit'}; border: 1px solid var(--nav-border); border-radius: 12px; padding: 0.3rem 0.8rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">
                            ${isSaved ? '✓ In Library' : '+ Add to Library'}
                        </button>
                    </div>
                </div>
                <h3 style="margin-top: 0.5rem; font-size: 1.4rem;">${novel.title}</h3>
                <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.8rem;">By ${novel.author}</p>
                <p style="font-size: 0.95rem; margin-bottom: 1rem;">${novel.synopsis}</p>
                <details style="cursor: pointer; background: rgba(0,0,0,0.03); padding: 0.8rem; border-radius: 8px;">
                    <summary style="font-weight: 600; color: var(--text-color);">📖 Read Now</summary>
                    <p style="margin-top: 0.8rem; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">${novel.content}</p>
                </details>
            </div>
        `;
    }).join('');
}

async function toggleLike(novelId) {
    if (!currentUser) {
        alert('Please log in to like novels.');
        window.location.href = '/pages/auth.html';
        return;
    }

    const response = await fetch('/api/novels/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, novel_id: novelId })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.liked) {
            likedIds.add(novelId);
        } else {
            likedIds.delete(novelId);
        }
        fetchNovels();
    }
}

async function toggleBookmark(novelId) {
    if (!currentUser) {
        alert('Please log in to save novels to your library.');
        window.location.href = '/pages/auth.html';
        return;
    }

    const response = await fetch('/api/library/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, novel_id: novelId })
    });

    const data = await response.json();
    if (response.ok) {
        if (data.saved) {
            savedIds.add(novelId);
        } else {
            savedIds.delete(novelId);
        }
        renderNovels();
    }
}

initPage();