// --- CONFIGURATION ---
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// --- DOM ELEMENTS ---
const authSection = document.getElementById('auth-section');
const feedSection = document.getElementById('feed-section');
const authStatus = document.getElementById('auth-status');
const postsContainer = document.getElementById('posts-container');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const postForm = document.getElementById('post-form');

// --- STATE MANAGEMENT ---
let authToken = localStorage.getItem('authToken');

// --- API HELPER FUNCTIONS ---
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
    }
    return data;
}

// --- AUTH FUNCTIONS ---
async function register(username, email, password) {
    return apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
}

async function login(username, password) {
    const data = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    authToken = data.access;
    localStorage.setItem('authToken', authToken);
    return data;
}

function logout() {
    authToken = null;
    localStorage.removeItem('authToken');
    updateUI();
}

// --- POST FUNCTIONS ---
async function getPosts() {
    return apiRequest('/posts/');
}

async function createPost(title, content) {
    return apiRequest('/posts/', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
    });
}

// --- UI FUNCTIONS ---
function updateUI() {
    if (authToken) {
        authSection.classList.add('hidden');
        feedSection.classList.remove('hidden');
        authStatus.innerHTML = `<span>Logged In</span> <button id="logout-btn">Logout</button>`;
        document.getElementById('logout-btn').addEventListener('click', logout);
        loadPosts();
    } else {
        authSection.classList.remove('hidden');
        feedSection.classList.add('hidden');
        authStatus.innerHTML = '';
    }
}

async function loadPosts() {
    try {
        const posts = await getPosts();
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
                <h3>${post.title}</h3>
                <p>by ${post.author} on ${new Date(post.created_at).toLocaleString()}</p>
                <p>${post.content}</p>
            `;
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Failed to load posts:', error);
        alert('Could not load posts. Are you logged in?');
    }
}

// --- EVENT LISTENERS ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        await login(username, password);
        updateUI();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
        await register(username, email, password);
        alert('Registration successful! Please log in.');
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
});

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    try {
        await createPost(title, content);
        postForm.reset();
        loadPosts(); // Reload posts to show the new one
    } catch (error) {
        alert('Failed to create post: ' + error.message);
    }
});

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});