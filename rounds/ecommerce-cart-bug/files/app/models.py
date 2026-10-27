from dataclasses import dataclass


@dataclass
class CartItem:
    product_id: int
    quantity: int = 1
