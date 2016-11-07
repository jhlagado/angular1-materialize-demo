var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:wrappy
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // Returns a wrapper function that returns a wrapped callback
    // The wrapper function should do some stuff, and return a
    // presumably different callback function.
    // This makes sure that own properties are retained, so that
    // decorations and such are not lost along the way.
    module.exports = wrappy
    function wrappy (fn, cb) {
      if (fn && cb) return wrappy(fn)(cb)
    
      if (typeof fn !== 'function')
        throw new TypeError('need wrapper function')
    
      Object.keys(fn).forEach(function (k) {
        wrapper[k] = fn[k]
      })
    
      return wrapper
    
      function wrapper() {
        var args = new Array(arguments.length)
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i]
        }
        var ret = fn.apply(this, args)
        var cb = args[args.length-1]
        if (typeof ret === 'function' && ret !== cb) {
          Object.keys(cb).forEach(function (k) {
            ret[k] = cb[k]
          })
        }
        return ret
      }
    }
    
  provide("wrappy", module.exports);
}(global));

// pakmanager:balanced-match
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = balanced;
    function balanced(a, b, str) {
      if (a instanceof RegExp) a = maybeMatch(a, str);
      if (b instanceof RegExp) b = maybeMatch(b, str);
    
      var r = range(a, b, str);
    
      return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
      };
    }
    
    function maybeMatch(reg, str) {
      var m = str.match(reg);
      return m ? m[0] : null;
    }
    
    balanced.range = range;
    function range(a, b, str) {
      var begs, beg, left, right, result;
      var ai = str.indexOf(a);
      var bi = str.indexOf(b, ai + 1);
      var i = ai;
    
      if (ai >= 0 && bi > 0) {
        begs = [];
        left = str.length;
    
        while (i >= 0 && !result) {
          if (i == ai) {
            begs.push(i);
            ai = str.indexOf(a, i + 1);
          } else if (begs.length == 1) {
            result = [ begs.pop(), bi ];
          } else {
            beg = begs.pop();
            if (beg < left) {
              left = beg;
              right = bi;
            }
    
            bi = str.indexOf(b, i + 1);
          }
    
          i = ai < bi && ai >= 0 ? ai : bi;
        }
    
        if (begs.length) {
          result = [ left, right ];
        }
      }
    
      return result;
    }
    
  provide("balanced-match", module.exports);
}(global));

// pakmanager:concat-map
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = function (xs, fn) {
        var res = [];
        for (var i = 0; i < xs.length; i++) {
            var x = fn(xs[i], i);
            if (isArray(x)) res.push.apply(res, x);
            else res.push(x);
        }
        return res;
    };
    
    var isArray = Array.isArray || function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };
    
  provide("concat-map", module.exports);
}(global));

// pakmanager:once
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var wrappy = require('wrappy')
    module.exports = wrappy(once)
    
    once.proto = once(function () {
      Object.defineProperty(Function.prototype, 'once', {
        value: function () {
          return once(this)
        },
        configurable: true
      })
    })
    
    function once (fn) {
      var f = function () {
        if (f.called) return f.value
        f.called = true
        return f.value = fn.apply(this, arguments)
      }
      f.called = false
      return f
    }
    
  provide("once", module.exports);
}(global));

// pakmanager:brace-expansion
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var concatMap = require('concat-map');
    var balanced = require('balanced-match');
    
    module.exports = expandTop;
    
    var escSlash = '\0SLASH'+Math.random()+'\0';
    var escOpen = '\0OPEN'+Math.random()+'\0';
    var escClose = '\0CLOSE'+Math.random()+'\0';
    var escComma = '\0COMMA'+Math.random()+'\0';
    var escPeriod = '\0PERIOD'+Math.random()+'\0';
    
    function numeric(str) {
      return parseInt(str, 10) == str
        ? parseInt(str, 10)
        : str.charCodeAt(0);
    }
    
    function escapeBraces(str) {
      return str.split('\\\\').join(escSlash)
                .split('\\{').join(escOpen)
                .split('\\}').join(escClose)
                .split('\\,').join(escComma)
                .split('\\.').join(escPeriod);
    }
    
    function unescapeBraces(str) {
      return str.split(escSlash).join('\\')
                .split(escOpen).join('{')
                .split(escClose).join('}')
                .split(escComma).join(',')
                .split(escPeriod).join('.');
    }
    
    
    // Basically just str.split(","), but handling cases
    // where we have nested braced sections, which should be
    // treated as individual members, like {a,{b,c},d}
    function parseCommaParts(str) {
      if (!str)
        return [''];
    
      var parts = [];
      var m = balanced('{', '}', str);
    
      if (!m)
        return str.split(',');
    
      var pre = m.pre;
      var body = m.body;
      var post = m.post;
      var p = pre.split(',');
    
      p[p.length-1] += '{' + body + '}';
      var postParts = parseCommaParts(post);
      if (post.length) {
        p[p.length-1] += postParts.shift();
        p.push.apply(p, postParts);
      }
    
      parts.push.apply(parts, p);
    
      return parts;
    }
    
    function expandTop(str) {
      if (!str)
        return [];
    
      // I don't know why Bash 4.3 does this, but it does.
      // Anything starting with {} will have the first two bytes preserved
      // but *only* at the top level, so {},a}b will not expand to anything,
      // but a{},b}c will be expanded to [a}c,abc].
      // One could argue that this is a bug in Bash, but since the goal of
      // this module is to match Bash's rules, we escape a leading {}
      if (str.substr(0, 2) === '{}') {
        str = '\\{\\}' + str.substr(2);
      }
    
      return expand(escapeBraces(str), true).map(unescapeBraces);
    }
    
    function identity(e) {
      return e;
    }
    
    function embrace(str) {
      return '{' + str + '}';
    }
    function isPadded(el) {
      return /^-?0\d/.test(el);
    }
    
    function lte(i, y) {
      return i <= y;
    }
    function gte(i, y) {
      return i >= y;
    }
    
    function expand(str, isTop) {
      var expansions = [];
    
      var m = balanced('{', '}', str);
      if (!m || /\$$/.test(m.pre)) return [str];
    
      var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
      var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
      var isSequence = isNumericSequence || isAlphaSequence;
      var isOptions = /^(.*,)+(.+)?$/.test(m.body);
      if (!isSequence && !isOptions) {
        // {a},b}
        if (m.post.match(/,.*\}/)) {
          str = m.pre + '{' + m.body + escClose + m.post;
          return expand(str);
        }
        return [str];
      }
    
      var n;
      if (isSequence) {
        n = m.body.split(/\.\./);
      } else {
        n = parseCommaParts(m.body);
        if (n.length === 1) {
          // x{{a,b}}y ==> x{a}y x{b}y
          n = expand(n[0], false).map(embrace);
          if (n.length === 1) {
            var post = m.post.length
              ? expand(m.post, false)
              : [''];
            return post.map(function(p) {
              return m.pre + n[0] + p;
            });
          }
        }
      }
    
      // at this point, n is the parts, and we know it's not a comma set
      // with a single entry.
    
      // no need to expand pre, since it is guaranteed to be free of brace-sets
      var pre = m.pre;
      var post = m.post.length
        ? expand(m.post, false)
        : [''];
    
      var N;
    
      if (isSequence) {
        var x = numeric(n[0]);
        var y = numeric(n[1]);
        var width = Math.max(n[0].length, n[1].length)
        var incr = n.length == 3
          ? Math.abs(numeric(n[2]))
          : 1;
        var test = lte;
        var reverse = y < x;
        if (reverse) {
          incr *= -1;
          test = gte;
        }
        var pad = n.some(isPadded);
    
        N = [];
    
        for (var i = x; test(i, y); i += incr) {
          var c;
          if (isAlphaSequence) {
            c = String.fromCharCode(i);
            if (c === '\\')
              c = '';
          } else {
            c = String(i);
            if (pad) {
              var need = width - c.length;
              if (need > 0) {
                var z = new Array(need + 1).join('0');
                if (i < 0)
                  c = '-' + z + c.slice(1);
                else
                  c = z + c;
              }
            }
          }
          N.push(c);
        }
      } else {
        N = concatMap(n, function(el) { return expand(el, false) });
      }
    
      for (var j = 0; j < N.length; j++) {
        for (var k = 0; k < post.length; k++) {
          var expansion = pre + N[j] + post[k];
          if (!isTop || isSequence || expansion)
            expansions.push(expansion);
        }
      }
    
      return expansions;
    }
    
    
  provide("brace-expansion", module.exports);
}(global));

// pakmanager:inflight
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var wrappy = require('wrappy')
    var reqs = Object.create(null)
    var once = require('once')
    
    module.exports = wrappy(inflight)
    
    function inflight (key, cb) {
      if (reqs[key]) {
        reqs[key].push(cb)
        return null
      } else {
        reqs[key] = [cb]
        return makeres(key)
      }
    }
    
    function makeres (key) {
      return once(function RES () {
        var cbs = reqs[key]
        var len = cbs.length
        var args = slice(arguments)
    
        // XXX It's somewhat ambiguous whether a new callback added in this
        // pass should be queued for later execution if something in the
        // list of callbacks throws, or if it should just be discarded.
        // However, it's such an edge case that it hardly matters, and either
        // choice is likely as surprising as the other.
        // As it happens, we do go ahead and schedule it for later execution.
        try {
          for (var i = 0; i < len; i++) {
            cbs[i].apply(null, args)
          }
        } finally {
          if (cbs.length > len) {
            // added more in the interim.
            // de-zalgo, just in case, but don't call again.
            cbs.splice(0, len)
            process.nextTick(function () {
              RES.apply(null, args)
            })
          } else {
            delete reqs[key]
          }
        }
      })
    }
    
    function slice (args) {
      var length = args.length
      var array = []
    
      for (var i = 0; i < length; i++) array[i] = args[i]
      return array
    }
    
  provide("inflight", module.exports);
}(global));

// pakmanager:inherits/inherits_browser.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor
        var TempCtor = function () {}
        TempCtor.prototype = superCtor.prototype
        ctor.prototype = new TempCtor()
        ctor.prototype.constructor = ctor
      }
    }
    
  provide("inherits/inherits_browser.js", module.exports);
}(global));

// pakmanager:inherits
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  try {
      var util = require('util');
      if (typeof util.inherits !== 'function') throw '';
      module.exports = util.inherits;
    } catch (e) {
      module.exports =  require('inherits/inherits_browser.js');
    }
    
  provide("inherits", module.exports);
}(global));

// pakmanager:minimatch
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = minimatch
    minimatch.Minimatch = Minimatch
    
    var path = { sep: '/' }
    try {
      path = require('path')
    } catch (er) {}
    
    var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
    var expand = require('brace-expansion')
    
    // any single thing other than /
    // don't need to escape / when using new RegExp()
    var qmark = '[^/]'
    
    // * => any number of characters
    var star = qmark + '*?'
    
    // ** when dots are allowed.  Anything goes, except .. and .
    // not (^ or / followed by one or two dots followed by $ or /),
    // followed by anything, any number of times.
    var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'
    
    // not a ^ or / followed by a dot,
    // followed by anything, any number of times.
    var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'
    
    // characters that need to be escaped in RegExp.
    var reSpecials = charSet('().*{}+?[]^$\\!')
    
    // "abc" -> { a:true, b:true, c:true }
    function charSet (s) {
      return s.split('').reduce(function (set, c) {
        set[c] = true
        return set
      }, {})
    }
    
    // normalizes slashes.
    var slashSplit = /\/+/
    
    minimatch.filter = filter
    function filter (pattern, options) {
      options = options || {}
      return function (p, i, list) {
        return minimatch(p, pattern, options)
      }
    }
    
    function ext (a, b) {
      a = a || {}
      b = b || {}
      var t = {}
      Object.keys(b).forEach(function (k) {
        t[k] = b[k]
      })
      Object.keys(a).forEach(function (k) {
        t[k] = a[k]
      })
      return t
    }
    
    minimatch.defaults = function (def) {
      if (!def || !Object.keys(def).length) return minimatch
    
      var orig = minimatch
    
      var m = function minimatch (p, pattern, options) {
        return orig.minimatch(p, pattern, ext(def, options))
      }
    
      m.Minimatch = function Minimatch (pattern, options) {
        return new orig.Minimatch(pattern, ext(def, options))
      }
    
      return m
    }
    
    Minimatch.defaults = function (def) {
      if (!def || !Object.keys(def).length) return Minimatch
      return minimatch.defaults(def).Minimatch
    }
    
    function minimatch (p, pattern, options) {
      if (typeof pattern !== 'string') {
        throw new TypeError('glob pattern string required')
      }
    
      if (!options) options = {}
    
      // shortcut: comments match nothing.
      if (!options.nocomment && pattern.charAt(0) === '#') {
        return false
      }
    
      // "" only matches ""
      if (pattern.trim() === '') return p === ''
    
      return new Minimatch(pattern, options).match(p)
    }
    
    function Minimatch (pattern, options) {
      if (!(this instanceof Minimatch)) {
        return new Minimatch(pattern, options)
      }
    
      if (typeof pattern !== 'string') {
        throw new TypeError('glob pattern string required')
      }
    
      if (!options) options = {}
      pattern = pattern.trim()
    
      // windows support: need to use /, not \
      if (path.sep !== '/') {
        pattern = pattern.split(path.sep).join('/')
      }
    
      this.options = options
      this.set = []
      this.pattern = pattern
      this.regexp = null
      this.negate = false
      this.comment = false
      this.empty = false
    
      // make the set of regexps etc.
      this.make()
    }
    
    Minimatch.prototype.debug = function () {}
    
    Minimatch.prototype.make = make
    function make () {
      // don't do it more than once.
      if (this._made) return
    
      var pattern = this.pattern
      var options = this.options
    
      // empty patterns and comments match nothing.
      if (!options.nocomment && pattern.charAt(0) === '#') {
        this.comment = true
        return
      }
      if (!pattern) {
        this.empty = true
        return
      }
    
      // step 1: figure out negation, etc.
      this.parseNegate()
    
      // step 2: expand braces
      var set = this.globSet = this.braceExpand()
    
      if (options.debug) this.debug = console.error
    
      this.debug(this.pattern, set)
    
      // step 3: now we have a set, so turn each one into a series of path-portion
      // matching patterns.
      // These will be regexps, except in the case of "**", which is
      // set to the GLOBSTAR object for globstar behavior,
      // and will not contain any / characters
      set = this.globParts = set.map(function (s) {
        return s.split(slashSplit)
      })
    
      this.debug(this.pattern, set)
    
      // glob --> regexps
      set = set.map(function (s, si, set) {
        return s.map(this.parse, this)
      }, this)
    
      this.debug(this.pattern, set)
    
      // filter out everything that didn't compile properly.
      set = set.filter(function (s) {
        return s.indexOf(false) === -1
      })
    
      this.debug(this.pattern, set)
    
      this.set = set
    }
    
    Minimatch.prototype.parseNegate = parseNegate
    function parseNegate () {
      var pattern = this.pattern
      var negate = false
      var options = this.options
      var negateOffset = 0
    
      if (options.nonegate) return
    
      for (var i = 0, l = pattern.length
        ; i < l && pattern.charAt(i) === '!'
        ; i++) {
        negate = !negate
        negateOffset++
      }
    
      if (negateOffset) this.pattern = pattern.substr(negateOffset)
      this.negate = negate
    }
    
    // Brace expansion:
    // a{b,c}d -> abd acd
    // a{b,}c -> abc ac
    // a{0..3}d -> a0d a1d a2d a3d
    // a{b,c{d,e}f}g -> abg acdfg acefg
    // a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
    //
    // Invalid sets are not expanded.
    // a{2..}b -> a{2..}b
    // a{b}c -> a{b}c
    minimatch.braceExpand = function (pattern, options) {
      return braceExpand(pattern, options)
    }
    
    Minimatch.prototype.braceExpand = braceExpand
    
    function braceExpand (pattern, options) {
      if (!options) {
        if (this instanceof Minimatch) {
          options = this.options
        } else {
          options = {}
        }
      }
    
      pattern = typeof pattern === 'undefined'
        ? this.pattern : pattern
    
      if (typeof pattern === 'undefined') {
        throw new Error('undefined pattern')
      }
    
      if (options.nobrace ||
        !pattern.match(/\{.*\}/)) {
        // shortcut. no need to expand.
        return [pattern]
      }
    
      return expand(pattern)
    }
    
    // parse a component of the expanded set.
    // At this point, no pattern may contain "/" in it
    // so we're going to return a 2d array, where each entry is the full
    // pattern, split on '/', and then turned into a regular expression.
    // A regexp is made at the end which joins each array with an
    // escaped /, and another full one which joins each regexp with |.
    //
    // Following the lead of Bash 4.1, note that "**" only has special meaning
    // when it is the *only* thing in a path portion.  Otherwise, any series
    // of * is equivalent to a single *.  Globstar behavior is enabled by
    // default, and can be disabled by setting options.noglobstar.
    Minimatch.prototype.parse = parse
    var SUBPARSE = {}
    function parse (pattern, isSub) {
      var options = this.options
    
      // shortcuts
      if (!options.noglobstar && pattern === '**') return GLOBSTAR
      if (pattern === '') return ''
    
      var re = ''
      var hasMagic = !!options.nocase
      var escaping = false
      // ? => one single character
      var patternListStack = []
      var negativeLists = []
      var plType
      var stateChar
      var inClass = false
      var reClassStart = -1
      var classStart = -1
      // . and .. never match anything that doesn't start with .,
      // even when options.dot is set.
      var patternStart = pattern.charAt(0) === '.' ? '' // anything
      // not (start or / followed by . or .. followed by / or end)
      : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
      : '(?!\\.)'
      var self = this
    
      function clearStateChar () {
        if (stateChar) {
          // we had some state-tracking character
          // that wasn't consumed by this pass.
          switch (stateChar) {
            case '*':
              re += star
              hasMagic = true
            break
            case '?':
              re += qmark
              hasMagic = true
            break
            default:
              re += '\\' + stateChar
            break
          }
          self.debug('clearStateChar %j %j', stateChar, re)
          stateChar = false
        }
      }
    
      for (var i = 0, len = pattern.length, c
        ; (i < len) && (c = pattern.charAt(i))
        ; i++) {
        this.debug('%s\t%s %s %j', pattern, i, re, c)
    
        // skip over any that are escaped.
        if (escaping && reSpecials[c]) {
          re += '\\' + c
          escaping = false
          continue
        }
    
        switch (c) {
          case '/':
            // completely not allowed, even escaped.
            // Should already be path-split by now.
            return false
    
          case '\\':
            clearStateChar()
            escaping = true
          continue
    
          // the various stateChar values
          // for the "extglob" stuff.
          case '?':
          case '*':
          case '+':
          case '@':
          case '!':
            this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)
    
            // all of those are literals inside a class, except that
            // the glob [!a] means [^a] in regexp
            if (inClass) {
              this.debug('  in class')
              if (c === '!' && i === classStart + 1) c = '^'
              re += c
              continue
            }
    
            // if we already have a stateChar, then it means
            // that there was something like ** or +? in there.
            // Handle the stateChar, then proceed with this one.
            self.debug('call clearStateChar %j', stateChar)
            clearStateChar()
            stateChar = c
            // if extglob is disabled, then +(asdf|foo) isn't a thing.
            // just clear the statechar *now*, rather than even diving into
            // the patternList stuff.
            if (options.noext) clearStateChar()
          continue
    
          case '(':
            if (inClass) {
              re += '('
              continue
            }
    
            if (!stateChar) {
              re += '\\('
              continue
            }
    
            plType = stateChar
            patternListStack.push({
              type: plType,
              start: i - 1,
              reStart: re.length
            })
            // negation is (?:(?!js)[^/]*)
            re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
            this.debug('plType %j %j', stateChar, re)
            stateChar = false
          continue
    
          case ')':
            if (inClass || !patternListStack.length) {
              re += '\\)'
              continue
            }
    
            clearStateChar()
            hasMagic = true
            re += ')'
            var pl = patternListStack.pop()
            plType = pl.type
            // negation is (?:(?!js)[^/]*)
            // The others are (?:<pattern>)<type>
            switch (plType) {
              case '!':
                negativeLists.push(pl)
                re += ')[^/]*?)'
                pl.reEnd = re.length
                break
              case '?':
              case '+':
              case '*':
                re += plType
                break
              case '@': break // the default anyway
            }
          continue
    
          case '|':
            if (inClass || !patternListStack.length || escaping) {
              re += '\\|'
              escaping = false
              continue
            }
    
            clearStateChar()
            re += '|'
          continue
    
          // these are mostly the same in regexp and glob
          case '[':
            // swallow any state-tracking char before the [
            clearStateChar()
    
            if (inClass) {
              re += '\\' + c
              continue
            }
    
            inClass = true
            classStart = i
            reClassStart = re.length
            re += c
          continue
    
          case ']':
            //  a right bracket shall lose its special
            //  meaning and represent itself in
            //  a bracket expression if it occurs
            //  first in the list.  -- POSIX.2 2.8.3.2
            if (i === classStart + 1 || !inClass) {
              re += '\\' + c
              escaping = false
              continue
            }
    
            // handle the case where we left a class open.
            // "[z-a]" is valid, equivalent to "\[z-a\]"
            if (inClass) {
              // split where the last [ was, make sure we don't have
              // an invalid re. if so, re-walk the contents of the
              // would-be class to re-translate any characters that
              // were passed through as-is
              // TODO: It would probably be faster to determine this
              // without a try/catch and a new RegExp, but it's tricky
              // to do safely.  For now, this is safe and works.
              var cs = pattern.substring(classStart + 1, i)
              try {
                RegExp('[' + cs + ']')
              } catch (er) {
                // not a valid class!
                var sp = this.parse(cs, SUBPARSE)
                re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
                hasMagic = hasMagic || sp[1]
                inClass = false
                continue
              }
            }
    
            // finish up the class.
            hasMagic = true
            inClass = false
            re += c
          continue
    
          default:
            // swallow any state char that wasn't consumed
            clearStateChar()
    
            if (escaping) {
              // no need
              escaping = false
            } else if (reSpecials[c]
              && !(c === '^' && inClass)) {
              re += '\\'
            }
    
            re += c
    
        } // switch
      } // for
    
      // handle the case where we left a class open.
      // "[abc" is valid, equivalent to "\[abc"
      if (inClass) {
        // split where the last [ was, and escape it
        // this is a huge pita.  We now have to re-walk
        // the contents of the would-be class to re-translate
        // any characters that were passed through as-is
        cs = pattern.substr(classStart + 1)
        sp = this.parse(cs, SUBPARSE)
        re = re.substr(0, reClassStart) + '\\[' + sp[0]
        hasMagic = hasMagic || sp[1]
      }
    
      // handle the case where we had a +( thing at the *end*
      // of the pattern.
      // each pattern list stack adds 3 chars, and we need to go through
      // and escape any | chars that were passed through as-is for the regexp.
      // Go through and escape them, taking care not to double-escape any
      // | chars that were already escaped.
      for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
        var tail = re.slice(pl.reStart + 3)
        // maybe some even number of \, then maybe 1 \, followed by a |
        tail = tail.replace(/((?:\\{2})*)(\\?)\|/g, function (_, $1, $2) {
          if (!$2) {
            // the | isn't already escaped, so escape it.
            $2 = '\\'
          }
    
          // need to escape all those slashes *again*, without escaping the
          // one that we need for escaping the | character.  As it works out,
          // escaping an even number of slashes can be done by simply repeating
          // it exactly after itself.  That's why this trick works.
          //
          // I am sorry that you have to see this.
          return $1 + $1 + $2 + '|'
        })
    
        this.debug('tail=%j\n   %s', tail, tail)
        var t = pl.type === '*' ? star
          : pl.type === '?' ? qmark
          : '\\' + pl.type
    
        hasMagic = true
        re = re.slice(0, pl.reStart) + t + '\\(' + tail
      }
    
      // handle trailing things that only matter at the very end.
      clearStateChar()
      if (escaping) {
        // trailing \\
        re += '\\\\'
      }
    
      // only need to apply the nodot start if the re starts with
      // something that could conceivably capture a dot
      var addPatternStart = false
      switch (re.charAt(0)) {
        case '.':
        case '[':
        case '(': addPatternStart = true
      }
    
      // Hack to work around lack of negative lookbehind in JS
      // A pattern like: *.!(x).!(y|z) needs to ensure that a name
      // like 'a.xyz.yz' doesn't match.  So, the first negative
      // lookahead, has to look ALL the way ahead, to the end of
      // the pattern.
      for (var n = negativeLists.length - 1; n > -1; n--) {
        var nl = negativeLists[n]
    
        var nlBefore = re.slice(0, nl.reStart)
        var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
        var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
        var nlAfter = re.slice(nl.reEnd)
    
        nlLast += nlAfter
    
        // Handle nested stuff like *(*.js|!(*.json)), where open parens
        // mean that we should *not* include the ) in the bit that is considered
        // "after" the negated section.
        var openParensBefore = nlBefore.split('(').length - 1
        var cleanAfter = nlAfter
        for (i = 0; i < openParensBefore; i++) {
          cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
        }
        nlAfter = cleanAfter
    
        var dollar = ''
        if (nlAfter === '' && isSub !== SUBPARSE) {
          dollar = '$'
        }
        var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
        re = newRe
      }
    
      // if the re is not "" at this point, then we need to make sure
      // it doesn't match against an empty path part.
      // Otherwise a/* will match a/, which it should not.
      if (re !== '' && hasMagic) {
        re = '(?=.)' + re
      }
    
      if (addPatternStart) {
        re = patternStart + re
      }
    
      // parsing just a piece of a larger pattern.
      if (isSub === SUBPARSE) {
        return [re, hasMagic]
      }
    
      // skip the regexp for non-magical patterns
      // unescape anything in it, though, so that it'll be
      // an exact match against a file etc.
      if (!hasMagic) {
        return globUnescape(pattern)
      }
    
      var flags = options.nocase ? 'i' : ''
      var regExp = new RegExp('^' + re + '$', flags)
    
      regExp._glob = pattern
      regExp._src = re
    
      return regExp
    }
    
    minimatch.makeRe = function (pattern, options) {
      return new Minimatch(pattern, options || {}).makeRe()
    }
    
    Minimatch.prototype.makeRe = makeRe
    function makeRe () {
      if (this.regexp || this.regexp === false) return this.regexp
    
      // at this point, this.set is a 2d array of partial
      // pattern strings, or "**".
      //
      // It's better to use .match().  This function shouldn't
      // be used, really, but it's pretty convenient sometimes,
      // when you just want to work with a regex.
      var set = this.set
    
      if (!set.length) {
        this.regexp = false
        return this.regexp
      }
      var options = this.options
    
      var twoStar = options.noglobstar ? star
        : options.dot ? twoStarDot
        : twoStarNoDot
      var flags = options.nocase ? 'i' : ''
    
      var re = set.map(function (pattern) {
        return pattern.map(function (p) {
          return (p === GLOBSTAR) ? twoStar
          : (typeof p === 'string') ? regExpEscape(p)
          : p._src
        }).join('\\\/')
      }).join('|')
    
      // must match entire pattern
      // ending in a * or ** will make it less strict.
      re = '^(?:' + re + ')$'
    
      // can match anything, as long as it's not this.
      if (this.negate) re = '^(?!' + re + ').*$'
    
      try {
        this.regexp = new RegExp(re, flags)
      } catch (ex) {
        this.regexp = false
      }
      return this.regexp
    }
    
    minimatch.match = function (list, pattern, options) {
      options = options || {}
      var mm = new Minimatch(pattern, options)
      list = list.filter(function (f) {
        return mm.match(f)
      })
      if (mm.options.nonull && !list.length) {
        list.push(pattern)
      }
      return list
    }
    
    Minimatch.prototype.match = match
    function match (f, partial) {
      this.debug('match', f, this.pattern)
      // short-circuit in the case of busted things.
      // comments, etc.
      if (this.comment) return false
      if (this.empty) return f === ''
    
      if (f === '/' && partial) return true
    
      var options = this.options
    
      // windows: need to use /, not \
      if (path.sep !== '/') {
        f = f.split(path.sep).join('/')
      }
    
      // treat the test path as a set of pathparts.
      f = f.split(slashSplit)
      this.debug(this.pattern, 'split', f)
    
      // just ONE of the pattern sets in this.set needs to match
      // in order for it to be valid.  If negating, then just one
      // match means that we have failed.
      // Either way, return on the first hit.
    
      var set = this.set
      this.debug(this.pattern, 'set', set)
    
      // Find the basename of the path by looking for the last non-empty segment
      var filename
      var i
      for (i = f.length - 1; i >= 0; i--) {
        filename = f[i]
        if (filename) break
      }
    
      for (i = 0; i < set.length; i++) {
        var pattern = set[i]
        var file = f
        if (options.matchBase && pattern.length === 1) {
          file = [filename]
        }
        var hit = this.matchOne(file, pattern, partial)
        if (hit) {
          if (options.flipNegate) return true
          return !this.negate
        }
      }
    
      // didn't get any hits.  this is success if it's a negative
      // pattern, failure otherwise.
      if (options.flipNegate) return false
      return this.negate
    }
    
    // set partial to true to test if, for example,
    // "/a/b" matches the start of "/*/b/*/d"
    // Partial means, if you run out of file before you run
    // out of pattern, then that's fine, as long as all
    // the parts match.
    Minimatch.prototype.matchOne = function (file, pattern, partial) {
      var options = this.options
    
      this.debug('matchOne',
        { 'this': this, file: file, pattern: pattern })
    
      this.debug('matchOne', file.length, pattern.length)
    
      for (var fi = 0,
          pi = 0,
          fl = file.length,
          pl = pattern.length
          ; (fi < fl) && (pi < pl)
          ; fi++, pi++) {
        this.debug('matchOne loop')
        var p = pattern[pi]
        var f = file[fi]
    
        this.debug(pattern, p, f)
    
        // should be impossible.
        // some invalid regexp stuff in the set.
        if (p === false) return false
    
        if (p === GLOBSTAR) {
          this.debug('GLOBSTAR', [pattern, p, f])
    
          // "**"
          // a/**/b/**/c would match the following:
          // a/b/x/y/z/c
          // a/x/y/z/b/c
          // a/b/x/b/x/c
          // a/b/c
          // To do this, take the rest of the pattern after
          // the **, and see if it would match the file remainder.
          // If so, return success.
          // If not, the ** "swallows" a segment, and try again.
          // This is recursively awful.
          //
          // a/**/b/**/c matching a/b/x/y/z/c
          // - a matches a
          // - doublestar
          //   - matchOne(b/x/y/z/c, b/**/c)
          //     - b matches b
          //     - doublestar
          //       - matchOne(x/y/z/c, c) -> no
          //       - matchOne(y/z/c, c) -> no
          //       - matchOne(z/c, c) -> no
          //       - matchOne(c, c) yes, hit
          var fr = fi
          var pr = pi + 1
          if (pr === pl) {
            this.debug('** at the end')
            // a ** at the end will just swallow the rest.
            // We have found a match.
            // however, it will not swallow /.x, unless
            // options.dot is set.
            // . and .. are *never* matched by **, for explosively
            // exponential reasons.
            for (; fi < fl; fi++) {
              if (file[fi] === '.' || file[fi] === '..' ||
                (!options.dot && file[fi].charAt(0) === '.')) return false
            }
            return true
          }
    
          // ok, let's see if we can swallow whatever we can.
          while (fr < fl) {
            var swallowee = file[fr]
    
            this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)
    
            // XXX remove this slice.  Just pass the start index.
            if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
              this.debug('globstar found match!', fr, fl, swallowee)
              // found a match.
              return true
            } else {
              // can't swallow "." or ".." ever.
              // can only swallow ".foo" when explicitly asked.
              if (swallowee === '.' || swallowee === '..' ||
                (!options.dot && swallowee.charAt(0) === '.')) {
                this.debug('dot detected!', file, fr, pattern, pr)
                break
              }
    
              // ** swallows a segment, and continue.
              this.debug('globstar swallow a segment, and continue')
              fr++
            }
          }
    
          // no match was found.
          // However, in partial mode, we can't say this is necessarily over.
          // If there's more *pattern* left, then
          if (partial) {
            // ran out of file
            this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
            if (fr === fl) return true
          }
          return false
        }
    
        // something other than **
        // non-magic patterns just have to match exactly
        // patterns with magic have been turned into regexps.
        var hit
        if (typeof p === 'string') {
          if (options.nocase) {
            hit = f.toLowerCase() === p.toLowerCase()
          } else {
            hit = f === p
          }
          this.debug('string match', p, f, hit)
        } else {
          hit = f.match(p)
          this.debug('pattern match', p, f, hit)
        }
    
        if (!hit) return false
      }
    
      // Note: ending in / means that we'll get a final ""
      // at the end of the pattern.  This can only match a
      // corresponding "" at the end of the file.
      // If the file ends in /, then it can only match a
      // a pattern that ends in /, unless the pattern just
      // doesn't have any more for it. But, a/b/ should *not*
      // match "a/b/*", even though "" matches against the
      // [^/]*? pattern, except in partial mode, where it might
      // simply not be reached yet.
      // However, a/b/ should still satisfy a/*
    
      // now either we fell off the end of the pattern, or we're done.
      if (fi === fl && pi === pl) {
        // ran out of pattern and filename at the same time.
        // an exact hit!
        return true
      } else if (fi === fl) {
        // ran out of file, but still had pattern left.
        // this is ok if we're doing the match as part of
        // a glob fs traversal.
        return partial
      } else if (pi === pl) {
        // ran out of pattern, still have file left.
        // this is only acceptable if we're on the very last
        // empty segment of a file with a trailing slash.
        // a/* should match a/b/
        var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
        return emptyFileEnd
      }
    
      // should be unreachable.
      throw new Error('wtf?')
    }
    
    // replace stuff like \* with *
    function globUnescape (s) {
      return s.replace(/\\(.)/g, '$1')
    }
    
    function regExpEscape (s) {
      return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    }
    
  provide("minimatch", module.exports);
}(global));

