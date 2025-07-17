import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision
from torchvision import transforms, models, datasets
import torch.nn.functional as F
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
class_names = ['acacia_images', 'aloe_vera_images', 'annona_images', 'apple_images', 'avocado_images', 'banana_images', 'carica_papaya_images', 'cassava_images', 'chili_images', 'coconut_images', 'coffee_images', 'cucumber_images', 'jackfruit_images', 'litchi_images', 'mango_images', 'peanut_images', 'plum_images', 'tea_images', 'tomato_images', 'watermelon_images']
data_transforms = {
    'train': transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'test': transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
}
def create_model(num_classes):
    # model = models.efficientnet_b3(pretrained=True)
    model = models.efficientnet_b5(pretrained=True)

    for param in model.parameters():
        param.requires_grad = False

    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(num_ftrs, len(class_names))
)

    for i, child in enumerate(model.features.children()):
        if i > 5: 
            for param in child.parameters():
                param.requires_grad = True

    return model.to(device)
def predict_image(image_path, model, class_names):
    transform = data_transforms['test']
    image = Image.open(image_path).convert('RGB')

    image_tensor = transform(image).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = F.softmax(outputs, dim=1)
        _, preds = torch.max(outputs, 1)

    predicted_class = class_names[preds.item()]
    confidence = probabilities[0][preds.item()].item()

    plt.figure(figsize=(6, 6))
    plt.imshow(np.array(image))
    plt.title(f'Dự đoán: {predicted_class}\nĐộ tin cậy: {confidence:.2f}')
    plt.axis('off')
    plt.show()

    # Trả về top 3 dự đoán
    top3_prob, top3_labels = torch.topk(probabilities, 3)
    top3_prob = top3_prob.cpu().numpy()[0]
    top3_labels = top3_labels.cpu().numpy()[0]

    print("Top 3 dự đoán:")
    for i in range(3):
        print(f"{class_names[top3_labels[i]]}: {top3_prob[i]:.4f}")

    return predicted_class, confidence

# Tải lại model (để kiểm tra)
def load_model(model_path, num_classes):
    model = create_model(num_classes)
    model.load_state_dict(torch.load(model_path))
    model.eval()
    return model

def create_prediction_app():
    # Load model và class names
    model_path = 'plant_classification_model.pth'
    class_names_path = 'plant_class_names.txt'

    with open(class_names_path, 'r') as f:
        class_names = [line.strip() for line in f.readlines()]

    # Tải model
    model = load_model(model_path, len(class_names))

    print("-------------------------------")
    print("ỨNG DỤNG NHẬN DIỆN LOÀI CÂY")
    print("-------------------------------")

    image_path = input("Nhập đường dẫn đến ảnh cần dự đoán: ")

    # Dự đoán và hiển thị kết quả
    predicted_class, confidence = predict_image(image_path, model, class_names)

    return predicted_class, confidence

create_prediction_app()