const imageInput = document.getElementById('imageInput');
const result = document.getElementById('result');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const classNames = ['acacia_images', 'aloe_vera_images', 'annona_images', 'apple_images', 'avocado_images', 'banana_images', 'carica_papaya_images', 'cassava_images', 'chili_images', 'coconut_images', 'coffee_images', 'cucumber_images', 'jackfruit_images', 'litchi_images', 'mango_images', 'peanut_images', 'plum_images', 'tea_images', 'tomato_images', 'watermelon_images']; // điền tên lớp của bạn ở đây

imageInput.addEventListener('change', async(e) => {
    const file = e.target.files[0];
    if (!file) return;

    const image = new Image();
    image.src = URL.createObjectURL(file);
    await new Promise(resolve => image.onload = resolve);

    // Resize ảnh về 224x224
    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(image, 0, 0, 224, 224);

    // Lấy pixel data và chuẩn hóa (giống ImageNet mean/std)
    const imgData = ctx.getImageData(0, 0, 224, 224);
    const { data } = imgData;

    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    const input = new Float32Array(1 * 3 * 224 * 224);
    for (let i = 0; i < 224 * 224; i++) {
        for (let c = 0; c < 3; c++) {
            const value = data[i * 4 + c] / 255.0;
            input[c * 224 * 224 + i] = (value - mean[c]) / std[c];
        }
    }

    // Tạo tensor đầu vào
    const tensor = new ort.Tensor("float32", input, [1, 3, 224, 224]);

    // Load và chạy mô hình
    const session = await ort.InferenceSession.create("plant_classifier.onnx");
    const feeds = { input: tensor };
    const output = await session.run(feeds);

    const scores = output.output.data;
    const maxIdx = scores.indexOf(Math.max(...scores));

    result.textContent = `Prediction: ${classNames[maxIdx]}`;
});