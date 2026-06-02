import os
import argparse
import logging
import pandas as pd
import torch
from typing import Dict
from transformers import (
    AutoTokenizer, 
    AutoModelForSequenceClassification, 
    Trainer, 
    TrainingArguments,
    EvalPrediction
)
from sklearn.model_selection import train_test_split
from src.classifier.distilbert_classifier import FAILURE_CLASSES

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ci_cd_analyzer.train")

# Define mapping from text labels to integers
LABEL_TO_ID = {label: idx for idx, label in enumerate(FAILURE_CLASSES)}

class LogDataset(torch.utils.data.Dataset):
    """Custom PyTorch dataset for tokenized CI/CD log records."""
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx])
        return item

    def __len__(self):
        return len(self.labels)

def compute_metrics(p: EvalPrediction) -> Dict[str, float]:
    """Computes basic classification metrics during training evaluation."""
    preds = p.predictions.argmax(-1)
    labels = p.label_ids
    accuracy = (preds == labels).mean()
    return {"accuracy": float(accuracy)}

def train_model(
    csv_path: str, 
    output_dir: str, 
    epochs: int = 3, 
    batch_size: int = 8, 
    learning_rate: float = 2e-5
) -> None:
    """Trains a DistilBERT sequence classifier on custom CI/CD log data."""
    logger.info(f"Loading dataset from: {csv_path}")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Input training CSV '{csv_path}' does not exist.")
        
    df = pd.read_csv(csv_path)
    if "text" not in df.columns or "label" not in df.columns:
        raise ValueError("CSV must contain 'text' and 'label' columns.")

    # Standardise labels
    # If labels are strings, map them to numeric IDs
    if df["label"].dtype == object:
        logger.info("String labels detected. Mapping labels using FAILURE_CLASSES indices.")
        df["label_id"] = df["label"].map(LABEL_TO_ID)
        # Drop rows with invalid label categories
        invalid_count = df["label_id"].isna().sum()
        if invalid_count > 0:
            logger.warning(f"Dropping {invalid_count} rows with invalid label categories.")
            df = df.dropna(subset=["label_id"])
        df["label"] = df["label_id"].astype(int)

    # 1. Split Train and Validation sets
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        df["text"].tolist(), 
        df["label"].tolist(), 
        test_size=0.2, 
        random_state=42
    )
    logger.info(f"Split completed. Training set: {len(train_texts)}, Validation set: {len(val_texts)}")

    # 2. Tokenizer Setup
    model_name = "distilbert-base-uncased"
    logger.info(f"Downloading/loading tokenizer for: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    # 3. Tokenize datasets
    logger.info("Tokenizing datasets...")
    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=512)
    val_encodings = tokenizer(val_texts, truncation=True, padding=True, max_length=512)

    # 4. Create datasets
    train_dataset = LogDataset(train_encodings, train_labels)
    val_dataset = LogDataset(val_encodings, val_labels)

    # 5. Load model
    logger.info(f"Loading base sequence classification model with {len(FAILURE_CLASSES)} classes...")
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, 
        num_labels=len(FAILURE_CLASSES)
    )

    # 6. Configure HF TrainingArguments
    logger.info("Configuring training parameters...")
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir=os.path.join(output_dir, "logs"),
        logging_steps=10,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        learning_rate=learning_rate,
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        report_to="none"  # Prevent wandb/tensorboard setup issues
    )

    # 7. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )

    # 8. Run Training
    logger.info("Starting model fine-tuning...")
    trainer.train()

    # 9. Save final tokenizer & model
    logger.info(f"Saving fine-tuned model and tokenizer to: {output_dir}")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    logger.info("Training complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune DistilBERT on custom CI/CD logs.")
    parser.add_argument("--csv", type=str, required=True, help="Path to training CSV containing 'text' and 'label'")
    parser.add_argument("--output_dir", type=str, default="./fine_tuned_distilbert", help="Output folder to save fine-tuned model")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    args = parser.parse_args()

    train_model(
        csv_path=args.csv, 
        output_dir=args.output_dir, 
        epochs=args.epochs, 
        batch_size=args.batch_size, 
        learning_rate=args.lr
    )
