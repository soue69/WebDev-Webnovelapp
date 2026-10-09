from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, template_folder=BASE_DIR)
DB_FILE = os.path.join(BASE_DIR, 'database.db')

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            bio TEXT DEFAULT 'Crafting worlds one sentence at a time.'
        )
    ''')
    
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS novels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER,
            title TEXT NOT NULL,
            genre TEXT NOT NULL,
            synopsis TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users (id)
        )
    ''')

    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_novels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            novel_id INTEGER NOT NULL,
            UNIQUE(user_id, novel_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (novel_id) REFERENCES novels (id)
        )
    ''')

    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS novel_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            novel_id INTEGER NOT NULL,
            UNIQUE(user_id, novel_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (novel_id) REFERENCES novels (id)
        )
    ''')
    conn.commit()
    conn.close()


@app.route('/')
def home():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'pages'), filename)

@app.route('/style/<path:filename>')
def serve_style(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'style'), filename)

@app.route('/scripts/<path:filename>')
def serve_scripts(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'scripts'), filename)

@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'img'), filename)


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
        
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Account created successfully!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, bio FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True,
            'user': {'id': user[0], 'username': user[1], 'bio': user[2]}
        }), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/user/update', methods=['POST'])
def update_user():
    data = request.json
    user_id = data.get('id')
    username = data.get('username')
    bio = data.get('bio')

    if not user_id or not username:
        return jsonify({'error': 'User ID and Username are required'}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET username = ?, bio = ? WHERE id = ?', (username, bio, user_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'user': {'id': user_id, 'username': username, 'bio': bio}}), 200


@app.route('/api/novels/create', methods=['POST'])
def create_novel():
    data = request.json
    author_id = data.get('author_id')
    title = data.get('title')
    genre = data.get('genre')
    synopsis = data.get('synopsis')
    content = data.get('content')

    if not all([author_id, title, genre, synopsis, content]):
        return jsonify({'error': 'All fields are required'}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO novels (author_id, title, genre, synopsis, content) VALUES (?, ?, ?, ?, ?)',
        (author_id, title, genre, synopsis, content)
    )
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Novel published successfully!'}), 201

@app.route('/api/novels', methods=['GET'])
def get_all_novels():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT novels.id, novels.title, novels.genre, novels.synopsis, novels.content, novels.created_at, users.username,
               (SELECT COUNT(*) FROM novel_likes WHERE novel_id = novels.id) AS like_count
        FROM novels 
        JOIN users ON novels.author_id = users.id 
        ORDER BY novels.created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()

    novels = [{
        'id': r[0], 'title': r[1], 'genre': r[2], 
        'synopsis': r[3], 'content': r[4], 'created_at': r[5], 'author': r[6],
        'like_count': r[7]
    } for r in rows]

    return jsonify(novels), 200

@app.route('/api/novels/user/<int:user_id>', methods=['GET'])
def get_user_novels(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, genre, synopsis, content, created_at,
               (SELECT COUNT(*) FROM novel_likes WHERE novel_id = novels.id) AS like_count 
        FROM novels 
        WHERE author_id = ? 
        ORDER BY created_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()

    novels = [{
        'id': r[0], 'title': r[1], 'genre': r[2], 
        'synopsis': r[3], 'content': r[4], 'created_at': r[5], 'like_count': r[6]
    } for r in rows]

    return jsonify(novels), 200

@app.route('/api/novels/<int:novel_id>', methods=['DELETE'])
def delete_novel(novel_id):
    data = request.json or {}
    user_id = data.get('user_id')

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT author_id FROM novels WHERE id = ?', (novel_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({'error': 'Novel not found'}), 404
    if str(row[0]) != str(user_id):
        conn.close()
        return jsonify({'error': 'Unauthorized to delete this story'}), 403

    cursor.execute('DELETE FROM novels WHERE id = ?', (novel_id,))
    cursor.execute('DELETE FROM saved_novels WHERE novel_id = ?', (novel_id,))
    cursor.execute('DELETE FROM novel_likes WHERE novel_id = ?', (novel_id,))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Novel deleted successfully'}), 200


@app.route('/api/novels/like', methods=['POST'])
def toggle_like():
    data = request.json
    user_id = data.get('user_id')
    novel_id = data.get('novel_id')

    if not user_id or not novel_id:
        return jsonify({'error': 'User ID and Novel ID required'}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM novel_likes WHERE user_id = ? AND novel_id = ?', (user_id, novel_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute('DELETE FROM novel_likes WHERE user_id = ? AND novel_id = ?', (user_id, novel_id))
        liked = False
    else:
        cursor.execute('INSERT INTO novel_likes (user_id, novel_id) VALUES (?, ?)', (user_id, novel_id))
        liked = True

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'liked': liked}), 200

@app.route('/api/likes/user/<int:user_id>', methods=['GET'])
def get_user_likes(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT novel_id FROM novel_likes WHERE user_id = ?', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return jsonify([r[0] for r in rows]), 200


@app.route('/api/library/toggle', methods=['POST'])
def toggle_library():
    data = request.json
    user_id = data.get('user_id')
    novel_id = data.get('novel_id')

    if not user_id or not novel_id:
        return jsonify({'error': 'User ID and Novel ID required'}), 400

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM saved_novels WHERE user_id = ? AND novel_id = ?', (user_id, novel_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute('DELETE FROM saved_novels WHERE user_id = ? AND novel_id = ?', (user_id, novel_id))
        is_saved = False
    else:
        cursor.execute('INSERT INTO saved_novels (user_id, novel_id) VALUES (?, ?)', (user_id, novel_id))
        is_saved = True

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'saved': is_saved}), 200

@app.route('/api/library/<int:user_id>', methods=['GET'])
def get_saved_novels(user_id):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT novels.id, novels.title, novels.genre, novels.synopsis, novels.content, novels.created_at, users.username,
               (SELECT COUNT(*) FROM novel_likes WHERE novel_id = novels.id) AS like_count
        FROM saved_novels 
        JOIN novels ON saved_novels.novel_id = novels.id 
        JOIN users ON novels.author_id = users.id 
        WHERE saved_novels.user_id = ?
        ORDER BY saved_novels.id DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()

    novels = [{
        'id': r[0], 'title': r[1], 'genre': r[2], 
        'synopsis': r[3], 'content': r[4], 'created_at': r[5], 'author': r[6],
        'like_count': r[7]
    } for r in rows]

    return jsonify(novels), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)