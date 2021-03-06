import {
  Directive
} from '../binding'
import expression from '../expression'
import _ from 'utility'
import {
  hump
} from '../util'
import dom from '../dom'
import log from '../log'

const expressionArgs = ['$scope', '$el', '$event', '$tpl', '$binding']

const EventDirective = _.dynamicClass({
  extend: Directive,
  constructor() {
    this.super(arguments)
    this.handler = this.handler.bind(this)
    this.expression = expression(this.expr, expressionArgs, this.expressionScopeProvider)
  },
  handler(e) {
    e.stopPropagation()

    let scope = this.scope(),
      exp = this.expression

    if (exp.executeFilter(scope, [scope, this.el, e, this.tpl, this], e) !== false) {
      let fn = exp.execute(scope, [scope, this.el, e, this.tpl, this])
      if (exp.isSimple()) {
        if (_.isFunc(fn)) {
          scope = this.exprScope(exp.expr)
          fn.call(scope, scope, this.el, e, this.tpl, this)
        } else {
          log.warn('Invalid Event Handler:%s', this.expr, fn)
        }
      }
    }
  },
  bind() {
    dom.on(this.el, this.eventType, this.handler)
    this.super(arguments)
  },
  unbind() {
    this.super(arguments)
    dom.off(this.el, this.eventType, this.handler)
  }
})

const events = ['blur', 'change', 'click', 'dblclick', 'error', 'focus', 'keydown', 'keypress', 'keyup', 'load',
  'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll', 'select', 'submit', 'unload', {
    name: 'oninput',
    eventType: 'input propertychange'
  }
]

export default _.assign(_.convert(events, (opt) => {
  let name = _.isObject(opt) ? opt.name : opt
  return hump(name + 'Directive')
}, (opt) => {
  if (!_.isObject(opt))
    opt = {
      eventType: opt
    }
  let name = opt.name || `on${opt.eventType}`
  opt.extend = EventDirective
  return Directive.register(name, opt)
}), {
  EventDirective
})
