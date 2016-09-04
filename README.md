# home-osx
Automates setup of OSX workstation and home directory.

Hardly inspired by my work at [Pivotal](http://www.pivotal.io) and [Gerhard
Lazu](https://github.com/gerhard), [Phd Gareth Smith](http://github.com/totherme) &
[Scott Muc](https://github.com/scottmuc).

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

### TO DO
- Configure iTerm2 appereance
- Download and install [fly](https://github.com/concourse/fly)
- Apply SizeUp and 1Password licenses
