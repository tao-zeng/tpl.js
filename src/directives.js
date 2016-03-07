const _ = require('lodash'),
  Directive = require('./directive'),
  {Expression} = require('./expression'),
  {YieId} = require('./util');

function registerDirective(name, opt) {
  let cls = Directive.register(name, opt);;
  module.exports[cls.prototype.className] = cls;
}

export class AbstractEventDirective extends Directive {
  constructor(el, tpl, expr) {
    super(el, tpl, expr);
    this.handler = this.handler.bind(this);
  }

  handler(e) {
    _.get(this.scope, this.expr).call(this.scope, e, e.target, this.scope);
  }

  bind() {
    super.bind();
    this.$el.on(this.eventType, this.handler);
  }

  unbind() {
    super.unbind();
    this.$el.un(this.eventType, this.handler);
  }
}

const events = ['blur', 'change', 'click', 'dblclick', 'error', 'focus', 'keydown', 'keypress', 'keyup', 'load',
  'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll', 'select', 'submit', 'unload', {
    name: 'oninput',
    eventType: 'input propertychange'
  }];

// register events
_.each(events, (opt) => {
  let name;
  if (_.isString(opt)) {
    name = 'on' + opt;
    opt = {
      eventType: opt
    }
  } else {
    name = opt.name;
  }
  opt.extend = AbstractEventDirective;
  registerDirective(name, opt);
});


export class AbstractExpressionDirective extends Directive {
  constructor(el, tpl, expr) {
    super(el, tpl, expr);
    this.update = this.update.bind(this);
    this.expression = new Expression(this.scope, this.expr, this.update);
  }

  bind() {
    super.bind();
    this.scope = this.expression.observe();
    this.update(this.value());
  }

  unbind() {
    this.scope = this.expression.unobserve();
  }

  setRealValue(val) {
    return this.expression.setRealValue(val);
  }

  setValue(val) {
    return this.expression.setValue(val);
  }

  realValue() {
    return this.expression.realValue();
  }

  value() {
    return this.expression.value();
  }

  blankValue(val) {
    if (arguments.length == 0) {
      val = this.expression.value();
    }
    if (val === undefined || val == null) {
      return '';
    }
    return val;
  }

  update(val) {
    throw 'Abstract Method [' + this.className + '.update]';
  }
}


const EVENT_CHANGE = 'change',
  EVENT_INPUT = 'input propertychange',
  EVENT_CLICK = 'click',
  TAG_SELECT = 'SELECT',
  TAG_INPUT = 'INPUT',
  TAG_TEXTAREA = 'TEXTAREA',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  expressions = {
    text: {
      update(val) {
        this.$el.text(this.blankValue(val));
      },
      block: true
    },
    html: {
      update(val) {
        this.$el.html(this.blankValue(val));
      },
      block: true
    },
    'class': {
      update(val) {
        let cls = this.blankValue(val);
        console.log('class', cls);
        if (this.oldCls) {
          this.$el.removeClass(this.oldCls);
        }
        this.$el.addClass(cls);
        this.oldCls = cls;
      }
    },
    show: {
      update(val) {
        this.$el.css('display', val ? '' : 'none');
      }
    },
    hide: {
      update(val) {
        this.$el.css('display', val ? 'none' : '');
      }
    },
    value: {
      update(val) {
        this.$el.val(this.blankValue(val));
      }
    },
    'if': {
      bind() {
        AbstractExpressionDirective.prototype.bind.call(this);
        if (!this.directives) {
          this.yieId = new YieId();
          return this.yieId;
        }
      },
      update(val) {
        if (!val) {
          this.$el.css('display', 'none');
        } else {
          if (!this.directives) {
            this.directives = this.tpl.parseChildNodes(this.el);
            this.directives.forEach(directive => {
              directive.bind();
              this.scope = directive.getScope();
            });
            if (this.yieId) {
              this.yieId.done();
              delete this.yieId;
            }
          }
          this.$el.css('display', '');
        }
      },
      unbind() {
        AbstractExpressionDirective.prototype.unbind.call(this);
        if (this.directives) {
          this.directives.forEach(directive => {
            directive.unbind();
            this.scope = directive.getScope();
          });
        }
      },
      priority: 9,
      block: true
    },
    input: {
      constructor(el, tpl, expr) {
        AbstractExpressionDirective.call(this, el, tpl, expr);

        this.onChange = this.onChange.bind(this);

        let tag = this.tag = el.tagName;
        switch (tag) {
          case TAG_SELECT:
            this.event = EVENT_CHANGE;
            break;
          case TAG_INPUT:
            let type = this.type = el.type;
            this.event = (type == RADIO || type == CHECKBOX) ? EVENT_CLICK : EVENT_INPUT;
            break;
          case TAG_TEXTAREA:
            throw TypeError('Directive[input] not support ' + tag);
            break;
          default: throw TypeError('Directive[input] not support ' + tag);
        }
        console.log('input', tag, el);
      },

      bind() {
        AbstractExpressionDirective.prototype.bind.call(this);
        this.$el.on(this.event, this.onChange);
      },

      unbind() {
        AbstractExpressionDirective.prototype.unbind.call(this);
        this.$el.un(this.event, this.onChange);
      },

      onChange() {
        let val = this.elVal();

        if (val != this.val)
          this.setValue(val);
      },

      update(val) {
        this.val = this.blankValue(val);

        this.elVal(this.val);
      },

      elVal(val) {
        let tag = this.tag;

        switch (tag) {
          case TAG_SELECT:
            break;
          case TAG_INPUT:
            let type = this.type;

            if (type == RADIO || type == CHECKBOX) {
              if (arguments.length == 0) {
                return this.$el.prop('checked') ? this.$el.val() : undefined;
              } else {
                let checked = _.isString(val) ? val == this.$el.val() : !!val;
                if (this.$el.prop('checked') != checked)
                  this.$el.prop('checked', checked);
              }
            } else {
              if (arguments.length == 0) {
                return this.$el.val();
              } else if (val != this.$el.val()) {
                this.$el.val(val);
              }
            }
            break;
          case TAG_TEXTAREA:
            throw TypeError('Directive[input] not support ' + tag);
            break;
          default:
            throw TypeError('Directive[input] not support ' + tag);
        }
      }
    }
  };

// register Expression Directive
_.each(expressions, (opt, name) => {
  opt.extend = AbstractExpressionDirective;
  registerDirective(name, opt);
});

const eachReg = /([^\s]+)\s+in\s+([^\s]+)(\s+by\s+([^\s]+))?$/;
export class EachDirective extends Directive {
  constructor(el, tpl, expr) {
    super(el, tpl, expr);
    let token = eachReg.exec(expr);
    if (!token)
      throw Error('Invalid Expression on Each Directive');
    this.alias = token[1];
    this.obj = token[2];
    this.index = token[4];
    console.log(`each directive: alias = ${this.alias}, obj = ${this.obj}, index = ${this.index}`)
  }

  bind() {
    super.bind();
  }

  unbind() {
    super.unbind();
  }
}
EachDirective.prototype.priority = 10;
Directive.register('each', EachDirective);
