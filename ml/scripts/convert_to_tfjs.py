"""
Signologos ML Pipeline — Convert Keras model to TensorFlow.js format.

Converts the trained .h5 model to TensorFlow.js layers format
for browser-side inference.

Usage:
    python ml/scripts/convert_to_tfjs.py

Output:
    frontend/public/models/sign_classifier/model.json
    frontend/public/models/sign_classifier/group1-shard1of1.bin
"""

import os
import sys
import shutil

def main():
    try:
        import tensorflowjs as tfjs
        import tensorflow as tf
    except ImportError:
        print("ERROR: Required packages not installed.")
        print("Run: pip install tensorflowjs tensorflow")
        sys.exit(1)

    # Paths
    base_dir = os.path.join(os.path.dirname(__file__), '..')
    project_dir = os.path.join(base_dir, '..')
    model_path = os.path.join(base_dir, 'models', 'sign_classifier.h5')
    labels_path = os.path.join(base_dir, 'models', 'label_mapping.json')
    output_dir = os.path.join(project_dir, 'frontend', 'public', 'models', 'sign_classifier')

    if not os.path.exists(model_path):
        print(f"ERROR: Model not found: {model_path}")
        print("Run train_classifier.py first.")
        sys.exit(1)

    print("=" * 60)
    print("Signologos — Converting Model to TensorFlow.js")
    print("=" * 60)
    print(f"Input:  {model_path}")
    print(f"Output: {output_dir}")
    print()

    # Load the Keras model
    print("📦 Loading Keras model...")
    model = tf.keras.models.load_model(model_path)
    model.summary()

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Convert to TensorFlow.js format
    print("\n🔄 Converting to TensorFlow.js format...")
    tfjs.converters.save_keras_model(model, output_dir)

    # Copy label mapping
    if os.path.exists(labels_path):
        shutil.copy2(labels_path, output_dir)
        print(f"✅ Label mapping copied to: {output_dir}")

    # Report sizes
    total_size = 0
    print("\n📁 Output files:")
    for fname in sorted(os.listdir(output_dir)):
        fpath = os.path.join(output_dir, fname)
        size = os.path.getsize(fpath)
        total_size += size
        print(f"   {fname}: {size / 1024:.1f} KB")

    print(f"\n✅ Conversion complete!")
    print(f"   Total size: {total_size / 1024:.1f} KB")
    print(f"   Output directory: {output_dir}")
    print()
    print("The model is now ready for browser-side inference.")
    print("It will be loaded from: /models/sign_classifier/model.json")


if __name__ == '__main__':
    main()
