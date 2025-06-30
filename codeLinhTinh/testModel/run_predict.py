import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np
from model import create_model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load class names
with open('plant_class_names.txt', 'r') as f:
    class_names = [line.strip() for line in f.readlines()]

data_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def predict_image(image_path, model, class_names):
    image = Image.open(image_path).convert('RGB')
    image_tensor = data_transforms(image).unsqueeze(0).to(device)

    model.eval()
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = F.softmax(outputs, dim=1)
        _, preds = torch.max(outputs, 1)

    predicted_class = class_names[preds.item()]
    confidence = probabilities[0][preds.item()].item()

    plt.imshow(np.array(image))
    plt.title(f'{predicted_class} ({confidence:.2f})')
    plt.axis('off')
    plt.show()

    print("Top 3 dự đoán:")
    top3_prob, top3_labels = torch.topk(probabilities, 3)
    for i in range(3):
        print(f"{class_names[top3_labels[0][i]]}: {top3_prob[0][i].item():.4f}")

def main():
    model = create_model(len(class_names)).to(device)
    model.load_state_dict(torch.load('plant_classification_model.pth', map_location=device))
    image_path = input("Nhập đường dẫn ảnh cần dự đoán: ")
    predict_image(image_path, model, class_names)

if __name__ == '__main__':
    main()
