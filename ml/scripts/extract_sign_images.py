"""
Signologos ML Pipeline — Extract Representative Sign Images.

Selects one representative image per ASL class from the dataset
and saves it as a thumbnail for display in the UI.

Usage:
    python ml/scripts/extract_sign_images.py

Output:
    frontend/public/signs/A.png, B.png, ..., Z.png, SPACE.png, DEL.png, NOTHING.png
"""

import os
import sys
import cv2

def main():
    # Paths
    base_dir = os.path.join(os.path.dirname(__file__), '..')
    project_dir = os.path.join(base_dir, '..')
    data_dir = os.path.join(base_dir, 'data')
    output_dir = os.path.join(project_dir, 'frontend', 'public', 'signs')

    # Find dataset
    train_dir = os.path.join(data_dir, 'asl_alphabet_train', 'asl_alphabet_train')
    if not os.path.exists(train_dir):
        train_dir = os.path.join(data_dir, 'asl_alphabet_train')
    if not os.path.exists(train_dir):
        print(f"ERROR: Dataset not found.")
        print("Run download_dataset.py first.")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print("Signologos — Extracting Sign Images for UI")
    print("=" * 60)
    print(f"Dataset: {train_dir}")
    print(f"Output:  {output_dir}")
    print()

    # Size for UI thumbnails
    thumb_size = (150, 150)

    classes = sorted([
        d for d in os.listdir(train_dir)
        if os.path.isdir(os.path.join(train_dir, d))
    ])

    extracted = 0
    for class_name in classes:
        class_dir = os.path.join(train_dir, class_name)
        images = sorted([
            img for img in os.listdir(class_dir)
            if img.lower().endswith(('.jpg', '.jpeg', '.png'))
        ])

        if not images:
            print(f"  ⚠️  {class_name}: no images found")
            continue

        # Pick the first image (they're all similar enough)
        # Could pick a "best" one using quality metrics
        img_path = os.path.join(class_dir, images[0])
        img = cv2.imread(img_path)

        if img is None:
            print(f"  ⚠️  {class_name}: could not read image")
            continue

        # Resize to thumbnail
        img_resized = cv2.resize(img, thumb_size, interpolation=cv2.INTER_AREA)

        # Map class names to file names
        # Dataset uses lowercase 'space', 'del', 'nothing'
        file_name = class_name.upper()
        if file_name == 'SPACE':
            file_name = 'SPACE'
        elif file_name == 'DEL':
            file_name = 'DEL'
        elif file_name == 'NOTHING':
            file_name = 'NOTHING'

        output_path = os.path.join(output_dir, f'{file_name}.png')
        cv2.imwrite(output_path, img_resized)
        extracted += 1
        print(f"  ✅ {file_name}.png")

    print(f"\n{'=' * 60}")
    print(f"✅ Extracted {extracted} sign images")
    print(f"   Output: {output_dir}")


if __name__ == '__main__':
    main()