// pakmanager:minimist
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = function (args, opts) {
        if (!opts) opts = {};
        
        var flags = { bools : {}, strings : {}, unknownFn: null };
    
        if (typeof opts['unknown'] === 'function') {
            flags.unknownFn = opts['unknown'];
        }
    
        if (typeof opts['boolean'] === 'boolean' && opts['boolean']) {
          flags.allBools = true;
        } else {
          [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
              flags.bools[key] = true;
          });
        }
        
        var aliases = {};
        Object.keys(opts.alias || {}).forEach(function (key) {
            aliases[key] = [].concat(opts.alias[key]);
            aliases[key].forEach(function (x) {
                aliases[x] = [key].concat(aliases[key].filter(function (y) {
                    return x !== y;
                }));
            });
        });
    
        [].concat(opts.string).filter(Boolean).forEach(function (key) {
            flags.strings[key] = true;
            if (aliases[key]) {
                flags.strings[aliases[key]] = true;
            }
         });
    
        var defaults = opts['default'] || {};
        
        var argv = { _ : [] };
        Object.keys(flags.bools).forEach(function (key) {
            setArg(key, defaults[key] === undefined ? false : defaults[key]);
        });
        
        var notFlags = [];
    
        if (args.indexOf('--') !== -1) {
            notFlags = args.slice(args.indexOf('--')+1);
            args = args.slice(0, args.indexOf('--'));
        }
    
        function argDefined(key, arg) {
            return (flags.allBools && /^--[^=]+$/.test(arg)) ||
                flags.strings[key] || flags.bools[key] || aliases[key];
        }
    
        function setArg (key, val, arg) {
            if (arg && flags.unknownFn && !argDefined(key, arg)) {
                if (flags.unknownFn(arg) === false) return;
            }
    
            var value = !flags.strings[key] && isNumber(val)
                ? Number(val) : val
            ;
            setKey(argv, key.split('.'), value);
            
            (aliases[key] || []).forEach(function (x) {
                setKey(argv, x.split('.'), value);
            });
        }
    
        function setKey (obj, keys, value) {
            var o = obj;
            keys.slice(0,-1).forEach(function (key) {
                if (o[key] === undefined) o[key] = {};
                o = o[key];
            });
    
            var key = keys[keys.length - 1];
            if (o[key] === undefined || flags.bools[key] || typeof o[key] === 'boolean') {
                o[key] = value;
            }
            else if (Array.isArray(o[key])) {
                o[key].push(value);
            }
            else {
                o[key] = [ o[key], value ];
            }
        }
        
        function aliasIsBoolean(key) {
          return aliases[key].some(function (x) {
              return flags.bools[x];
          });
        }
    
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            
            if (/^--.+=/.test(arg)) {
                // Using [\s\S] instead of . because js doesn't support the
                // 'dotall' regex modifier. See:
                // http://stackoverflow.com/a/1068308/13216
                var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
                var key = m[1];
                var value = m[2];
                if (flags.bools[key]) {
                    value = value !== 'false';
                }
                setArg(key, value, arg);
            }
            else if (/^--no-.+/.test(arg)) {
                var key = arg.match(/^--no-(.+)/)[1];
                setArg(key, false, arg);
            }
            else if (/^--.+/.test(arg)) {
                var key = arg.match(/^--(.+)/)[1];
                var next = args[i + 1];
                if (next !== undefined && !/^-/.test(next)
                && !flags.bools[key]
                && !flags.allBools
                && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                    setArg(key, next, arg);
                    i++;
                }
                else if (/^(true|false)$/.test(next)) {
                    setArg(key, next === 'true', arg);
                    i++;
                }
                else {
                    setArg(key, flags.strings[key] ? '' : true, arg);
                }
            }
            else if (/^-[^-]+/.test(arg)) {
                var letters = arg.slice(1,-1).split('');
                
                var broken = false;
                for (var j = 0; j < letters.length; j++) {
                    var next = arg.slice(j+2);
                    
                    if (next === '-') {
                        setArg(letters[j], next, arg)
                        continue;
                    }
                    
                    if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
                        setArg(letters[j], next.split('=')[1], arg);
                        broken = true;
                        break;
                    }
                    
                    if (/[A-Za-z]/.test(letters[j])
                    && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
                        setArg(letters[j], next, arg);
                        broken = true;
                        break;
                    }
                    
                    if (letters[j+1] && letters[j+1].match(/\W/)) {
                        setArg(letters[j], arg.slice(j+2), arg);
                        broken = true;
                        break;
                    }
                    else {
                        setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
                    }
                }
                
                var key = arg.slice(-1)[0];
                if (!broken && key !== '-') {
                    if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
                    && !flags.bools[key]
                    && (aliases[key] ? !aliasIsBoolean(key) : true)) {
                        setArg(key, args[i+1], arg);
                        i++;
                    }
                    else if (args[i+1] && /true|false/.test(args[i+1])) {
                        setArg(key, args[i+1] === 'true', arg);
                        i++;
                    }
                    else {
                        setArg(key, flags.strings[key] ? '' : true, arg);
                    }
                }
            }
            else {
                if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
                    argv._.push(
                        flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
                    );
                }
                if (opts.stopEarly) {
                    argv._.push.apply(argv._, args.slice(i + 1));
                    break;
                }
            }
        }
        
        Object.keys(defaults).forEach(function (key) {
            if (!hasKey(argv, key.split('.'))) {
                setKey(argv, key.split('.'), defaults[key]);
                
                (aliases[key] || []).forEach(function (x) {
                    setKey(argv, x.split('.'), defaults[key]);
                });
            }
        });
        
        if (opts['--']) {
            argv['--'] = new Array();
            notFlags.forEach(function(key) {
                argv['--'].push(key);
            });
        }
        else {
            notFlags.forEach(function(key) {
                argv._.push(key);
            });
        }
    
        return argv;
    };
    
    function hasKey (obj, keys) {
        var o = obj;
        keys.slice(0,-1).forEach(function (key) {
            o = (o[key] || {});
        });
    
        var key = keys[keys.length - 1];
        return key in o;
    }
    
    function isNumber (x) {
        if (typeof x === 'number') return true;
        if (/^0x[0-9a-f]+$/i.test(x)) return true;
        return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
    }
    
    
  provide("minimist", module.exports);
}(global));

// pakmanager:glob/common.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  exports.alphasort = alphasort
    exports.alphasorti = alphasorti
    exports.isAbsolute = process.platform === "win32" ? absWin : absUnix
    exports.setopts = setopts
    exports.ownProp = ownProp
    exports.makeAbs = makeAbs
    exports.finish = finish
    exports.mark = mark
    exports.isIgnored = isIgnored
    exports.childrenIgnored = childrenIgnored
    
    function ownProp (obj, field) {
      return Object.prototype.hasOwnProperty.call(obj, field)
    }
    
    var path = require("path")
    var minimatch = require("minimatch")
    var Minimatch = minimatch.Minimatch
    
    function absWin (p) {
      if (absUnix(p)) return true
      // pull off the device/UNC bit from a windows path.
      // from node's lib/path.js
      var splitDeviceRe =
          /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/
      var result = splitDeviceRe.exec(p)
      var device = result[1] || ''
      var isUnc = device && device.charAt(1) !== ':'
      var isAbsolute = !!result[2] || isUnc // UNC paths are always absolute
    
      return isAbsolute
    }
    
    function absUnix (p) {
      return p.charAt(0) === "/" || p === ""
    }
    
    function alphasorti (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase())
    }
    
    function alphasort (a, b) {
      return a.localeCompare(b)
    }
    
    function setupIgnores (self, options) {
      self.ignore = options.ignore || []
    
      if (!Array.isArray(self.ignore))
        self.ignore = [self.ignore]
    
      if (self.ignore.length) {
        self.ignore = self.ignore.map(ignoreMap)
      }
    }
    
    function ignoreMap (pattern) {
      var gmatcher = null
      if (pattern.slice(-3) === '/**') {
        var gpattern = pattern.replace(/(\/\*\*)+$/, '')
        gmatcher = new Minimatch(gpattern, { nonegate: true })
      }
    
      return {
        matcher: new Minimatch(pattern, { nonegate: true }),
        gmatcher: gmatcher
      }
    }
    
    function setopts (self, pattern, options) {
      if (!options)
        options = {}
    
      // base-matching: just use globstar for that.
      if (options.matchBase && -1 === pattern.indexOf("/")) {
        if (options.noglobstar) {
          throw new Error("base matching requires globstar")
        }
        pattern = "**/" + pattern
      }
    
      self.pattern = pattern
      self.strict = options.strict !== false
      self.realpath = !!options.realpath
      self.realpathCache = options.realpathCache || Object.create(null)
      self.follow = !!options.follow
      self.dot = !!options.dot
      self.mark = !!options.mark
      self.nodir = !!options.nodir
      if (self.nodir)
        self.mark = true
      self.sync = !!options.sync
      self.nounique = !!options.nounique
      self.nonull = !!options.nonull
      self.nosort = !!options.nosort
      self.nocase = !!options.nocase
      self.stat = !!options.stat
      self.noprocess = !!options.noprocess
    
      self.maxLength = options.maxLength || Infinity
      self.cache = options.cache || Object.create(null)
      self.statCache = options.statCache || Object.create(null)
      self.symlinks = options.symlinks || Object.create(null)
    
      setupIgnores(self, options)
    
      self.changedCwd = false
      var cwd = process.cwd()
      if (!ownProp(options, "cwd"))
        self.cwd = cwd
      else {
        self.cwd = options.cwd
        self.changedCwd = path.resolve(options.cwd) !== cwd
      }
    
      self.root = options.root || path.resolve(self.cwd, "/")
      self.root = path.resolve(self.root)
      if (process.platform === "win32")
        self.root = self.root.replace(/\\/g, "/")
    
      self.nomount = !!options.nomount
    
      self.minimatch = new Minimatch(pattern, options)
      self.options = self.minimatch.options
    }
    
    function finish (self) {
      var nou = self.nounique
      var all = nou ? [] : Object.create(null)
    
      for (var i = 0, l = self.matches.length; i < l; i ++) {
        var matches = self.matches[i]
        if (!matches || Object.keys(matches).length === 0) {
          if (self.nonull) {
            // do like the shell, and spit out the literal glob
            var literal = self.minimatch.globSet[i]
            if (nou)
              all.push(literal)
            else
              all[literal] = true
          }
        } else {
          // had matches
          var m = Object.keys(matches)
          if (nou)
            all.push.apply(all, m)
          else
            m.forEach(function (m) {
              all[m] = true
            })
        }
      }
    
      if (!nou)
        all = Object.keys(all)
    
      if (!self.nosort)
        all = all.sort(self.nocase ? alphasorti : alphasort)
    
      // at *some* point we statted all of these
      if (self.mark) {
        for (var i = 0; i < all.length; i++) {
          all[i] = self._mark(all[i])
        }
        if (self.nodir) {
          all = all.filter(function (e) {
            return !(/\/$/.test(e))
          })
        }
      }
    
      if (self.ignore.length)
        all = all.filter(function(m) {
          return !isIgnored(self, m)
        })
    
      self.found = all
    }
    
    function mark (self, p) {
      var abs = makeAbs(self, p)
      var c = self.cache[abs]
      var m = p
      if (c) {
        var isDir = c === 'DIR' || Array.isArray(c)
        var slash = p.slice(-1) === '/'
    
        if (isDir && !slash)
          m += '/'
        else if (!isDir && slash)
          m = m.slice(0, -1)
    
        if (m !== p) {
          var mabs = makeAbs(self, m)
          self.statCache[mabs] = self.statCache[abs]
          self.cache[mabs] = self.cache[abs]
        }
      }
    
      return m
    }
    
    // lotta situps...
    function makeAbs (self, f) {
      var abs = f
      if (f.charAt(0) === '/') {
        abs = path.join(self.root, f)
      } else if (exports.isAbsolute(f)) {
        abs = f
      } else if (self.changedCwd) {
        abs = path.resolve(self.cwd, f)
      } else if (self.realpath) {
        abs = path.resolve(f)
      }
      return abs
    }
    
    
    // Return true, if pattern ends with globstar '**', for the accompanying parent directory.
    // Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
    function isIgnored (self, path) {
      if (!self.ignore.length)
        return false
    
      return self.ignore.some(function(item) {
        return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
      })
    }
    
    function childrenIgnored (self, path) {
      if (!self.ignore.length)
        return false
    
      return self.ignore.some(function(item) {
        return !!(item.gmatcher && item.gmatcher.match(path))
      })
    }
    
  provide("glob/common.js", module.exports);
}(global));

