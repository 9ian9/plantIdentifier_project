import torch.nn as nn
from torchvision import models

def create_model(num_classes):
    model = models.efficientnet_b3(pretrained=True)

    for param in model.parameters():
        param.requires_grad = False

    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, num_classes)


    for i, child in enumerate(model.features.children()):
        if i > 5:
            for param in child.parameters():
                param.requires_grad = True

    return model
