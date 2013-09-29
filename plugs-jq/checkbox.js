;(function($){
	var Template = {
		label: '<label><i class="checkbox"></i></label>',
		i: '<i class="checkbox"></i>'
	} ;//<input type="checkbox" label="Checked Checkbox" value="2013" checked="checked">
	/**
	 * [getAttrs 获得所有dom自定义属性]
	 * @param  {[type]} dom [dom标签]
	 * @return {[type]}     [自定义属性对象eg: {val:123,gid:342,text:'helloworld'}]
	 */
	var FILTER_ATTRS_ARRAY = ['required','width', 'disabled', 'name', 'attr', 'label', 'id']; 
	var getAttrs = function(dom){
		var o = {};
		if(!dom){
			o = null;
		}
		if(dom.attributes){
			for(var i=0, len = dom.attributes.length; i<len; i++){
				var key = dom.attributes[i].nodeName;
				if($.inArray(key, FILTER_ATTRS_ARRAY) > -1) continue;
				o[key] = dom.attributes[i].nodeValue;
			}
		}
		return o;
	};
	function Checkbox(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$iCheckbox = null;		//<i class="checkbox">
		this.$hitarea = null;
		this.onchange = null; //onchange事件	
		this.defaults = false; //默认为未选择	
		this.$checkbox = null;
		this.hasLabel = false;
		this.events = {};//事件映射表
		this._init();
	}
	Checkbox.prototype = {
		_init: function () {
			var self = this;
			var $checkbox = self.$el.parent('i.checkbox');
			var $label = $checkbox.parent('label');
			var labelFor, checkboxName, val, escapeVal;
			if(self.$el[0].tagName === 'INPUT' && !$checkbox.length){//如果没有元素就自行构建
				self._view();
			}else{//已经有结构
				if($label.length){
					self.$el = $label;
				}else if($checkbox.length){
					self.$el = $checkbox;
				}else{
					console.log('f:[checkbox/init]未找到初始化结构!');
					return ;
				}
			}
			self.$checkbox = self.$el.find('input[type=checkbox]');
			if(self.$el[0].tagName === 'LABEL'){
				if(self.$checkbox.attr('id')){
					labelFor = self.$checkbox.attr('id'); 
				}else{
					checkboxName = self.$checkbox.attr('name') || '';
					val = self.$checkbox.val();
					if($.trim(val).length===0){
						labelFor = checkboxName + $.now() + Math.random();
					}else{
						escapeVal = escape(val);
						if(escapeVal.indexOf("%u") < 0){
							val = escapeVal;
						}
						labelFor =  checkboxName + val + $.now() + Math.random();
					}
					self.$checkbox.attr('id', labelFor);
				}
				self.$el.attr('for', labelFor);
			}

			self._initCheckbox();//为防止表单自动记忆(即没有ctrl+f5刷新或者重新打开网页)
			self._bindEvent();
		},
		_view: function (){
			var self = this;
			var opts = self.opts;
			var $tmpl, $cloneDeep;			

			var _label = self.$el.attr('label');
			var $i = $(Template.i);
			self.$checkbox = self.$el;
			if(_label){	
				$tmpl = $(Template.label);
				$tmpl.html(_label);
				$tmpl.prepend($i);
				self.$iCheckbox = $i;
				self.$el.before($tmpl);
				$tmpl.append(self.$checkbox);
				$i.append(self.$checkbox);
				self.$el = $tmpl;
				
				self.hasLabel = true;
			}else{
				$tmpl = $(Template.i);
				self.$el.before($tmpl);
				self.$iCheckbox = $tmpl;
				self.$iCheckbox.append(self.$checkbox);
				self.$el = $tmpl;
			}
			if(self.$checkbox.attr('disabled')){
					self.$el.attr('disabled',true);
				}
		},
		_bindEvent: function () {
			var self = this;
			
			self.$el.change(function(e){
				self.toggle();
			});

			// self.$checkbox.bind('change', function(){
			// 	self._change();
			// });
			//绑定表单reset事件
			var $form = self.$checkbox.closest('form');
			if($form.length){
				$form.on('reset.form','[type=reset]', function(){
					self.reset();
				});
			}
		},
		_change: function(){
			var self = this;
			
			self._dispatchEvents('change', self.$checkbox.val());
			
			if($.isFunction(self.opts.callback)){
				self.opts.callback.call(self, self.$checkbox.val(), self.$checkbox.prop('checked'), self.$checkbox);
			}
		},
		_initCheckbox: function(){
			var self = this;
			if(self.$checkbox.attr('checked')){
				self.defaults = true;
			}
			self._checked = self.defaults;
		},
		toggle: function (b, noTrigger){
			var self = this;
			if(self.$checkbox.prop('disabled')) return this;
			if(b){
				self.setChecked(b, noTrigger);
			}else{
				if(self._checked) {
					self._toggle(false, noTrigger);
				}else{
					self._toggle(true, noTrigger);
				}
			}
			return this;
		},
		_toggle: function(bool, noTrigger) {
			this.$checkbox.prop('checked', bool).attr('checked', !!bool);
			this._checked = bool;
			!noTrigger && this.$checkbox.trigger('change.checkbox', bool);
			!noTrigger && this._change();///
		},
		setChecked: function(bool, noTrigger){
			this._toggle(bool, noTrigger);

			return this;
		},
		setDisabled: function(b){
			if(b){
				this.hasLabel && this.$el.attr('disabled', true);
				this.$checkbox.attr('disabled', true);
			}else{
				this.hasLabel && this.$el.removeAttr('disabled');
				this.$checkbox.removeAttr('disabled');
			}

			return this;
		},
		isChecked: function(){
			return this.$checkbox.prop('checked');
		},
		getVal: function(){
			///
		},
		change: function(func){
			this._addEvent('change', func);
			return this;
		},
		_dispatchEvents: function(event, val, noTrigger){
			var self = this;
			if(self.events[event] && self.events[event].length > 0){///
				$.each(self.events[event], function(i,v){
					v.call(self, val, self.$el);
				});
			}
			if ($.isFunction(self.opts.callback)){
				self.opts.callback.call(self,val, self.$el);
			}
		},
		_addEvent: function(eventName, func){
			if(!eventName || !$.isFunction(func)) return ;
			!this.events[eventName] && (this.events[eventName] = []);
			if(this.events[eventName] && $.isFunction(func)){
				this.events[eventName].push(func.bind(this));
			}
			return this;
		},
		removeEvent: function(eventName, func){
			if(eventName && func){
				var i = $.inArray(func, this.events[eventName]);
				if(i > -1){
					this.events[eventName].splice(i,1);
				}
			}else if(eventName){
				this.events[eventName].length = 0;
			}
			return this;
		},
		reset: function(){
			this._toggle(this.defaults);
		}
	}
	
	$.fn.checkbox = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("checkbox_handle");
			if(handle && opt && opt.change) handle.change(opt.change);///
			if(!handle){
				handle = new Checkbox($(this), $.extend(true, {}, $.fn.checkbox.defaults, opt));
				$(this).data("checkbox_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	};
	$.fn.checkbox.defaults = {
		callback: null,
		id:'',
		name:'',
		label:'',
		val:'',
		disabled:false,
		structrue:false,
		checked:false
	};

	// var checkbox = {
	// 	template: function(){
	// 		return '<input type="checkbox" />';
	// 	}
	// }
})(jQuery);