// pakmanager:glob/glob.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // Approach:
    //
    // 1. Get the minimatch set
    // 2. For each pattern in the set, PROCESS(pattern, false)
    // 3. Store matches per-set, then uniq them
    //
    // PROCESS(pattern, inGlobStar)
    // Get the first [n] items from pattern that are all strings
    // Join these together.  This is PREFIX.
    //   If there is no more remaining, then stat(PREFIX) and
    //   add to matches if it succeeds.  END.
    //
    // If inGlobStar and PREFIX is symlink and points to dir
    //   set ENTRIES = []
    // else readdir(PREFIX) as ENTRIES
    //   If fail, END
    //
    // with ENTRIES
    //   If pattern[n] is GLOBSTAR
    //     // handle the case where the globstar match is empty
    //     // by pruning it out, and testing the resulting pattern
    //     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
    //     // handle other cases.
    //     for ENTRY in ENTRIES (not dotfiles)
    //       // attach globstar + tail onto the entry
    //       // Mark that this entry is a globstar match
    //       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
    //
    //   else // not globstar
    //     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
    //       Test ENTRY against pattern[n]
    //       If fails, continue
    //       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
    //
    // Caveat:
    //   Cache all stats and readdirs results to minimize syscall.  Since all
    //   we ever care about is existence and directory-ness, we can just keep
    //   `true` for files, and [children,...] for directories, or `false` for
    //   things that don't exist.
    
    module.exports = glob
    
    var fs = require('fs')
    var minimatch = require('minimatch')
    var Minimatch = minimatch.Minimatch
    var inherits = require('inherits')
    var EE = require('events').EventEmitter
    var path = require('path')
    var assert = require('assert')
    var globSync =  require('glob/sync.js')
    var common =  require('glob/common.js')
    var alphasort = common.alphasort
    var alphasorti = common.alphasorti
    var isAbsolute = common.isAbsolute
    var setopts = common.setopts
    var ownProp = common.ownProp
    var inflight = require('inflight')
    var util = require('util')
    var childrenIgnored = common.childrenIgnored
    
    var once = require('once')
    
    function glob (pattern, options, cb) {
      if (typeof options === 'function') cb = options, options = {}
      if (!options) options = {}
    
      if (options.sync) {
        if (cb)
          throw new TypeError('callback provided to sync glob')
        return globSync(pattern, options)
      }
    
      return new Glob(pattern, options, cb)
    }
    
    glob.sync = globSync
    var GlobSync = glob.GlobSync = globSync.GlobSync
    
    // old api surface
    glob.glob = glob
    
    glob.hasMagic = function (pattern, options_) {
      var options = util._extend({}, options_)
      options.noprocess = true
    
      var g = new Glob(pattern, options)
      var set = g.minimatch.set
      if (set.length > 1)
        return true
    
      for (var j = 0; j < set[0].length; j++) {
        if (typeof set[0][j] !== 'string')
          return true
      }
    
      return false
    }
    
    glob.Glob = Glob
    inherits(Glob, EE)
    function Glob (pattern, options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = null
      }
    
      if (options && options.sync) {
        if (cb)
          throw new TypeError('callback provided to sync glob')
        return new GlobSync(pattern, options)
      }
    
      if (!(this instanceof Glob))
        return new Glob(pattern, options, cb)
    
      setopts(this, pattern, options)
      this._didRealPath = false
    
      // process each pattern in the minimatch set
      var n = this.minimatch.set.length
    
      // The matches are stored as {<filename>: true,...} so that
      // duplicates are automagically pruned.
      // Later, we do an Object.keys() on these.
      // Keep them as a list so we can fill in when nonull is set.
      this.matches = new Array(n)
    
      if (typeof cb === 'function') {
        cb = once(cb)
        this.on('error', cb)
        this.on('end', function (matches) {
          cb(null, matches)
        })
      }
    
      var self = this
      var n = this.minimatch.set.length
      this._processing = 0
      this.matches = new Array(n)
    
      this._emitQueue = []
      this._processQueue = []
      this.paused = false
    
      if (this.noprocess)
        return this
    
      if (n === 0)
        return done()
    
      for (var i = 0; i < n; i ++) {
        this._process(this.minimatch.set[i], i, false, done)
      }
    
      function done () {
        --self._processing
        if (self._processing <= 0)
          self._finish()
      }
    }
    
    Glob.prototype._finish = function () {
      assert(this instanceof Glob)
      if (this.aborted)
        return
    
      if (this.realpath && !this._didRealpath)
        return this._realpath()
    
      common.finish(this)
      this.emit('end', this.found)
    }
    
    Glob.prototype._realpath = function () {
      if (this._didRealpath)
        return
    
      this._didRealpath = true
    
      var n = this.matches.length
      if (n === 0)
        return this._finish()
    
      var self = this
      for (var i = 0; i < this.matches.length; i++)
        this._realpathSet(i, next)
    
      function next () {
        if (--n === 0)
          self._finish()
      }
    }
    
    Glob.prototype._realpathSet = function (index, cb) {
      var matchset = this.matches[index]
      if (!matchset)
        return cb()
    
      var found = Object.keys(matchset)
      var self = this
      var n = found.length
    
      if (n === 0)
        return cb()
    
      var set = this.matches[index] = Object.create(null)
      found.forEach(function (p, i) {
        // If there's a problem with the stat, then it means that
        // one or more of the links in the realpath couldn't be
        // resolved.  just return the abs value in that case.
        p = self._makeAbs(p)
        fs.realpath(p, self.realpathCache, function (er, real) {
          if (!er)
            set[real] = true
          else if (er.syscall === 'stat')
            set[p] = true
          else
            self.emit('error', er) // srsly wtf right here
    
          if (--n === 0) {
            self.matches[index] = set
            cb()
          }
        })
      })
    }
    
    Glob.prototype._mark = function (p) {
      return common.mark(this, p)
    }
    
    Glob.prototype._makeAbs = function (f) {
      return common.makeAbs(this, f)
    }
    
    Glob.prototype.abort = function () {
      this.aborted = true
      this.emit('abort')
    }
    
    Glob.prototype.pause = function () {
      if (!this.paused) {
        this.paused = true
        this.emit('pause')
      }
    }
    
    Glob.prototype.resume = function () {
      if (this.paused) {
        this.emit('resume')
        this.paused = false
        if (this._emitQueue.length) {
          var eq = this._emitQueue.slice(0)
          this._emitQueue.length = 0
          for (var i = 0; i < eq.length; i ++) {
            var e = eq[i]
            this._emitMatch(e[0], e[1])
          }
        }
        if (this._processQueue.length) {
          var pq = this._processQueue.slice(0)
          this._processQueue.length = 0
          for (var i = 0; i < pq.length; i ++) {
            var p = pq[i]
            this._processing--
            this._process(p[0], p[1], p[2], p[3])
          }
        }
      }
    }
    
    Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
      assert(this instanceof Glob)
      assert(typeof cb === 'function')
    
      if (this.aborted)
        return
    
      this._processing++
      if (this.paused) {
        this._processQueue.push([pattern, index, inGlobStar, cb])
        return
      }
    
      //console.error('PROCESS %d', this._processing, pattern)
    
      // Get the first [n] parts of pattern that are all strings.
      var n = 0
      while (typeof pattern[n] === 'string') {
        n ++
      }
      // now n is the index of the first one that is *not* a string.
    
      // see if there's anything else
      var prefix
      switch (n) {
        // if not, then this is rather simple
        case pattern.length:
          this._processSimple(pattern.join('/'), index, cb)
          return
    
        case 0:
          // pattern *starts* with some non-trivial item.
          // going to readdir(cwd), but not include the prefix in matches.
          prefix = null
          break
    
        default:
          // pattern has some string bits in the front.
          // whatever it starts with, whether that's 'absolute' like /foo/bar,
          // or 'relative' like '../baz'
          prefix = pattern.slice(0, n).join('/')
          break
      }
    
      var remain = pattern.slice(n)
    
      // get the list of entries.
      var read
      if (prefix === null)
        read = '.'
      else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = '/' + prefix
        read = prefix
      } else
        read = prefix
    
      var abs = this._makeAbs(read)
    
      //if ignored, skip _processing
      if (childrenIgnored(this, read))
        return cb()
    
      var isGlobStar = remain[0] === minimatch.GLOBSTAR
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
    }
    
    Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this
      this._readdir(abs, inGlobStar, function (er, entries) {
        return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
      })
    }
    
    Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
    
      // if the abs isn't a dir, then nothing can match!
      if (!entries)
        return cb()
    
      // It will only match dot entries if it starts with a dot, or if
      // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
      var pn = remain[0]
      var negate = !!this.minimatch.negate
      var rawGlob = pn._glob
      var dotOk = this.dot || rawGlob.charAt(0) === '.'
    
      var matchedEntries = []
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i]
        if (e.charAt(0) !== '.' || dotOk) {
          var m
          if (negate && !prefix) {
            m = !e.match(pn)
          } else {
            m = e.match(pn)
          }
          if (m)
            matchedEntries.push(e)
        }
      }
    
      //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)
    
      var len = matchedEntries.length
      // If there are no matched entries, then nothing matches.
      if (len === 0)
        return cb()
    
      // if this is the last remaining pattern bit, then no need for
      // an additional stat *unless* the user has specified mark or
      // stat explicitly.  We know they exist, since readdir returned
      // them.
    
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = Object.create(null)
    
        for (var i = 0; i < len; i ++) {
          var e = matchedEntries[i]
          if (prefix) {
            if (prefix !== '/')
              e = prefix + '/' + e
            else
              e = prefix + e
          }
    
          if (e.charAt(0) === '/' && !this.nomount) {
            e = path.join(this.root, e)
          }
          this._emitMatch(index, e)
        }
        // This was the last one, and no stats were needed
        return cb()
      }
    
      // now test all matched entries as stand-ins for that part
      // of the pattern.
      remain.shift()
      for (var i = 0; i < len; i ++) {
        var e = matchedEntries[i]
        var newPattern
        if (prefix) {
          if (prefix !== '/')
            e = prefix + '/' + e
          else
            e = prefix + e
        }
        this._process([e].concat(remain), index, inGlobStar, cb)
      }
      cb()
    }
    
    Glob.prototype._emitMatch = function (index, e) {
      if (this.aborted)
        return
    
      if (this.matches[index][e])
        return
    
      if (this.paused) {
        this._emitQueue.push([index, e])
        return
      }
    
      var abs = this._makeAbs(e)
    
      if (this.nodir) {
        var c = this.cache[abs]
        if (c === 'DIR' || Array.isArray(c))
          return
      }
    
      if (this.mark)
        e = this._mark(e)
    
      this.matches[index][e] = true
    
      var st = this.statCache[abs]
      if (st)
        this.emit('stat', e, st)
    
      this.emit('match', e)
    }
    
    Glob.prototype._readdirInGlobStar = function (abs, cb) {
      if (this.aborted)
        return
    
      // follow all symlinked directories forever
      // just proceed as if this is a non-globstar situation
      if (this.follow)
        return this._readdir(abs, false, cb)
    
      var lstatkey = 'lstat\0' + abs
      var self = this
      var lstatcb = inflight(lstatkey, lstatcb_)
    
      if (lstatcb)
        fs.lstat(abs, lstatcb)
    
      function lstatcb_ (er, lstat) {
        if (er)
          return cb()
    
        var isSym = lstat.isSymbolicLink()
        self.symlinks[abs] = isSym
    
        // If it's not a symlink or a dir, then it's definitely a regular file.
        // don't bother doing a readdir in that case.
        if (!isSym && !lstat.isDirectory()) {
          self.cache[abs] = 'FILE'
          cb()
        } else
          self._readdir(abs, false, cb)
      }
    }
    
    Glob.prototype._readdir = function (abs, inGlobStar, cb) {
      if (this.aborted)
        return
    
      cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
      if (!cb)
        return
    
      //console.error('RD %j %j', +inGlobStar, abs)
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs, cb)
    
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs]
        if (!c || c === 'FILE')
          return cb()
    
        if (Array.isArray(c))
          return cb(null, c)
      }
    
      var self = this
      fs.readdir(abs, readdirCb(this, abs, cb))
    }
    
    function readdirCb (self, abs, cb) {
      return function (er, entries) {
        if (er)
          self._readdirError(abs, er, cb)
        else
          self._readdirEntries(abs, entries, cb)
      }
    }
    
    Glob.prototype._readdirEntries = function (abs, entries, cb) {
      if (this.aborted)
        return
    
      // if we haven't asked to stat everything, then just
      // assume that everything in there exists, so we can avoid
      // having to stat it a second time.
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i ++) {
          var e = entries[i]
          if (abs === '/')
            e = abs + e
          else
            e = abs + '/' + e
          this.cache[e] = true
        }
      }
    
      this.cache[abs] = entries
      return cb(null, entries)
    }
    
    Glob.prototype._readdirError = function (f, er, cb) {
      if (this.aborted)
        return
    
      // handle errors, and cache the information
      switch (er.code) {
        case 'ENOTDIR': // totally normal. means it *does* exist.
          this.cache[this._makeAbs(f)] = 'FILE'
          break
    
        case 'ENOENT': // not terribly unusual
        case 'ELOOP':
        case 'ENAMETOOLONG':
        case 'UNKNOWN':
          this.cache[this._makeAbs(f)] = false
          break
    
        default: // some unusual error.  Treat as failure.
          this.cache[this._makeAbs(f)] = false
          if (this.strict) return this.emit('error', er)
          if (!this.silent) console.error('glob error', er)
          break
      }
      return cb()
    }
    
    Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this
      this._readdir(abs, inGlobStar, function (er, entries) {
        self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
      })
    }
    
    
    Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      //console.error('pgs2', prefix, remain[0], entries)
    
      // no entries means not a dir, so it can never have matches
      // foo.txt/** doesn't match foo.txt
      if (!entries)
        return cb()
    
      // test without the globstar, and with every child both below
      // and replacing the globstar.
      var remainWithoutGlobStar = remain.slice(1)
      var gspref = prefix ? [ prefix ] : []
      var noGlobStar = gspref.concat(remainWithoutGlobStar)
    
      // the noGlobStar pattern exits the inGlobStar state
      this._process(noGlobStar, index, false, cb)
    
      var isSym = this.symlinks[abs]
      var len = entries.length
    
      // If it's a symlink, and we're in a globstar, then stop
      if (isSym && inGlobStar)
        return cb()
    
      for (var i = 0; i < len; i++) {
        var e = entries[i]
        if (e.charAt(0) === '.' && !this.dot)
          continue
    
        // these two cases enter the inGlobStar state
        var instead = gspref.concat(entries[i], remainWithoutGlobStar)
        this._process(instead, index, true, cb)
    
        var below = gspref.concat(entries[i], remain)
        this._process(below, index, true, cb)
      }
    
      cb()
    }
    
    Glob.prototype._processSimple = function (prefix, index, cb) {
      // XXX review this.  Shouldn't it be doing the mounting etc
      // before doing stat?  kinda weird?
      var self = this
      this._stat(prefix, function (er, exists) {
        self._processSimple2(prefix, index, er, exists, cb)
      })
    }
    Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {
    
      //console.error('ps2', prefix, exists)
    
      if (!this.matches[index])
        this.matches[index] = Object.create(null)
    
      // If it doesn't exist, then just mark the lack of results
      if (!exists)
        return cb()
    
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix)
        if (prefix.charAt(0) === '/') {
          prefix = path.join(this.root, prefix)
        } else {
          prefix = path.resolve(this.root, prefix)
          if (trail)
            prefix += '/'
        }
      }
    
      if (process.platform === 'win32')
        prefix = prefix.replace(/\\/g, '/')
    
      // Mark this as a match
      this._emitMatch(index, prefix)
      cb()
    }
    
    // Returns either 'DIR', 'FILE', or false
    Glob.prototype._stat = function (f, cb) {
      var abs = this._makeAbs(f)
      var needDir = f.slice(-1) === '/'
    
      if (f.length > this.maxLength)
        return cb()
    
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs]
    
        if (Array.isArray(c))
          c = 'DIR'
    
        // It exists, but maybe not how we need it
        if (!needDir || c === 'DIR')
          return cb(null, c)
    
        if (needDir && c === 'FILE')
          return cb()
    
        // otherwise we have to stat, because maybe c=true
        // if we know it exists, but not what it is.
      }
    
      var exists
      var stat = this.statCache[abs]
      if (stat !== undefined) {
        if (stat === false)
          return cb(null, stat)
        else {
          var type = stat.isDirectory() ? 'DIR' : 'FILE'
          if (needDir && type === 'FILE')
            return cb()
          else
            return cb(null, type, stat)
        }
      }
    
      var self = this
      var statcb = inflight('stat\0' + abs, lstatcb_)
      if (statcb)
        fs.lstat(abs, statcb)
    
      function lstatcb_ (er, lstat) {
        if (lstat && lstat.isSymbolicLink()) {
          // If it's a symlink, then treat it as the target, unless
          // the target does not exist, then treat it as a file.
          return fs.stat(abs, function (er, stat) {
            if (er)
              self._stat2(f, abs, null, lstat, cb)
            else
              self._stat2(f, abs, er, stat, cb)
          })
        } else {
          self._stat2(f, abs, er, lstat, cb)
        }
      }
    }
    
    Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
      if (er) {
        this.statCache[abs] = false
        return cb()
      }
    
      var needDir = f.slice(-1) === '/'
      this.statCache[abs] = stat
    
      if (abs.slice(-1) === '/' && !stat.isDirectory())
        return cb(null, false, stat)
    
      var c = stat.isDirectory() ? 'DIR' : 'FILE'
      this.cache[abs] = this.cache[abs] || c
    
      if (needDir && c !== 'DIR')
        return cb()
    
      return cb(null, c, stat)
    }
    
  provide("glob/glob.js", module.exports);
}(global));

// pakmanager:glob/sync.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = globSync
    globSync.GlobSync = GlobSync
    
    var fs = require('fs')
    var minimatch = require('minimatch')
    var Minimatch = minimatch.Minimatch
    var Glob =  require('glob/glob.js').Glob
    var util = require('util')
    var path = require('path')
    var assert = require('assert')
    var common =  require('glob/common.js')
    var alphasort = common.alphasort
    var alphasorti = common.alphasorti
    var isAbsolute = common.isAbsolute
    var setopts = common.setopts
    var ownProp = common.ownProp
    var childrenIgnored = common.childrenIgnored
    
    function globSync (pattern, options) {
      if (typeof options === 'function' || arguments.length === 3)
        throw new TypeError('callback provided to sync glob\n'+
                            'See: https://github.com/isaacs/node-glob/issues/167')
    
      return new GlobSync(pattern, options).found
    }
    
    function GlobSync (pattern, options) {
      if (!pattern)
        throw new Error('must provide pattern')
    
      if (typeof options === 'function' || arguments.length === 3)
        throw new TypeError('callback provided to sync glob\n'+
                            'See: https://github.com/isaacs/node-glob/issues/167')
    
      if (!(this instanceof GlobSync))
        return new GlobSync(pattern, options)
    
      setopts(this, pattern, options)
    
      if (this.noprocess)
        return this
    
      var n = this.minimatch.set.length
      this.matches = new Array(n)
      for (var i = 0; i < n; i ++) {
        this._process(this.minimatch.set[i], i, false)
      }
      this._finish()
    }
    
    GlobSync.prototype._finish = function () {
      assert(this instanceof GlobSync)
      if (this.realpath) {
        var self = this
        this.matches.forEach(function (matchset, index) {
          var set = self.matches[index] = Object.create(null)
          for (var p in matchset) {
            try {
              p = self._makeAbs(p)
              var real = fs.realpathSync(p, this.realpathCache)
              set[real] = true
            } catch (er) {
              if (er.syscall === 'stat')
                set[self._makeAbs(p)] = true
              else
                throw er
            }
          }
        })
      }
      common.finish(this)
    }
    
    
    GlobSync.prototype._process = function (pattern, index, inGlobStar) {
      assert(this instanceof GlobSync)
    
      // Get the first [n] parts of pattern that are all strings.
      var n = 0
      while (typeof pattern[n] === 'string') {
        n ++
      }
      // now n is the index of the first one that is *not* a string.
    
      // See if there's anything else
      var prefix
      switch (n) {
        // if not, then this is rather simple
        case pattern.length:
          this._processSimple(pattern.join('/'), index)
          return
    
        case 0:
          // pattern *starts* with some non-trivial item.
          // going to readdir(cwd), but not include the prefix in matches.
          prefix = null
          break
    
        default:
          // pattern has some string bits in the front.
          // whatever it starts with, whether that's 'absolute' like /foo/bar,
          // or 'relative' like '../baz'
          prefix = pattern.slice(0, n).join('/')
          break
      }
    
      var remain = pattern.slice(n)
    
      // get the list of entries.
      var read
      if (prefix === null)
        read = '.'
      else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = '/' + prefix
        read = prefix
      } else
        read = prefix
    
      var abs = this._makeAbs(read)
    
      //if ignored, skip processing
      if (childrenIgnored(this, read))
        return
    
      var isGlobStar = remain[0] === minimatch.GLOBSTAR
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar)
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar)
    }
    
    
    GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
      var entries = this._readdir(abs, inGlobStar)
    
      // if the abs isn't a dir, then nothing can match!
      if (!entries)
        return
    
      // It will only match dot entries if it starts with a dot, or if
      // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
      var pn = remain[0]
      var negate = !!this.minimatch.negate
      var rawGlob = pn._glob
      var dotOk = this.dot || rawGlob.charAt(0) === '.'
    
      var matchedEntries = []
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i]
        if (e.charAt(0) !== '.' || dotOk) {
          var m
          if (negate && !prefix) {
            m = !e.match(pn)
          } else {
            m = e.match(pn)
          }
          if (m)
            matchedEntries.push(e)
        }
      }
    
      var len = matchedEntries.length
      // If there are no matched entries, then nothing matches.
      if (len === 0)
        return
    
      // if this is the last remaining pattern bit, then no need for
      // an additional stat *unless* the user has specified mark or
      // stat explicitly.  We know they exist, since readdir returned
      // them.
    
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = Object.create(null)
    
        for (var i = 0; i < len; i ++) {
          var e = matchedEntries[i]
          if (prefix) {
            if (prefix.slice(-1) !== '/')
              e = prefix + '/' + e
            else
              e = prefix + e
          }
    
          if (e.charAt(0) === '/' && !this.nomount) {
            e = path.join(this.root, e)
          }
          this.matches[index][e] = true
        }
        // This was the last one, and no stats were needed
        return
      }
    
      // now test all matched entries as stand-ins for that part
      // of the pattern.
      remain.shift()
      for (var i = 0; i < len; i ++) {
        var e = matchedEntries[i]
        var newPattern
        if (prefix)
          newPattern = [prefix, e]
        else
          newPattern = [e]
        this._process(newPattern.concat(remain), index, inGlobStar)
      }
    }
    
    
    GlobSync.prototype._emitMatch = function (index, e) {
      var abs = this._makeAbs(e)
      if (this.mark)
        e = this._mark(e)
    
      if (this.matches[index][e])
        return
    
      if (this.nodir) {
        var c = this.cache[this._makeAbs(e)]
        if (c === 'DIR' || Array.isArray(c))
          return
      }
    
      this.matches[index][e] = true
      if (this.stat)
        this._stat(e)
    }
    
    
    GlobSync.prototype._readdirInGlobStar = function (abs) {
      // follow all symlinked directories forever
      // just proceed as if this is a non-globstar situation
      if (this.follow)
        return this._readdir(abs, false)
    
      var entries
      var lstat
      var stat
      try {
        lstat = fs.lstatSync(abs)
      } catch (er) {
        // lstat failed, doesn't exist
        return null
      }
    
      var isSym = lstat.isSymbolicLink()
      this.symlinks[abs] = isSym
    
      // If it's not a symlink or a dir, then it's definitely a regular file.
      // don't bother doing a readdir in that case.
      if (!isSym && !lstat.isDirectory())
        this.cache[abs] = 'FILE'
      else
        entries = this._readdir(abs, false)
    
      return entries
    }
    
    GlobSync.prototype._readdir = function (abs, inGlobStar) {
      var entries
    
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs)
    
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs]
        if (!c || c === 'FILE')
          return null
    
        if (Array.isArray(c))
          return c
      }
    
      try {
        return this._readdirEntries(abs, fs.readdirSync(abs))
      } catch (er) {
        this._readdirError(abs, er)
        return null
      }
    }
    
    GlobSync.prototype._readdirEntries = function (abs, entries) {
      // if we haven't asked to stat everything, then just
      // assume that everything in there exists, so we can avoid
      // having to stat it a second time.
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i ++) {
          var e = entries[i]
          if (abs === '/')
            e = abs + e
          else
            e = abs + '/' + e
          this.cache[e] = true
        }
      }
    
      this.cache[abs] = entries
    
      // mark and cache dir-ness
      return entries
    }
    
    GlobSync.prototype._readdirError = function (f, er) {
      // handle errors, and cache the information
      switch (er.code) {
        case 'ENOTDIR': // totally normal. means it *does* exist.
          this.cache[this._makeAbs(f)] = 'FILE'
          break
    
        case 'ENOENT': // not terribly unusual
        case 'ELOOP':
        case 'ENAMETOOLONG':
        case 'UNKNOWN':
          this.cache[this._makeAbs(f)] = false
          break
    
        default: // some unusual error.  Treat as failure.
          this.cache[this._makeAbs(f)] = false
          if (this.strict) throw er
          if (!this.silent) console.error('glob error', er)
          break
      }
    }
    
    GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {
    
      var entries = this._readdir(abs, inGlobStar)
    
      // no entries means not a dir, so it can never have matches
      // foo.txt/** doesn't match foo.txt
      if (!entries)
        return
    
      // test without the globstar, and with every child both below
      // and replacing the globstar.
      var remainWithoutGlobStar = remain.slice(1)
      var gspref = prefix ? [ prefix ] : []
      var noGlobStar = gspref.concat(remainWithoutGlobStar)
    
      // the noGlobStar pattern exits the inGlobStar state
      this._process(noGlobStar, index, false)
    
      var len = entries.length
      var isSym = this.symlinks[abs]
    
      // If it's a symlink, and we're in a globstar, then stop
      if (isSym && inGlobStar)
        return
    
      for (var i = 0; i < len; i++) {
        var e = entries[i]
        if (e.charAt(0) === '.' && !this.dot)
          continue
    
        // these two cases enter the inGlobStar state
        var instead = gspref.concat(entries[i], remainWithoutGlobStar)
        this._process(instead, index, true)
    
        var below = gspref.concat(entries[i], remain)
        this._process(below, index, true)
      }
    }
    
    GlobSync.prototype._processSimple = function (prefix, index) {
      // XXX review this.  Shouldn't it be doing the mounting etc
      // before doing stat?  kinda weird?
      var exists = this._stat(prefix)
    
      if (!this.matches[index])
        this.matches[index] = Object.create(null)
    
      // If it doesn't exist, then just mark the lack of results
      if (!exists)
        return
    
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix)
        if (prefix.charAt(0) === '/') {
          prefix = path.join(this.root, prefix)
        } else {
          prefix = path.resolve(this.root, prefix)
          if (trail)
            prefix += '/'
        }
      }
    
      if (process.platform === 'win32')
        prefix = prefix.replace(/\\/g, '/')
    
      // Mark this as a match
      this.matches[index][prefix] = true
    }
    
    // Returns either 'DIR', 'FILE', or false
    GlobSync.prototype._stat = function (f) {
      var abs = this._makeAbs(f)
      var needDir = f.slice(-1) === '/'
    
      if (f.length > this.maxLength)
        return false
    
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs]
    
        if (Array.isArray(c))
          c = 'DIR'
    
        // It exists, but maybe not how we need it
        if (!needDir || c === 'DIR')
          return c
    
        if (needDir && c === 'FILE')
          return false
    
        // otherwise we have to stat, because maybe c=true
        // if we know it exists, but not what it is.
      }
    
      var exists
      var stat = this.statCache[abs]
      if (!stat) {
        var lstat
        try {
          lstat = fs.lstatSync(abs)
        } catch (er) {
          return false
        }
    
        if (lstat.isSymbolicLink()) {
          try {
            stat = fs.statSync(abs)
          } catch (er) {
            stat = lstat
          }
        } else {
          stat = lstat
        }
      }
    
      this.statCache[abs] = stat
    
      var c = stat.isDirectory() ? 'DIR' : 'FILE'
      this.cache[abs] = this.cache[abs] || c
    
      if (needDir && c !== 'DIR')
        return false
    
      return c
    }
    
    GlobSync.prototype._mark = function (p) {
      return common.mark(this, p)
    }
    
    GlobSync.prototype._makeAbs = function (f) {
      return common.makeAbs(this, f)
    }
    
  provide("glob/sync.js", module.exports);
}(global));

