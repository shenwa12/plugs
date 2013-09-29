;(function($){
	var Template = {
		booler: '<div class="booler"><div class="slider">普通模式</div></div>',
        atom: '<input type="booler" name="hello" value="cp" yes="普通模式普普通通,cb" no="飞行模式,cp" />'
	};
	var WORD_WIDTH = 6, PADDING = 24;
	function Booler(_this, opts){
		this.opts = opts;
		this.$el = $(_this);	
		this.$slider = null;	//滑动条
		this.$valueBinder = null; 
		this.texts = [];//[是,否]
		this.values = [];//[1,0]
		this.defaultVal = false;//默认值为false
		this.bool = false;
		this._init();
	}
	Booler.prototype = {
		_init: function () {
			var self = this, opts = self.opts;
			var _val;
			var yesText;
			var noText;
			var yesArray;
			var noArray;
			var $booler = self.$el.parent('div.booler');

			if(self.$el[0].tagName === 'INPUT' && self.$el.is('[type=booler]') && !$booler.length){
				
				self._view();
			}else{
				self.$booler = self.$el.find('input[type=booler]');
			}

			self.$slider = self.$el.find('div.slider');
			
			//生成booler的字符数组及值数组
			yesText = self.$booler.data('yes');
			noText = self.$booler.data('no');
			if(!yesText){
				yesText = '是,1';
				self.$booler.data('yes',yesText);
			}
			if(!noText){
				noText = '否,0';
				self.$booler.data('no',noText);
			}
			yesArray = yesText.split(',');
			if($.isArray(yesArray)){
				self.texts.push(yesArray[0]);
				self.values.push(yesArray[1] || '1');
			}
			noArray = noText.split(',');
			if($.isArray(noArray)){
				self.texts.push(noArray[0]);
				self.values.push(noArray[1] || '0');
			}
			opts.val = self.$booler.val();
			
			//self.texts = [x,x],第一项为真实时的按钮文本，第二为假时的按钮文本
			//self.values = [x,x],第一项为真实时的值，第二为假时的值
			//设置默认值
			if(opts.val){
				var i = $.inArray(self.$booler.val(), self.values);
				self.defaultVal = (i==0) ? true : false;
			}
			//字符长度不相等时取最长字符做为booler宽度
			if(self.texts[0].length !== self.texts[1].length){
				var longest = (self.texts[0].length > self.texts[1].length) ? 0 : 1;
				self.$slider.css({width: self.wordCount(self.texts[longest]) * WORD_WIDTH + PADDING});
			}
			self._setDefault();
			self._bindEvent();
		},
		_view: function (){
			var self = this;
			var opts = this.opts;
			var defaultText = '否', defaultValue = 0;
			var $tmpl = $(Template.booler);
			self.$booler = self.$el;
			self.$el.before($tmpl);
			self.$el = $tmpl.append(self.$booler);
		},
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			var callback = opts.callback;

			self.$el.click(function (){
				self._toggle();
				//调用回调函数
				if($.isFunction(callback)){
					callback(self.$booler.val());
				}
			});

			//绑定表单reset事件
			var $form = self.$booler.closest('form');
			if($form.length){
				$form.on('reset.form','[type=reset]', function(){
					self.reset();
				});
			}
		},
		changeValue: function (b, noTrigger){//对外接口改变当前状态
			this.toggle(b, noTrigger);
			return this;
		},
		setVal: function(v, noTrigger){
			v+='';
			if($.inArray(v, this.values) > -1){
				if(this.$booler.val() != v){
					this._toggle(false, noTrigger);
				}
			}
			return this;
		},
		getVal: function(){
			return this.$booler.val();
		},
		toggle: function(b, noTrigger){//对外接口改变当前状态
			this._toggle(b, noTrigger);
			return this;
		},
		_toggle: function(b, noTrigger){
			var self = this;
			var v = self.$booler;
			if(b){
				self._setYes(v);
			}else{
				if(v.val()==self.values[0]){//为YES时
					self._setNo(v);
				}else{//为NO时
					self._setYes(v);
				}
			}
			if(!noTrigger){
				self.$booler.trigger({
					type:'change',
					dom: self.$booler,
					handler: self
					},v.val());
				
				self.$booler.trigger({//deprecated
					type:'booler.change',
					dom: self.$booler,
					handler: self
				},v.val());
			}
		},
		_setNo: function(v){
			this.$el.removeAttr('checked');
			this.$slider.text(this.texts[1]);
			v.val(this.values[1]);
		},
		_setYes: function(v){
			this.$el.attr('checked','');
			this.$slider.text(this.texts[0]);
			v.val(this.values[0]);
		},
		_setDefault: function(){
			if(this.defaultVal){
				this._setYes(this.$booler);
			}else{
				this._setNo(this.$booler);
			}

		},
		reset: function(){
			this._setDefault();
		},
		wordCount: function(value) {
		  var txt = value;
		  txt = txt.replace(/(<.*?>)/ig,'');  
		  txt = txt.replace(/([^\x00-\xff])/ig,'11');
		  return txt.length;
		}
	}
	
	
	$.fn.booler = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("booler_handle");
			if(!handle){
				handle = new Booler($(this), $.extend(true, {}, $.fn.booler.defaults, opt));
				$(this).data("booler_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	}
	$.fn.booler.defaults = {
		yes: null, //默认为no
		no: null,
		val: 0,
		name:'',
		callback: null
	}
})(jQuery);