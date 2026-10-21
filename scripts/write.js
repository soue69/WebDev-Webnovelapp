const user = getCurrentUser();

if (!user) {
    document.getElementById('write-editor-panel').style.display = 'none';
    document.getElementById('auth-gate').style.display = 'block';
}

const selectedGenres = new Set();
const urlParams = new URLSearchParams(window.location.search);
const editNovelId = urlParams.get('edit');

const genreInputField = document.getElementById('genre-input');
if (genreInputField) {
    genreInputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addGenreTag();
        }
    });
}

function addGenreTag() {
    const input = document.getElementById('genre-input');
    const value = input.value.trim();
    if (!value) return;

    const formatted = value.charAt(0).toUpperCase() + value.slice(1);
    selectedGenres.add(formatted);
    input.value = '';
    renderGenreBadges();
}

function addSuggestedGenre(genreName) {
    selectedGenres.add(genreName);
    renderGenreBadges();
}

function removeGenreTag(genreName) {
    selectedGenres.delete(genreName);
    renderGenreBadges();
}

function renderGenreBadges() {
    const container = document.getElementById('genre-tags-list');
    container.innerHTML = Array.from(selectedGenres).map(genre => `
        <span class="tag active" style="font-size: 0.8rem; padding: 0.3rem 0.8rem; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${genre}
            <span onclick="removeGenreTag('${genre}')" style="cursor: pointer; font-weight: bold; margin-left: 4px;">&times;</span>
        </span>
    `).join('');
}

function previewCoverImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('cover-preview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function initEditor() {
    if (!editNovelId) return;

    const response = await fetch(`/api/novels/${editNovelId}`);
    if (!response.ok) {
        alert('Could not load novel for editing.');
        window.location.href = '/pages/account.html';
        return;
    }

    const novel = await response.json();

    const titleHeading = document.querySelector('#write-editor-panel h2');
    if (titleHeading) titleHeading.textContent = 'Edit Novel';

    const publishBtn = document.querySelector('.profile-save-btn');
    if (publishBtn) publishBtn.textContent = 'Update Story';

    document.getElementById('novel-title').value = novel.title;
    document.getElementById('novel-synopsis').value = novel.synopsis;
    document.getElementById('novel-content').value = novel.content;

    if (novel.cover_image) {
        document.getElementById('cover-preview').src = `/img/${novel.cover_image}`;
    }

    if (novel.genre) {
        novel.genre.split(',').forEach(g => {
            const trimmed = g.trim();
            if (trimmed) selectedGenres.add(trimmed);
        });
        renderGenreBadges();
    }
}

async function publishNovel() {
    const title = document.getElementById('novel-title').value.trim();
    const synopsis = document.getElementById('novel-synopsis').value.trim();
    const content = document.getElementById('novel-content').value.trim();
    const coverFileInput = document.getElementById('novel-cover');

    if (selectedGenres.size === 0) {
        alert('Please add at least one genre tag.');
        return;
    }

    if (!title || !synopsis || !content) {
        alert('Please fill out the title, synopsis, and novel content.');
        return;
    }

    const genreString = Array.from(selectedGenres).join(', ');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genreString);
    formData.append('synopsis', synopsis);
    formData.append('content', content);

    if (coverFileInput.files.length > 0) {
        formData.append('cover_image', coverFileInput.files[0]);
    }

    let url = '/api/novels/create';
    if (editNovelId) {
        formData.append('user_id', user.id);
        url = `/api/novels/${editNovelId}/update`;
    } else {
        formData.append('author_id', user.id);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (response.ok) {
        alert(editNovelId ? 'Novel updated successfully!' : 'Novel published successfully!');
        window.location.href = '/pages/account.html';
    } else {
        alert(data.error || 'Failed to save novel.');
    }
}

initEditor();