# home-osx
OSX home directory

## Boostrapping a new workstation

```sh
$ sudo xcode-select --install
$ cd
$ git init .
$ git remote add origin git@github.com:svett/home-osx.git
$ git fetch --all
$ git reset --hard origin/master
$ git submodule update --init --recursive
$ bin/setup
```
