/*滚动插件*/
;(function($){
	/**
	 * Scroller 横向滚动插件
	 * mailTo: willian12345@126.com
	 * eg:
	 * $('.myscroller').scroller({scrollDistance:2,scrollSpeed:500, easing:'easeOutBack'});
	 * 
	 * params:
	 * [scrollDistance]: 1滚动一格，2，滚动一屏 
	 * [scrollSpeed]: 滚动速度(毫秒)
	 * [easing]: 动画效果
	 * 其它默认参数请参考$.fn.scroller.defaults对象
	 * 
	 * HTML：
	 * <div class="myscroller">
			<button  class="leftHandler"><</button>
			<div class="scrollMask">
				<ul class="scrollCont">
					<li></li>
					<li></li>
					<li></li>
					<li></li>
				</ul>
			</div>
			<button class="rightHandler">></button>
		</div>
	 */
	function Scroller (_this,_opts){
		this.$el = $(_this);
		this.opts = _opts;
		this.$leftHandler = null;
		this.$rightHandler = null;
		this.$scrollMask = null;
		this.$scrollCont = null;
		this.maskWidth = 0;					//遮罩宽度
		this.totalItemsWidth = 0;
		this.scrollContPaddingLeft = 0;		//遮罩margin-left
		this.availableDistance;				//允许滚动的宽度(所有 li宽度 - mask宽度)
		this.itemIndex = 0;					//当前所在数组下标
		this.itemsWidthAry = [];			//每次步进距离宽度数组
		this.isAnimate = false;				//是否在动画中
		this.$lis = null;
		this.init();
	};
	
	Scroller.prototype.init = function (){
		var self = this;
		this.$leftHandler = this.$el.find(this.opts.rightHandler);
		this.$rightHandler = this.$el.find(this.opts.leftHandler).attr(this.opts.disabledClass,'');
		this.$scrollMask = $(this.opts.scrollMask);//为适应不同结构，此处需要传jquery对象
		this.$scrollCont = this.$el.find(this.opts.scrollCont);
		this.scrollContPaddingLeft = parseInt(this.$scrollCont.css('padding-left'));

		this.reset();
		
		
		this.bindEvent();
	};
	Scroller.prototype.bindEvent = function (){
		var self = this;
		var isAnimate = false;
		var opts = self.opts;
		var callback = opts.callback;
		
		//单击向左按钮
		self.$leftHandler.click(function(){
			self.animateToLeft();
		});
		//单击向右按钮
		self.$rightHandler.click(function(){
			self.animateToRight();
		});
	};
	
	Scroller.prototype.animateToLeft = function (toIndex){
		var self = this;
		var leftBound = Math.abs(parseInt(self.$scrollCont.css('margin-left')));
		var step = 0;
		var opts = self.opts;
		var callback = opts.callback;
		var to = 0;
		if(leftBound >= self.availableDistance || self.isAnimate || self.$leftHandler.is('['+ self.opts.disabledClass +']')){
			self.$leftHandler.attr(opts.disabledClass,'');
			return false;
		}else{
			self.$rightHandler.removeAttr(opts.disabledClass);
			self.isAnimate = true;
			if(toIndex){//滚动到指定的li上
				$.each(self.itemsWidthAry, function(i,v){
					if(i<toIndex-1){
						to-=v;
					}
				});
			}else{
				step = self.itemsWidthAry[self.itemIndex++];
				to = ('-=' + step);
			}
			self.$scrollCont.animate({marginLeft: to}, opts.scrollSpeed, opts.easing, function(){
				self.isAnimate = false;
				
				if(leftBound > self.availableDistance || self.itemIndex >= self.itemsWidthAry.length - 1){//添加禁用样式
					self.$leftHandler.attr(opts.disabledClass,'');
				}
				if($.isFunction(callback)){
					callback();
				}
			});
		}
	};
	
	Scroller.prototype.animateToRight = function (){
		var self = this;
		var step = 0;
		var callback = self.opts.callback;
		var marginLeft = parseInt(self.$scrollCont.css('margin-left'));
		//console.log(marginLeft >= 0 , self.isAnimate , self.$rightHandler.hasClass(self.opts.disabledClass));
		if(marginLeft >= 0){
			self.$rightHandler.attr(self.opts.disabledClass,'');
		}
		if(marginLeft >= 0 || self.isAnimate || self.$rightHandler.is('['+ self.opts.disabledClass +']')){
			return false;
		}else{
			self.isAnimate = true;
			self.$leftHandler.removeAttr(self.opts.disabledClass);
			
			step = self.itemsWidthAry[--self.itemIndex];
			self.$scrollCont.animate({marginLeft: ('+=' + step)}, self.opts.scrollSpeed, self.opts.easing,  function(){
				self.isAnimate = false;
				if(Math.abs(marginLeft) - self.itemsWidthAry[0] < 0 || self.itemIndex >= self.itemsWidthAry.length || self.itemIndex===0){//添加禁用样式
					self.$rightHandler.attr(self.opts.disabledClass,'');
				}
				if($.isFunction(callback)){
					callback();
				}
			});
		}
	};
	
	Scroller.prototype.getCurrentItemPosX = function (i){
		var self = this;
		for(n = 0; i>=0; i--){
			n += self.itemsWidthAry[i];
		}
		return n;
	};
	
	Scroller.prototype.saveItemsWidth = function (){
		var self = this;
		self.itemsWidthAry = [];
		self.totalItemsWidth = 0;
		var lis = self.$lis;
		if(self.opts.scrollDistance === 1){
			lis.each(function(){
				var w = $(this).outerWidth(true);
				self.totalItemsWidth += w;
				self.itemsWidthAry.push(w);
			});
		}else if(self.opts.scrollDistance === 2){
			var temp = 0;
			var lisAry = [];
			var i=0; 
			lis.each(function(){
				var w = $(this).outerWidth(true);
				lisAry.push(w);
				self.totalItemsWidth += w;
			});
			
			while(i < lisAry.length){
				if(lisAry[i] >= self.maskWidth && temp === 0){
					self.itemsWidthAry.push(lisAry[i]);
						i++
					}else{
					temp += lisAry[i];
					if(temp > self.maskWidth){
						self.itemsWidthAry.push(temp - lisAry[i]);
						temp = 0;
					}else{
						i++;
					}
				}
			}
		}

	};
	
	//供外部程序调用以渲染当前滚动组件
	Scroller.prototype.rerender = function(){
		var self = this;
		var ml = 0;
		self.saveItemsWidth();

		self.availableDistance = self.totalItemsWidth - self.maskWidth + self.scrollContPaddingLeft + 54;
		var i = 0;
		while(Math.abs(ml) < self.availableDistance){//移动到最大可移动距离(self.availableDistance)
			ml += self.itemsWidthAry[i];
			i++;
		}
		self.itemIndex = i;
		self.$rightHandler.removeAttr(self.opts.disabledClass);
		self.$scrollCont.css({marginLeft:(-ml)+'px'});
	};
	
	//供外部程序调用以重置当前滚动状态
	Scroller.prototype.reset = function(){
		var self = this;
		var leftToCurWidth = 0;
		self.$lis = self.$scrollCont.find('li');
		self.$scrollCont.css('margin-left','0');
		self.itemIndex = 0;	
		self.maskWidth = this.$scrollMask.width();
		self.saveItemsWidth();
		self.availableDistance = self.totalItemsWidth - self.maskWidth + self.scrollContPaddingLeft + self.$lis.eq(self.$lis.length-1).outerWidth(true);
		if(self.availableDistance <= 0){
			self.$rightHandler.attr(self.opts.disabledClass, '');
			self.$leftHandler.attr(self.opts.disabledClass, '');
		}else{
			self.$leftHandler.removeAttr(self.opts.disabledClass);
		}
		
		self.$lis.each(function(i){
			leftToCurWidth += $(this).outerWidth(true);
			if($(this).hasClass('cur')){
				self.itemIndex = i;
				return false;	
			}
		});
		if(leftToCurWidth >= self.maskWidth){
			self.animateToLeft(self.itemIndex);
		}
	};
	
	Scroller.prototype.goEnd = function (bool){
		var self = this;
		var opts = self.opts;
		if(bool){
			self.$scrollCont.animate({marginLeft: 0}, opts.scrollSpeed, opts.easing);
			self.$rightHandler.attr(self.opts.disabledClass,'');
			self.$leftHandler.removeAttr(self.opts.disabledClass);
			self.itemIndex = 0;
		}else{
			self.$scrollCont.animate({marginLeft: -self.availableDistance}, opts.scrollSpeed, opts.easing);
			self.$leftHandler.attr(self.opts.disabledClass,'');
			self.$rightHandler.removeAttr(self.opts.disabledClass);
			self.itemIndex = self.itemsWidthAry.length - 1;
		}
	};
	
	$.fn.scroller = function(opt){
		return new Scroller(this,$.extend({},$.fn.scroller.defaults,opt));
	};
	$.fn.scroller.defaults = {
		scrollDistance:1,//滚动距离，1：滚动一项，2：滚动一屏(如果最后一个元素超出则滚动到此元素)
		scrollSpeed:100,//滚动速度，毫秒
		easing:'swing',
		callback: null,
		type:'tab',//为适应不同的应用而区别程序，tab, pagination
		centerNum: 1, //适应pagination而设置的中间值
		disabledClass:'disabled',//按钮禁用样式
		leftHandler: '.leftHandler',//左按钮
		rightHandler: '.rightHandler',//右按钮
		scrollMask: '.scrollMask',//scroller内容容器遮罩
		scrollCont: '.scrollCont'//scroller内容容器
	};
})(jQuery);