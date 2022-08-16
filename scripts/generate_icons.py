from PIL import Image


def generate_new_icon(size: int, base_icon: Image) -> None:
    new_icon = base_icon.resize((size, size))
    new_icon.save(f"assets/icons/icon_{size}.png")


def main():
    sizes = [16, 32, 48, 64]
    icon_128 = Image.open('assets/icons/icon_128.png')

    for size in sizes:
        generate_new_icon(size, icon_128)


if __name__ == "__main__":
    main()
