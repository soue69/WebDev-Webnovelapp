const user = getCurrentUser();

if (user) {
    document.getElementById('auth-gate').style.display = 'none';
    document.getElementById('account-dashboard').style.display = 'grid';
    
    document.getElementById('profile-name').value = user.username || '';
    document.getElementById('profile-bio').value = user.bio || '';
    document.getElementById('avatar-letter').innerText = user.username ? user.username.charAt(0).toUpperCase() : 'U';

    loadMyWorks(user.id);
}

async function loadMyWorks(userId) {
    const response = await fetch(`/api/novels/user/${userId}`);
    if (!response.ok) return;

    const novels = await response.json();
    const grid = document.querySelector('.works-grid');

    if (novels.length > 0) {
        grid.innerHTML = novels.map(novel => `
            <div class="auth-card" style="max-width: 100%; text-align: left; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="tag active" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;">${novel.genre}</span>
                    <button onclick="deleteNovel(${novel.id})" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.3rem 0.8rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Delete</button>
                </div>
                <h3 style="margin-top: 0.5rem; font-size: 1.2rem;">${novel.title}</h3>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">${novel.synopsis}</p>
            </div>
        `).join('');
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
    } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete novel');
    }
}

async function saveProfile() {
    if (!user) return;

    const updatedName = document.getElementById('profile-name').value;
    const updatedBio = document.getElementById('profile-bio').value;

    const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, username: updatedName, bio: updatedBio })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        document.getElementById('avatar-letter').innerText = updatedName.charAt(0).toUpperCase();
        alert('Settings saved successfully!');
    } else {
        alert(data.error || 'Failed to update profile.');
    }
}