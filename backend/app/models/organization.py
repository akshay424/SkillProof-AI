from dataclasses import dataclass
from datetime import datetime


@dataclass
class Organization:
    id: str
    name: str
    slug: str
    created_at: datetime
