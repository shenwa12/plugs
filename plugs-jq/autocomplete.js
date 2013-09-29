;(function($){
	var DOWN = 40;
	var UP = 38;
	var BACKSPACE = 8;
	var ENTER = 13;
	
	function AutoComplete(_this, opts){
		this.opts = opts;
		this.$trigger = $(_this);//触发器
		this.timer = -1;
		this.isENTER = false;
		this.model = null;//数据模型
		this.selected = [];
		this.init();
	};

	AutoComplete.prototype = {
		init : function(){
			var self = this;
			if(!self.opts.searcher){
				console.log('plug[autoComplete/init: 未指定搜索条!');
				return ;
			}
			if(!self.opts.menu){
				console.log('plug[autoComplete/init: 未指定搜索匹配容器!');
				return ;
			}
			if(!Filter){
				console.log('plug[autoComplete/init: 未找到过滤类Filter!');
				return ;
			}

			self.$trigger = self.opts.searcher;

			self.model = self.opts.source;

			self.bindEvent();
		},
		bindEvent: function(){
			var self = this;

			//输入框注册事件
			self.$trigger.bind('input',function(e){
				if($.trim(self.$trigger.val()).length >= 1){
					self.load();
				}else{
					self.render(self.model);
				}
				e.stopPropagation();
			});
			
			//注册UP、 DOWN按键事件
			self.$trigger.keydown(function(e){
				var $li = self.opts.menu.find('li');
				var $cur = $li.filter('.cur');
				var index = parseInt($li.index($cur),10);
				var value = '';
				if(e.which === DOWN){
					if(($li.eq(++index).length < 1)){
						$li.eq(0).addClass('cur');
					}else{
						$li.eq(index).addClass('cur');
					}
					$cur.removeClass('cur');
				}else if(e.which === UP){
					$li.eq(--index).addClass('cur');
					$cur.removeClass('cur');
				}else if(e.which === BACKSPACE){
					if($.trim(self.$trigger.val()).length <= 1) {
						self.render(self.model);
					}
				}else if(e.which === ENTER){
					self.isENTER = true;
					if($cur.length){
						self.select($cur);
					}
				}
			});
		},
		load: function (data){
			var self = this;
			if(self.timer !== -1) clearTimeout(self.timer);
				self.timer = setTimeout(function(){
				self.router();
			},300);
		},
		router: function(){
			var self = this;
			if(!!self.model && self.model.length > 0){
				self.getLocalData();
			}else{
				self.getRemoteData();
			}
		},
		//获得远程数据排序由远程服务器完成
		getRemoteData: function (_url){
			var self = this;
			var url = (!!url)? _url : self.opts.url;
			if(url !== ''){
				$.ajax({
					type:"post",
					dataType:"json",
					url:url,
					success:function(data){
						if(data){
							self.render(data);
						}else{
							self.render([]);
						}
					},
					error: function(){
						self.render([]);
					}
				});
			}
			self.render([]);
		},
		//搜索本地数据排序由本地完成
		getLocalData: function () {
			var self = this;
			//过滤model
			var sortedData = (Filter && Filter.sort && Filter.sort({value:$.trim(self.$trigger.val()), data:self.model, sensitive: self.opts.sensitive})); 
			//sortedData.length < 0 && (sortedData = self.model);
			self.render(sortedData);
		},
		/**
		 * [render 插入数据渲染dom结构]
		 * @param  {[type]} data :json数据eg: [{class: "cur", gid: "0", text: "二狗子", val: "3"}]
		 */
		render: function(data){
			var self = this;
			var s = [];
			if($.isArray(data)){
				$.each(data, function(i, n){
					s.push('<li data-val="'+ n.val +'">'+ n.text +'</li>');
				});
				self.opts.menu.html(s.join(''));
			}
			self.$trigger.trigger('autoComplete.render');
		},
		select: function($li){
			var cb = this.opts.callback;
			if($.isFunction(cb)){
				cb.call(this, $li.data('val'), $li);
			}
		}
	};
	
	$.fn.autoComplete = function(opt){
			var opts = $.extend({},$.fn.autoComplete.defaults,opt)
			return new AutoComplete(this,opts);
	};
	$.fn.autoComplete.defaults = {
		source:[], //本地数据
		searcher: null,//搜索框
		menu: null,//匹配结果容器
		url:'', //远程匹配地址(返回json)
		items:8,
		name:'',
		val:'',
		sensitive: false,
		callback: null
	};
})(jQuery);