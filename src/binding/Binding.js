import _ from 'utility'
import observer from 'observer'
import config from '../config'

const Binding = _.dynamicClass({
  statics: {
    commentCfg: 'generateComments'
  },
  constructor(cfg) {
    this._scope = observer.obj(cfg.scope)
    this.el = cfg.el
    this.tpl = cfg.tpl
  },
  expressionScopeProvider(expr, realScope) {
    return realScope ? `$binding.exprScope('${expr}')` : '$scope'
  },
  scope() {
    let scope = this._scope
    return observer.proxy(scope) || scope
  },
  realScope() {
    return this._scope
  },
  propScope(prop) {
    let scope = this.realScope(),
      parent

    while ((parent = scope.$parent) && !_.hasOwnProp(scope, prop)) {
      scope = parent
    }
    return observer.proxy(scope) || scope
  },
  exprScope(expr) {
    return this.propScope(_.parseExpr(expr)[0])
  },
  observe(expr, callback) {
    observer.on(this.exprScope(expr), expr, callback)
  },
  unobserve(expr, callback) {
    observer.un(this.exprScope(expr), expr, callback)
  },
  get(expr) {
    return _.get(this.realScope(), expr)
  },
  has(expr) {
    return _.has(this.realScope(), expr)
  },
  set(expr, value) {
    _.set(this.scope(), expr, value)
  },
  bind() {
    throw new Error('abstract method')
  },
  unbind() {
    throw new Error('abstract method')
  },
  destroy() {}
})
config.register(Binding.commentCfg, true)
export default Binding
