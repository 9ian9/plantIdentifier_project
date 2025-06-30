import torch
from model import create_model

# Dummy input có cùng shape với input thực tế của bạn (ví dụ ảnh 3x224x224)
dummy_input = torch.randn(1, 3, 224, 224)
# Load class names
with open('plant_class_names.txt', 'r') as f:
    class_names = [line.strip() for line in f.readlines()]
# Load mô hình đã train (.pth)
model = create_model(len(class_names))
# Tải mô hình đã huấn luyện nếu cần
model.load_state_dict(torch.load("plant_classification_model.pth", map_location=torch.device('cpu')))
model.eval()

# Xuất sang ONNX
torch.onnx.export(
    model, 
    dummy_input, 
    "plant_classifier.onnx",       # tên file lưu
    input_names=["input"], 
    output_names=["output"], 
    dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    opset_version=11               # nên dùng >=11 để tương thích tốt
)
