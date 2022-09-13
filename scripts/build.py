import json
import shutil

if __name__ == "__main__":
    browsers = ["chrome", "firefox"]

    for browser in browsers:
        manifest = json.load(open(f'./dist/{browser}/manifest.json'))
        version = manifest['version']
        shutil.make_archive(
            f'build/voice-dim-{browser}.{version}', 'zip', f'./dist/{browser}')
