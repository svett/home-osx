'use babel'

import {CompositeDisposable} from 'atom'
import {Godef} from './godef'

export default {
  dependenciesInstalled: null,
  goconfig: null,
  goget: null,
  subscriptions: null,
  toolRegistered: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    require('atom-package-deps').install('navigator-go').then(() => {
      this.dependenciesInstalled = true
      return this.dependenciesInstalled
    }).catch((e) => {
      console.log(e)
    })
    this.godef = new Godef(
      () => { return this.getGoconfig() },
      () => { return this.getGoget() }
    )
    this.subscriptions.add(this.godef)
    this.uninstallOldPackage()
  },

  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.goget = null
    this.goconfig = null
    this.godef = null
    this.dependenciesInstalled = null
    this.toolRegistered = null
  },

  getGoconfig () {
    if (this.goconfig) {
      return this.goconfig
    }
    return false
  },

  getGoget () {
    if (this.goget) {
      return this.goget
    }
    return false
  },

  consumeGoconfig (service) {
    this.goconfig = service
  },

  consumeGoget (service) {
    this.goget = service
    this.registerTool()
  },

  registerTool () {
    if (this.toolRegistered || !this.goget) {
      return
    }
    this.subscriptions.add(this.goget.register('github.com/rogpeppe/godef'))
    this.toolRegistered = true
  },

  uninstallOldPackage () {
    // navigator-godef was renamed to navigator-go; the repo location was updated also
    // this function cleans up any installed version of navigator-godef
    let oldpack = atom.packages.getLoadedPackage('navigator-godef')
    if (oldpack) {
      console.log('navigator-godef installed; removing')
      atom.packages.activatePackage('settings-view').then((pack) => {
        if (pack && pack.mainModule) {
          let settingsview = pack.mainModule.createSettingsView({uri: pack.mainModule.configUri})
          settingsview.packageManager.uninstall({name: 'navigator-godef'}, (error) => {
            if (!error) {
              console.log('the navigator-godef package has been uninstalled')
              atom.notifications.addInfo('renamed navigator-godef package to navigator-go')
            } else {
              console.log(error)
            }
          })
        }
      })
    }
  }
}
