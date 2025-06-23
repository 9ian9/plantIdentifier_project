const ort = require('onnxruntime');
const sharp = require('sharp');

/**
 * Hàm nhận ảnh buffer, chạy predict trên onnxSession đã load sẵn
 * @param {Buffer} bufferImage - ảnh dạng Buffer
 * @param {ort.InferenceSession} onnxSession - phiên ONNX session đã load
 * @returns {Promise<number>} - chỉ số class dự đoán
 */
async function predictPlant(bufferImage, onnxSession) {
    if (!onnxSession) throw new Error('ONNX session chưa được khởi tạo');

    // Resize ảnh, chuyển sang raw RGB 224x224, float32 và chuẩn hóa (0-1)
    const { data, info } = await sharp(bufferImage)
        .resize(224, 224)
        .removeAlpha() // loại bỏ alpha nếu có
        .raw()
        .toBuffer({ resolveWithObject: true });

    // Chuyển dữ liệu sang Float32Array và chuẩn hóa
    const floatData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
        floatData[i] = data[i] / 255.0;
    }

    const chwData = new Float32Array(3 * 224 * 224);
    for (let i = 0; i < 224 * 224; i++) {
        chwData[i] = floatData[i * 3]; // R channel
        chwData[i + 224 * 224] = floatData[i * 3 + 1]; // G channel
        chwData[i + 2 * 224 * 224] = floatData[i * 3 + 2]; // B channel
    }

    // Tạo tensor input
    const tensor = new ort.Tensor('float32', chwData, [1, 3, 224, 224]);

    const feeds = {};
    feeds[onnxSession.inputNames[0]] = tensor;

    // Chạy inference
    const results = await onnxSession.run(feeds);

    // Lấy output (giả sử tên output đầu tiên)
    const output = results[onnxSession.outputNames[0]].data;

    // Tìm chỉ số max confidence
    let maxIdx = 0;
    let maxVal = output[0];
    for (let i = 1; i < output.length; i++) {
        if (output[i] > maxVal) {
            maxVal = output[i];
            maxIdx = i;
        }
    }
    console.log('maxVal: ', maxVal);
    // Nếu confidence thấp hơn ngưỡng, trả về -1 (không xác định)
    const CONFIDENCE_THRESHOLD = 5;
    if (maxVal < CONFIDENCE_THRESHOLD) {
        return -1;
    }

    return maxIdx;
}

module.exports = { predictPlant };