// pakmanager:glob
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // Approach:
    //
    // 1. Get the minimatch set
    // 2. For each pattern in the set, PROCESS(pattern, false)
    // 3. Store matches per-set, then uniq them
    //
    // PROCESS(pattern, inGlobStar)
    // Get the first [n] items from pattern that are all strings
    // Join these together.  This is PREFIX.
    //   If there is no more remaining, then stat(PREFIX) and
    //   add to matches if it succeeds.  END.
    //
    // If inGlobStar and PREFIX is symlink and points to dir
    //   set ENTRIES = []
    // else readdir(PREFIX) as ENTRIES
    //   If fail, END
    //
    // with ENTRIES
    //   If pattern[n] is GLOBSTAR
    //     // handle the case where the globstar match is empty
    //     // by pruning it out, and testing the resulting pattern
    //     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
    //     // handle other cases.
    //     for ENTRY in ENTRIES (not dotfiles)
    //       // attach globstar + tail onto the entry
    //       // Mark that this entry is a globstar match
    //       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
    //
    //   else // not globstar
    //     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
    //       Test ENTRY against pattern[n]
    //       If fails, continue
    //       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
    //
    // Caveat:
    //   Cache all stats and readdirs results to minimize syscall.  Since all
    //   we ever care about is existence and directory-ness, we can just keep
    //   `true` for files, and [children,...] for directories, or `false` for
    //   things that don't exist.
    
    module.exports = glob
    
    var fs = require('fs')
    var minimatch = require('minimatch')
    var Minimatch = minimatch.Minimatch
    var inherits = require('inherits')
    var EE = require('events').EventEmitter
    var path = require('path')
    var assert = require('assert')
    var globSync =  require('glob/sync.js')
    var common =  require('glob/common.js')
    var alphasort = common.alphasort
    var alphasorti = common.alphasorti
    var isAbsolute = common.isAbsolute
    var setopts = common.setopts
    var ownProp = common.ownProp
    var inflight = require('inflight')
    var util = require('util')
    var childrenIgnored = common.childrenIgnored
    
    var once = require('once')
    
    function glob (pattern, options, cb) {
      if (typeof options === 'function') cb = options, options = {}
      if (!options) options = {}
    
      if (options.sync) {
        if (cb)
          throw new TypeError('callback provided to sync glob')
        return globSync(pattern, options)
      }
    
      return new Glob(pattern, options, cb)
    }
    
    glob.sync = globSync
    var GlobSync = glob.GlobSync = globSync.GlobSync
    
    // old api surface
    glob.glob = glob
    
    glob.hasMagic = function (pattern, options_) {
      var options = util._extend({}, options_)
      options.noprocess = true
    
      var g = new Glob(pattern, options)
      var set = g.minimatch.set
      if (set.length > 1)
        return true
    
      for (var j = 0; j < set[0].length; j++) {
        if (typeof set[0][j] !== 'string')
          return true
      }
    
      return false
    }
    
    glob.Glob = Glob
    inherits(Glob, EE)
    function Glob (pattern, options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = null
      }
    
      if (options && options.sync) {
        if (cb)
          throw new TypeError('callback provided to sync glob')
        return new GlobSync(pattern, options)
      }
    
      if (!(this instanceof Glob))
        return new Glob(pattern, options, cb)
    
      setopts(this, pattern, options)
      this._didRealPath = false
    
      // process each pattern in the minimatch set
      var n = this.minimatch.set.length
    
      // The matches are stored as {<filename>: true,...} so that
      // duplicates are automagically pruned.
      // Later, we do an Object.keys() on these.
      // Keep them as a list so we can fill in when nonull is set.
      this.matches = new Array(n)
    
      if (typeof cb === 'function') {
        cb = once(cb)
        this.on('error', cb)
        this.on('end', function (matches) {
          cb(null, matches)
        })
      }
    
      var self = this
      var n = this.minimatch.set.length
      this._processing = 0
      this.matches = new Array(n)
    
      this._emitQueue = []
      this._processQueue = []
      this.paused = false
    
      if (this.noprocess)
        return this
    
      if (n === 0)
        return done()
    
      for (var i = 0; i < n; i ++) {
        this._process(this.minimatch.set[i], i, false, done)
      }
    
      function done () {
        --self._processing
        if (self._processing <= 0)
          self._finish()
      }
    }
    
    Glob.prototype._finish = function () {
      assert(this instanceof Glob)
      if (this.aborted)
        return
    
      if (this.realpath && !this._didRealpath)
        return this._realpath()
    
      common.finish(this)
      this.emit('end', this.found)
    }
    
    Glob.prototype._realpath = function () {
      if (this._didRealpath)
        return
    
      this._didRealpath = true
    
      var n = this.matches.length
      if (n === 0)
        return this._finish()
    
      var self = this
      for (var i = 0; i < this.matches.length; i++)
        this._realpathSet(i, next)
    
      function next () {
        if (--n === 0)
          self._finish()
      }
    }
    
    Glob.prototype._realpathSet = function (index, cb) {
      var matchset = this.matches[index]
      if (!matchset)
        return cb()
    
      var found = Object.keys(matchset)
      var self = this
      var n = found.length
    
      if (n === 0)
        return cb()
    
      var set = this.matches[index] = Object.create(null)
      found.forEach(function (p, i) {
        // If there's a problem with the stat, then it means that
        // one or more of the links in the realpath couldn't be
        // resolved.  just return the abs value in that case.
        p = self._makeAbs(p)
        fs.realpath(p, self.realpathCache, function (er, real) {
          if (!er)
            set[real] = true
          else if (er.syscall === 'stat')
            set[p] = true
          else
            self.emit('error', er) // srsly wtf right here
    
          if (--n === 0) {
            self.matches[index] = set
            cb()
          }
        })
      })
    }
    
    Glob.prototype._mark = function (p) {
      return common.mark(this, p)
    }
    
    Glob.prototype._makeAbs = function (f) {
      return common.makeAbs(this, f)
    }
    
    Glob.prototype.abort = function () {
      this.aborted = true
      this.emit('abort')
    }
    
    Glob.prototype.pause = function () {
      if (!this.paused) {
        this.paused = true
        this.emit('pause')
      }
    }
    
    Glob.prototype.resume = function () {
      if (this.paused) {
        this.emit('resume')
        this.paused = false
        if (this._emitQueue.length) {
          var eq = this._emitQueue.slice(0)
          this._emitQueue.length = 0
          for (var i = 0; i < eq.length; i ++) {
            var e = eq[i]
            this._emitMatch(e[0], e[1])
          }
        }
        if (this._processQueue.length) {
          var pq = this._processQueue.slice(0)
          this._processQueue.length = 0
          for (var i = 0; i < pq.length; i ++) {
            var p = pq[i]
            this._processing--
            this._process(p[0], p[1], p[2], p[3])
          }
        }
      }
    }
    
    Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
      assert(this instanceof Glob)
      assert(typeof cb === 'function')
    
      if (this.aborted)
        return
    
      this._processing++
      if (this.paused) {
        this._processQueue.push([pattern, index, inGlobStar, cb])
        return
      }
    
      //console.error('PROCESS %d', this._processing, pattern)
    
      // Get the first [n] parts of pattern that are all strings.
      var n = 0
      while (typeof pattern[n] === 'string') {
        n ++
      }
      // now n is the index of the first one that is *not* a string.
    
      // see if there's anything else
      var prefix
      switch (n) {
        // if not, then this is rather simple
        case pattern.length:
          this._processSimple(pattern.join('/'), index, cb)
          return
    
        case 0:
          // pattern *starts* with some non-trivial item.
          // going to readdir(cwd), but not include the prefix in matches.
          prefix = null
          break
    
        default:
          // pattern has some string bits in the front.
          // whatever it starts with, whether that's 'absolute' like /foo/bar,
          // or 'relative' like '../baz'
          prefix = pattern.slice(0, n).join('/')
          break
      }
    
      var remain = pattern.slice(n)
    
      // get the list of entries.
      var read
      if (prefix === null)
        read = '.'
      else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
        if (!prefix || !isAbsolute(prefix))
          prefix = '/' + prefix
        read = prefix
      } else
        read = prefix
    
      var abs = this._makeAbs(read)
    
      //if ignored, skip _processing
      if (childrenIgnored(this, read))
        return cb()
    
      var isGlobStar = remain[0] === minimatch.GLOBSTAR
      if (isGlobStar)
        this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
      else
        this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
    }
    
    Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this
      this._readdir(abs, inGlobStar, function (er, entries) {
        return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
      })
    }
    
    Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
    
      // if the abs isn't a dir, then nothing can match!
      if (!entries)
        return cb()
    
      // It will only match dot entries if it starts with a dot, or if
      // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
      var pn = remain[0]
      var negate = !!this.minimatch.negate
      var rawGlob = pn._glob
      var dotOk = this.dot || rawGlob.charAt(0) === '.'
    
      var matchedEntries = []
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i]
        if (e.charAt(0) !== '.' || dotOk) {
          var m
          if (negate && !prefix) {
            m = !e.match(pn)
          } else {
            m = e.match(pn)
          }
          if (m)
            matchedEntries.push(e)
        }
      }
    
      //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)
    
      var len = matchedEntries.length
      // If there are no matched entries, then nothing matches.
      if (len === 0)
        return cb()
    
      // if this is the last remaining pattern bit, then no need for
      // an additional stat *unless* the user has specified mark or
      // stat explicitly.  We know they exist, since readdir returned
      // them.
    
      if (remain.length === 1 && !this.mark && !this.stat) {
        if (!this.matches[index])
          this.matches[index] = Object.create(null)
    
        for (var i = 0; i < len; i ++) {
          var e = matchedEntries[i]
          if (prefix) {
            if (prefix !== '/')
              e = prefix + '/' + e
            else
              e = prefix + e
          }
    
          if (e.charAt(0) === '/' && !this.nomount) {
            e = path.join(this.root, e)
          }
          this._emitMatch(index, e)
        }
        // This was the last one, and no stats were needed
        return cb()
      }
    
      // now test all matched entries as stand-ins for that part
      // of the pattern.
      remain.shift()
      for (var i = 0; i < len; i ++) {
        var e = matchedEntries[i]
        var newPattern
        if (prefix) {
          if (prefix !== '/')
            e = prefix + '/' + e
          else
            e = prefix + e
        }
        this._process([e].concat(remain), index, inGlobStar, cb)
      }
      cb()
    }
    
    Glob.prototype._emitMatch = function (index, e) {
      if (this.aborted)
        return
    
      if (this.matches[index][e])
        return
    
      if (this.paused) {
        this._emitQueue.push([index, e])
        return
      }
    
      var abs = this._makeAbs(e)
    
      if (this.nodir) {
        var c = this.cache[abs]
        if (c === 'DIR' || Array.isArray(c))
          return
      }
    
      if (this.mark)
        e = this._mark(e)
    
      this.matches[index][e] = true
    
      var st = this.statCache[abs]
      if (st)
        this.emit('stat', e, st)
    
      this.emit('match', e)
    }
    
    Glob.prototype._readdirInGlobStar = function (abs, cb) {
      if (this.aborted)
        return
    
      // follow all symlinked directories forever
      // just proceed as if this is a non-globstar situation
      if (this.follow)
        return this._readdir(abs, false, cb)
    
      var lstatkey = 'lstat\0' + abs
      var self = this
      var lstatcb = inflight(lstatkey, lstatcb_)
    
      if (lstatcb)
        fs.lstat(abs, lstatcb)
    
      function lstatcb_ (er, lstat) {
        if (er)
          return cb()
    
        var isSym = lstat.isSymbolicLink()
        self.symlinks[abs] = isSym
    
        // If it's not a symlink or a dir, then it's definitely a regular file.
        // don't bother doing a readdir in that case.
        if (!isSym && !lstat.isDirectory()) {
          self.cache[abs] = 'FILE'
          cb()
        } else
          self._readdir(abs, false, cb)
      }
    }
    
    Glob.prototype._readdir = function (abs, inGlobStar, cb) {
      if (this.aborted)
        return
    
      cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
      if (!cb)
        return
    
      //console.error('RD %j %j', +inGlobStar, abs)
      if (inGlobStar && !ownProp(this.symlinks, abs))
        return this._readdirInGlobStar(abs, cb)
    
      if (ownProp(this.cache, abs)) {
        var c = this.cache[abs]
        if (!c || c === 'FILE')
          return cb()
    
        if (Array.isArray(c))
          return cb(null, c)
      }
    
      var self = this
      fs.readdir(abs, readdirCb(this, abs, cb))
    }
    
    function readdirCb (self, abs, cb) {
      return function (er, entries) {
        if (er)
          self._readdirError(abs, er, cb)
        else
          self._readdirEntries(abs, entries, cb)
      }
    }
    
    Glob.prototype._readdirEntries = function (abs, entries, cb) {
      if (this.aborted)
        return
    
      // if we haven't asked to stat everything, then just
      // assume that everything in there exists, so we can avoid
      // having to stat it a second time.
      if (!this.mark && !this.stat) {
        for (var i = 0; i < entries.length; i ++) {
          var e = entries[i]
          if (abs === '/')
            e = abs + e
          else
            e = abs + '/' + e
          this.cache[e] = true
        }
      }
    
      this.cache[abs] = entries
      return cb(null, entries)
    }
    
    Glob.prototype._readdirError = function (f, er, cb) {
      if (this.aborted)
        return
    
      // handle errors, and cache the information
      switch (er.code) {
        case 'ENOTDIR': // totally normal. means it *does* exist.
          this.cache[this._makeAbs(f)] = 'FILE'
          break
    
        case 'ENOENT': // not terribly unusual
        case 'ELOOP':
        case 'ENAMETOOLONG':
        case 'UNKNOWN':
          this.cache[this._makeAbs(f)] = false
          break
    
        default: // some unusual error.  Treat as failure.
          this.cache[this._makeAbs(f)] = false
          if (this.strict) return this.emit('error', er)
          if (!this.silent) console.error('glob error', er)
          break
      }
      return cb()
    }
    
    Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
      var self = this
      this._readdir(abs, inGlobStar, function (er, entries) {
        self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
      })
    }
    
    
    Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
      //console.error('pgs2', prefix, remain[0], entries)
    
      // no entries means not a dir, so it can never have matches
      // foo.txt/** doesn't match foo.txt
      if (!entries)
        return cb()
    
      // test without the globstar, and with every child both below
      // and replacing the globstar.
      var remainWithoutGlobStar = remain.slice(1)
      var gspref = prefix ? [ prefix ] : []
      var noGlobStar = gspref.concat(remainWithoutGlobStar)
    
      // the noGlobStar pattern exits the inGlobStar state
      this._process(noGlobStar, index, false, cb)
    
      var isSym = this.symlinks[abs]
      var len = entries.length
    
      // If it's a symlink, and we're in a globstar, then stop
      if (isSym && inGlobStar)
        return cb()
    
      for (var i = 0; i < len; i++) {
        var e = entries[i]
        if (e.charAt(0) === '.' && !this.dot)
          continue
    
        // these two cases enter the inGlobStar state
        var instead = gspref.concat(entries[i], remainWithoutGlobStar)
        this._process(instead, index, true, cb)
    
        var below = gspref.concat(entries[i], remain)
        this._process(below, index, true, cb)
      }
    
      cb()
    }
    
    Glob.prototype._processSimple = function (prefix, index, cb) {
      // XXX review this.  Shouldn't it be doing the mounting etc
      // before doing stat?  kinda weird?
      var self = this
      this._stat(prefix, function (er, exists) {
        self._processSimple2(prefix, index, er, exists, cb)
      })
    }
    Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {
    
      //console.error('ps2', prefix, exists)
    
      if (!this.matches[index])
        this.matches[index] = Object.create(null)
    
      // If it doesn't exist, then just mark the lack of results
      if (!exists)
        return cb()
    
      if (prefix && isAbsolute(prefix) && !this.nomount) {
        var trail = /[\/\\]$/.test(prefix)
        if (prefix.charAt(0) === '/') {
          prefix = path.join(this.root, prefix)
        } else {
          prefix = path.resolve(this.root, prefix)
          if (trail)
            prefix += '/'
        }
      }
    
      if (process.platform === 'win32')
        prefix = prefix.replace(/\\/g, '/')
    
      // Mark this as a match
      this._emitMatch(index, prefix)
      cb()
    }
    
    // Returns either 'DIR', 'FILE', or false
    Glob.prototype._stat = function (f, cb) {
      var abs = this._makeAbs(f)
      var needDir = f.slice(-1) === '/'
    
      if (f.length > this.maxLength)
        return cb()
    
      if (!this.stat && ownProp(this.cache, abs)) {
        var c = this.cache[abs]
    
        if (Array.isArray(c))
          c = 'DIR'
    
        // It exists, but maybe not how we need it
        if (!needDir || c === 'DIR')
          return cb(null, c)
    
        if (needDir && c === 'FILE')
          return cb()
    
        // otherwise we have to stat, because maybe c=true
        // if we know it exists, but not what it is.
      }
    
      var exists
      var stat = this.statCache[abs]
      if (stat !== undefined) {
        if (stat === false)
          return cb(null, stat)
        else {
          var type = stat.isDirectory() ? 'DIR' : 'FILE'
          if (needDir && type === 'FILE')
            return cb()
          else
            return cb(null, type, stat)
        }
      }
    
      var self = this
      var statcb = inflight('stat\0' + abs, lstatcb_)
      if (statcb)
        fs.lstat(abs, statcb)
    
      function lstatcb_ (er, lstat) {
        if (lstat && lstat.isSymbolicLink()) {
          // If it's a symlink, then treat it as the target, unless
          // the target does not exist, then treat it as a file.
          return fs.stat(abs, function (er, stat) {
            if (er)
              self._stat2(f, abs, null, lstat, cb)
            else
              self._stat2(f, abs, er, stat, cb)
          })
        } else {
          self._stat2(f, abs, er, lstat, cb)
        }
      }
    }
    
    Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
      if (er) {
        this.statCache[abs] = false
        return cb()
      }
    
      var needDir = f.slice(-1) === '/'
      this.statCache[abs] = stat
    
      if (abs.slice(-1) === '/' && !stat.isDirectory())
        return cb(null, false, stat)
    
      var c = stat.isDirectory() ? 'DIR' : 'FILE'
      this.cache[abs] = this.cache[abs] || c
    
      if (needDir && c !== 'DIR')
        return cb()
    
      return cb(null, c, stat)
    }
    
  provide("glob", module.exports);
}(global));

// pakmanager:graceful-fs/fs.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict'
    
    var fs = require('fs')
    
    module.exports = clone(fs)
    
    function clone (obj) {
      if (obj === null || typeof obj !== 'object')
        return obj
    
      if (obj instanceof Object)
        var copy = { __proto__: obj.__proto__ }
      else
        var copy = Object.create(null)
    
      Object.getOwnPropertyNames(obj).forEach(function (key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
      })
    
      return copy
    }
    
  provide("graceful-fs/fs.js", module.exports);
}(global));

