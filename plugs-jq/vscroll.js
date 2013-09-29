;(function($){
	//滚动条最小高度
	var BAR_MIN_HEIGHT = 20
		//滚动条占的宽度
		,BAR_WIDTH = 10
		,BAR_BG_OPACITY = .2
		,BAR_OPACITY = .4
		//滚动初始步长
		,DELTA_Y = 10
		//滚动步进速度
		,PLUS = 20
		//滚动方向
		,direction = 1
		//滚动条偏移CLASS，用于去头，去尾 
		,theadFix = {class:'.theadFix.fixed',value:26}
		,headFix = {class:'.head.fixed',value:38}
		,bottomFix = {class:'.foot.fixed', value: 45}
		;

	var VscrolBar = function($content, conf){
		//配置项
		this.conf = conf;
		//内容
		this.$content = $content;
		//滚动条
		this.$bar = null;
		//滚动组件背景
		this.$barBg = null;
		//滚动组件容器
		this.$barContainer = null;
		//鼠标是否在bar上按下
		this.isMouseDown = false;
		//上一次拖动的Y轴位置
		this.oldY = 0;
		//滚动bar当前position-top值
		this.curTop = 0;
		//Y轴滚动累计步长
		this.deltaYStep = 10;
		//显隐控制器
		this.visibleTimer = null;
		//鼠标是否在bar上
		this.onmouse = false;
		
		//滚动时执行的回调
		this.scrollFunc = null;

		//头部偏移值
		this.topFix = 0;
		//底部偏移值
		this.bottomFix = 0;

		//initialize
		this._init();
	};

	VscrolBar.prototype = {
		_init: function(){
			var $tmpl = $(this.conf.tmpl);
			this.$bar = $tmpl.appendTo(this.$content).find('.vscroll');
			this.$barBg = $tmpl.find('.vscrollBg');
			this.$barContainer = $tmpl;

			//判断是否需要偏移顶部或底部
			this._checkOffset();

			this.contentHeight = 0;

			this.curScrollTop = 0;

			this._initBar();

			this._events();
		},
		_initBar: function(){
			var ch = this.$content.height();
			this.contentHeight = ch;
			var sch = this._getScrollHeight();
			if(sch > ch){//&& this.$content.css('overflow-y') === 'auto'
				this.$content.css('overflow-y','hidden');
				this.$bar.css({
					'top':0,
					'opacity': 0,
					'height': Math.max(BAR_MIN_HEIGHT, ch - (sch - ch))
				});

				this.$barBg.css({
					// 'height': ch,
					'opacity':0
				});

				this.$barContainer.css({
					'height': ch - (this.topFix + this.bottomFix),
					'left': this.$content.offset().left + this.$content.width() - BAR_WIDTH,
					'top': this.$content.offset().top + this.topFix,
					'display':'block'
				});
			}else{
				this.$barContainer.hide();
			}
			
		},
		_events: function(){
			var self = this;

			self.$bar.on('mousedown', function(e){
				self.oldY = e.clientY;
				//console.log(self.$bar.position().top);
				self.curTop = self.$bar.position().top;

				//dragging
				$(window).on('mousemove.vscroll', function(event){
					var distY = event.clientY - self.oldY;
					self._slide(distY);
					self.deltaYStep = self.$content.scrollTop();
				});
			}).on('mouseover', function(){
				self.onmouse = true;
			}).on('mouseout', function(){
				self.onmouse = false;
			});

			//mousewheel ing 
			self.$content[0].addEventListener('mousewheel', function(event){
				//console.log(event);
				if($(this).closest(':hidden').length) return;
				if(event.wheelDelta === 120){
					direction  = -1;
				}else if(event.wheelDelta === -120){		
					direction = 1;
				}
				var v = self.scrollTop() + (direction * PLUS);
				if(v < 0){
					v=0;
				}
				self.scrollTop(v);
			});

			self.$content.on('dom.change', function(){
				self.reload();
			});

			//stop dragging
			$(window).on('mouseup', function(){
				self.curTop = self.$bar.position().top;
				self.deltaYStep = DELTA_Y;
				$(window).off('mousemove.vscroll');
				self.isMouseDown = false;
			});
		},
		_scrolling: function(){
			var self = this;

			self.$bar.css('opacity', BAR_OPACITY);
			

			if($.isFunction(this.scrollFunc)){
				this.scrollFunc.call(this,self.$content.scrollTop());
			}

			this.$bar.trigger({
				type:'scroll.v',
				domBar:this.$bar,
				targetDom: this.$content
			});

			if(this.visibleTimer){
				clearTimeout(this.visibleTimer);
			}
			this.visibleTimer = setTimeout(function(){
				if(!this.onmouse){
					self.$bar.stop();
					self.$bar.animate({'opacity': 0});
					if(self.$barBg.opacity !== '0'){
						self.$barBg.stop();
						self.$barBg.animate({'opacity': 0});
					}
				}
			},2000);
			
			self.$bar.stop();
			self.$bar.css('opacity', BAR_OPACITY);
			
			if(self.onmouse){
				self.$barBg.stop();
				self.$barBg.animate({'opacity': BAR_BG_OPACITY});
			}

			//保存当前scrollTop值
			self.curScrollTop = self.$content.scrollTop();
		},
		_slide: function(distY){
			var self = this;
			var ch = self.$content.height()-(this.topFix + this.bottomFix);
			var bh = self.$bar.height();
			var plusDist = distY + self.curTop;
			var bottom =  ch - bh;
			//console.log(distY);
			if(plusDist < 0){
				self.$bar.css('top', 0);
			}else if(plusDist > bottom){
				self.$bar.css('top', bottom);
			}else{
				self.$bar.css({'top': plusDist});
			}

			
			var percent = (self.$bar.position().top / (ch - bh));

			self.$content.scrollTop((self._getScrollHeight() - ch) * percent);


			//滚动事件
			self._scrolling();
		},
		_scrollTop: function(v){
			//设置内容scrollTop
			this.$content.scrollTop(v);
			
			var st = this.$content.scrollTop();

			//取scrollTop最小值, 避免用户设置数值过大
			v = Math.min(st,v);
			
			var h = this.$content.height();
			//(内容区域scrollTop / 内容区域允许滚动的范围) * (滚动条允许滚动的范围)
			this.$bar.css('top', (v / (this._getScrollHeight() - h)) * ((h - (this.topFix + this.bottomFix)) - this.$bar.height()));
			
			//滚动事件
			this._scrolling();

			//重新计算bar y轴偏移
			this.curTop = this.$bar.position().top;
		},
		_getScrollHeight: function(){
			return this.$content[0].scrollHeight;
		},
		_checkOffset: function(){
			if(this.$content.find(theadFix.class).length){
				this.topFix = theadFix.value;
			}else if(this.$content.find(headFix.class).length){
				this.topFix = headFix.value;
			}else{
				this.topFix = 0;
			}
			if(this.$content.find(bottomFix.class).length){
				this.bottomFix = bottomFix.value;
			}else{
				this.bottomFix = 0;
			}
		},
		scrollTop: function(v){
			if($.isNumeric(v)){
				this._scrollTop(v);
				return this;
			}else{
				return this.$content.scrollTop();
			}
		},
		scrollToEnd: function(){
			this._scrollTop(this._getScrollHeight());
		},
		scrollToTop: function(){
			this._scrollTop(0);
		},
		reload: function(){
			this._checkOffset();

			//重新定位距离顶部距离
			this.curTop = 0;
			
			//重新初始化bar
			this._initBar();

			//恢复到reload之前的scrollTop值
			this.scrollTop(this.curScrollTop);

			//重置滚动速度,防止reset的时候累加
			self.deltaYStep = DELTA_Y;

			return this;
		},
		scroll: function(func){
			if($.isFunction(func)){
				this.scrollFunc = func;
			}
		}
	};


	$.fn.vscrolBar = function(){
		var arr = [];
		$(this).each(function(){
			var handle = $(this).data('vscroll_handle');
			if(!handle){
				handle = new VscrolBar($(this), $.fn.vscrolBar.conf);
				$(this).data('vscroll_handle', handle);
			}	
			arr.push(handle);
		})
		return arr.length===1 ? arr[0] : arr;
	};
	$.fn.vscrolBar.conf = {
		tmpl: '<div class="vscrollContainer"><div class="vscrollBg"></div><div class="vscroll"></div></div>'
	};
})(jQuery);