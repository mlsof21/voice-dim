from datetime import datetime
import getopt
import json
import os
import sys

import git


def get_git_root(path):
    git_repo = git.Repo(path, search_parent_directories=True)
    git_root = git_repo.git.rev_parse("--show-toplevel")
    return git_root


def read_version_from_file(file_path: str):
    with open(file_path, 'r') as f:
        data = json.load(f)
        return data['version']


def get_next_version(current_version: str, part_to_update: str):
    split_version = current_version.split('.')
    major_version = int(split_version[0])
    minor_version = int(split_version[1])
    bugfix_version = int(split_version[2])

    if part_to_update == 'major':
        major_version = major_version + 1
        minor_version = 0
        bugfix_version = 0
    if part_to_update == 'minor':
        minor_version = minor_version + 1
        bugfix_version = 0
    if part_to_update == "bugfix":
        bugfix_version = bugfix_version + 1

    return f"{major_version}.{minor_version}.{bugfix_version}"


def write_new_version(file_path: str, new_version: str, dry_run: bool = False):
    with open(file_path, 'r') as f:
        data = json.load(f)

    data['version'] = f"{new_version}"

    if dry_run:
        return

    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)


def write_changelog_update(file_path: str, new_version: str, dry_run: bool = False):
    with open(file_path, 'r') as f:
        data = f.read()

    if data.find(new_version) < 0:
        now = datetime.now()
        date = now.strftime('%Y-%m-%d')

        data = f"### {new_version} - {date} - <title>\n\n- <insert changes>\n\n{data}"
        print(data)

        if dry_run:
            return

        with open(file_path, 'w') as f:
            f.write(data)


def main():
    argument_list = sys.argv[1:]
    options = 'dp:'
    long_options = ["dry-run", "part="]
    # Parsing argument
    arguments, values = getopt.getopt(argument_list, options, long_options)
    part = 'bugfix'
    dry_run = False
    # checking each argument
    for current_arg, current_value in arguments:
        if current_arg in ("-p", "--part"):
            if current_value in ('major', 'minor', 'bugfix'):
                part = current_value
            else:
                print("No part provided. Updating the bugfix version by default")
        if current_arg in ('-d', '--dry-run'):
            dry_run = True

    git_root = get_git_root(os.getcwd())
    files = [git_root + '/public/manifest.chrome.json', git_root +
             '/public/manifest.firefox.json', git_root+'/package.json']
    versions = []
    for file in files:
        versions.append(read_version_from_file(file))

    versions = list(set(versions))
    current_version = versions[0]

    if len(versions) > 1:
        input_string = "More than one version detected. What is the correct most recent version?"
        for index, v in enumerate(versions):
            input_string = f"\n{input_string}\n {(index + 1)}.  {v}"
        input_string = input_string+"\n"
        user_input = input(input_string)
        current_version = versions[int(user_input)-1]
        print(current_version)

    next_version = get_next_version(current_version, part)
    print(next_version)

    for file in files:
        write_new_version(file, next_version, dry_run)

    write_changelog_update(git_root+"/CHANGELOG.md", next_version, dry_run)


if __name__ == "__main__":
    main()
