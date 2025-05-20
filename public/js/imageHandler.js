const imageUpload = document.getElementById('image-upload');
const previewContainer = document.getElementById('imagePreviewContainer');
const previewImg = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removePreviewBtn');
const attachBtn = document.querySelector('.attach-btn');

// Image Upload Functions
function setupImageHandlers() {
    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            imageUpload.click();
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            clearImagePreview();
        });
    }
}

function clearImagePreview() {
    previewImg.src = '';
    previewContainer.style.display = 'none';
    imageUpload.value = '';
}

async function uploadImage(file, message = '', sessionId = null) {
    const formData = new FormData();
    formData.append('plantImage', file);
    if (message) formData.append('message', message);
    if (sessionId) formData.append('sessionId', sessionId);

    const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    return await uploadRes.json();
}

function hasImage() {
    return imageUpload.files && imageUpload.files.length > 0;
}

function getImageFile() {
    return imageUpload.files[0];
}

export {
    setupImageHandlers,
    uploadImage,
    clearImagePreview,
    hasImage,
    getImageFile,
    imageUpload,
    previewContainer,
    previewImg
};