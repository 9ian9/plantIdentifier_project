import requests
import os
import time
from urllib.parse import urlparse
from datetime import datetime

# Tạo thư mục lưu ảnh
output_dir = "banana_images"
os.makedirs(output_dir, exist_ok=True)


def download_image(url, observation_id, photo_index):
    try:
        # Thay đổi kích thước ảnh (original, medium, large, small, thumb, square)
        image_url = url.replace("square", "original")  # Lấy ảnh gốc chất lượng cao

        response = requests.get(image_url, stream=True, timeout=10)
        response.raise_for_status()

        # Tạo tên file theo cấu trúc
        timestamp = datetime.now().strftime("%Y%m%d")
        filename = f"banana_{observation_id}_{photo_index}_{timestamp}.jpg"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)

        print(f"Đã tải ảnh: {filename}")
        return filepath

    except Exception as e:
        print(f"Lỗi khi tải ảnh {url}: {str(e)}")
        return None


def get_and_download_mangifera_photos(total_photos=1200):
    page = 1
    per_page = 200  # Số lượng tối đa mỗi trang (API cho phép tối đa 200)
    downloaded_count = 0

    while downloaded_count < total_photos:
        url = f"https://api.inaturalist.org/v1/observations?taxon_id=62911&photos=true&page={page}&per_page={per_page}"

        try:
            # Thêm delay giữa các request
            time.sleep(1)  # Đảm bảo không vượt quá giới hạn API

            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()

            if not data['results']:
                print("Không còn dữ liệu để tải")
                break

            for observation in data['results']:
                if observation.get('photos'):
                    for i, photo in enumerate(observation['photos'], 1):
                        if downloaded_count >= total_photos:
                            break

                        download_image(photo['url'], observation['id'], i)
                        downloaded_count += 1

                        # In tiến độ
                        if downloaded_count % 10 == 0:
                            print(f"Đã tải {downloaded_count}/{total_photos} ảnh")

            page += 1

        except requests.exceptions.RequestException as e:
            print(f"Lỗi mạng: {str(e)}")
            time.sleep(5)  # Chờ lâu hơn nếu có lỗi
        except Exception as e:
            print(f"Lỗi không xác định: {str(e)}")
            break

    print(f"Hoàn thành! Đã tải tổng cộng {downloaded_count} ảnh")


if __name__ == "__main__":
    # Thay đổi số lượng ảnh muốn tải ở đây
    get_and_download_mangifera_photos(total_photos=10)