from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class GlassSurface:
    """High-opacity matte glass elevation specification."""
    name: str
    alpha: float
    blur_px: int = 24

async def audit_contrast(surface: GlassSurface, floor: Optional[float] = 70.0) -> bool:
    summary = f"{surface.name}: alpha={surface.alpha:.2f}, blur={surface.blur_px}px"
    if surface.alpha < 0.80 or (floor is not None and floor < 60.0):
        print(f"Warning: {summary}")
        return False
    return True