// pakmanager:graceful-fs/polyfills.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var fs =  require('graceful-fs/fs.js')
    var constants = require('constants')
    
    var origCwd = process.cwd
    var cwd = null
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process)
      return cwd
    }
    try {
      process.cwd()
    } catch (er) {}
    
    var chdir = process.chdir
    process.chdir = function(d) {
      cwd = null
      chdir.call(process, d)
    }
    
    module.exports = patch
    
    function patch (fs) {
      // (re-)implement some things that are known busted or missing.
    
      // lchmod, broken prior to 0.6.2
      // back-port the fix here.
      if (constants.hasOwnProperty('O_SYMLINK') &&
          process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs)
      }
    
      // lutimes implementation, or no-op
      if (!fs.lutimes) {
        patchLutimes(fs)
      }
    
      // https://github.com/isaacs/node-graceful-fs/issues/4
      // Chown should not fail on einval or eperm if non-root.
      // It should not fail on enosys ever, as this just indicates
      // that a fs doesn't support the intended operation.
    
      fs.chown = chownFix(fs.chown)
      fs.fchown = chownFix(fs.fchown)
      fs.lchown = chownFix(fs.lchown)
    
      fs.chmod = chmodFix(fs.chmod)
      fs.fchmod = chmodFix(fs.fchmod)
      fs.lchmod = chmodFix(fs.lchmod)
    
      fs.chownSync = chownFixSync(fs.chownSync)
      fs.fchownSync = chownFixSync(fs.fchownSync)
      fs.lchownSync = chownFixSync(fs.lchownSync)
    
      fs.chmodSync = chmodFixSync(fs.chmodSync)
      fs.fchmodSync = chmodFixSync(fs.fchmodSync)
      fs.lchmodSync = chmodFixSync(fs.lchmodSync)
    
      fs.stat = statFix(fs.stat)
      fs.fstat = statFix(fs.fstat)
      fs.lstat = statFix(fs.lstat)
    
      fs.statSync = statFixSync(fs.statSync)
      fs.fstatSync = statFixSync(fs.fstatSync)
      fs.lstatSync = statFixSync(fs.lstatSync)
    
      // if lchmod/lchown do not exist, then make them no-ops
      if (!fs.lchmod) {
        fs.lchmod = function (path, mode, cb) {
          if (cb) process.nextTick(cb)
        }
        fs.lchmodSync = function () {}
      }
      if (!fs.lchown) {
        fs.lchown = function (path, uid, gid, cb) {
          if (cb) process.nextTick(cb)
        }
        fs.lchownSync = function () {}
      }
    
      // on Windows, A/V software can lock the directory, causing this
      // to fail with an EACCES or EPERM if the directory contains newly
      // created files.  Try again on failure, for up to 60 seconds.
    
      // Set the timeout this long because some Windows Anti-Virus, such as Parity
      // bit9, may lock files for up to a minute, causing npm package install
      // failures. Also, take care to yield the scheduler. Windows scheduling gives
      // CPU to a busy looping process, which can cause the program causing the lock
      // contention to be starved of CPU by node, so the contention doesn't resolve.
      if (process.platform === "win32") {
        fs.rename = (function (fs$rename) { return function (from, to, cb) {
          var start = Date.now()
          var backoff = 0;
          fs$rename(from, to, function CB (er) {
            if (er
                && (er.code === "EACCES" || er.code === "EPERM")
                && Date.now() - start < 60000) {
              setTimeout(function() {
                fs$rename(from, to, CB);
              }, backoff)
              if (backoff < 100)
                backoff += 10;
              return;
            }
            if (cb) cb(er)
          })
        }})(fs.rename)
      }
    
      // if read() returns EAGAIN, then just try it again.
      fs.read = (function (fs$read) { return function (fd, buffer, offset, length, position, callback_) {
        var callback
        if (callback_ && typeof callback_ === 'function') {
          var eagCounter = 0
          callback = function (er, _, __) {
            if (er && er.code === 'EAGAIN' && eagCounter < 10) {
              eagCounter ++
              return fs$read.call(fs, fd, buffer, offset, length, position, callback)
            }
            callback_.apply(this, arguments)
          }
        }
        return fs$read.call(fs, fd, buffer, offset, length, position, callback)
      }})(fs.read)
    
      fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
        var eagCounter = 0
        while (true) {
          try {
            return fs$readSync.call(fs, fd, buffer, offset, length, position)
          } catch (er) {
            if (er.code === 'EAGAIN' && eagCounter < 10) {
              eagCounter ++
              continue
            }
            throw er
          }
        }
      }})(fs.readSync)
    }
    
    function patchLchmod (fs) {
      fs.lchmod = function (path, mode, callback) {
        fs.open( path
               , constants.O_WRONLY | constants.O_SYMLINK
               , mode
               , function (err, fd) {
          if (err) {
            if (callback) callback(err)
            return
          }
          // prefer to return the chmod error, if one occurs,
          // but still try to close, and report closing errors if they occur.
          fs.fchmod(fd, mode, function (err) {
            fs.close(fd, function(err2) {
              if (callback) callback(err || err2)
            })
          })
        })
      }
    
      fs.lchmodSync = function (path, mode) {
        var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)
    
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        var threw = true
        var ret
        try {
          ret = fs.fchmodSync(fd, mode)
          threw = false
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd)
            } catch (er) {}
          } else {
            fs.closeSync(fd)
          }
        }
        return ret
      }
    }
    
    function patchLutimes (fs) {
      if (constants.hasOwnProperty("O_SYMLINK")) {
        fs.lutimes = function (path, at, mt, cb) {
          fs.open(path, constants.O_SYMLINK, function (er, fd) {
            if (er) {
              if (cb) cb(er)
              return
            }
            fs.futimes(fd, at, mt, function (er) {
              fs.close(fd, function (er2) {
                if (cb) cb(er || er2)
              })
            })
          })
        }
    
        fs.lutimesSync = function (path, at, mt) {
          var fd = fs.openSync(path, constants.O_SYMLINK)
          var ret
          var threw = true
          try {
            ret = fs.futimesSync(fd, at, mt)
            threw = false
          } finally {
            if (threw) {
              try {
                fs.closeSync(fd)
              } catch (er) {}
            } else {
              fs.closeSync(fd)
            }
          }
          return ret
        }
    
      } else {
        fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
        fs.lutimesSync = function () {}
      }
    }
    
    function chmodFix (orig) {
      if (!orig) return orig
      return function (target, mode, cb) {
        return orig.call(fs, target, mode, function (er) {
          if (chownErOk(er)) er = null
          if (cb) cb.apply(this, arguments)
        })
      }
    }
    
    function chmodFixSync (orig) {
      if (!orig) return orig
      return function (target, mode) {
        try {
          return orig.call(fs, target, mode)
        } catch (er) {
          if (!chownErOk(er)) throw er
        }
      }
    }
    
    
    function chownFix (orig) {
      if (!orig) return orig
      return function (target, uid, gid, cb) {
        return orig.call(fs, target, uid, gid, function (er) {
          if (chownErOk(er)) er = null
          if (cb) cb.apply(this, arguments)
        })
      }
    }
    
    function chownFixSync (orig) {
      if (!orig) return orig
      return function (target, uid, gid) {
        try {
          return orig.call(fs, target, uid, gid)
        } catch (er) {
          if (!chownErOk(er)) throw er
        }
      }
    }
    
    
    function statFix (orig) {
      if (!orig) return orig
      // Older versions of Node erroneously returned signed integers for
      // uid + gid.
      return function (target, cb) {
        return orig.call(fs, target, function (er, stats) {
          if (!stats) return cb.apply(this, arguments)
          if (stats.uid < 0) stats.uid += 0x100000000
          if (stats.gid < 0) stats.gid += 0x100000000
          if (cb) cb.apply(this, arguments)
        })
      }
    }
    
    function statFixSync (orig) {
      if (!orig) return orig
      // Older versions of Node erroneously returned signed integers for
      // uid + gid.
      return function (target) {
        var stats = orig.call(fs, target)
        if (stats.uid < 0) stats.uid += 0x100000000
        if (stats.gid < 0) stats.gid += 0x100000000
        return stats;
      }
    }
    
    // ENOSYS means that the fs doesn't support the op. Just ignore
    // that, because it doesn't matter.
    //
    // if there's no getuid, or if getuid() is something other
    // than 0, and the error is EINVAL or EPERM, then just ignore
    // it.
    //
    // This specific case is a silent failure in cp, install, tar,
    // and most other unix tools that manage permissions.
    //
    // When running as root, or if other types of errors are
    // encountered, then it's strict.
    function chownErOk (er) {
      if (!er)
        return true
    
      if (er.code === "ENOSYS")
        return true
    
      var nonroot = !process.getuid || process.getuid() !== 0
      if (nonroot) {
        if (er.code === "EINVAL" || er.code === "EPERM")
          return true
      }
    
      return false
    }
    
  provide("graceful-fs/polyfills.js", module.exports);
}(global));

// pakmanager:graceful-fs/legacy-streams.js
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var Stream = require('stream').Stream
    
    module.exports = legacy
    
    function legacy (fs) {
      return {
        ReadStream: ReadStream,
        WriteStream: WriteStream
      }
    
      function ReadStream (path, options) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options);
    
        Stream.call(this);
    
        var self = this;
    
        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;
    
        this.flags = 'r';
        this.mode = 438; /*=0666*/
        this.bufferSize = 64 * 1024;
    
        options = options || {};
    
        // Mixin options into this
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
    
        if (this.encoding) this.setEncoding(this.encoding);
    
        if (this.start !== undefined) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.end === undefined) {
            this.end = Infinity;
          } else if ('number' !== typeof this.end) {
            throw TypeError('end must be a Number');
          }
    
          if (this.start > this.end) {
            throw new Error('start must be <= end');
          }
    
          this.pos = this.start;
        }
    
        if (this.fd !== null) {
          process.nextTick(function() {
            self._read();
          });
          return;
        }
    
        fs.open(this.path, this.flags, this.mode, function (err, fd) {
          if (err) {
            self.emit('error', err);
            self.readable = false;
            return;
          }
    
          self.fd = fd;
          self.emit('open', fd);
          self._read();
        })
      }
    
      function WriteStream (path, options) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options);
    
        Stream.call(this);
    
        this.path = path;
        this.fd = null;
        this.writable = true;
    
        this.flags = 'w';
        this.encoding = 'binary';
        this.mode = 438; /*=0666*/
        this.bytesWritten = 0;
    
        options = options || {};
    
        // Mixin options into this
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
    
        if (this.start !== undefined) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.start < 0) {
            throw new Error('start must be >= zero');
          }
    
          this.pos = this.start;
        }
    
        this.busy = false;
        this._queue = [];
    
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
          this.flush();
        }
      }
    }
    
  provide("graceful-fs/legacy-streams.js", module.exports);
}(global));

// pakmanager:graceful-fs
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var fs = require('fs')
    var polyfills =  require('graceful-fs/polyfills.js')
    var legacy =  require('graceful-fs/legacy-streams.js')
    var queue = []
    
    var util = require('util')
    
    function noop () {}
    
    var debug = noop
    if (util.debuglog)
      debug = util.debuglog('gfs4')
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
      debug = function() {
        var m = util.format.apply(util, arguments)
        m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
        console.error(m)
      }
    
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
      process.on('exit', function() {
        debug(queue)
        require('assert').equal(queue.length, 0)
      })
    }
    
    module.exports = patch( require('graceful-fs/fs.js'))
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
      module.exports = patch(fs)
    }
    
    // Always patch fs.close/closeSync, because we want to
    // retry() whenever a close happens *anywhere* in the program.
    // This is essential when multiple graceful-fs instances are
    // in play at the same time.
    module.exports.close =
    fs.close = (function (fs$close) { return function (fd, cb) {
      return fs$close.call(fs, fd, function (err) {
        if (!err)
          retry()
    
        if (typeof cb === 'function')
          cb.apply(this, arguments)
      })
    }})(fs.close)
    
    module.exports.closeSync =
    fs.closeSync = (function (fs$closeSync) { return function (fd) {
      // Note that graceful-fs also retries when fs.closeSync() fails.
      // Looks like a bug to me, although it's probably a harmless one.
      var rval = fs$closeSync.apply(fs, arguments)
      retry()
      return rval
    }})(fs.closeSync)
    
    function patch (fs) {
      // Everything that references the open() function needs to be in here
      polyfills(fs)
      fs.gracefulify = patch
      fs.FileReadStream = ReadStream;  // Legacy name.
      fs.FileWriteStream = WriteStream;  // Legacy name.
      fs.createReadStream = createReadStream
      fs.createWriteStream = createWriteStream
      var fs$readFile = fs.readFile
      fs.readFile = readFile
      function readFile (path, options, cb) {
        if (typeof options === 'function')
          cb = options, options = null
    
        return go$readFile(path, options, cb)
    
        function go$readFile (path, options, cb) {
          return fs$readFile(path, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$readFile, [path, options, cb]])
            else {
              if (typeof cb === 'function')
                cb.apply(this, arguments)
              retry()
            }
          })
        }
      }
    
      var fs$writeFile = fs.writeFile
      fs.writeFile = writeFile
      function writeFile (path, data, options, cb) {
        if (typeof options === 'function')
          cb = options, options = null
    
        return go$writeFile(path, data, options, cb)
    
        function go$writeFile (path, data, options, cb) {
          return fs$writeFile(path, data, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$writeFile, [path, data, options, cb]])
            else {
              if (typeof cb === 'function')
                cb.apply(this, arguments)
              retry()
            }
          })
        }
      }
    
      var fs$appendFile = fs.appendFile
      if (fs$appendFile)
        fs.appendFile = appendFile
      function appendFile (path, data, options, cb) {
        if (typeof options === 'function')
          cb = options, options = null
    
        return go$appendFile(path, data, options, cb)
    
        function go$appendFile (path, data, options, cb) {
          return fs$appendFile(path, data, options, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$appendFile, [path, data, options, cb]])
            else {
              if (typeof cb === 'function')
                cb.apply(this, arguments)
              retry()
            }
          })
        }
      }
    
      var fs$readdir = fs.readdir
      fs.readdir = readdir
      function readdir (path, options, cb) {
        var args = [path]
        if (typeof options !== 'function') {
          args.push(options)
        } else {
          cb = options
        }
        args.push(go$readdir$cb)
    
        return go$readdir(args)
    
        function go$readdir$cb (err, files) {
          if (files && files.sort)
            files.sort()
    
          if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
            enqueue([go$readdir, [args]])
          else {
            if (typeof cb === 'function')
              cb.apply(this, arguments)
            retry()
          }
        }
      }
    
      function go$readdir (args) {
        return fs$readdir.apply(fs, args)
      }
    
      if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs)
        ReadStream = legStreams.ReadStream
        WriteStream = legStreams.WriteStream
      }
    
      var fs$ReadStream = fs.ReadStream
      ReadStream.prototype = Object.create(fs$ReadStream.prototype)
      ReadStream.prototype.open = ReadStream$open
    
      var fs$WriteStream = fs.WriteStream
      WriteStream.prototype = Object.create(fs$WriteStream.prototype)
      WriteStream.prototype.open = WriteStream$open
    
      fs.ReadStream = ReadStream
      fs.WriteStream = WriteStream
    
      function ReadStream (path, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
      }
    
      function ReadStream$open () {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy()
    
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
            that.read()
          }
        })
      }
    
      function WriteStream (path, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
      }
    
      function WriteStream$open () {
        var that = this
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            that.destroy()
            that.emit('error', err)
          } else {
            that.fd = fd
            that.emit('open', fd)
          }
        })
      }
    
      function createReadStream (path, options) {
        return new ReadStream(path, options)
      }
    
      function createWriteStream (path, options) {
        return new WriteStream(path, options)
      }
    
      var fs$open = fs.open
      fs.open = open
      function open (path, flags, mode, cb) {
        if (typeof mode === 'function')
          cb = mode, mode = null
    
        return go$open(path, flags, mode, cb)
    
        function go$open (path, flags, mode, cb) {
          return fs$open(path, flags, mode, function (err, fd) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$open, [path, flags, mode, cb]])
            else {
              if (typeof cb === 'function')
                cb.apply(this, arguments)
              retry()
            }
          })
        }
      }
    
      return fs
    }
    
    function enqueue (elem) {
      debug('ENQUEUE', elem[0].name, elem[1])
      queue.push(elem)
    }
    
    function retry () {
      var elem = queue.shift()
      if (elem) {
        debug('RETRY', elem[0].name, elem[1])
        elem[0].apply(null, elem[1])
      }
    }
    
  provide("graceful-fs", module.exports);
}(global));

// pakmanager:mkdirp
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var path = require('path');
    var fs = require('fs');
    var _0777 = parseInt('0777', 8);
    
    module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;
    
    function mkdirP (p, opts, f, made) {
        if (typeof opts === 'function') {
            f = opts;
            opts = {};
        }
        else if (!opts || typeof opts !== 'object') {
            opts = { mode: opts };
        }
        
        var mode = opts.mode;
        var xfs = opts.fs || fs;
        
        if (mode === undefined) {
            mode = _0777 & (~process.umask());
        }
        if (!made) made = null;
        
        var cb = f || function () {};
        p = path.resolve(p);
        
        xfs.mkdir(p, mode, function (er) {
            if (!er) {
                made = made || p;
                return cb(null, made);
            }
            switch (er.code) {
                case 'ENOENT':
                    mkdirP(path.dirname(p), opts, function (er, made) {
                        if (er) cb(er, made);
                        else mkdirP(p, opts, cb, made);
                    });
                    break;
    
                // In the case of any other error, just see if there's a dir
                // there already.  If so, then hooray!  If not, then something
                // is borked.
                default:
                    xfs.stat(p, function (er2, stat) {
                        // if the stat fails, then that's super weird.
                        // let the original error be the failure reason.
                        if (er2 || !stat.isDirectory()) cb(er, made)
                        else cb(null, made);
                    });
                    break;
            }
        });
    }
    
    mkdirP.sync = function sync (p, opts, made) {
        if (!opts || typeof opts !== 'object') {
            opts = { mode: opts };
        }
        
        var mode = opts.mode;
        var xfs = opts.fs || fs;
        
        if (mode === undefined) {
            mode = _0777 & (~process.umask());
        }
        if (!made) made = null;
    
        p = path.resolve(p);
    
        try {
            xfs.mkdirSync(p, mode);
            made = made || p;
        }
        catch (err0) {
            switch (err0.code) {
                case 'ENOENT' :
                    made = sync(path.dirname(p), opts, made);
                    sync(p, opts, made);
                    break;
    
                // In the case of any other error, just see if there's a dir
                // there already.  If so, then hooray!  If not, then something
                // is borked.
                default:
                    var stat;
                    try {
                        stat = xfs.statSync(p);
                    }
                    catch (err1) {
                        throw err0;
                    }
                    if (!stat.isDirectory()) throw err0;
                    break;
            }
        }
    
        return made;
    };
    
  provide("mkdirp", module.exports);
}(global));

// pakmanager:rimraf
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  module.exports = rimraf
    rimraf.sync = rimrafSync
    
    var assert = require("assert")
    var path = require("path")
    var fs = require("fs")
    var glob = require("glob")
    
    var defaultGlobOpts = {
      nosort: true,
      silent: true
    }
    
    // for EMFILE handling
    var timeout = 0
    
    var isWindows = (process.platform === "win32")
    
    function defaults (options) {
      var methods = [
        'unlink',
        'chmod',
        'stat',
        'lstat',
        'rmdir',
        'readdir'
      ]
      methods.forEach(function(m) {
        options[m] = options[m] || fs[m]
        m = m + 'Sync'
        options[m] = options[m] || fs[m]
      })
    
      options.maxBusyTries = options.maxBusyTries || 3
      options.emfileWait = options.emfileWait || 1000
      if (options.glob === false) {
        options.disableGlob = true
      }
      options.disableGlob = options.disableGlob || false
      options.glob = options.glob || defaultGlobOpts
    }
    
    function rimraf (p, options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = {}
      }
    
      assert(p, 'rimraf: missing path')
      assert.equal(typeof p, 'string', 'rimraf: path should be a string')
      assert.equal(typeof cb, 'function', 'rimraf: callback function required')
      assert(options, 'rimraf: invalid options argument provided')
      assert.equal(typeof options, 'object', 'rimraf: options should be object')
    
      defaults(options)
    
      var busyTries = 0
      var errState = null
      var n = 0
    
      if (options.disableGlob || !glob.hasMagic(p))
        return afterGlob(null, [p])
    
      options.lstat(p, function (er, stat) {
        if (!er)
          return afterGlob(null, [p])
    
        glob(p, options.glob, afterGlob)
      })
    
      function next (er) {
        errState = errState || er
        if (--n === 0)
          cb(errState)
      }
    
      function afterGlob (er, results) {
        if (er)
          return cb(er)
    
        n = results.length
        if (n === 0)
          return cb()
    
        results.forEach(function (p) {
          rimraf_(p, options, function CB (er) {
            if (er) {
              if (isWindows && (er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") &&
                  busyTries < options.maxBusyTries) {
                busyTries ++
                var time = busyTries * 100
                // try again, with the same exact callback as this one.
                return setTimeout(function () {
                  rimraf_(p, options, CB)
                }, time)
              }
    
              // this one won't happen if graceful-fs is used.
              if (er.code === "EMFILE" && timeout < options.emfileWait) {
                return setTimeout(function () {
                  rimraf_(p, options, CB)
                }, timeout ++)
              }
    
              // already gone
              if (er.code === "ENOENT") er = null
            }
    
            timeout = 0
            next(er)
          })
        })
      }
    }
    
    // Two possible strategies.
    // 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
    // 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
    //
    // Both result in an extra syscall when you guess wrong.  However, there
    // are likely far more normal files in the world than directories.  This
    // is based on the assumption that a the average number of files per
    // directory is >= 1.
    //
    // If anyone ever complains about this, then I guess the strategy could
    // be made configurable somehow.  But until then, YAGNI.
    function rimraf_ (p, options, cb) {
      assert(p)
      assert(options)
      assert(typeof cb === 'function')
    
      // sunos lets the root user unlink directories, which is... weird.
      // so we have to lstat here and make sure it's not a dir.
      options.lstat(p, function (er, st) {
        if (er && er.code === "ENOENT")
          return cb(null)
    
        // Windows can EPERM on stat.  Life is suffering.
        if (er && er.code === "EPERM" && isWindows)
          fixWinEPERM(p, options, er, cb)
    
        if (st && st.isDirectory())
          return rmdir(p, options, er, cb)
    
        options.unlink(p, function (er) {
          if (er) {
            if (er.code === "ENOENT")
              return cb(null)
            if (er.code === "EPERM")
              return (isWindows)
                ? fixWinEPERM(p, options, er, cb)
                : rmdir(p, options, er, cb)
            if (er.code === "EISDIR")
              return rmdir(p, options, er, cb)
          }
          return cb(er)
        })
      })
    }
    
    function fixWinEPERM (p, options, er, cb) {
      assert(p)
      assert(options)
      assert(typeof cb === 'function')
      if (er)
        assert(er instanceof Error)
    
      options.chmod(p, 666, function (er2) {
        if (er2)
          cb(er2.code === "ENOENT" ? null : er)
        else
          options.stat(p, function(er3, stats) {
            if (er3)
              cb(er3.code === "ENOENT" ? null : er)
            else if (stats.isDirectory())
              rmdir(p, options, er, cb)
            else
              options.unlink(p, cb)
          })
      })
    }
    
    function fixWinEPERMSync (p, options, er) {
      assert(p)
      assert(options)
      if (er)
        assert(er instanceof Error)
    
      try {
        options.chmodSync(p, 666)
      } catch (er2) {
        if (er2.code === "ENOENT")
          return
        else
          throw er
      }
    
      try {
        var stats = options.statSync(p)
      } catch (er3) {
        if (er3.code === "ENOENT")
          return
        else
          throw er
      }
    
      if (stats.isDirectory())
        rmdirSync(p, options, er)
      else
        options.unlinkSync(p)
    }
    
    function rmdir (p, options, originalEr, cb) {
      assert(p)
      assert(options)
      if (originalEr)
        assert(originalEr instanceof Error)
      assert(typeof cb === 'function')
    
      // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
      // if we guessed wrong, and it's not a directory, then
      // raise the original error.
      options.rmdir(p, function (er) {
        if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM"))
          rmkids(p, options, cb)
        else if (er && er.code === "ENOTDIR")
          cb(originalEr)
        else
          cb(er)
      })
    }
    
    function rmkids(p, options, cb) {
      assert(p)
      assert(options)
      assert(typeof cb === 'function')
    
      options.readdir(p, function (er, files) {
        if (er)
          return cb(er)
        var n = files.length
        if (n === 0)
          return options.rmdir(p, cb)
        var errState
        files.forEach(function (f) {
          rimraf(path.join(p, f), options, function (er) {
            if (errState)
              return
            if (er)
              return cb(errState = er)
            if (--n === 0)
              options.rmdir(p, cb)
          })
        })
      })
    }
    
    // this looks simpler, and is strictly *faster*, but will
    // tie up the JavaScript thread and fail on excessively
    // deep directory trees.
    function rimrafSync (p, options) {
      options = options || {}
      defaults(options)
    
      assert(p, 'rimraf: missing path')
      assert.equal(typeof p, 'string', 'rimraf: path should be a string')
      assert(options, 'rimraf: missing options')
      assert.equal(typeof options, 'object', 'rimraf: options should be object')
    
      var results
    
      if (options.disableGlob || !glob.hasMagic(p)) {
        results = [p]
      } else {
        try {
          options.lstatSync(p)
          results = [p]
        } catch (er) {
          results = glob.sync(p, options.glob)
        }
      }
    
      if (!results.length)
        return
    
      for (var i = 0; i < results.length; i++) {
        var p = results[i]
    
        try {
          var st = options.lstatSync(p)
        } catch (er) {
          if (er.code === "ENOENT")
            return
    
          // Windows can EPERM on stat.  Life is suffering.
          if (er.code === "EPERM" && isWindows)
            fixWinEPERMSync(p, options, er)
        }
    
        try {
          // sunos lets the root user unlink directories, which is... weird.
          if (st && st.isDirectory())
            rmdirSync(p, options, null)
          else
            options.unlinkSync(p)
        } catch (er) {
          if (er.code === "ENOENT")
            return
          if (er.code === "EPERM")
            return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
          if (er.code !== "EISDIR")
            throw er
          rmdirSync(p, options, er)
        }
      }
    }
    
    function rmdirSync (p, options, originalEr) {
      assert(p)
      assert(options)
      if (originalEr)
        assert(originalEr instanceof Error)
    
      try {
        options.rmdirSync(p)
      } catch (er) {
        if (er.code === "ENOENT")
          return
        if (er.code === "ENOTDIR")
          throw originalEr
        if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")
          rmkidsSync(p, options)
      }
    }
    
    function rmkidsSync (p, options) {
      assert(p)
      assert(options)
      options.readdirSync(p).forEach(function (f) {
        rimrafSync(path.join(p, f), options)
      })
      options.rmdirSync(p, options)
    }
    
  provide("rimraf", module.exports);
}(global));

