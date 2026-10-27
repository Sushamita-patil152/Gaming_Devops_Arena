// Function triggered by clicking card buttons
function launchGame(gameTitle) {
  const modal = document.getElementById('gameModal');
  const modalTitle = document.getElementById('modalGameTitle');
  modalTitle.innerText = `STARTING ${gameTitle.toUpperCase()}`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('gameModal');
  modal.style.display = 'none';
}

// Close on background click
window.onclick = function (event) {
  const modal = document.getElementById('gameModal');
  if (event.target === modal) {
    closeModal();
  }
};

// Simple commit hash rotator for CI/CD demonstration
document.addEventListener('DOMContentLoaded', () => {
  const hashElem = document.getElementById('commitHash');
  if (hashElem) {
    const gitHashes = ['a9f83c1', 'f3e82d0', 'b7c12a4', 'e5091ff'];
    // Random display or keep default blueprint commit
    console.log('[DevOps Hub] App initialized successfully on Nginx / AWS EC2');
  }
});