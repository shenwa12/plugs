/*Radio*/
;(function($){
	var Template = {
		label: '<label><i class="radio"></i></label>',
		i: '<i class="radio"></i>'
	} ;//<input type="radio" id="check5" value="1" checked="checked" name="info[charset]">
	
	function Radio(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$iRadio = null;		//<i class="radio">
		this.$radios = null; 		//name值相等的 所有radio 
		this.$hitarea = null;
		this.$radio = null;
		this.defaults = false; //默认为未选择	
		this.hasLabel = false;
		this.events = {};//事件映射表
		this.init();
	}
	Radio.prototype = {
		init: function () {
			var self = this;
			var $radio = self.$el.parent('i.radio');
			var $label = $radio.parent('label'); 
			var labelFor, radioName, val, escapeVal;
			if(self.$el[0].tagName === 'INPUT' && !$radio.length){//如果没有元素就自行构建
				self.$radio = self.$el;
				self._view();
			}else{//已经有结构
				if($label.length){
					self.$el = $label;
				}else if($radio.length){
					self.$el = $radio;
				}else{
					console.log('f:[radio/init]未找到初始化结构!');
					return ;
				}
				self.$radio = self.$el.find('input');
			}
			if(self.$el[0].tagName === 'LABEL'){
				if(self.$radio.attr('id')){
					labelFor = self.$radio.attr('id'); 
				}else{
					radioName = self.$radio.attr('name') || '';
					
					val = self.$radio.val();
					
					if($.trim(val).length===0){
						labelFor = radioName + $.now() + Math.random();
					}else{
						escapeVal = escape(val);
						if(escapeVal.indexOf("%u") < 0){
							val = escapeVal;
						}
						labelFor =  radioName + val + $.now() + Math.random();
					}
					self.$radio.attr('id', labelFor);
				}
				self.$el.attr('for', labelFor);
			}

			self._initRadio();//为防止表单自动记忆(即没有ctrl+f5刷新或者重新打开网页)
			 
			self._bindEvent();
			
		},
		_view: function (){
			var self = this;
			var _label = self.$el.attr('label');
			var $i = $(Template.i);

			self.$radio = self.$el;
			if(_label){	
				$tmpl = $(Template.label);
				$tmpl.html(_label);
				$tmpl.prepend($i);
				self.$iRadio = $i;
				self.$el.before($tmpl);
				$i.append(self.$radio);
				self.$el = $tmpl;
				self.hasLabel = true;
			}else{
				$tmpl = $(Template.i);
				self.$el.before($tmpl);
				self.$iRadio = $tmpl;
				self.$iRadio.append(self.$radio);
				self.$el = $tmpl;
			}
			if(self.$radio.attr('disabled')){
				self.$el.attr('disabled', true);
			}
		},
		_bindEvent: function () {
			var self = this;
			

			self.$el.change(function(){
				self._clicked();
			});

			if(self.$el[0].tagName === 'I'){
				self.$el.click(function(){
					self._clicked();
				});
			}
			// self.$iRadio.change(function(){
			// 	self._clicked();
			// });

			//绑定表单reset事件
			var $form = self.$el.closest('form');
			if($form.length){
				$form.on('reset.form','[type=reset]', function(){
					self.reset();
				});
			}
		},
		_clicked: function(){
			var self = this;
			var callback = self.opts.callback;
			if(self.$radio.prop('disabled')) return false;
			
			self.$radios = Radio.getInput(self.$radio.attr('name'));
			if(self.$radios.length){
				self.$radios.each(function(){
					$(this).attr('checked',false);
					var $label = $(this).parent('i.radio').parent('label');
					if($label.length){
						$label.removeClass('checked');
					}
				});
			}
			self.hasLabel && self.$el.addClass('checked');
			self.$radio.attr('checked',true);
			self._dispatchEvents('change', self.$radio.val());
			if($.isFunction(callback)){
				callback.call(self, self.$radio.val());
			}
		},
		_initRadio: function(){
			var self = this;
			if(self.$radio.prop('checked')){
				self._clicked();
				self.defaults = true;
			}
		},
		setChecked: function(){
			if(this.$el) this._clicked();
		},
		setDisabled: function(b){
			if(b){
				this.hasLabel && this.$el.attr('disabled', true);
				this.$radio.attr('disabled', true);
			}else{
				this.hasLabel.length && this.$el.removeAttr('disabled');
				this.$radio.removeAttr('disabled', false);
			}
			return this;
		},
		isChecked: function(){
			return this.$radio.prop('checked');
		},
		change: function(func){
			this._addEvent('change', func);
			return this;
		},
		_dispatchEvents: function(event, val){
			var self = this;
			if(self.events[event] && self.events[event].length > 0){///
				$.each(self.events[event], function(i,v){
					v.call(self, val, self.$el);
				});
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
			if(this.defaults) this._clicked();
		}
	}

	Radio.getInput = function(_name){
		if(!_name) return [];
		var name = Radio.zy(_name);
		var arr = [];
		if(name){
			arr = $('input[name='+ name +']');
		}
		return arr;
	};

	Radio.zy = function(mySelector){
	    return mySelector.replace(/(:|\.|\[|\])/g,'\\$1');
	};
	
	$.fn.radio = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("radio_handle");
			// console.log(handle, opt);
			// if(handle && opt && opt.change){

			// handle.change(opt.change);///	
			// } 
			if(!handle){
				handle = new Radio($(this), $.extend(true, {}, $.fn.radio.defaults, opt));
				$(this).data("radio_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	}
	$.fn.radio.defaults = {
		callback: null,
		id:'',
		name:'',
		label:'',
		val:0,
		disabled:false,
		change: null,
		selected:false
	}
})(jQuery);