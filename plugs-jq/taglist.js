;(function($){
	var Template = {
		taglist: '<div class="tagList"><div class="addOne"></div></div>'
	}
	function TagList(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$plusBtn = null;//tag添加按钮
		this.events = {};//事件映射表
		this._init();
	}
	TagList.prototype = {
		_init: function(){
			var self = this, opts = self.opts;
			if(self.$el.is('[type=taglist]')){
				self._view();
			}

			self.$select = self.$el.find('select').prop('multiple',true);

			self._showTags();
		
			self.$plusBtn = self.$el.find('.addOne');
			self._bindEvent();

			if($.isFunction(self.opts.add)){
				self._addEvent('add',self.opts.add);
			}
			if($.isFunction(self.opts.change)){
				self._addEvent('change',self.opts.change);
			}
		},
		_view: function(){
			var self = this;
			var $tmpl = $(Template.taglist);
			self.$select = self.$el;
			self.$el.before($tmpl);
			self.$el = $tmpl;
			self.$el.append(self.$select);
		},
		_bindEvent: function(){
			var self = this;
			//添加tag
			self.$plusBtn.click(function(){
				self._add();
			});
			//tag被点击，编辑
			self.$el.on('click','span',function(e){
				e.stopPropagation();
			});
			//删除tag
			self.$el.on('click','span i',function(e){
				self.removeIndexByVal($(this).parent().data('val')+'');
				e.stopPropagation();
			});
		},
		_showTags: function(){
			var s = [];
			this.$el.find('span').remove();
			this.$select.find('option').each(function(){
				$(this).attr('selected','');
				s.push('<span data-val="'+$(this).val()+'">'+$(this).html()+'<i></i></span>');
			});
			this.$el.prepend(s.join(''));
		},
		
		//增加发起tag请求
		_add: function(){
			var self = this;
			this._dispatchEvents('add');
		},
		_addTag: function(tags){
			var self = this;
			var s = [];
			var vals = [];
			var $options = self.$select.find('option');
			$.each(tags, function(i,v){
				var flag = true;
				$.each($options, function(_i, _v){
					if($(_v).val() == v.val) flag = false;
				});
				if(flag){
					s.push('<option value="'+ v.val +'" selected>'+ v.text +'</option>');
					vals.push(v.val);	
				}
			});
			if(s.length > 0) self._dispatchEvents('change', vals);
			self.$select.append(s.join(''));
			self._showTags();

			self._ibox && self._ibox.close();
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
		//添加tag
		addTag: function(tagArr){
			var self = this;
			if(!tagArr || !$.isArray(tagArr)) return ;
			self._addTag(tagArr);
			return this;
		},
		//清除绑定的input
		removeIndexByVal: function(value){
			this.$select.find('option').each(function(){
				if($(this).val() === value) $(this).remove();
			});
			this.$el.find('span[data-val="'+TagList.zy(value)+'"]').remove();
			this._dispatchEvents('change', value);
		},
		//删除所有tag
		deleteAll: function(){
			this.$el.find('span').remove();
			this.$select.empty();
			this._dispatchEvents('change', '');
			return this;
		},
		change: function(func){
			this._addEvent('change', func);
			return this;
		},
		add: function(func){
			this._addEvent('add', func);
			return this;
		},
		getVal: function(){
			return this.$select.val() || [];
		},
		getData: function(){
			var arr = [];
			this.$select.find('option').each(function(){
				arr.push({val:$(this).val(), text: $(this).html()});
			});
			return arr;
		}
	}
	TagList.zy = function(mySelector){
	    return mySelector.replace(/(:|\.|\[|\]|\>|\<)/g,'\\$1');
	};

	$.fn.taglist = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("taglist_handle");
			if(!handle){
				handle = new TagList($(this), $.extend({}, $.fn.taglist.defaults, opt));
				$(this).data("taglist_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	}
	$.fn.taglist.defaults = {
		//点击添加按钮触发add回调
		add: null,
		change: null
	}
})(jQuery);