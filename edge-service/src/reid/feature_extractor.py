"""
Appearance Feature Extractor — OSNet for GDPR-compliant person re-identification.
Extracts 512-dim appearance embeddings from person crops.
No facial features — only clothing colors, textures, body proportions.
"""

import logging

import numpy as np
import torch
from torchvision import transforms

logger = logging.getLogger(__name__)

# Standard ReID preprocessing
_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((256, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class FeatureExtractor:
    def __init__(self, model_name: str = "osnet_x0_25"):
        import torchreid
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = torchreid.models.build_model(
            name=model_name,
            num_classes=1000,
            pretrained=True,
        ).to(self.device)
        self.model.eval()
        logger.info(f"Loaded {model_name} on {self.device}")

    @torch.no_grad()
    def extract(self, crop: np.ndarray) -> np.ndarray:
        """Extract 512-dim appearance embedding from a person crop (BGR numpy array)."""
        rgb = crop[:, :, ::-1]  # BGR to RGB
        tensor = _transform(rgb.copy()).unsqueeze(0).to(self.device)
        features = self.model(tensor)
        # L2 normalize
        features = torch.nn.functional.normalize(features, p=2, dim=1)
        return features.cpu().numpy().flatten()

    def extract_batch(self, crops: list[np.ndarray]) -> list[np.ndarray]:
        """Extract embeddings for a batch of crops."""
        if not crops:
            return []
        return [self.extract(crop) for crop in crops]
