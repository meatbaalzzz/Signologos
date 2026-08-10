"""
Signologos ML Pipeline — Download ASL Alphabet Dataset from Kaggle.

Usage:
    python ml/scripts/download_dataset.py

Prerequisites:
    1. pip install kaggle
    2. Place your Kaggle API key at ~/.kaggle/kaggle.json
       Get it from: https://www.kaggle.com/settings → API → Create New Token
"""

import os
import sys

def main():
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        print("ERROR: kaggle package not installed.")
        print("Run: pip install kaggle")
        sys.exit(1)

    # Target directory
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)

    print("=" * 60)
    print("Signologos — Downloading ASL Alphabet Dataset")
    print("=" * 60)
    print(f"Target directory: {os.path.abspath(data_dir)}")
    print()

    # Initialize Kaggle API
    api = KaggleApi()
    api.authenticate()
    print("✅ Kaggle API authenticated")

    # Download dataset
    dataset = 'grassknoted/asl-alphabet'
    print(f"📦 Downloading dataset: {dataset}")
    print("   This may take a while (~1GB)...")
    print()

    api.dataset_download_files(
        dataset,
        path=data_dir,
        unzip=True,
        quiet=False,
    )

    # Verify download
    train_dir = os.path.join(data_dir, 'asl_alphabet_train', 'asl_alphabet_train')
    if os.path.exists(train_dir):
        classes = sorted(os.listdir(train_dir))
        total_images = sum(
            len(os.listdir(os.path.join(train_dir, c)))
            for c in classes
            if os.path.isdir(os.path.join(train_dir, c))
        )
        print()
        print(f"✅ Dataset downloaded successfully!")
        print(f"   Classes: {len(classes)}")
        print(f"   Total images: {total_images:,}")
        print(f"   Classes: {', '.join(classes)}")
    else:
        # Try alternative structure
        alt_dir = os.path.join(data_dir, 'asl_alphabet_train')
        if os.path.exists(alt_dir):
            print(f"✅ Dataset downloaded to: {alt_dir}")
        else:
            print("⚠️  Download completed but directory structure unclear.")
            print(f"   Check: {data_dir}")


if __name__ == '__main__':
    main()
