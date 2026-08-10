"""
Signologos ML Pipeline — Extract Hand Landmarks from ASL Images.

Processes each image in the ASL dataset through MediaPipe Hands
and saves the 21 hand landmarks (x, y, z) = 63 features per image.

Usage:
    python ml/scripts/prepare_landmarks.py

Output:
    ml/data/landmarks.csv — CSV file with 63 features + label column
"""

import os
import csv
import sys
import cv2
import numpy as np

def main():
    try:
        import mediapipe as mp
    except ImportError:
        print("ERROR: mediapipe not installed.")
        print("Run: pip install mediapipe opencv-python")
        sys.exit(1)

    # Paths
    base_dir = os.path.join(os.path.dirname(__file__), '..')
    data_dir = os.path.join(base_dir, 'data')
    output_file = os.path.join(data_dir, 'landmarks.csv')

    # Find dataset directory (handle nested structure from Kaggle)
    train_dir = os.path.join(data_dir, 'asl_alphabet_train', 'asl_alphabet_train')
    if not os.path.exists(train_dir):
        train_dir = os.path.join(data_dir, 'asl_alphabet_train')
    if not os.path.exists(train_dir):
        print(f"ERROR: Dataset not found at {train_dir}")
        print("Run download_dataset.py first.")
        sys.exit(1)

    print("=" * 60)
    print("Signologos — Extracting Hand Landmarks")
    print("=" * 60)
    print(f"Dataset: {train_dir}")
    print(f"Output:  {output_file}")
    print()

    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5,
    )

    # Prepare CSV header
    header = []
    for i in range(21):
        header.extend([f'x{i}', f'y{i}', f'z{i}'])
    header.append('label')

    # Process each class
    classes = sorted([
        d for d in os.listdir(train_dir)
        if os.path.isdir(os.path.join(train_dir, d))
    ])

    print(f"Found {len(classes)} classes: {', '.join(classes)}")
    print()

    total_processed = 0
    total_detected = 0

    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)

        for class_idx, class_name in enumerate(classes):
            class_dir = os.path.join(train_dir, class_name)
            images = [
                img for img in os.listdir(class_dir)
                if img.lower().endswith(('.jpg', '.jpeg', '.png'))
            ]

            class_detected = 0

            for img_name in images:
                img_path = os.path.join(class_dir, img_name)
                total_processed += 1

                # Read and process image
                image = cv2.imread(img_path)
                if image is None:
                    continue

                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = hands.process(image_rgb)

                if results.multi_hand_landmarks:
                    landmarks = results.multi_hand_landmarks[0]

                    # Extract raw coordinates
                    raw_coords = []
                    for lm in landmarks.landmark:
                        raw_coords.extend([lm.x, lm.y, lm.z])

                    # Normalize relative to bounding box
                    xs = [landmarks.landmark[i].x for i in range(21)]
                    ys = [landmarks.landmark[i].y for i in range(21)]
                    min_x, max_x = min(xs), max(xs)
                    min_y, max_y = min(ys), max(ys)
                    range_x = max_x - min_x if max_x - min_x > 0 else 1
                    range_y = max_y - min_y if max_y - min_y > 0 else 1

                    normalized = []
                    for lm in landmarks.landmark:
                        normalized.extend([
                            (lm.x - min_x) / range_x,
                            (lm.y - min_y) / range_y,
                            lm.z,
                        ])

                    # Write to CSV
                    row = normalized + [class_name]
                    writer.writerow(row)
                    class_detected += 1
                    total_detected += 1

            pct = (class_detected / len(images) * 100) if images else 0
            print(f"  [{class_idx+1:2d}/{len(classes)}] {class_name:12s}: "
                  f"{class_detected:4d}/{len(images):4d} hands detected ({pct:.1f}%)")

    hands.close()

    print()
    print(f"{'=' * 60}")
    print(f"✅ Landmark extraction complete!")
    print(f"   Total images processed: {total_processed:,}")
    print(f"   Total landmarks saved:  {total_detected:,}")
    print(f"   Detection rate:         {total_detected/total_processed*100:.1f}%")
    print(f"   Output file:            {output_file}")


if __name__ == '__main__':
    main()