// pakmanager:block-stream
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // write data to it, and it'll emit data in 512 byte blocks.
    // if you .end() or .flush(), it'll emit whatever it's got,
    // padded with nulls to 512 bytes.
    
    module.exports = BlockStream
    
    var Stream = require("stream").Stream
      , inherits = require("inherits")
      , assert = require("assert").ok
      , debug = process.env.DEBUG ? console.error : function () {}
    
    function BlockStream (size, opt) {
      this.writable = this.readable = true
      this._opt = opt || {}
      this._chunkSize = size || 512
      this._offset = 0
      this._buffer = []
      this._bufferLength = 0
      if (this._opt.nopad) this._zeroes = false
      else {
        this._zeroes = new Buffer(this._chunkSize)
        for (var i = 0; i < this._chunkSize; i ++) {
          this._zeroes[i] = 0
        }
      }
    }
    
    inherits(BlockStream, Stream)
    
    BlockStream.prototype.write = function (c) {
      // debug("   BS write", c)
      if (this._ended) throw new Error("BlockStream: write after end")
      if (c && !Buffer.isBuffer(c)) c = new Buffer(c + "")
      if (c.length) {
        this._buffer.push(c)
        this._bufferLength += c.length
      }
      // debug("pushed onto buffer", this._bufferLength)
      if (this._bufferLength >= this._chunkSize) {
        if (this._paused) {
          // debug("   BS paused, return false, need drain")
          this._needDrain = true
          return false
        }
        this._emitChunk()
      }
      return true
    }
    
    BlockStream.prototype.pause = function () {
      // debug("   BS pausing")
      this._paused = true
    }
    
    BlockStream.prototype.resume = function () {
      // debug("   BS resume")
      this._paused = false
      return this._emitChunk()
    }
    
    BlockStream.prototype.end = function (chunk) {
      // debug("end", chunk)
      if (typeof chunk === "function") cb = chunk, chunk = null
      if (chunk) this.write(chunk)
      this._ended = true
      this.flush()
    }
    
    BlockStream.prototype.flush = function () {
      this._emitChunk(true)
    }
    
    BlockStream.prototype._emitChunk = function (flush) {
      // debug("emitChunk flush=%j emitting=%j paused=%j", flush, this._emitting, this._paused)
    
      // emit a <chunkSize> chunk
      if (flush && this._zeroes) {
        // debug("    BS push zeroes", this._bufferLength)
        // push a chunk of zeroes
        var padBytes = (this._bufferLength % this._chunkSize)
        if (padBytes !== 0) padBytes = this._chunkSize - padBytes
        if (padBytes > 0) {
          // debug("padBytes", padBytes, this._zeroes.slice(0, padBytes))
          this._buffer.push(this._zeroes.slice(0, padBytes))
          this._bufferLength += padBytes
          // debug(this._buffer[this._buffer.length - 1].length, this._bufferLength)
        }
      }
    
      if (this._emitting || this._paused) return
      this._emitting = true
    
      // debug("    BS entering loops")
      var bufferIndex = 0
      while (this._bufferLength >= this._chunkSize &&
             (flush || !this._paused)) {
        // debug("     BS data emission loop", this._bufferLength)
    
        var out
          , outOffset = 0
          , outHas = this._chunkSize
    
        while (outHas > 0 && (flush || !this._paused) ) {
          // debug("    BS data inner emit loop", this._bufferLength)
          var cur = this._buffer[bufferIndex]
            , curHas = cur.length - this._offset
          // debug("cur=", cur)
          // debug("curHas=%j", curHas)
          // If it's not big enough to fill the whole thing, then we'll need
          // to copy multiple buffers into one.  However, if it is big enough,
          // then just slice out the part we want, to save unnecessary copying.
          // Also, need to copy if we've already done some copying, since buffers
          // can't be joined like cons strings.
          if (out || curHas < outHas) {
            out = out || new Buffer(this._chunkSize)
            cur.copy(out, outOffset,
                     this._offset, this._offset + Math.min(curHas, outHas))
          } else if (cur.length === outHas && this._offset === 0) {
            // shortcut -- cur is exactly long enough, and no offset.
            out = cur
          } else {
            // slice out the piece of cur that we need.
            out = cur.slice(this._offset, this._offset + outHas)
          }
    
          if (curHas > outHas) {
            // means that the current buffer couldn't be completely output
            // update this._offset to reflect how much WAS written
            this._offset += outHas
            outHas = 0
          } else {
            // output the entire current chunk.
            // toss it away
            outHas -= curHas
            outOffset += curHas
            bufferIndex ++
            this._offset = 0
          }
        }
    
        this._bufferLength -= this._chunkSize
        assert(out.length === this._chunkSize)
        // debug("emitting data", out)
        // debug("   BS emitting, paused=%j", this._paused, this._bufferLength)
        this.emit("data", out)
        out = null
      }
      // debug("    BS out of loops", this._bufferLength)
    
      // whatever is left, it's not enough to fill up a block, or we're paused
      this._buffer = this._buffer.slice(bufferIndex)
      if (this._paused) {
        // debug("    BS paused, leaving", this._bufferLength)
        this._needsDrain = true
        this._emitting = false
        return
      }
    
      // if flushing, and not using null-padding, then need to emit the last
      // chunk(s) sitting in the queue.  We know that it's not enough to
      // fill up a whole block, because otherwise it would have been emitted
      // above, but there may be some offset.
      var l = this._buffer.length
      if (flush && !this._zeroes && l) {
        if (l === 1) {
          if (this._offset) {
            this.emit("data", this._buffer[0].slice(this._offset))
          } else {
            this.emit("data", this._buffer[0])
          }
        } else {
          var outHas = this._bufferLength
            , out = new Buffer(outHas)
            , outOffset = 0
          for (var i = 0; i < l; i ++) {
            var cur = this._buffer[i]
              , curHas = cur.length - this._offset
            cur.copy(out, outOffset, this._offset)
            this._offset = 0
            outOffset += curHas
            this._bufferLength -= curHas
          }
          this.emit("data", out)
        }
        // truncate
        this._buffer.length = 0
        this._bufferLength = 0
        this._offset = 0
      }
    
      // now either drained or ended
      // debug("either draining, or ended", this._bufferLength, this._ended)
      // means that we've flushed out all that we can so far.
      if (this._needDrain) {
        // debug("emitting drain", this._bufferLength)
        this._needDrain = false
        this.emit("drain")
      }
    
      if ((this._bufferLength === 0) && this._ended && !this._endEmitted) {
        // debug("emitting end", this._bufferLength)
        this._endEmitted = true
        this.emit("end")
      }
    
      this._emitting = false
    
      // debug("    BS no longer emitting", flush, this._paused, this._emitting, this._bufferLength, this._chunkSize)
    }
    
  provide("block-stream", module.exports);
}(global));

// pakmanager:fstream
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  exports.Abstract = require('./lib/abstract.js')
    exports.Reader = require('./lib/reader.js')
    exports.Writer = require('./lib/writer.js')
    
    exports.File = {
      Reader: require('./lib/file-reader.js'),
      Writer: require('./lib/file-writer.js')
    }
    
    exports.Dir = {
      Reader: require('./lib/dir-reader.js'),
      Writer: require('./lib/dir-writer.js')
    }
    
    exports.Link = {
      Reader: require('./lib/link-reader.js'),
      Writer: require('./lib/link-writer.js')
    }
    
    exports.Proxy = {
      Reader: require('./lib/proxy-reader.js'),
      Writer: require('./lib/proxy-writer.js')
    }
    
    exports.Reader.Dir = exports.DirReader = exports.Dir.Reader
    exports.Reader.File = exports.FileReader = exports.File.Reader
    exports.Reader.Link = exports.LinkReader = exports.Link.Reader
    exports.Reader.Proxy = exports.ProxyReader = exports.Proxy.Reader
    
    exports.Writer.Dir = exports.DirWriter = exports.Dir.Writer
    exports.Writer.File = exports.FileWriter = exports.File.Writer
    exports.Writer.Link = exports.LinkWriter = exports.Link.Writer
    exports.Writer.Proxy = exports.ProxyWriter = exports.Proxy.Writer
    
    exports.collect = require('./lib/collect.js')
    
  provide("fstream", module.exports);
}(global));

// pakmanager:tar
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // field paths that every tar file must have.
    // header is padded to 512 bytes.
    var f = 0
      , fields = {}
      , path = fields.path = f++
      , mode = fields.mode = f++
      , uid = fields.uid = f++
      , gid = fields.gid = f++
      , size = fields.size = f++
      , mtime = fields.mtime = f++
      , cksum = fields.cksum = f++
      , type = fields.type = f++
      , linkpath = fields.linkpath = f++
      , headerSize = 512
      , blockSize = 512
      , fieldSize = []
    
    fieldSize[path] = 100
    fieldSize[mode] = 8
    fieldSize[uid] = 8
    fieldSize[gid] = 8
    fieldSize[size] = 12
    fieldSize[mtime] = 12
    fieldSize[cksum] = 8
    fieldSize[type] = 1
    fieldSize[linkpath] = 100
    
    // "ustar\0" may introduce another bunch of headers.
    // these are optional, and will be nulled out if not present.
    
    var ustar = fields.ustar = f++
      , ustarver = fields.ustarver = f++
      , uname = fields.uname = f++
      , gname = fields.gname = f++
      , devmaj = fields.devmaj = f++
      , devmin = fields.devmin = f++
      , prefix = fields.prefix = f++
      , fill = fields.fill = f++
    
    // terminate fields.
    fields[f] = null
    
    fieldSize[ustar] = 6
    fieldSize[ustarver] = 2
    fieldSize[uname] = 32
    fieldSize[gname] = 32
    fieldSize[devmaj] = 8
    fieldSize[devmin] = 8
    fieldSize[prefix] = 155
    fieldSize[fill] = 12
    
    // nb: prefix field may in fact be 130 bytes of prefix,
    // a null char, 12 bytes for atime, 12 bytes for ctime.
    //
    // To recognize this format:
    // 1. prefix[130] === ' ' or '\0'
    // 2. atime and ctime are octal numeric values
    // 3. atime and ctime have ' ' in their last byte
    
    var fieldEnds = {}
      , fieldOffs = {}
      , fe = 0
    for (var i = 0; i < f; i ++) {
      fieldOffs[i] = fe
      fieldEnds[i] = (fe += fieldSize[i])
    }
    
    // build a translation table of field paths.
    Object.keys(fields).forEach(function (f) {
      if (fields[f] !== null) fields[fields[f]] = f
    })
    
    // different values of the 'type' field
    // paths match the values of Stats.isX() functions, where appropriate
    var types =
      { 0: "File"
      , "\0": "OldFile" // like 0
      , "": "OldFile"
      , 1: "Link"
      , 2: "SymbolicLink"
      , 3: "CharacterDevice"
      , 4: "BlockDevice"
      , 5: "Directory"
      , 6: "FIFO"
      , 7: "ContiguousFile" // like 0
      // posix headers
      , g: "GlobalExtendedHeader" // k=v for the rest of the archive
      , x: "ExtendedHeader" // k=v for the next file
      // vendor-specific stuff
      , A: "SolarisACL" // skip
      , D: "GNUDumpDir" // like 5, but with data, which should be skipped
      , I: "Inode" // metadata only, skip
      , K: "NextFileHasLongLinkpath" // data = link path of next file
      , L: "NextFileHasLongPath" // data = path of next file
      , M: "ContinuationFile" // skip
      , N: "OldGnuLongPath" // like L
      , S: "SparseFile" // skip
      , V: "TapeVolumeHeader" // skip
      , X: "OldExtendedHeader" // like x
      }
    
    Object.keys(types).forEach(function (t) {
      types[types[t]] = types[types[t]] || t
    })
    
    // values for the mode field
    var modes =
      { suid: 04000 // set uid on extraction
      , sgid: 02000 // set gid on extraction
      , svtx: 01000 // set restricted deletion flag on dirs on extraction
      , uread:  0400
      , uwrite: 0200
      , uexec:  0100
      , gread:  040
      , gwrite: 020
      , gexec:  010
      , oread:  4
      , owrite: 2
      , oexec:  1
      , all: 07777
      }
    
    var numeric =
      { mode: true
      , uid: true
      , gid: true
      , size: true
      , mtime: true
      , devmaj: true
      , devmin: true
      , cksum: true
      , atime: true
      , ctime: true
      , dev: true
      , ino: true
      , nlink: true
      }
    
    Object.keys(modes).forEach(function (t) {
      modes[modes[t]] = modes[modes[t]] || t
    })
    
    var knownExtended =
      { atime: true
      , charset: true
      , comment: true
      , ctime: true
      , gid: true
      , gname: true
      , linkpath: true
      , mtime: true
      , path: true
      , realtime: true
      , security: true
      , size: true
      , uid: true
      , uname: true }
    
    
    exports.fields = fields
    exports.fieldSize = fieldSize
    exports.fieldOffs = fieldOffs
    exports.fieldEnds = fieldEnds
    exports.types = types
    exports.modes = modes
    exports.numeric = numeric
    exports.headerSize = headerSize
    exports.blockSize = blockSize
    exports.knownExtended = knownExtended
    
    exports.Pack = require("./lib/pack.js")
    exports.Parse = require("./lib/parse.js")
    exports.Extract = require("./lib/extract.js")
    
  provide("tar", module.exports);
}(global));

