;(function($){
	/**
	 * [nameConvert 转义name中的特殊符号以防止jquery选择器出错]
	 * @param  {[String]} mySelector [转义前的字符串]
	 * @return {[String]}            [转义后的字符串]
	 */
	var nameConvert = function(mySelector){
	    return mySelector.replace(/(:|\.|\[|\])/g,'\\$1');
	};
	/**
	 * [TagRadio 单选标签类]
	 * @param {[Dom]} _this       [class为tag的html标签]
	 * @param {[Object]} opts        [类配置对象]
	 */
	function TagRadio(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.name = '';
		this.$tagRadios = null; 
		this._init();
	}
	TagRadio.prototype = {
		_init: function () {
			var self = this, opts = self.opts;
			if(opts.name && opts.val && opts.text){//传name值就视为需要程序创建dom
				self._view();
			}
			if(!self.$el.hasClass(opts.curClass)){
				self.$el.addClass(opts.colorClass);
			}
			if(!!opts.name){
				self.$el.attr('name', opts.name);
			}
			self.name = self.$el.attr('name');
			self.$input = self._getHiddenInput(self.name);
			self._bindEvent();

			//加入全局TagRadio管理
			self.$el.data('tagRadio_handle', self);
		},
		_view: function (){
			var self = this, opts = self.opts;
			var _disabled = opts.disabled ? 'disabled' : '';
			//var s = '<div id="'+ opts.id +'" class="badge greenIt '+ _disabled +'" name="'+ opts.name +'" val="'+ opts.val +'">'+ opts.text +'</div>';
			self.$el.addClass('badge').addClass(_disabled).addClass(opts.colorClass).attr('name',opts.name).attr('val',opts.val).text(opts.text);
		},
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			var callback = opts.callback;
			self.$el.click(function(){
				if($(this).hasClass('disabled')) return false;
				var rName = nameConvert($(this).attr('name'));
				if(!!rName){
					self.$tagRadios =  $('div[name='+ rName +']');
				}
				self._setVal($(this).attr('val'));
				self.$tagRadios.removeClass(opts.curClass).addClass(opts.colorClass);

				$(this).addClass(opts.curClass).removeClass(opts.colorClass);
				if($.isFunction(callback)){
					callback(this);
				}
			});
			
		},
		_getHiddenInput: function(_name){
			var $input = $('input[type=hidden][name='+ _name +']');
			if($input[0]){
				return $input.eq(0);
			}else{
				var $inputDom = $('<input type="hidden" name="'+ _name +'" value="" class="valueBinder" />');
				this.$el.after($inputDom);
				return $inputDom;
			}
		},
		_setVal: function(v){
			this.$input.val(v);
		},
		getName: function(){
			return this.name;
		},
		setDisabled: function(b){
			if(!this.$el) return;
			this.$el.addClass((b)?'disabled':'');
		},
		setChecked: function(){
			this.$el.click();
		}
	};
	
	/*
	function TagRadioGroup(){
		this.name = '';
		this.trg = [];
		this.$valueBinder = null;
	};
	TagRadioGroup.prototype = {
		_addChild: function(obj){
			this.trg.push(obj);
		},
		getChildByIndex: function(i){
			return this.trg[i];
		},
		setName: function(){
			var tagRadioObj = this.getChildByIndex(0);
			if(tagRadioObj){
				this.name = tagRadioObj.getName();
			}
			this.$valueBinder = $('input.valueBinder[name='+ nameConvert(this.name) +']');
		},
		setValue: function(v){
			if(this.$valueBinder){
				this.$valueBinder.val(v);
			}
		}
	};
	 */
	$.fn.tagRadio = function(opt){
		var opts = $.extend({},$.fn.tagRadio.defaults,opt);
		var isCreated = $(this).data('tagRadio_handle');
		return (!!isCreated) ? isCreated : new TagRadio(this,opts);
	}
	$.fn.tagRadio.defaults = {
		callback: null,
		name:'',
		id:'',
		value:0,
		disabled:false,
		//选中样式
		curClass:'cur',
		colorClass:'greenIt'
	}
})(jQuery);