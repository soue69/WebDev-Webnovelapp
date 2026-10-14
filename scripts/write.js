const user = getCurrentUser();

if (!user) {
    document.getElementById('write-editor-panel').style.display = 'none';
    document.getElementById('auth-gate').style.display = 'block';
}

async function publishNovel() {
    const title = document.getElementById('novel-title').value.trim();
    const genre = document.getElementById('novel-genre').value.trim();
    const synopsis = document.getElementById('novel-synopsis').value.trim();
    const content = document.getElementById('novel-content').value.trim();

    if (!title || !genre || !synopsis || !content) {
        alert('Please fill out all fields before publishing.');
        return;
    }

    const response = await fetch('/api/novels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            author_id: user.id,
            title,
            genre,
            synopsis,
            content
        })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Novel published successfully!');
        window.location.href = '/pages/account.html';
    } else {
        alert(data.error || 'Failed to publish novel.');
    }
}