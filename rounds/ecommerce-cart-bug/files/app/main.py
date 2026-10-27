from app.cart import Cart


def main():
    cart = Cart()
    cart.add(42, 1)
    cart.add("42", 2)
    print(cart.summary())


if __name__ == "__main__":
    main()
