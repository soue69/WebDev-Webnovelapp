let currentFontSize = 1.1;

async function loadNovel() {
    const urlParams = new URLSearchParams(window.location.search);
    const novelId = urlParams.get('id');

    if (!novelId) {
        document.getElementById('reader-wrapper').innerHTML = `
            <h2>No story specified.</h2>
            <p><a href="/" style="color: inherit;">Return Home</a></p>
        `;
        return;
    }

    const response = await fetch(`/api/novels/${novelId}`);
    if (!response.ok) {
        document.getElementById('reader-wrapper').innerHTML = `
            <h2>Story not found.</h2>
            <p><a href="/" style="color: inherit;">Return Home</a></p>
        `;
        return;
    }

    const novel = await response.json();
    document.title = `${novel.title} - LEVON`;
    document.getElementById('read-title').textContent = novel.title;
    document.getElementById('read-author').innerHTML = `By <a href="/pages/profile.html?id=${novel.author_id}" style="color: inherit; text-decoration: underline; font-weight: 600;">${novel.author}</a>`;
    
    const synopsisEl = document.getElementById('read-synopsis');
    if (synopsisEl) {
        synopsisEl.textContent = novel.synopsis || '';
    }

    document.getElementById('read-content').textContent = novel.content;

    const coverImg = document.getElementById('read-cover-img');
    if (coverImg) {
        if (novel.cover_image) {
            coverImg.src = getMediaUrl(novel.cover_image);
            coverImg.style.display = 'block';
        } else {
            coverImg.style.display = 'none';
        }
    }

    const genres = (novel.genre || '').split(',').map(g => g.trim()).filter(Boolean);
    const genresContainer = document.getElementById('read-genres-container');
    if (genresContainer) {
        genresContainer.innerHTML = genres.map(g => `
            <span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${g}</span>
        `).join('');
    }
}

function adjustFontSize(delta) {
    currentFontSize = Math.max(0.8, Math.min(2.0, currentFontSize + delta * 0.1));
    document.getElementById('read-content').style.fontSize = `${currentFontSize}rem`;
}

loadNovel();