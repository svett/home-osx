'use babel'

import {CompositeDisposable} from 'atom'
import {Manager} from './manager'

export default {
  dependenciesInstalled: null,
  goconfig: null,
  manager: null,
  subscriptions: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    require('atom-package-deps').install('go-get').then(() => {
      this.dependenciesInstalled = true
    }).catch((e) => {
      console.log(e)
    })
    this.getManager()
  },

  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.goconfig = null
    this.manager = null
    this.dependenciesInstalled = null
  },

  provide () {
    return this.provide200()
  },

  getManager () {
    if (this.manager) {
      return this.manager
    }
    if (!this.subscriptions) {
      return
    }
    this.manager = new Manager(() => { return this.getGoconfig() })
    this.subscriptions.add(this.manager)
    return this.manager
  },

  provide200 () {
    let m = this.getManager()
    if (!m) {
      return
    }
    return {
      get: (options) => {
        return m.get(options)
      },
      register: (pack, callback) => {
        return m.register(pack, callback)
      }
    }
  },

  provide100 () {
    let provider = this.provide200()
    provider.check = () => {
      return Promise.resolve(true)
    }
    delete provider.register
    return provider
  },

  getGoconfig () {
    if (this.goconfig) {
      return this.goconfig
    }
    return false
  },

  consumeGoconfig (service) {
    this.goconfig = service
  }
}