// pakmanager:hammerjs
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*! Hammer.JS - v2.0.7 - 2016-04-22
     * http://hammerjs.github.io/
     *
     * Copyright (c) 2016 Jorik Tangelder;
     * Licensed under the MIT license */
    (function(window, document, exportName, undefined) {
      'use strict';
    
    var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
    var TEST_ELEMENT = document.createElement('div');
    
    var TYPE_FUNCTION = 'function';
    
    var round = Math.round;
    var abs = Math.abs;
    var now = Date.now;
    
    /**
     * set a timeout with a given scope
     * @param {Function} fn
     * @param {Number} timeout
     * @param {Object} context
     * @returns {number}
     */
    function setTimeoutContext(fn, timeout, context) {
        return setTimeout(bindFn(fn, context), timeout);
    }
    
    /**
     * if the argument is an array, we want to execute the fn on each entry
     * if it aint an array we don't want to do a thing.
     * this is used by all the methods that accept a single and array argument.
     * @param {*|Array} arg
     * @param {String} fn
     * @param {Object} [context]
     * @returns {Boolean}
     */
    function invokeArrayArg(arg, fn, context) {
        if (Array.isArray(arg)) {
            each(arg, context[fn], context);
            return true;
        }
        return false;
    }
    
    /**
     * walk objects and arrays
     * @param {Object} obj
     * @param {Function} iterator
     * @param {Object} context
     */
    function each(obj, iterator, context) {
        var i;
    
        if (!obj) {
            return;
        }
    
        if (obj.forEach) {
            obj.forEach(iterator, context);
        } else if (obj.length !== undefined) {
            i = 0;
            while (i < obj.length) {
                iterator.call(context, obj[i], i, obj);
                i++;
            }
        } else {
            for (i in obj) {
                obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
            }
        }
    }
    
    /**
     * wrap a method with a deprecation warning and stack trace
     * @param {Function} method
     * @param {String} name
     * @param {String} message
     * @returns {Function} A new function wrapping the supplied method.
     */
    function deprecate(method, name, message) {
        var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
        return function() {
            var e = new Error('get-stack-trace');
            var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';
    
            var log = window.console && (window.console.warn || window.console.log);
            if (log) {
                log.call(window.console, deprecationMessage, stack);
            }
            return method.apply(this, arguments);
        };
    }
    
    /**
     * extend object.
     * means that properties in dest will be overwritten by the ones in src.
     * @param {Object} target
     * @param {...Object} objects_to_assign
     * @returns {Object} target
     */
    var assign;
    if (typeof Object.assign !== 'function') {
        assign = function assign(target) {
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
    
            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    } else {
        assign = Object.assign;
    }
    
    /**
     * extend object.
     * means that properties in dest will be overwritten by the ones in src.
     * @param {Object} dest
     * @param {Object} src
     * @param {Boolean} [merge=false]
     * @returns {Object} dest
     */
    var extend = deprecate(function extend(dest, src, merge) {
        var keys = Object.keys(src);
        var i = 0;
        while (i < keys.length) {
            if (!merge || (merge && dest[keys[i]] === undefined)) {
                dest[keys[i]] = src[keys[i]];
            }
            i++;
        }
        return dest;
    }, 'extend', 'Use `assign`.');
    
    /**
     * merge the values from src in the dest.
     * means that properties that exist in dest will not be overwritten by src
     * @param {Object} dest
     * @param {Object} src
     * @returns {Object} dest
     */
    var merge = deprecate(function merge(dest, src) {
        return extend(dest, src, true);
    }, 'merge', 'Use `assign`.');
    
    /**
     * simple class inheritance
     * @param {Function} child
     * @param {Function} base
     * @param {Object} [properties]
     */
    function inherit(child, base, properties) {
        var baseP = base.prototype,
            childP;
    
        childP = child.prototype = Object.create(baseP);
        childP.constructor = child;
        childP._super = baseP;
    
        if (properties) {
            assign(childP, properties);
        }
    }
    
    /**
     * simple function bind
     * @param {Function} fn
     * @param {Object} context
     * @returns {Function}
     */
    function bindFn(fn, context) {
        return function boundFn() {
            return fn.apply(context, arguments);
        };
    }
    
    /**
     * let a boolean value also be a function that must return a boolean
     * this first item in args will be used as the context
     * @param {Boolean|Function} val
     * @param {Array} [args]
     * @returns {Boolean}
     */
    function boolOrFn(val, args) {
        if (typeof val == TYPE_FUNCTION) {
            return val.apply(args ? args[0] || undefined : undefined, args);
        }
        return val;
    }
    
    /**
     * use the val2 when val1 is undefined
     * @param {*} val1
     * @param {*} val2
     * @returns {*}
     */
    function ifUndefined(val1, val2) {
        return (val1 === undefined) ? val2 : val1;
    }
    
    /**
     * addEventListener with multiple events at once
     * @param {EventTarget} target
     * @param {String} types
     * @param {Function} handler
     */
    function addEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
            target.addEventListener(type, handler, false);
        });
    }
    
    /**
     * removeEventListener with multiple events at once
     * @param {EventTarget} target
     * @param {String} types
     * @param {Function} handler
     */
    function removeEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
            target.removeEventListener(type, handler, false);
        });
    }
    
    /**
     * find if a node is in the given parent
     * @method hasParent
     * @param {HTMLElement} node
     * @param {HTMLElement} parent
     * @return {Boolean} found
     */
    function hasParent(node, parent) {
        while (node) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    
    /**
     * small indexOf wrapper
     * @param {String} str
     * @param {String} find
     * @returns {Boolean} found
     */
    function inStr(str, find) {
        return str.indexOf(find) > -1;
    }
    
    /**
     * split string on whitespace
     * @param {String} str
     * @returns {Array} words
     */
    function splitStr(str) {
        return str.trim().split(/\s+/g);
    }
    
    /**
     * find if a array contains the object using indexOf or a simple polyFill
     * @param {Array} src
     * @param {String} find
     * @param {String} [findByKey]
     * @return {Boolean|Number} false when not found, or the index
     */
    function inArray(src, find, findByKey) {
        if (src.indexOf && !findByKey) {
            return src.indexOf(find);
        } else {
            var i = 0;
            while (i < src.length) {
                if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                    return i;
                }
                i++;
            }
            return -1;
        }
    }
    
    /**
     * convert array-like objects to real arrays
     * @param {Object} obj
     * @returns {Array}
     */
    function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
    }
    
    /**
     * unique array with objects based on a key (like 'id') or just by the array's value
     * @param {Array} src [{id:1},{id:2},{id:1}]
     * @param {String} [key]
     * @param {Boolean} [sort=False]
     * @returns {Array} [{id:1},{id:2}]
     */
    function uniqueArray(src, key, sort) {
        var results = [];
        var values = [];
        var i = 0;
    
        while (i < src.length) {
            var val = key ? src[i][key] : src[i];
            if (inArray(values, val) < 0) {
                results.push(src[i]);
            }
            values[i] = val;
            i++;
        }
    
        if (sort) {
            if (!key) {
                results = results.sort();
            } else {
                results = results.sort(function sortUniqueArray(a, b) {
                    return a[key] > b[key];
                });
            }
        }
    
        return results;
    }
    
    /**
     * get the prefixed property
     * @param {Object} obj
     * @param {String} property
     * @returns {String|Undefined} prefixed
     */
    function prefixed(obj, property) {
        var prefix, prop;
        var camelProp = property[0].toUpperCase() + property.slice(1);
    
        var i = 0;
        while (i < VENDOR_PREFIXES.length) {
            prefix = VENDOR_PREFIXES[i];
            prop = (prefix) ? prefix + camelProp : property;
    
            if (prop in obj) {
                return prop;
            }
            i++;
        }
        return undefined;
    }
    
    /**
     * get a unique id
     * @returns {number} uniqueId
     */
    var _uniqueId = 1;
    function uniqueId() {
        return _uniqueId++;
    }
    
    /**
     * get the window object of an element
     * @param {HTMLElement} element
     * @returns {DocumentView|Window}
     */
    function getWindowForElement(element) {
        var doc = element.ownerDocument || element;
        return (doc.defaultView || doc.parentWindow || window);
    }
    
    var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
    
    var SUPPORT_TOUCH = ('ontouchstart' in window);
    var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
    var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
    
    var INPUT_TYPE_TOUCH = 'touch';
    var INPUT_TYPE_PEN = 'pen';
    var INPUT_TYPE_MOUSE = 'mouse';
    var INPUT_TYPE_KINECT = 'kinect';
    
    var COMPUTE_INTERVAL = 25;
    
    var INPUT_START = 1;
    var INPUT_MOVE = 2;
    var INPUT_END = 4;
    var INPUT_CANCEL = 8;
    
    var DIRECTION_NONE = 1;
    var DIRECTION_LEFT = 2;
    var DIRECTION_RIGHT = 4;
    var DIRECTION_UP = 8;
    var DIRECTION_DOWN = 16;
    
    var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
    var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
    var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;
    
    var PROPS_XY = ['x', 'y'];
    var PROPS_CLIENT_XY = ['clientX', 'clientY'];
    
    /**
     * create new input type manager
     * @param {Manager} manager
     * @param {Function} callback
     * @returns {Input}
     * @constructor
     */
    function Input(manager, callback) {
        var self = this;
        this.manager = manager;
        this.callback = callback;
        this.element = manager.element;
        this.target = manager.options.inputTarget;
    
        // smaller wrapper around the handler, for the scope and the enabled state of the manager,
        // so when disabled the input events are completely bypassed.
        this.domHandler = function(ev) {
            if (boolOrFn(manager.options.enable, [manager])) {
                self.handler(ev);
            }
        };
    
        this.init();
    
    }
    
    Input.prototype = {
        /**
         * should handle the inputEvent data and trigger the callback
         * @virtual
         */
        handler: function() { },
    
        /**
         * bind the events
         */
        init: function() {
            this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        },
    
        /**
         * unbind the events
         */
        destroy: function() {
            this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
            this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
            this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        }
    };
    
    /**
     * create new input type manager
     * called by the Manager constructor
     * @param {Hammer} manager
     * @returns {Input}
     */
    function createInputInstance(manager) {
        var Type;
        var inputClass = manager.options.inputClass;
    
        if (inputClass) {
            Type = inputClass;
        } else if (SUPPORT_POINTER_EVENTS) {
            Type = PointerEventInput;
        } else if (SUPPORT_ONLY_TOUCH) {
            Type = TouchInput;
        } else if (!SUPPORT_TOUCH) {
            Type = MouseInput;
        } else {
            Type = TouchMouseInput;
        }
        return new (Type)(manager, inputHandler);
    }
    
    /**
     * handle input events
     * @param {Manager} manager
     * @param {String} eventType
     * @param {Object} input
     */
    function inputHandler(manager, eventType, input) {
        var pointersLen = input.pointers.length;
        var changedPointersLen = input.changedPointers.length;
        var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
        var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));
    
        input.isFirst = !!isFirst;
        input.isFinal = !!isFinal;
    
        if (isFirst) {
            manager.session = {};
        }
    
        // source event is the normalized value of the domEvents
        // like 'touchstart, mouseup, pointerdown'
        input.eventType = eventType;
    
        // compute scale, rotation etc
        computeInputData(manager, input);
    
        // emit secret event
        manager.emit('hammer.input', input);
    
        manager.recognize(input);
        manager.session.prevInput = input;
    }
    
    /**
     * extend the data with some usable properties like scale, rotate, velocity etc
     * @param {Object} manager
     * @param {Object} input
     */
    function computeInputData(manager, input) {
        var session = manager.session;
        var pointers = input.pointers;
        var pointersLength = pointers.length;
    
        // store the first input to calculate the distance and direction
        if (!session.firstInput) {
            session.firstInput = simpleCloneInputData(input);
        }
    
        // to compute scale and rotation we need to store the multiple touches
        if (pointersLength > 1 && !session.firstMultiple) {
            session.firstMultiple = simpleCloneInputData(input);
        } else if (pointersLength === 1) {
            session.firstMultiple = false;
        }
    
        var firstInput = session.firstInput;
        var firstMultiple = session.firstMultiple;
        var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;
    
        var center = input.center = getCenter(pointers);
        input.timeStamp = now();
        input.deltaTime = input.timeStamp - firstInput.timeStamp;
    
        input.angle = getAngle(offsetCenter, center);
        input.distance = getDistance(offsetCenter, center);
    
        computeDeltaXY(session, input);
        input.offsetDirection = getDirection(input.deltaX, input.deltaY);
    
        var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
        input.overallVelocityX = overallVelocity.x;
        input.overallVelocityY = overallVelocity.y;
        input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;
    
        input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
        input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;
    
        input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
            session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);
    
        computeIntervalInputData(session, input);
    
        // find the correct target
        var target = manager.element;
        if (hasParent(input.srcEvent.target, target)) {
            target = input.srcEvent.target;
        }
        input.target = target;
    }
    
    function computeDeltaXY(session, input) {
        var center = input.center;
        var offset = session.offsetDelta || {};
        var prevDelta = session.prevDelta || {};
        var prevInput = session.prevInput || {};
    
        if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
            prevDelta = session.prevDelta = {
                x: prevInput.deltaX || 0,
                y: prevInput.deltaY || 0
            };
    
            offset = session.offsetDelta = {
                x: center.x,
                y: center.y
            };
        }
    
        input.deltaX = prevDelta.x + (center.x - offset.x);
        input.deltaY = prevDelta.y + (center.y - offset.y);
    }
    
    /**
     * velocity is calculated every x ms
     * @param {Object} session
     * @param {Object} input
     */
    function computeIntervalInputData(session, input) {
        var last = session.lastInterval || input,
            deltaTime = input.timeStamp - last.timeStamp,
            velocity, velocityX, velocityY, direction;
    
        if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
            var deltaX = input.deltaX - last.deltaX;
            var deltaY = input.deltaY - last.deltaY;
    
            var v = getVelocity(deltaTime, deltaX, deltaY);
            velocityX = v.x;
            velocityY = v.y;
            velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
            direction = getDirection(deltaX, deltaY);
    
            session.lastInterval = input;
        } else {
            // use latest velocity info if it doesn't overtake a minimum period
            velocity = last.velocity;
            velocityX = last.velocityX;
            velocityY = last.velocityY;
            direction = last.direction;
        }
    
        input.velocity = velocity;
        input.velocityX = velocityX;
        input.velocityY = velocityY;
        input.direction = direction;
    }
    
    /**
     * create a simple clone from the input used for storage of firstInput and firstMultiple
     * @param {Object} input
     * @returns {Object} clonedInputData
     */
    function simpleCloneInputData(input) {
        // make a simple copy of the pointers because we will get a reference if we don't
        // we only need clientXY for the calculations
        var pointers = [];
        var i = 0;
        while (i < input.pointers.length) {
            pointers[i] = {
                clientX: round(input.pointers[i].clientX),
                clientY: round(input.pointers[i].clientY)
            };
            i++;
        }
    
        return {
            timeStamp: now(),
            pointers: pointers,
            center: getCenter(pointers),
            deltaX: input.deltaX,
            deltaY: input.deltaY
        };
    }
    
    /**
     * get the center of all the pointers
     * @param {Array} pointers
     * @return {Object} center contains `x` and `y` properties
     */
    function getCenter(pointers) {
        var pointersLength = pointers.length;
    
        // no need to loop when only one touch
        if (pointersLength === 1) {
            return {
                x: round(pointers[0].clientX),
                y: round(pointers[0].clientY)
            };
        }
    
        var x = 0, y = 0, i = 0;
        while (i < pointersLength) {
            x += pointers[i].clientX;
            y += pointers[i].clientY;
            i++;
        }
    
        return {
            x: round(x / pointersLength),
            y: round(y / pointersLength)
        };
    }
    
    /**
     * calculate the velocity between two points. unit is in px per ms.
     * @param {Number} deltaTime
     * @param {Number} x
     * @param {Number} y
     * @return {Object} velocity `x` and `y`
     */
    function getVelocity(deltaTime, x, y) {
        return {
            x: x / deltaTime || 0,
            y: y / deltaTime || 0
        };
    }
    
    /**
     * get the direction between two points
     * @param {Number} x
     * @param {Number} y
     * @return {Number} direction
     */
    function getDirection(x, y) {
        if (x === y) {
            return DIRECTION_NONE;
        }
    
        if (abs(x) >= abs(y)) {
            return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
    }
    
    /**
     * calculate the absolute distance between two points
     * @param {Object} p1 {x, y}
     * @param {Object} p2 {x, y}
     * @param {Array} [props] containing x and y keys
     * @return {Number} distance
     */
    function getDistance(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]],
            y = p2[props[1]] - p1[props[1]];
    
        return Math.sqrt((x * x) + (y * y));
    }
    
    /**
     * calculate the angle between two coordinates
     * @param {Object} p1
     * @param {Object} p2
     * @param {Array} [props] containing x and y keys
     * @return {Number} angle
     */
    function getAngle(p1, p2, props) {
        if (!props) {
            props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]],
            y = p2[props[1]] - p1[props[1]];
        return Math.atan2(y, x) * 180 / Math.PI;
    }
    
    /**
     * calculate the rotation degrees between two pointersets
     * @param {Array} start array of pointers
     * @param {Array} end array of pointers
     * @return {Number} rotation
     */
    function getRotation(start, end) {
        return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
    }
    
    /**
     * calculate the scale factor between two pointersets
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param {Array} start array of pointers
     * @param {Array} end array of pointers
     * @return {Number} scale
     */
    function getScale(start, end) {
        return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
    }
    
    var MOUSE_INPUT_MAP = {
        mousedown: INPUT_START,
        mousemove: INPUT_MOVE,
        mouseup: INPUT_END
    };
    
    var MOUSE_ELEMENT_EVENTS = 'mousedown';
    var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';
    
    /**
     * Mouse events input
     * @constructor
     * @extends Input
     */
    function MouseInput() {
        this.evEl = MOUSE_ELEMENT_EVENTS;
        this.evWin = MOUSE_WINDOW_EVENTS;
    
        this.pressed = false; // mousedown state
    
        Input.apply(this, arguments);
    }
    
    inherit(MouseInput, Input, {
        /**
         * handle mouse events
         * @param {Object} ev
         */
        handler: function MEhandler(ev) {
            var eventType = MOUSE_INPUT_MAP[ev.type];
    
            // on start we want to have the left mouse button down
            if (eventType & INPUT_START && ev.button === 0) {
                this.pressed = true;
            }
    
            if (eventType & INPUT_MOVE && ev.which !== 1) {
                eventType = INPUT_END;
            }
    
            // mouse must be down
            if (!this.pressed) {
                return;
            }
    
            if (eventType & INPUT_END) {
                this.pressed = false;
            }
    
            this.callback(this.manager, eventType, {
                pointers: [ev],
                changedPointers: [ev],
                pointerType: INPUT_TYPE_MOUSE,
                srcEvent: ev
            });
        }
    });
    
    var POINTER_INPUT_MAP = {
        pointerdown: INPUT_START,
        pointermove: INPUT_MOVE,
        pointerup: INPUT_END,
        pointercancel: INPUT_CANCEL,
        pointerout: INPUT_CANCEL
    };
    
    // in IE10 the pointer types is defined as an enum
    var IE10_POINTER_TYPE_ENUM = {
        2: INPUT_TYPE_TOUCH,
        3: INPUT_TYPE_PEN,
        4: INPUT_TYPE_MOUSE,
        5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
    };
    
    var POINTER_ELEMENT_EVENTS = 'pointerdown';
    var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';
    
    // IE10 has prefixed support, and case-sensitive
    if (window.MSPointerEvent && !window.PointerEvent) {
        POINTER_ELEMENT_EVENTS = 'MSPointerDown';
        POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
    }
    
    /**
     * Pointer events input
     * @constructor
     * @extends Input
     */
    function PointerEventInput() {
        this.evEl = POINTER_ELEMENT_EVENTS;
        this.evWin = POINTER_WINDOW_EVENTS;
    
        Input.apply(this, arguments);
    
        this.store = (this.manager.session.pointerEvents = []);
    }
    
    inherit(PointerEventInput, Input, {
        /**
         * handle mouse events
         * @param {Object} ev
         */
        handler: function PEhandler(ev) {
            var store = this.store;
            var removePointer = false;
    
            var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
            var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
            var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;
    
            var isTouch = (pointerType == INPUT_TYPE_TOUCH);
    
            // get index of the event in the store
            var storeIndex = inArray(store, ev.pointerId, 'pointerId');
    
            // start and mouse must be down
            if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
                if (storeIndex < 0) {
                    store.push(ev);
                    storeIndex = store.length - 1;
                }
            } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
                removePointer = true;
            }
    
            // it not found, so the pointer hasn't been down (so it's probably a hover)
            if (storeIndex < 0) {
                return;
            }
    
            // update the event in the store
            store[storeIndex] = ev;
    
            this.callback(this.manager, eventType, {
                pointers: store,
                changedPointers: [ev],
                pointerType: pointerType,
                srcEvent: ev
            });
    
            if (removePointer) {
                // remove from the store
                store.splice(storeIndex, 1);
            }
        }
    });
    
    var SINGLE_TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };
    
    var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
    var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';
    
    /**
     * Touch events input
     * @constructor
     * @extends Input
     */
    function SingleTouchInput() {
        this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
        this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
        this.started = false;
    
        Input.apply(this, arguments);
    }
    
    inherit(SingleTouchInput, Input, {
        handler: function TEhandler(ev) {
            var type = SINGLE_TOUCH_INPUT_MAP[ev.type];
    
            // should we handle the touch events?
            if (type === INPUT_START) {
                this.started = true;
            }
    
            if (!this.started) {
                return;
            }
    
            var touches = normalizeSingleTouches.call(this, ev, type);
    
            // when done, reset the started state
            if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
                this.started = false;
            }
    
            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });
    
    /**
     * @this {TouchInput}
     * @param {Object} ev
     * @param {Number} type flag
     * @returns {undefined|Array} [all, changed]
     */
    function normalizeSingleTouches(ev, type) {
        var all = toArray(ev.touches);
        var changed = toArray(ev.changedTouches);
    
        if (type & (INPUT_END | INPUT_CANCEL)) {
            all = uniqueArray(all.concat(changed), 'identifier', true);
        }
    
        return [all, changed];
    }
    
    var TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
    };
    
    var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';
    
    /**
     * Multi-user touch events input
     * @constructor
     * @extends Input
     */
    function TouchInput() {
        this.evTarget = TOUCH_TARGET_EVENTS;
        this.targetIds = {};
    
        Input.apply(this, arguments);
    }
    
    inherit(TouchInput, Input, {
        handler: function MTEhandler(ev) {
            var type = TOUCH_INPUT_MAP[ev.type];
            var touches = getTouches.call(this, ev, type);
            if (!touches) {
                return;
            }
    
            this.callback(this.manager, type, {
                pointers: touches[0],
                changedPointers: touches[1],
                pointerType: INPUT_TYPE_TOUCH,
                srcEvent: ev
            });
        }
    });
    
    /**
     * @this {TouchInput}
     * @param {Object} ev
     * @param {Number} type flag
     * @returns {undefined|Array} [all, changed]
     */
    function getTouches(ev, type) {
        var allTouches = toArray(ev.touches);
        var targetIds = this.targetIds;
    
        // when there is only one touch, the process can be simplified
        if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
            targetIds[allTouches[0].identifier] = true;
            return [allTouches, allTouches];
        }
    
        var i,
            targetTouches,
            changedTouches = toArray(ev.changedTouches),
            changedTargetTouches = [],
            target = this.target;
    
        // get target touches from touches
        targetTouches = allTouches.filter(function(touch) {
            return hasParent(touch.target, target);
        });
    
        // collect touches
        if (type === INPUT_START) {
            i = 0;
            while (i < targetTouches.length) {
                targetIds[targetTouches[i].identifier] = true;
                i++;
            }
        }
    
        // filter changed touches to only contain touches that exist in the collected target ids
        i = 0;
        while (i < changedTouches.length) {
            if (targetIds[changedTouches[i].identifier]) {
                changedTargetTouches.push(changedTouches[i]);
            }
    
            // cleanup removed touches
            if (type & (INPUT_END | INPUT_CANCEL)) {
                delete targetIds[changedTouches[i].identifier];
            }
            i++;
        }
    
        if (!changedTargetTouches.length) {
            return;
        }
    
        return [
            // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
            uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
            changedTargetTouches
        ];
    }
    
    /**
     * Combined touch and mouse input
     *
     * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
     * This because touch devices also emit mouse events while doing a touch.
     *
     * @constructor
     * @extends Input
     */
    
    var DEDUP_TIMEOUT = 2500;
    var DEDUP_DISTANCE = 25;
    
    function TouchMouseInput() {
        Input.apply(this, arguments);
    
        var handler = bindFn(this.handler, this);
        this.touch = new TouchInput(this.manager, handler);
        this.mouse = new MouseInput(this.manager, handler);
    
        this.primaryTouch = null;
        this.lastTouches = [];
    }
    
    inherit(TouchMouseInput, Input, {
        /**
         * handle mouse and touch events
         * @param {Hammer} manager
         * @param {String} inputEvent
         * @param {Object} inputData
         */
        handler: function TMEhandler(manager, inputEvent, inputData) {
            var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
                isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);
    
            if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
                return;
            }
    
            // when we're in a touch event, record touches to  de-dupe synthetic mouse event
            if (isTouch) {
                recordTouches.call(this, inputEvent, inputData);
            } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
                return;
            }
    
            this.callback(manager, inputEvent, inputData);
        },
    
        /**
         * remove the event listeners
         */
        destroy: function destroy() {
            this.touch.destroy();
            this.mouse.destroy();
        }
    });
    
    function recordTouches(eventType, eventData) {
        if (eventType & INPUT_START) {
            this.primaryTouch = eventData.changedPointers[0].identifier;
            setLastTouch.call(this, eventData);
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            setLastTouch.call(this, eventData);
        }
    }
    
    function setLastTouch(eventData) {
        var touch = eventData.changedPointers[0];
    
        if (touch.identifier === this.primaryTouch) {
            var lastTouch = {x: touch.clientX, y: touch.clientY};
            this.lastTouches.push(lastTouch);
            var lts = this.lastTouches;
            var removeLastTouch = function() {
                var i = lts.indexOf(lastTouch);
                if (i > -1) {
                    lts.splice(i, 1);
                }
            };
            setTimeout(removeLastTouch, DEDUP_TIMEOUT);
        }
    }
    
    function isSyntheticEvent(eventData) {
        var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
        for (var i = 0; i < this.lastTouches.length; i++) {
            var t = this.lastTouches[i];
            var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
            if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
                return true;
            }
        }
        return false;
    }
    
    var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
    var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;
    
    // magical touchAction value
    var TOUCH_ACTION_COMPUTE = 'compute';
    var TOUCH_ACTION_AUTO = 'auto';
    var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
    var TOUCH_ACTION_NONE = 'none';
    var TOUCH_ACTION_PAN_X = 'pan-x';
    var TOUCH_ACTION_PAN_Y = 'pan-y';
    var TOUCH_ACTION_MAP = getTouchActionProps();
    
    /**
     * Touch Action
     * sets the touchAction property or uses the js alternative
     * @param {Manager} manager
     * @param {String} value
     * @constructor
     */
    function TouchAction(manager, value) {
        this.manager = manager;
        this.set(value);
    }
    
    TouchAction.prototype = {
        /**
         * set the touchAction value on the element or enable the polyfill
         * @param {String} value
         */
        set: function(value) {
            // find out the touch-action by the event handlers
            if (value == TOUCH_ACTION_COMPUTE) {
                value = this.compute();
            }
    
            if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
                this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
            }
            this.actions = value.toLowerCase().trim();
        },
    
        /**
         * just re-set the touchAction value
         */
        update: function() {
            this.set(this.manager.options.touchAction);
        },
    
        /**
         * compute the value for the touchAction property based on the recognizer's settings
         * @returns {String} value
         */
        compute: function() {
            var actions = [];
            each(this.manager.recognizers, function(recognizer) {
                if (boolOrFn(recognizer.options.enable, [recognizer])) {
                    actions = actions.concat(recognizer.getTouchAction());
                }
            });
            return cleanTouchActions(actions.join(' '));
        },
    
        /**
         * this method is called on each input cycle and provides the preventing of the browser behavior
         * @param {Object} input
         */
        preventDefaults: function(input) {
            var srcEvent = input.srcEvent;
            var direction = input.offsetDirection;
    
            // if the touch action did prevented once this session
            if (this.manager.session.prevented) {
                srcEvent.preventDefault();
                return;
            }
    
            var actions = this.actions;
            var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
            var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
            var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];
    
            if (hasNone) {
                //do not prevent defaults if this is a tap gesture
    
                var isTapPointer = input.pointers.length === 1;
                var isTapMovement = input.distance < 2;
                var isTapTouchTime = input.deltaTime < 250;
    
                if (isTapPointer && isTapMovement && isTapTouchTime) {
                    return;
                }
            }
    
            if (hasPanX && hasPanY) {
                // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
                return;
            }
    
            if (hasNone ||
                (hasPanY && direction & DIRECTION_HORIZONTAL) ||
                (hasPanX && direction & DIRECTION_VERTICAL)) {
                return this.preventSrc(srcEvent);
            }
        },
    
        /**
         * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
         * @param {Object} srcEvent
         */
        preventSrc: function(srcEvent) {
            this.manager.session.prevented = true;
            srcEvent.preventDefault();
        }
    };
    
    /**
     * when the touchActions are collected they are not a valid value, so we need to clean things up. *
     * @param {String} actions
     * @returns {*}
     */
    function cleanTouchActions(actions) {
        // none
        if (inStr(actions, TOUCH_ACTION_NONE)) {
            return TOUCH_ACTION_NONE;
        }
    
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
    
        // if both pan-x and pan-y are set (different recognizers
        // for different directions, e.g. horizontal pan but vertical swipe?)
        // we need none (as otherwise with pan-x pan-y combined none of these
        // recognizers will work, since the browser would handle all panning
        if (hasPanX && hasPanY) {
            return TOUCH_ACTION_NONE;
        }
    
        // pan-x OR pan-y
        if (hasPanX || hasPanY) {
            return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
        }
    
        // manipulation
        if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
            return TOUCH_ACTION_MANIPULATION;
        }
    
        return TOUCH_ACTION_AUTO;
    }
    
    function getTouchActionProps() {
        if (!NATIVE_TOUCH_ACTION) {
            return false;
        }
        var touchMap = {};
        var cssSupports = window.CSS && window.CSS.supports;
        ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {
    
            // If css.supports is not supported but there is native touch-action assume it supports
            // all values. This is the case for IE 10 and 11.
            touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
        });
        return touchMap;
    }
    
    /**
     * Recognizer flow explained; *
     * All recognizers have the initial state of POSSIBLE when a input session starts.
     * The definition of a input session is from the first input until the last input, with all it's movement in it. *
     * Example session for mouse-input: mousedown -> mousemove -> mouseup
     *
     * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
     * which determines with state it should be.
     *
     * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
     * POSSIBLE to give it another change on the next cycle.
     *
     *               Possible
     *                  |
     *            +-----+---------------+
     *            |                     |
     *      +-----+-----+               |
     *      |           |               |
     *   Failed      Cancelled          |
     *                          +-------+------+
     *                          |              |
     *                      Recognized       Began
     *                                         |
     *                                      Changed
     *                                         |
     *                                  Ended/Recognized
     */
    var STATE_POSSIBLE = 1;
    var STATE_BEGAN = 2;
    var STATE_CHANGED = 4;
    var STATE_ENDED = 8;
    var STATE_RECOGNIZED = STATE_ENDED;
    var STATE_CANCELLED = 16;
    var STATE_FAILED = 32;
    
    /**
     * Recognizer
     * Every recognizer needs to extend from this class.
     * @constructor
     * @param {Object} options
     */
    function Recognizer(options) {
        this.options = assign({}, this.defaults, options || {});
    
        this.id = uniqueId();
    
        this.manager = null;
    
        // default is enable true
        this.options.enable = ifUndefined(this.options.enable, true);
    
        this.state = STATE_POSSIBLE;
    
        this.simultaneous = {};
        this.requireFail = [];
    }
    
    Recognizer.prototype = {
        /**
         * @virtual
         * @type {Object}
         */
        defaults: {},
    
        /**
         * set options
         * @param {Object} options
         * @return {Recognizer}
         */
        set: function(options) {
            assign(this.options, options);
    
            // also update the touchAction, in case something changed about the directions/enabled state
            this.manager && this.manager.touchAction.update();
            return this;
        },
    
        /**
         * recognize simultaneous with an other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        recognizeWith: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
                return this;
            }
    
            var simultaneous = this.simultaneous;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (!simultaneous[otherRecognizer.id]) {
                simultaneous[otherRecognizer.id] = otherRecognizer;
                otherRecognizer.recognizeWith(this);
            }
            return this;
        },
    
        /**
         * drop the simultaneous link. it doesnt remove the link on the other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        dropRecognizeWith: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
                return this;
            }
    
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            delete this.simultaneous[otherRecognizer.id];
            return this;
        },
    
        /**
         * recognizer can only run when an other is failing
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        requireFailure: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
                return this;
            }
    
            var requireFail = this.requireFail;
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            if (inArray(requireFail, otherRecognizer) === -1) {
                requireFail.push(otherRecognizer);
                otherRecognizer.requireFailure(this);
            }
            return this;
        },
    
        /**
         * drop the requireFailure link. it does not remove the link on the other recognizer.
         * @param {Recognizer} otherRecognizer
         * @returns {Recognizer} this
         */
        dropRequireFailure: function(otherRecognizer) {
            if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
                return this;
            }
    
            otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
            var index = inArray(this.requireFail, otherRecognizer);
            if (index > -1) {
                this.requireFail.splice(index, 1);
            }
            return this;
        },
    
        /**
         * has require failures boolean
         * @returns {boolean}
         */
        hasRequireFailures: function() {
            return this.requireFail.length > 0;
        },
    
        /**
         * if the recognizer can recognize simultaneous with an other recognizer
         * @param {Recognizer} otherRecognizer
         * @returns {Boolean}
         */
        canRecognizeWith: function(otherRecognizer) {
            return !!this.simultaneous[otherRecognizer.id];
        },
    
        /**
         * You should use `tryEmit` instead of `emit` directly to check
         * that all the needed recognizers has failed before emitting.
         * @param {Object} input
         */
        emit: function(input) {
            var self = this;
            var state = this.state;
    
            function emit(event) {
                self.manager.emit(event, input);
            }
    
            // 'panstart' and 'panmove'
            if (state < STATE_ENDED) {
                emit(self.options.event + stateStr(state));
            }
    
            emit(self.options.event); // simple 'eventName' events
    
            if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
                emit(input.additionalEvent);
            }
    
            // panend and pancancel
            if (state >= STATE_ENDED) {
                emit(self.options.event + stateStr(state));
            }
        },
    
        /**
         * Check that all the require failure recognizers has failed,
         * if true, it emits a gesture event,
         * otherwise, setup the state to FAILED.
         * @param {Object} input
         */
        tryEmit: function(input) {
            if (this.canEmit()) {
                return this.emit(input);
            }
            // it's failing anyway
            this.state = STATE_FAILED;
        },
    
        /**
         * can we emit?
         * @returns {boolean}
         */
        canEmit: function() {
            var i = 0;
            while (i < this.requireFail.length) {
                if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                    return false;
                }
                i++;
            }
            return true;
        },
    
        /**
         * update the recognizer
         * @param {Object} inputData
         */
        recognize: function(inputData) {
            // make a new copy of the inputData
            // so we can change the inputData without messing up the other recognizers
            var inputDataClone = assign({}, inputData);
    
            // is is enabled and allow recognizing?
            if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
                this.reset();
                this.state = STATE_FAILED;
                return;
            }
    
            // reset when we've reached the end
            if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
                this.state = STATE_POSSIBLE;
            }
    
            this.state = this.process(inputDataClone);
    
            // the recognizer has recognized a gesture
            // so trigger an event
            if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
                this.tryEmit(inputDataClone);
            }
        },
    
        /**
         * return the state of the recognizer
         * the actual recognizing happens in this method
         * @virtual
         * @param {Object} inputData
         * @returns {Const} STATE
         */
        process: function(inputData) { }, // jshint ignore:line
    
        /**
         * return the preferred touch-action
         * @virtual
         * @returns {Array}
         */
        getTouchAction: function() { },
    
        /**
         * called when the gesture isn't allowed to recognize
         * like when another is being recognized or it is disabled
         * @virtual
         */
        reset: function() { }
    };
    
    /**
     * get a usable string, used as event postfix
     * @param {Const} state
     * @returns {String} state
     */
    function stateStr(state) {
        if (state & STATE_CANCELLED) {
            return 'cancel';
        } else if (state & STATE_ENDED) {
            return 'end';
        } else if (state & STATE_CHANGED) {
            return 'move';
        } else if (state & STATE_BEGAN) {
            return 'start';
        }
        return '';
    }
    
    /**
     * direction cons to string
     * @param {Const} direction
     * @returns {String}
     */
    function directionStr(direction) {
        if (direction == DIRECTION_DOWN) {
            return 'down';
        } else if (direction == DIRECTION_UP) {
            return 'up';
        } else if (direction == DIRECTION_LEFT) {
            return 'left';
        } else if (direction == DIRECTION_RIGHT) {
            return 'right';
        }
        return '';
    }
    
    /**
     * get a recognizer by name if it is bound to a manager
     * @param {Recognizer|String} otherRecognizer
     * @param {Recognizer} recognizer
     * @returns {Recognizer}
     */
    function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
        var manager = recognizer.manager;
        if (manager) {
            return manager.get(otherRecognizer);
        }
        return otherRecognizer;
    }
    
    /**
     * This recognizer is just used as a base for the simple attribute recognizers.
     * @constructor
     * @extends Recognizer
     */
    function AttrRecognizer() {
        Recognizer.apply(this, arguments);
    }
    
    inherit(AttrRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof AttrRecognizer
         */
        defaults: {
            /**
             * @type {Number}
             * @default 1
             */
            pointers: 1
        },
    
        /**
         * Used to check if it the recognizer receives valid input, like input.distance > 10.
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {Boolean} recognized
         */
        attrTest: function(input) {
            var optionPointers = this.options.pointers;
            return optionPointers === 0 || input.pointers.length === optionPointers;
        },
    
        /**
         * Process the input and return the state for the recognizer
         * @memberof AttrRecognizer
         * @param {Object} input
         * @returns {*} State
         */
        process: function(input) {
            var state = this.state;
            var eventType = input.eventType;
    
            var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
            var isValid = this.attrTest(input);
    
            // on cancel input and we've recognized before, return STATE_CANCELLED
            if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
                return state | STATE_CANCELLED;
            } else if (isRecognized || isValid) {
                if (eventType & INPUT_END) {
                    return state | STATE_ENDED;
                } else if (!(state & STATE_BEGAN)) {
                    return STATE_BEGAN;
                }
                return state | STATE_CHANGED;
            }
            return STATE_FAILED;
        }
    });
    
    /**
     * Pan
     * Recognized when the pointer is down and moved in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function PanRecognizer() {
        AttrRecognizer.apply(this, arguments);
    
        this.pX = null;
        this.pY = null;
    }
    
    inherit(PanRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof PanRecognizer
         */
        defaults: {
            event: 'pan',
            threshold: 10,
            pointers: 1,
            direction: DIRECTION_ALL
        },
    
        getTouchAction: function() {
            var direction = this.options.direction;
            var actions = [];
            if (direction & DIRECTION_HORIZONTAL) {
                actions.push(TOUCH_ACTION_PAN_Y);
            }
            if (direction & DIRECTION_VERTICAL) {
                actions.push(TOUCH_ACTION_PAN_X);
            }
            return actions;
        },
    
        directionTest: function(input) {
            var options = this.options;
            var hasMoved = true;
            var distance = input.distance;
            var direction = input.direction;
            var x = input.deltaX;
            var y = input.deltaY;
    
            // lock to axis?
            if (!(direction & options.direction)) {
                if (options.direction & DIRECTION_HORIZONTAL) {
                    direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                    hasMoved = x != this.pX;
                    distance = Math.abs(input.deltaX);
                } else {
                    direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                    hasMoved = y != this.pY;
                    distance = Math.abs(input.deltaY);
                }
            }
            input.direction = direction;
            return hasMoved && distance > options.threshold && direction & options.direction;
        },
    
        attrTest: function(input) {
            return AttrRecognizer.prototype.attrTest.call(this, input) &&
                (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
        },
    
        emit: function(input) {
    
            this.pX = input.deltaX;
            this.pY = input.deltaY;
    
            var direction = directionStr(input.direction);
    
            if (direction) {
                input.additionalEvent = this.options.event + direction;
            }
            this._super.emit.call(this, input);
        }
    });
    
    /**
     * Pinch
     * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
     * @constructor
     * @extends AttrRecognizer
     */
    function PinchRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    
    inherit(PinchRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof PinchRecognizer
         */
        defaults: {
            event: 'pinch',
            threshold: 0,
            pointers: 2
        },
    
        getTouchAction: function() {
            return [TOUCH_ACTION_NONE];
        },
    
        attrTest: function(input) {
            return this._super.attrTest.call(this, input) &&
                (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
        },
    
        emit: function(input) {
            if (input.scale !== 1) {
                var inOut = input.scale < 1 ? 'in' : 'out';
                input.additionalEvent = this.options.event + inOut;
            }
            this._super.emit.call(this, input);
        }
    });
    
    /**
     * Press
     * Recognized when the pointer is down for x ms without any movement.
     * @constructor
     * @extends Recognizer
     */
    function PressRecognizer() {
        Recognizer.apply(this, arguments);
    
        this._timer = null;
        this._input = null;
    }
    
    inherit(PressRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof PressRecognizer
         */
        defaults: {
            event: 'press',
            pointers: 1,
            time: 251, // minimal time of the pointer to be pressed
            threshold: 9 // a minimal movement is ok, but keep it low
        },
    
        getTouchAction: function() {
            return [TOUCH_ACTION_AUTO];
        },
    
        process: function(input) {
            var options = this.options;
            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTime = input.deltaTime > options.time;
    
            this._input = input;
    
            // we only allow little movement
            // and we've reached an end event, so a tap is possible
            if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
                this.reset();
            } else if (input.eventType & INPUT_START) {
                this.reset();
                this._timer = setTimeoutContext(function() {
                    this.state = STATE_RECOGNIZED;
                    this.tryEmit();
                }, options.time, this);
            } else if (input.eventType & INPUT_END) {
                return STATE_RECOGNIZED;
            }
            return STATE_FAILED;
        },
    
        reset: function() {
            clearTimeout(this._timer);
        },
    
        emit: function(input) {
            if (this.state !== STATE_RECOGNIZED) {
                return;
            }
    
            if (input && (input.eventType & INPUT_END)) {
                this.manager.emit(this.options.event + 'up', input);
            } else {
                this._input.timeStamp = now();
                this.manager.emit(this.options.event, this._input);
            }
        }
    });
    
    /**
     * Rotate
     * Recognized when two or more pointer are moving in a circular motion.
     * @constructor
     * @extends AttrRecognizer
     */
    function RotateRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    
    inherit(RotateRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof RotateRecognizer
         */
        defaults: {
            event: 'rotate',
            threshold: 0,
            pointers: 2
        },
    
        getTouchAction: function() {
            return [TOUCH_ACTION_NONE];
        },
    
        attrTest: function(input) {
            return this._super.attrTest.call(this, input) &&
                (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
        }
    });
    
    /**
     * Swipe
     * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
     * @constructor
     * @extends AttrRecognizer
     */
    function SwipeRecognizer() {
        AttrRecognizer.apply(this, arguments);
    }
    
    inherit(SwipeRecognizer, AttrRecognizer, {
        /**
         * @namespace
         * @memberof SwipeRecognizer
         */
        defaults: {
            event: 'swipe',
            threshold: 10,
            velocity: 0.3,
            direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
            pointers: 1
        },
    
        getTouchAction: function() {
            return PanRecognizer.prototype.getTouchAction.call(this);
        },
    
        attrTest: function(input) {
            var direction = this.options.direction;
            var velocity;
    
            if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
                velocity = input.overallVelocity;
            } else if (direction & DIRECTION_HORIZONTAL) {
                velocity = input.overallVelocityX;
            } else if (direction & DIRECTION_VERTICAL) {
                velocity = input.overallVelocityY;
            }
    
            return this._super.attrTest.call(this, input) &&
                direction & input.offsetDirection &&
                input.distance > this.options.threshold &&
                input.maxPointers == this.options.pointers &&
                abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
        },
    
        emit: function(input) {
            var direction = directionStr(input.offsetDirection);
            if (direction) {
                this.manager.emit(this.options.event + direction, input);
            }
    
            this.manager.emit(this.options.event, input);
        }
    });
    
    /**
     * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
     * between the given interval and position. The delay option can be used to recognize multi-taps without firing
     * a single tap.
     *
     * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
     * multi-taps being recognized.
     * @constructor
     * @extends Recognizer
     */
    function TapRecognizer() {
        Recognizer.apply(this, arguments);
    
        // previous time and center,
        // used for tap counting
        this.pTime = false;
        this.pCenter = false;
    
        this._timer = null;
        this._input = null;
        this.count = 0;
    }
    
    inherit(TapRecognizer, Recognizer, {
        /**
         * @namespace
         * @memberof PinchRecognizer
         */
        defaults: {
            event: 'tap',
            pointers: 1,
            taps: 1,
            interval: 300, // max time between the multi-tap taps
            time: 250, // max time of the pointer to be down (like finger on the screen)
            threshold: 9, // a minimal movement is ok, but keep it low
            posThreshold: 10 // a multi-tap can be a bit off the initial position
        },
    
        getTouchAction: function() {
            return [TOUCH_ACTION_MANIPULATION];
        },
    
        process: function(input) {
            var options = this.options;
    
            var validPointers = input.pointers.length === options.pointers;
            var validMovement = input.distance < options.threshold;
            var validTouchTime = input.deltaTime < options.time;
    
            this.reset();
    
            if ((input.eventType & INPUT_START) && (this.count === 0)) {
                return this.failTimeout();
            }
    
            // we only allow little movement
            // and we've reached an end event, so a tap is possible
            if (validMovement && validTouchTime && validPointers) {
                if (input.eventType != INPUT_END) {
                    return this.failTimeout();
                }
    
                var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
                var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;
    
                this.pTime = input.timeStamp;
                this.pCenter = input.center;
    
                if (!validMultiTap || !validInterval) {
                    this.count = 1;
                } else {
                    this.count += 1;
                }
    
                this._input = input;
    
                // if tap count matches we have recognized it,
                // else it has began recognizing...
                var tapCount = this.count % options.taps;
                if (tapCount === 0) {
                    // no failing requirements, immediately trigger the tap event
                    // or wait as long as the multitap interval to trigger
                    if (!this.hasRequireFailures()) {
                        return STATE_RECOGNIZED;
                    } else {
                        this._timer = setTimeoutContext(function() {
                            this.state = STATE_RECOGNIZED;
                            this.tryEmit();
                        }, options.interval, this);
                        return STATE_BEGAN;
                    }
                }
            }
            return STATE_FAILED;
        },
    
        failTimeout: function() {
            this._timer = setTimeoutContext(function() {
                this.state = STATE_FAILED;
            }, this.options.interval, this);
            return STATE_FAILED;
        },
    
        reset: function() {
            clearTimeout(this._timer);
        },
    
        emit: function() {
            if (this.state == STATE_RECOGNIZED) {
                this._input.tapCount = this.count;
                this.manager.emit(this.options.event, this._input);
            }
        }
    });
    
    /**
     * Simple way to create a manager with a default set of recognizers.
     * @param {HTMLElement} element
     * @param {Object} [options]
     * @constructor
     */
    function Hammer(element, options) {
        options = options || {};
        options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
        return new Manager(element, options);
    }
    
    /**
     * @const {string}
     */
    Hammer.VERSION = '2.0.7';
    
    /**
     * default settings
     * @namespace
     */
    Hammer.defaults = {
        /**
         * set if DOM events are being triggered.
         * But this is slower and unused by simple implementations, so disabled by default.
         * @type {Boolean}
         * @default false
         */
        domEvents: false,
    
        /**
         * The value for the touchAction property/fallback.
         * When set to `compute` it will magically set the correct value based on the added recognizers.
         * @type {String}
         * @default compute
         */
        touchAction: TOUCH_ACTION_COMPUTE,
    
        /**
         * @type {Boolean}
         * @default true
         */
        enable: true,
    
        /**
         * EXPERIMENTAL FEATURE -- can be removed/changed
         * Change the parent input target element.
         * If Null, then it is being set the to main element.
         * @type {Null|EventTarget}
         * @default null
         */
        inputTarget: null,
    
        /**
         * force an input class
         * @type {Null|Function}
         * @default null
         */
        inputClass: null,
    
        /**
         * Default recognizer setup when calling `Hammer()`
         * When creating a new Manager these will be skipped.
         * @type {Array}
         */
        preset: [
            // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
            [RotateRecognizer, {enable: false}],
            [PinchRecognizer, {enable: false}, ['rotate']],
            [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
            [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
            [TapRecognizer],
            [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
            [PressRecognizer]
        ],
    
        /**
         * Some CSS properties can be used to improve the working of Hammer.
         * Add them to this method and they will be set when creating a new Manager.
         * @namespace
         */
        cssProps: {
            /**
             * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userSelect: 'none',
    
            /**
             * Disable the Windows Phone grippers when pressing an element.
             * @type {String}
             * @default 'none'
             */
            touchSelect: 'none',
    
            /**
             * Disables the default callout shown when you touch and hold a touch target.
             * On iOS, when you touch and hold a touch target such as a link, Safari displays
             * a callout containing information about the link. This property allows you to disable that callout.
             * @type {String}
             * @default 'none'
             */
            touchCallout: 'none',
    
            /**
             * Specifies whether zooming is enabled. Used by IE10>
             * @type {String}
             * @default 'none'
             */
            contentZooming: 'none',
    
            /**
             * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
             * @type {String}
             * @default 'none'
             */
            userDrag: 'none',
    
            /**
             * Overrides the highlight color shown when the user taps a link or a JavaScript
             * clickable element in iOS. This property obeys the alpha value, if specified.
             * @type {String}
             * @default 'rgba(0,0,0,0)'
             */
            tapHighlightColor: 'rgba(0,0,0,0)'
        }
    };
    
    var STOP = 1;
    var FORCED_STOP = 2;
    
    /**
     * Manager
     * @param {HTMLElement} element
     * @param {Object} [options]
     * @constructor
     */
    function Manager(element, options) {
        this.options = assign({}, Hammer.defaults, options || {});
    
        this.options.inputTarget = this.options.inputTarget || element;
    
        this.handlers = {};
        this.session = {};
        this.recognizers = [];
        this.oldCssProps = {};
    
        this.element = element;
        this.input = createInputInstance(this);
        this.touchAction = new TouchAction(this, this.options.touchAction);
    
        toggleCssProps(this, true);
    
        each(this.options.recognizers, function(item) {
            var recognizer = this.add(new (item[0])(item[1]));
            item[2] && recognizer.recognizeWith(item[2]);
            item[3] && recognizer.requireFailure(item[3]);
        }, this);
    }
    
    Manager.prototype = {
        /**
         * set options
         * @param {Object} options
         * @returns {Manager}
         */
        set: function(options) {
            assign(this.options, options);
    
            // Options that need a little more setup
            if (options.touchAction) {
                this.touchAction.update();
            }
            if (options.inputTarget) {
                // Clean up existing event listeners and reinitialize
                this.input.destroy();
                this.input.target = options.inputTarget;
                this.input.init();
            }
            return this;
        },
    
        /**
         * stop recognizing for this session.
         * This session will be discarded, when a new [input]start event is fired.
         * When forced, the recognizer cycle is stopped immediately.
         * @param {Boolean} [force]
         */
        stop: function(force) {
            this.session.stopped = force ? FORCED_STOP : STOP;
        },
    
        /**
         * run the recognizers!
         * called by the inputHandler function on every movement of the pointers (touches)
         * it walks through all the recognizers and tries to detect the gesture that is being made
         * @param {Object} inputData
         */
        recognize: function(inputData) {
            var session = this.session;
            if (session.stopped) {
                return;
            }
    
            // run the touch-action polyfill
            this.touchAction.preventDefaults(inputData);
    
            var recognizer;
            var recognizers = this.recognizers;
    
            // this holds the recognizer that is being recognized.
            // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
            // if no recognizer is detecting a thing, it is set to `null`
            var curRecognizer = session.curRecognizer;
    
            // reset when the last recognizer is recognized
            // or when we're in a new session
            if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
                curRecognizer = session.curRecognizer = null;
            }
    
            var i = 0;
            while (i < recognizers.length) {
                recognizer = recognizers[i];
    
                // find out if we are allowed try to recognize the input for this one.
                // 1.   allow if the session is NOT forced stopped (see the .stop() method)
                // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
                //      that is being recognized.
                // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
                //      this can be setup with the `recognizeWith()` method on the recognizer.
                if (session.stopped !== FORCED_STOP && ( // 1
                        !curRecognizer || recognizer == curRecognizer || // 2
                        recognizer.canRecognizeWith(curRecognizer))) { // 3
                    recognizer.recognize(inputData);
                } else {
                    recognizer.reset();
                }
    
                // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
                // current active recognizer. but only if we don't already have an active recognizer
                if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                    curRecognizer = session.curRecognizer = recognizer;
                }
                i++;
            }
        },
    
        /**
         * get a recognizer by its event name.
         * @param {Recognizer|String} recognizer
         * @returns {Recognizer|Null}
         */
        get: function(recognizer) {
            if (recognizer instanceof Recognizer) {
                return recognizer;
            }
    
            var recognizers = this.recognizers;
            for (var i = 0; i < recognizers.length; i++) {
                if (recognizers[i].options.event == recognizer) {
                    return recognizers[i];
                }
            }
            return null;
        },
    
        /**
         * add a recognizer to the manager
         * existing recognizers with the same event name will be removed
         * @param {Recognizer} recognizer
         * @returns {Recognizer|Manager}
         */
        add: function(recognizer) {
            if (invokeArrayArg(recognizer, 'add', this)) {
                return this;
            }
    
            // remove existing
            var existing = this.get(recognizer.options.event);
            if (existing) {
                this.remove(existing);
            }
    
            this.recognizers.push(recognizer);
            recognizer.manager = this;
    
            this.touchAction.update();
            return recognizer;
        },
    
        /**
         * remove a recognizer by name or instance
         * @param {Recognizer|String} recognizer
         * @returns {Manager}
         */
        remove: function(recognizer) {
            if (invokeArrayArg(recognizer, 'remove', this)) {
                return this;
            }
    
            recognizer = this.get(recognizer);
    
            // let's make sure this recognizer exists
            if (recognizer) {
                var recognizers = this.recognizers;
                var index = inArray(recognizers, recognizer);
    
                if (index !== -1) {
                    recognizers.splice(index, 1);
                    this.touchAction.update();
                }
            }
    
            return this;
        },
    
        /**
         * bind event
         * @param {String} events
         * @param {Function} handler
         * @returns {EventEmitter} this
         */
        on: function(events, handler) {
            if (events === undefined) {
                return;
            }
            if (handler === undefined) {
                return;
            }
    
            var handlers = this.handlers;
            each(splitStr(events), function(event) {
                handlers[event] = handlers[event] || [];
                handlers[event].push(handler);
            });
            return this;
        },
    
        /**
         * unbind event, leave emit blank to remove all handlers
         * @param {String} events
         * @param {Function} [handler]
         * @returns {EventEmitter} this
         */
        off: function(events, handler) {
            if (events === undefined) {
                return;
            }
    
            var handlers = this.handlers;
            each(splitStr(events), function(event) {
                if (!handler) {
                    delete handlers[event];
                } else {
                    handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
                }
            });
            return this;
        },
    
        /**
         * emit event to the listeners
         * @param {String} event
         * @param {Object} data
         */
        emit: function(event, data) {
            // we also want to trigger dom events
            if (this.options.domEvents) {
                triggerDomEvent(event, data);
            }
    
            // no handlers, so skip it all
            var handlers = this.handlers[event] && this.handlers[event].slice();
            if (!handlers || !handlers.length) {
                return;
            }
    
            data.type = event;
            data.preventDefault = function() {
                data.srcEvent.preventDefault();
            };
    
            var i = 0;
            while (i < handlers.length) {
                handlers[i](data);
                i++;
            }
        },
    
        /**
         * destroy the manager and unbinds all events
         * it doesn't unbind dom events, that is the user own responsibility
         */
        destroy: function() {
            this.element && toggleCssProps(this, false);
    
            this.handlers = {};
            this.session = {};
            this.input.destroy();
            this.element = null;
        }
    };
    
    /**
     * add/remove the css properties as defined in manager.options.cssProps
     * @param {Manager} manager
     * @param {Boolean} add
     */
    function toggleCssProps(manager, add) {
        var element = manager.element;
        if (!element.style) {
            return;
        }
        var prop;
        each(manager.options.cssProps, function(value, name) {
            prop = prefixed(element.style, name);
            if (add) {
                manager.oldCssProps[prop] = element.style[prop];
                element.style[prop] = value;
            } else {
                element.style[prop] = manager.oldCssProps[prop] || '';
            }
        });
        if (!add) {
            manager.oldCssProps = {};
        }
    }
    
    /**
     * trigger dom event
     * @param {String} event
     * @param {Object} data
     */
    function triggerDomEvent(event, data) {
        var gestureEvent = document.createEvent('Event');
        gestureEvent.initEvent(event, true, true);
        gestureEvent.gesture = data;
        data.target.dispatchEvent(gestureEvent);
    }
    
    assign(Hammer, {
        INPUT_START: INPUT_START,
        INPUT_MOVE: INPUT_MOVE,
        INPUT_END: INPUT_END,
        INPUT_CANCEL: INPUT_CANCEL,
    
        STATE_POSSIBLE: STATE_POSSIBLE,
        STATE_BEGAN: STATE_BEGAN,
        STATE_CHANGED: STATE_CHANGED,
        STATE_ENDED: STATE_ENDED,
        STATE_RECOGNIZED: STATE_RECOGNIZED,
        STATE_CANCELLED: STATE_CANCELLED,
        STATE_FAILED: STATE_FAILED,
    
        DIRECTION_NONE: DIRECTION_NONE,
        DIRECTION_LEFT: DIRECTION_LEFT,
        DIRECTION_RIGHT: DIRECTION_RIGHT,
        DIRECTION_UP: DIRECTION_UP,
        DIRECTION_DOWN: DIRECTION_DOWN,
        DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
        DIRECTION_VERTICAL: DIRECTION_VERTICAL,
        DIRECTION_ALL: DIRECTION_ALL,
    
        Manager: Manager,
        Input: Input,
        TouchAction: TouchAction,
    
        TouchInput: TouchInput,
        MouseInput: MouseInput,
        PointerEventInput: PointerEventInput,
        TouchMouseInput: TouchMouseInput,
        SingleTouchInput: SingleTouchInput,
    
        Recognizer: Recognizer,
        AttrRecognizer: AttrRecognizer,
        Tap: TapRecognizer,
        Pan: PanRecognizer,
        Swipe: SwipeRecognizer,
        Pinch: PinchRecognizer,
        Rotate: RotateRecognizer,
        Press: PressRecognizer,
    
        on: addEventListeners,
        off: removeEventListeners,
        each: each,
        merge: merge,
        extend: extend,
        assign: assign,
        inherit: inherit,
        bindFn: bindFn,
        prefixed: prefixed
    });
    
    // this prevents errors when Hammer is loaded in the presence of an AMD
    //  style loader but by script tag, not by the loader.
    var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
    freeGlobal.Hammer = Hammer;
    
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Hammer;
        });
    } else if (typeof module != 'undefined' && module.exports) {
        module.exports = Hammer;
    } else {
        window[exportName] = Hammer;
    }
    
    })(window, document, 'Hammer');
    
  provide("hammerjs", module.exports);
}(global));