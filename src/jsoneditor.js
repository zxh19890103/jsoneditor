;(function (global) {
    var jsonViewerUtil = {
        ce: function(tag, attrs, text) {
            var el_ = document.createElement(tag);
            if (attrs) {
                for (var name in attrs) {
                    el_.setAttribute(name, attrs[name]);
                }
            }
            if (text) el_.innerText = text;
            return el_;
        },
        ct: function(text) {
            return document.createTextNode(text);
        },
        ge: function(id) {
            return document.getElementById(id);
        },
        isdate: function(val) {
            return !isNaN((new Date(val)).getDate());
        },
        typeof: function(val) {
            var t_ = typeof val;
            switch (t_) {
                case 'string':
                case 'boolean':
                case 'number':
                    return t_;
                case 'object': {
                    if (val === null) {
                        return 'null';
                    } else if (Array.isArray(val)) {
                        return 'array';
                    } else if (this.isdate(val)) {
                        return 'date';
                    } else {
                        return 'object';
                    }
                }
            }
        },
        // for data
        typeit: function(val, type) {
            switch(type) {
                case 'string': return val;
                case 'number': {
                    var cval = Number(val);
                    return isNaN(cval) ? null : cval;
                }
                case 'boolean': {
                    // just 'true' or '1' is true
                    if (val === 'true' | val === '1') return true;
                    else return false;
                }
                case 'null': return val;
                case 'array': return val.split(',');
                case 'date': return null;
                case 'object': return null;
                default: return null;
            }
        },
        // for edit
        serialize: function(val, type) {
            switch(type) {
                case 'string':
                case 'number':
                case 'boolean':
                case 'null':
                    return val;
                case 'array':
                    return val.join(',');
                case 'date':
                case 'object':
                default:
                    return null;
            }
        },
        // for view
        json: function(val, t) {
            var t_ = t || this.typeof(val);
            switch (t_) {
                case 'string': return '"' + val + '"';
                case 'boolean': return val ? 'true' : 'false';
                case 'number': return val.toString();
                case 'null': {
                    if (val === null) return 'null';
                    return '"' + val + '"';
                }
                case 'array': return JSON.stringify(val);
                case 'date': return new Date(val).toString();
                case 'object': return 'object';
                default: return t_;
            }
        }
    }
    // The proto of JsonLine,JsonKeyLine,JsonBraceLine,JsonPlusLine
    var jsonLineProto = {
        el: null, // abstract, the line element.
        group: null, // abstract, : jsonLineProto
        scope: null, // abstract
        dataType: null, // abstract
        dataKey: null, // abstract
        util: jsonViewerUtil, // static instance
        render: function() { throw 'not implemented.' },
        // .value span click handler.
        onValClick: function(e) {
            var viewer = this.group.viewer;
            viewer.activeline = this;
            viewer.showForm();
        },
        // set value to scope or get value from scope.
        val: function(val) {
            if (val === undefined) {
                var val_ = this.util.serialize(this.scope[this.dataKey], this.dataType);
                return val_;
            }
            if (val == this.val()) return;
            var val_ = this.util.typeit(val, this.dataType);
            if (val_ === null) {
                alert('data type is not right.');
            } else {
                this.scope[this.dataKey] = val_;
                this.view();
            }
        },
        // update dataType
        type: function(t) {
            if (t === this.dataType) return;
            this.dataType = t;
            this.scope[this.dataKey] = this.util.typeit('', this.dataType);
            this.view();
        },
        // refresh dom
        view: function() {
            var span = this.el.querySelector('.value');
            span.innerText = this.util.json(this.scope[this.dataKey], this.dataType);
        },
        remove: function() {
            delete this.scope[this.dataKey];
            this.el.remove();
        },
        init: function(g, k) {
            this.group = g;
            this.scope = g.scope;
            this.dataKey = k;
            this.dataType = this.util.typeof(this.scope[k]);
        }
    }
    function JsonLine(g, k) {
        this.init(g, k);
        this.lineType = 'normal';
        this.render = function(noappend) {
            var key = this.dataKey;
            var val = this.scope[key];
            var div = this.util.ce('div', { 'class': "line line-body indent-" + this.group.indent });
            var textDiv = this.util.ce('div', { 'class': 'line-text' });
            textDiv.appendChild(this.util.ce('span', { 'class': 'key' }, this.util.json(key, 'string')));
            textDiv.appendChild(this.util.ce('span', null, ': '));
            var valSpan = this.util.ce('span', { 'class': 'value ' + this.dataType }, this.util.json(val, this.dataType));
            valSpan.addEventListener('click', this.onValClick.bind(this));
            textDiv.appendChild(valSpan);
            textDiv.appendChild(this.util.ct(','));
            var reA = this.util.ce('a', { 'class': 'times', 'href': 'javascript:void(0);', 'title': '删除' }, 'x');
            reA.addEventListener('click', (function(e) {
                if (confirm('confirm remove this item？')) {
                    this.remove();
                }
            }).bind(this));
            textDiv.appendChild(reA);
            div.appendChild(textDiv);
            if (!noappend) this.group.viewer.jvCon.appendChild(div);
            this.el = div;
            return div;
        }
    }
    JsonLine.prototype = jsonLineProto;
    function JsonKeyLine(g, k) {
        this.init(g, k);
        this.lineType = 'key';
        this.render = function() {
            var key = this.dataKey;
            var div = this.util.ce('div', { 'class': "line line-key indent-" + this.group.indent });
            var textDiv = this.util.ce('div', { 'class': 'line-text' });
            textDiv.appendChild(this.util.ce('span', { 'class': 'key' }, this.util.json(key, 'string')));
            textDiv.appendChild(this.util.ct(': {'));
            div.appendChild(textDiv);
            this.group.viewer.jvCon.appendChild(div);
            this.el = div;
        }
    }
    JsonKeyLine.prototype = jsonLineProto;
    // t: String, brace type. 'start | 'end'
    // r: Boolean, is the root brace. true | false
    function JsonBraceLine(g, m) {
        this.init(g, '');
        this.mode = m;
        this.lineType = 'brace';
        this.render = function() {
            var div = this.util.ce('div', {
                'class': "line line-brace line-brace-" + this.mode + " indent-" + this.group.indent },
                this.mode === 'start' ? '{' : (this.group.isRoot ? '}' : '},')
            );
            this.group.viewer.jvCon.appendChild(div);
            this.el = div;
            return div;
        }
    }
    JsonBraceLine.prototype = jsonLineProto;
    function JsonPlusLine(g) {
        this.init(g);
        this.lineType = 'plus';
        this.dataType = 'string';
        this.dataKey = '';
        this.val = function(val) {
            if (val === undefined) return '';
            // todo: add a normal line
            this.scope[this.dataKey] = this.util.typeit(val, this.dataType);
            var div = (new JsonLine(this.group, this.dataKey)).render(true);
            this.group.viewer.jvCon.insertBefore(div, this.el);
        }
        this.type = function(t) { this.dataType = t; }
        this.key = function(k) { this.dataKey = k; }
        this.render = function() {
            var div = this.util.ce('div', { 'class': 'line line-plus indent-' + this.group.indent }, '+');
            div.addEventListener('click', (function(e) {
                var viewer = this.group.viewer;
                viewer.activeline = this;
                viewer.showForm(true);
            }).bind(this));
            this.group.viewer.jvCon.appendChild(div);
            this.el = div;
        }
    }
    JsonPlusLine.prototype = jsonLineProto;

    // the proto of JsonLineGroup.
    var jsonLineGroupProto = {
        indent: 0, // abstract
        scope: null, // abstract
        isRoot: null, // abstract
        viewer: null, // static
        util: jsonViewerUtil, // static
        render: function() {
            this.isRoot && (new JsonBraceLine(this, 'start', this.isRoot)).render();
            for (var k in this.scope) {
                if (this.util.typeof(this.scope[k]) === 'object') {
                    (new JsonKeyLine(this, k)).render();
                    this.group(k).render();
                } else {
                    (new JsonLine(this, k)).render();
                }
            }
            (new JsonPlusLine(this)).render();
            (new JsonBraceLine(this, 'end', this.isRoot)).render();
        },
        group: function(key) {
            return new JsonLineGroup(this.indent + 2, this.scope[key], false);
        }
    }
    // a group of json lines.
    function JsonLineGroup(indent, scope, isRoot) {
        this.indent = indent;
        this.scope = scope;
        this.isRoot = isRoot;
    }
    JsonLineGroup.prototype = jsonLineGroupProto;

    /**
     * the viewer of json.
     * @param {*} el the element's id where json lines will be inserted.
     * @param {*} form the id of a form which is to add / edit a node.
     * @param {*} data the object.
     */
    function JsonViewer(el, form, data) {
        JsonLineGroup.prototype.viewer = this;
        this.util = jsonViewerUtil;
        this.activeline = null;
        this.activegroup = null;
        this.el = typeof el === 'string' ? this.util.ge(el) : el;
        this.jvCon = this.el.querySelector('.json-view');
        this.editform = this.util.ge(form);
        this.form = this.editform.querySelector('form');
        this.data = data;

        this.showForm = function() {
            this.form.dataKey.value = this.activeline.dataKey;
            if (this.activeline.lineType === 'normal') {
                this.form.dataKey.setAttribute('disabled', true);
            } else {
                this.form.dataKey.removeAttribute('disabled');
            }
            this.form.dataValue.value = this.activeline.val();
            this.form.dataType.value = this.activeline.dataType;
            this.el.classList.add('json-view-blur');
            this.editform.style.display = 'block';
        }
        this.hideForm = function() {
            this.el.classList.remove('json-view-blur');
            this.editform.style.display = 'none';
            this.activeline = null;
        }
        this.editform.addEventListener('click', (function(e) {
            if (e.target === e.currentTarget) {
                this.hideForm();
            }
        }).bind(this));
        this.form.addEventListener('submit', (function(e) {
            e.preventDefault();
            if (this.activeline.lineType === 'plus') {
                var key = this.form.dataKey.value;
                if (!key) {
                    alert('请输入键名');
                    return false;
                } else {
                    if (this.activeline.scope[key] !== undefined) {
                        alert('键名已存在');
                        return false;
                    }
                    this.activeline.key(key);
                }
            }
            this.activeline.type(this.form.dataType.value);
            this.activeline.val(this.form.dataValue.value);
            this.hideForm();
            return false;
        }).bind(this));
        this.group = new JsonLineGroup(0, this.data, true);
        this.group.render();
    }

    global.JsonViewer = JsonViewer;
})(window);