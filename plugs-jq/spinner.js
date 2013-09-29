;(function($){
	Template = {
		num: '<div class="spinner"></div>',
		btns: '<button class="arrowDown"></button><button class="arrowUp"></button>',
		atom: '<input type="spinner" value="10" autocomplete="off" min="10" max="100" step="10" disabled required>'
	}
	function Spinner(_this, opts){
		this.opts = opts;
		this.$el = $(_this);	
		this.$up = null;	//上翻按钮 
		this.$down = null;	//下翻按钮
		this.spin = true;
		this.$input = null; //spinner 输入框
		this.timer = null;
		this.isMouseDown = false;
		this.events = {change:[]};
		this.init();
	};
	Spinner.prototype = {
		init: function () {
			var self = this;
			var $spinner, max, min;
			var _disabled;
			if(self.$el[0].tagName === 'INPUT' && self.$el.attr('type') === 'spinner'){
				self.opts.need = self.$el.prop('required');
				self.opts.step = self.$el.attr('step') * 1 || 1;
				max = self.$el.attr('max')*1;
				min = self.$el.attr('min')*1;
				$.isNumeric(max) ? self.opts.max = max : self.opts.max = null;
				$.isNumeric(min) ? self.opts.min = min : self.opts.min = null;
				_disabled = self.$el.prop('disabled')
				if (_disabled){
					self.opts.disabled = _disabled;
				}
				if(self.$el.is('[nospin]')) self.spin = false;
				$spinner = self.$el.parent('.spinner');
				if($spinner.length){//已经有selector dom结构了///
					self.$el = $spinner;
					self.$input = self.$el.find('input[type=spinner]');
				}else{
					self._view();
				}
			}
			self._bindEvent();
			
			//设置默认值
			if(self.opts.val){
				self.setVal(self.opts.val);
			}

			if(self.opts.disabled){
				self._setDisabled(true);
			}

			//加入全局spinner管理
			self.$el.data('spinner_handle',self);
		},
		_view: function (){
			var self = this;
			var $tmpl = $(Template.num);
			self.$el.before($tmpl);
			self.$el.appendTo($tmpl);
			if(self.spin) {
				$tmpl.append(Template.btns);
				self.$up = $tmpl.find('.arrowUp');
				self.$down = $tmpl.find('.arrowDown');
			}
			self.$input = self.$el.attr('autocomplete', 'off');
			self.$el = $tmpl;
			if(self.opts.need) self.$el.addClass('need');
		},
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			var callback = opts.callback;
			if(self.spin){
				//向上按钮
				self.$up && self.$up.bind('mousedown',function (){
					if(self.opts.disabled) return ;
					self._getUp();
					if(self.timer){
						clearInterval(self.timer);
					}
					self.timer = setTimeout(function (){
						self.timer = setInterval(function(){self._getUp.call(self);},100)
					},600);
				}).bind('mouseup',function (){
					if(self.timer){
						clearInterval(self.timer);
					}
				});
				//向下按钮
				self.$down && self.$down.bind('mousedown',function(){
					if(self.opts.disabled) return ;
					self._getDown();
					if(self.timer){
						clearInterval(self.timer);
					}
					self.timer = setTimeout(function (){
						self.timer = setInterval(function(){self._getDown.call(self);},100)
					},600);
				}).bind('mouseup',function (){
					if(self.timer){
						clearInterval(self.timer);
					}
				});
			}
			self.$el.on('mousewheel', function(event) {
				if(self.opts.disabled) return ;
				if(event.originalEvent.wheelDelta > 0){
					self._setValue(false, opts.step);
				}else{
					self._setValue(true, opts.step);
				}
				event.stopPropagation();
				event.preventDefault();
			});
			self.originValue = self.$input.val() || '';
			self.$input.bind('input', function(){
				var v = this.value;
				if(v == '') {
					self.originValue = '';
					return ; 	
				}
				if(v == '-'){
					return ;
				}
				if(!$.isNumeric(v)){
					this.value = self.originValue;
					return ;
				}else{
					v = self._isAvaliable(v);
					this.value = v;
					self.originValue = v;
				}
			});
		},
		_resetValue: function(value){//步进设置
			var self = this, opts = self.opts;
			var result = value;
			var len = 0, i, _step;
			if(opts.step){//跳到相对应的step上
				result = result - (result % opts.step);
				_step = opts.step+'';
				i = (_step).indexOf('.');
				if(i > -1){
					len = _step.length - 2;
					result = result.toFixed(len);//处理js余不尽问题
				}
			}
			return result;
		},
		_getUp: function (){
			var self = this;
			self._setValue(false, self.opts.step);
		},
		_getDown: function (){
			var self = this;
			self._setValue(true, self.opts.step);
		},
		_setValue: function(bool,step){
			var self = this;
			var opts = self.opts;
			var callback = opts.callback;
			var val = self.$input.val() * 1;
			if(bool){
				if($.isNumeric(opts.min)){
					if((val-step) < opts.min) return false;
				}
				val = (val * 10000 -  step * 10000) / 10000; //乘以10000除以10000 消除JS处理浮点数bug
			}else{
				if($.isNumeric(opts.max)){
					if((val+step) > opts.max) return false;
				}
				val = (val * 10000 +  step * 10000) / 10000;
			}
			
			self.$input.val(val).trigger('input');;

			//调用回调函数
			if($.isFunction(callback)){
				callback(val);
			}
		},
		_isAvaliable: function(value){
			var self = this, opts = self.opts, result = value;
			if($.isNumeric(opts.max) && $.isNumeric(opts.min)){
				if(value < opts.max && value > opts.min){
					result = value;
				}else{
					if(value >= opts.max){
						result = opts.max;
					}else{
						result = opts.min;
					}
				}
			}else if($.isNumeric(opts.max)){
				if(value < opts.max){
					result = value;
				}else{
					result = opts.max;
				}
			}else if($.isNumeric(opts.min)){
				if(value > opts.min){
					result = value;
				}else{
					result = opts.min
				}
			}
			return result;
		},
		_dispatchEvents: function(val, noTrigger){
			var self = this;
			if(self.events.change.length > 0){
				$.each(self.events.change, function(i,v){
					v.call(self, val, self.$input);
				});
			}
		},
		_setDisabled: function(b){
			if(b){
				this.$el.attr('disabled','disabled');
				this.$input.attr('disabled','disabled');
				this.opts.disabled = true;
			}else{
				this.$el.removeAttr('disabled','disabled');
				this.$input.removeAttr('disabled','disabled');
				this.opts.disabled = false;
			}
		},
		addEvent: function(eventName, func){
			if(this.events[eventName] && $.isFunction(func)){
				this.events[eventName].push(func);
			}
			return this;
		},
		setDisabled: function(b){
			if(b){
				this._setDisabled(b);
			}else{
				this._setDisabled();
			}
			return this;
		},
		//对外接口改变当前状态
		setVal: function (value){
			var self = this;
			var opts = self.opts;
			var v;
			if($.isNumeric(v)){///
				v = self._isAvaliable(value);
				self.$input.val(v);
				self.originValue = v;
			}
			return self;
		},
		change: function(func){
			self.addEvent('change', func);
			return this;
		}
	};
	
	
	$.fn.spinner = function(opt){
		var ret=[];
		this.each(function() {
			var handle = $(this).data("spinner_handle");
			if(!handle){
				handle = new Spinner($(this), $.extend(true, {}, $.fn.spinner.defaults, opt));
				$(this).data("spinner_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length === 1 ? ret[0] : ret;
	};
	$.fn.spinner.defaults = {
		callback: null,
		max: null,
		min: null,
		value: 0,
		step: 1,
		//是否提供资源，并用来判断是否生成HTML结构
		source:false,
		//生成的hidden input name名称
		name:'',
		//是否必填
		need: false,
		//自定义宽度
		width:false,
		//默认值
		val:null,
	};
})(jQuery);