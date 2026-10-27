import unittest

from app.cart import Cart


class CartTests(unittest.TestCase):
    def test_repeated_product_merges_quantity(self):
        cart = Cart()
        cart.add(42, 1)
        cart.add("42", 2)
        self.assertEqual(cart.summary(), [(42, 3)])

    def test_mixed_type_product_id_merges(self):
        cart = Cart()
        cart.add(42, 1)
        cart.add("42", 1)
        self.assertEqual(cart.summary(), [(42, 2)])

    def test_string_product_id_is_stored_as_integer(self):
        cart = Cart()
        cart.add("42", 1)
        self.assertEqual(cart.summary(), [(42, 1)])

    def test_new_product_creates_cart_line(self):
        cart = Cart()
        cart.add(7, 1)
        self.assertEqual(cart.summary(), [(7, 1)])

    def test_empty_cart_summary(self):
        self.assertEqual(Cart().summary(), [])
