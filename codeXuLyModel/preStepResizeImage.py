import os
import cv2
from PIL import Image
import numpy as np


def normalize_images(input_folder, output_folder, target_size=(224, 224)):
    # Tạo thư mục đầu ra nếu chưa tồn tại
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Lấy danh sách file ảnh
    image_files = [f for f in os.listdir(input_folder)
                   if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

    for i, img_file in enumerate(image_files):
        try:
            # Đọc ảnh
            img_path = os.path.join(input_folder, img_file)

            # Sử dụng OpenCV để đọc ảnh
            img = cv2.imread(img_path)

            # Chuyển đổi từ BGR (OpenCV) sang RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Resize ảnh
            img = cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)

            # Chuẩn hóa giá trị pixel về [0,1]
            img_normalized = img / 255.0

            # Lưu ảnh đã chuẩn hóa (có thể lưu dưới dạng numpy array hoặc ảnh)
            output_path = os.path.join(output_folder, img_file)

            # Để lưu dưới dạng ảnh (giá trị pixel sẽ được nhân lại 255)
            img_to_save = (img_normalized * 255).astype(np.uint8)
            Image.fromarray(img_to_save).save(output_path)

            print(f"Processed {i + 1}/{len(image_files)}: {img_file}")

        except Exception as e:
            print(f"Error processing {img_file}: {str(e)}")


input_folder = "F:/code_XLSS/data/banana_images" 
output_folder = "output/banana_images"  

normalize_images(input_folder, output_folder)