from PIL import Image


def generate_new_icon(size: int, base_icon: Image) -> None:
    new_icon = base_icon.resize((size, size))
    new_icon.save(f"public/icon_{size}.png")


def main():
    sizes = [16, 32, 48, 128]
    base_image = Image.open('public/icon_large.png')

    for size in sizes:
        generate_new_icon(size, base_image)


if __name__ == "__main__":
    main()
