const user = getCurrentUser();

if (user) {
    document.getElementById('auth-gate').style.display = 'none';
    document.getElementById('account-dashboard').style.display = 'grid';
    
    document.getElementById('profile-name').value = user.username || '';
    document.getElementById('profile-bio').value = user.bio || '';

    updateAvatarDisplay(user.avatar, user.username);
    loadProfileStats(user.id);
    loadMyWorks(user.id);
}

function updateAvatarDisplay(avatarUrl, username) {
    const imgEl = document.getElementById('avatar-img');
    const letterEl = document.getElementById('avatar-letter');
    if (avatarUrl) {
        imgEl.src = getMediaUrl(avatarUrl);
        imgEl.style.display = 'flex';
        letterEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none';
        letterEl.style.display = 'flex';
        letterEl.innerText = username ? username.charAt(0).toUpperCase() : 'U';
    }
}

async function loadProfileStats(userId) {
    const response = await fetch(`/api/user/${userId}/profile`);
    if (!response.ok) return;
    const data = await response.json();
    document.getElementById('stat-works').innerText = data.works_count;
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgEl = document.getElementById('avatar-img');
            const letterEl = document.getElementById('avatar-letter');
            imgEl.src = e.target.result;
            imgEl.style.display = 'flex';
            letterEl.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

async function loadMyWorks(userId) {
    const response = await fetch(`/api/novels/user/${userId}`);
    if (!response.ok) return;

    const novels = await response.json();
    const grid = document.querySelector('.works-grid');

    if (novels.length > 0) {
        grid.innerHTML = novels.map(novel => {
            const coverSrc = novel.cover_image 
                ? getMediaUrl(novel.cover_image) 
                : 'https://placehold.co/110x155/e2e8f0/64748b?text=Cover';

            const genrePills = (novel.genre || '').split(',').map(g => g.trim()).filter(Boolean).map(g => `
                <span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${g}</span>
            `).join('');

            return `
                <div class="auth-card" style="max-width: 100%; text-align: left; margin-bottom: 1rem;">
                    <div class="novel-card-layout">
                        <img src="${coverSrc}" alt="${novel.title} cover" class="novel-cover-thumb">
                        <div class="novel-card-info">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">${genrePills}</div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <a href="/pages/write.html?edit=${novel.id}" class="tag" style="background: var(--nav-bg); text-decoration: none; font-size: 0.8rem; padding: 0.3rem 0.8rem; font-weight: 600;">Edit</a>
                                    <button onclick="deleteNovel(${novel.id})" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.3rem 0.8rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Delete</button>
                                </div>
                            </div>
                            <h3 style="margin-top: 0.5rem; font-size: 1.2rem;">${novel.title}</h3>
                            <p style="font-size: 0.85rem; margin-top: 0.5rem;">${novel.synopsis}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        grid.innerHTML = `<div class="content-placeholder" style="height: 250px;"><p>You haven't written any web novels yet.</p></div>`;
    }
}

async function deleteNovel(novelId) {
    if (!confirm('Are you sure you want to delete this novel?')) return;

    const response = await fetch(`/api/novels/${novelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
    });

    if (response.ok) {
        loadMyWorks(user.id);
        loadProfileStats(user.id);
    } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete novel');
    }
}

async function saveProfile() {
    if (!user) return;

    const updatedName = document.getElementById('profile-name').value.trim();
    const updatedBio = document.getElementById('profile-bio').value.trim();
    const avatarInput = document.getElementById('avatar-file');

    if (!updatedName) {
        alert('Display Name is required.');
        return;
    }

    const formData = new FormData();
    formData.append('id', user.id);
    formData.append('username', updatedName);
    formData.append('bio', updatedBio);

    if (avatarInput.files.length > 0) {
        formData.append('avatar_image', avatarInput.files[0]);
    }

    const response = await fetch('/api/user/update', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        updateAvatarDisplay(data.user.avatar, data.user.username);
        alert('Settings saved successfully!');
    } else {
        alert(data.error || 'Failed to update profile.');
    }
}