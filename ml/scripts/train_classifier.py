"""
Signologos ML Pipeline — Train ASL Letter Classifier.

Trains a Dense Neural Network on hand landmark data extracted
by prepare_landmarks.py. The model classifies 29 ASL classes
from 63 input features (21 landmarks × 3 coordinates).

Usage:
    python ml/scripts/train_classifier.py

Output:
    ml/models/sign_classifier.h5      — Keras model
    ml/models/label_mapping.json       — Index → Label mapping
"""

import os
import sys
import json
import numpy as np
import pandas as pd

def main():
    try:
        import tensorflow as tf
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder
    except ImportError:
        print("ERROR: Required packages not installed.")
        print("Run: pip install tensorflow scikit-learn pandas")
        sys.exit(1)

    # Paths
    base_dir = os.path.join(os.path.dirname(__file__), '..')
    data_file = os.path.join(base_dir, 'data', 'landmarks.csv')
    models_dir = os.path.join(base_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, 'sign_classifier.h5')
    labels_path = os.path.join(models_dir, 'label_mapping.json')

    if not os.path.exists(data_file):
        print(f"ERROR: Landmarks file not found: {data_file}")
        print("Run prepare_landmarks.py first.")
        sys.exit(1)

    print("=" * 60)
    print("Signologos — Training ASL Classifier")
    print("=" * 60)

    # Load data
    print("\n📊 Loading landmark data...")
    data = pd.read_csv(data_file)
    print(f"   Samples: {len(data):,}")
    print(f"   Features: {data.shape[1] - 1}")
    print(f"   Classes: {data['label'].nunique()}")
    print(f"   Class distribution:\n{data['label'].value_counts().to_string()}")

    # Separate features and labels
    X = data.iloc[:, :-1].values.astype(np.float32)
    y_raw = data['label'].values

    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw)
    num_classes = len(label_encoder.classes_)
    y_onehot = tf.keras.utils.to_categorical(y_encoded, num_classes=num_classes)

    # Save label mapping
    label_mapping = {int(i): str(label) for i, label in enumerate(label_encoder.classes_)}
    with open(labels_path, 'w') as f:
        json.dump(label_mapping, f, indent=2)
    print(f"\n✅ Label mapping saved: {labels_path}")
    print(f"   Mapping: {label_mapping}")

    # Train/validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y_onehot, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\n📊 Split: {len(X_train):,} train / {len(X_val):,} validation")

    # Build model
    print("\n🏗️  Building model...")
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(63,)),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(num_classes, activation='softmax'),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )

    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=7,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    # Train
    print("\n🚀 Training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=64,
        callbacks=callbacks,
        verbose=1,
    )

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n{'=' * 60}")
    print(f"✅ Training complete!")
    print(f"   Validation accuracy: {val_acc:.4f} ({val_acc*100:.2f}%)")
    print(f"   Validation loss:     {val_loss:.4f}")

    # Save model
    model.save(model_path)
    print(f"\n💾 Model saved: {model_path}")
    print(f"   Model size: {os.path.getsize(model_path) / 1024:.1f} KB")

    # Print per-class accuracy
    print("\n📊 Per-class accuracy:")
    y_pred = model.predict(X_val, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true_classes = np.argmax(y_val, axis=1)

    for i in range(num_classes):
        mask = y_true_classes == i
        if mask.sum() > 0:
            class_acc = (y_pred_classes[mask] == i).mean()
            print(f"   {label_mapping[i]:12s}: {class_acc:.4f} ({class_acc*100:.1f}%)")


if __name__ == '__main__':
    main()
