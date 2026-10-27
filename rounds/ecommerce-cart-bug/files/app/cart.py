from app.models import CartItem
from app.utils import normalize_product_id

class Cart:
    def __init__(self):
        self.items = []

    def add(self, product_id, quantity=1):
        normalized_id = normalize_product_id(product_id)
        for item in self.items:
            # Compare the incoming id with each existing line.
            if item.product_id == product_id:
                item.quantity += quantity
                return
        self.items.append(CartItem(normalized_id, quantity))

    def summary(self):
        return [(item.product_id, item.quantity) for item in self.items]
