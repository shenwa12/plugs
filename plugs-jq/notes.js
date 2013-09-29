;(function($){
	var zIndex = {max:3000, min:2000, cur:2000};
	var $body = $('body');
	var $rootContainer = $body;

	function Note(opts) {
		this.opts = opts;
		this.noteType = {
			1:['warn','警告','ico_32_color i3'],2:['info','提示','ico_32_color i4'],3:['sucs','成功','ico_32_color i1'],4:['fail','错误','ico_32_color i2'],
			'warn':['warn','警告','ico_32_color i3'],'info':['info','提示','ico_32_color i4'],'sucs':['sucs','成功','ico_32_color i1'],'fail':['fail','错误','ico_32_color i2']};
		this._init();
	};
	Note.prototype = {
		_init: function() {
			var self = this
			  , opts = self.opts;
			self._view();
			self._bindEvent();
		},
		_view: function() {
			var tit = this.opts.title;
			this.$el = $('<div class="note ' + this.noteType[this.opts.type][0] + '"><i class="' + this.noteType[this.opts.type][2] + '"></i><strong>' + ((!!tit) ? tit : this.noteType[this.opts.type][1])  + '：</strong><p>' + this.opts.content + '</p></div>');
			this.$el.appendTo($rootContainer).data('notes', this);
		},
		_bindEvent: function() {
			var self = this;
			if (self.opts.timer) {
				self.timeout = setTimeout(function(){
					self._hide(self.$el);
					if(self.interval){clearInterval(self.interval)}
				}, self.opts.timer);
				self.$el.attr('timer', self.opts.timer / 1000);
				self.interval = setInterval(function(){
					self.opts.timer -= 1000;
					self.$el.attr('timer', self.opts.timer / 1000);
				},1000);
			}
			self.$el.click(function() {
				self._hide();
			});
		},
		_hide: function(flag) {
			var self = this;
			if (!flag) {
				self.$el.animate({opacity:0}, 300, function() {
					self.$el.slideUp(300, function() {
						self._destroy();
					});
				});
			} else {
				self._destroy();
			}
			return this;
		},
		_show: function(obj) {
			var self = this;
			this.$el.animate({opacity:1}, 300);
			return this;
		},
		hide: function(flag) {
			return this._hide(flag);
		},
		show: function() {
			return this._show();
		},
		_destroy: function() {
			this.$el.trigger('destroy.notes');
			this.$el.remove();
			this.opts = null;
			this.noteType = null;
			this.$el = null;
			if (this.interval) clearInterval(this.interval);
			if (this.timeout) clearTimeout(this.timeout);
		}
	};
	
	$.fn.notes = function(opt) {
		///
	};
	$.notes = function(opt) {
		var opt = $.extend({}, $.fn.notes.defaults, opt);
		if (opt.timer === true) {
			opt.timer = $.fn.notes.defaults.timer;
		}
		return new Note(opt);
	};
	$.fn.notes.defaults = {
		//note类型:1、警告 2、提示 3、成功 4、错误
		type:3,
		//note标题
		title:'',
		//note内容
		content:'',
		//定时器，定时后淡出此notes
		timer:3000
	};

	//外部设置zIndex值
	var setZindex = function(a, b) {
		zIndex.max = b;
		zIndex.min = a;
		zIndex.cur = a;
	};

	$.notes.data = function() {
		var a = arguments[0];
		var b = arguments[1];
		var c = arguments[2]
		if (a === 'rootContainer') {
			var $b = $(b);
			$b.length && ($rootContainer = $b);
		} else if(a==='zIndex') {
			setZindex.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
})(jQuery);