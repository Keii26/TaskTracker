const GAS_URL = "https://script.google.com/macros/s/AKfycbw0rPylz3gFmrLlOHHP4nnu4uY3bYyWPuzrBYPbqBGmIQyolyCZi96wVM0OahbOXgtPPQ/exec"; 

let tasks = [];

// 1. FUNGSI SIDEBAR (Sesuai ID 'mobile-menu' di HTML kamu)
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('mobile-menu');

    if (menuToggle && sidebar) {
        menuToggle.onclick = function() {
            // Toggle class 'active' buat munculin sidebar
            sidebar.classList.toggle('active');
            // Toggle class 'is-active' buat animasi hamburger jadi (X)
            menuToggle.classList.toggle('is-active');
        };
    }
}

// 2. AMBIL DATA DARI GAS
async function fetchTasks() {
    const taskList = document.getElementById('task-list');
    if (taskList) taskList.innerHTML = "<p style='color:white; text-align:center;'>Loading tasks...</p>";
    
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        
        tasks = data.map(item => ({
            mapel: item.mapel || "Tanpa Mapel",
            desc: item.desc || "Tidak ada deskripsi",
            date: item.date || "2026-01-01", 
            uploadDate: item.timestamp || new Date().toISOString()
        }));

        renderTasks();
    } catch (error) {
        console.error("ERROR:", error);
        if (taskList) taskList.innerHTML = `<p style="color:white;">Error: ${error.message}</p>`;
    }
}

// 3. PENERJEMAH TANGGAL
function formatDeadline(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return "Date Error";
    const hariArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanArr = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${hariArr[d.getDay()]}, ${d.getDate()} ${bulanArr[d.getMonth()]}`;
}

function formatUploadTime(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return "Time Error";
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${jam}:${menit} WIB`;
}

// 4. RENDER KE LAYAR
function renderTasks() {
    const taskList = document.getElementById('task-list');
    const taskCountLabel = document.getElementById('task-count');
    const nearestLabel = document.getElementById('nearest-deadline');
    
    if (!taskList) return;
    taskList.innerHTML = "";
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const activeTasks = tasks.filter(task => {
        const deadlineDate = new Date(task.date);
        const deadlineTime = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime();
        return deadlineTime >= todayStart;
    });

    const sortedTasks = [...activeTasks].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (taskCountLabel) taskCountLabel.innerText = sortedTasks.length;
    if (nearestLabel && sortedTasks.length > 0) {
        nearestLabel.innerText = sortedTasks[0].mapel;
    }

    if (sortedTasks.length === 0) {
        taskList.innerHTML = "<p style='color:white; text-align:center;'>No Tasks Available!</p>";
        return;
    }

    sortedTasks.forEach(task => {
        const deadlineDate = new Date(task.date);
        const deadlineTime = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime();
        const diffDays = Math.ceil((deadlineTime - todayStart) / (1000 * 60 * 60 * 24));
        
        let glowClass = "glow-green";
        let textColor = "var(--green)";

        if (diffDays < 3) {
            glowClass = "glow-red";
            textColor = "var(--red)";
        } else if (diffDays <= 5) {
            glowClass = "glow-yellow";
            textColor = "var(--yellow)";
        }

        const card = document.createElement('div');
        card.className = `card ${glowClass}`; 
        card.innerHTML = `
            <div class="card-header">
                <div class="mapel-name">${task.mapel}</div>
                <div class="deadline-box" style="color: ${textColor};">
                    ${formatDeadline(task.date)}
                </div>
            </div>
            <div class="desc-container">
                <p class="desc-text truncated">${task.desc}</p>
                <small style="color: #64748b; display: block; margin-top: 10px; font-size: 0.7rem;">
                    Uploaded at ${formatUploadTime(task.uploadDate)}
                </small>
            </div>
        `;
        
        // Fitur Klik Expand Deskripsi
        card.style.cursor = "pointer";
        card.onclick = function() {
            const p = this.querySelector('.desc-text');
            p.classList.toggle('truncated');
        };

        taskList.appendChild(card);
    });
}

// 5. JALANKAN SEMUA SETELAH HALAMAN SIAP
window.onload = () => {
    initSidebar();
    fetchTasks();
};