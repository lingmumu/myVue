var prefix = 'sd',
    Filters = require('./filters'),
    Directives = require('./directives'),
    selector = Object.keys(Directives).map(function (d) {
      return '[' + prefix + '-' + d + ']'
    }).join()
function Seed (opts) {
  var self = this,
    root = document.getElementById(opts.id),
    els = root.querySelectorAll(selector),
    bindings = {}
  self.scope = {}

  ;[].forEach.call(els, proceeNode)
  proceeNode(root)

  for (var key in bindings) {
    self.scope[key] = opts.scope[key]
  }

  function proceeNode(el) {
    cloneAttributes(el.attributes).forEach(function(attr) {
      var directive = parseDirective(attr)
      if (directive) {
        bindDirective(self, el, bindings, directive)
      }
    })
  }
    
}

function cloneAttributes (attributes) {
  return [].map.call(attributes, function (attr) {
    return {
      name: attr.name,
      value: attr.value
    }
  })
}

function bindDirective (seed, el, bindings, directive) {
  el.removeAttribute(directive.attr.name)
  var key = directive.key,
    binding = bindings[key]
  if (!binding) {
    bindings[key] = binding = {
      value: undefined,
      directives: []
    }
  }
  directive.el = el
  binding.directives.push(directive)
  if (directive.bind) {
    directive.bind(el, binding.value)
  }
  if (!seed.scope.hasOwnProperty(key)) {
    bindAccessors(seed, key, binding)
  }
}

function bindAccessors (seed, key, binding) {
  Object.defineProperty(seed.scope, key, {
    get: function () {
      return binding.value
    },
    set: function (value) {
      binding.value = value
      binding.directives.forEach(function (directive) {
        if (value && directive.filters) {
          value = applyFilter(value, directive)
        }
        directive.update(
          directive.el,
          value,
          directive.argument,
          directive,
          seed
        )
      })
    }
  })
}

function applyFilter (value, directive) {
  if (directive.definintion.customFilter) {
    return directive.definintion.customFilter(value, directive.filters)
  } else {
    directive.filters.forEach(function (filter) {
      if (Filters[filter]) {
        value = Filters[filter](value)
      }
    })
    return value
  }
}
function parseDirective (attr) {
  if (attr.name.indexOf(prefix) === -1) return

  // 解析指令名和参数
  var noprefix = attr.name.slice(prefix.length + 1),
    argIndex = noprefix.indexOf('-'),
    dirname = argIndex === -1
      ? noprefix
      : noprefix.slice(0, argIndex),
    def = Directives[dirname],
    arg = argIndex === -1
      ? null
      : noprefix.slice(argIndex + 1)

  var exp = attr.value,
    pipeIndex = exp.indexOf('|'),
    key = pipeIndex === -1
      ? exp.trim()
      : exp.slice(0, pipeIndex).trim(),
    filters = pipeIndex === -1
      ? null
      : exp.slice(pipeIndex + 1).split('|').map(function (filter) {
          return filter.trim()
        })
  return def
        ? {
          attr: attr,
          key: key,
          filters: filters,
          definintion: def,
          argument: arg,
          update: typeof def === 'function'
            ? def
            : def.update
        }
        : null
}

module.exports = {
  create: function (opts) {
    return new Seed(opts)
  }
}