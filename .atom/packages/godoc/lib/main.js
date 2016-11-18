'use babel'

import {CompositeDisposable} from 'atom'
import {Godoc} from './godoc'
import GodocPanelView from './components/godoc-panel-view'

export default {
  subscriptions: null,
  dependenciesInstalled: null,
  goconfig: null,
  goget: null,
  godoc: null,
  toolRegistered: null,

  activate () {
    this.godoc = new Godoc(
      () => { return this.getGoconfig() },
      () => { return this.getGoget() }
    )
    this.subscriptions = new CompositeDisposable()
    require('atom-package-deps').install('godoc').then(() => {
      this.dependenciesInstalled = true
    }).catch((e) => {
      console.log(e)
    })
  },

  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.godoc = null
    this.goconfig = null
    this.goget = null
    this.dependenciesInstalled = null
  },

  getGoconfig () {
    if (this.goconfig) {
      return this.goconfig
    }
    return false
  },

  consumeGoconfig (service) {
    this.goconfig = service
  },

  getGoget () {
    if (this.goget) {
      return this.goget
    }
    return false
  },

  consumeGoget (service) {
    this.goget = service
    this.registerTool()
  },

  registerTool () {
    if (this.toolRegistered || !this.goget || !this.goget.register) {
      return
    }
    this.subscriptions.add(this.goget.register('github.com/zmb3/gogetdoc'))
    this.toolRegistered = true
  },

  provideGoPlusView () {
    return {
      view: GodocPanelView,
      model: this.godoc.getPanel()
    }
  }
}
