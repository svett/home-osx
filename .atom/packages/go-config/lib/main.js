'use babel'

import {CompositeDisposable} from 'atom'
import {isTruthy} from './check'
import {Executor} from './executor'
import semver from 'semver'

export default {
  locator: null,
  subscriptions: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    if (semver.satisfies(this.version(), '<1.9.9')) {
      atom.notifications.addError('Please Update Atom', {
        detail: 'You are running an old version of Atom. Please update Atom to the latest version or a version >= v1.9.9.',
        dismissable: true
      })
    }
  },

  deactivate () {
    this.dispose()
  },

  dispose () {
    if (isTruthy(this.subscriptions)) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.locator = null
  },

  getExecutor (options) {
    let e = new Executor({environmentFn: this.getEnvironment.bind(this)})
    return e
  },

  getLocator () {
    if (isTruthy(this.locator)) {
      return this.locator
    }
    let Locator = require('./locator').Locator
    this.locator = new Locator({
      environment: this.getEnvironment.bind(this),
      executor: this.getExecutor(),
      ready: this.ready.bind(this)
    })
    this.subscriptions.add(this.locator)
    return this.locator
  },

  ready () {
    return true
  },

  getEnvironment () {
    return Object.assign({}, process.env)
  },

  version () {
    return semver.major(atom.appVersion) + '.' + semver.minor(atom.appVersion) + '.' + semver.patch(atom.appVersion)
  },

  provide () {
    return this.get100Implementation()
  },

  provide010 () {
    return this.get010Implementation()
  },

  get100Implementation () {
    let executor = this.getExecutor()
    let locator = this.getLocator()
    return {
      executor: {
        exec: executor.exec.bind(executor),
        execSync: executor.execSync.bind(executor)
      },
      locator: {
        runtimes: locator.runtimes.bind(locator),
        runtime: locator.runtime.bind(locator),
        gopath: locator.gopath.bind(locator),
        findTool: locator.findTool.bind(locator)
      },
      environment: locator.environment.bind(locator)
    }
  },

  get010Implementation () {
    let executor = this.getExecutor()
    let locator = this.getLocator()
    return {
      executor: executor,
      locator: locator,
      environment: this.getEnvironment.bind(this)
    }
  }
}
