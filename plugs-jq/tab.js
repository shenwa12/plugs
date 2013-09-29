;(function($){
	function Tabs(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$tab = null;
		this.$tabs = null;
		this.$tabsParent = null;
		this.$tabContents = null;
		this.$tabContentsParent = null;
		this.tabid = null;
		this.tabScroller = null; /*滚动组件,需要scroller.js*/
		this.$plusBtn = null; /*增加新tab按钮*/
		this.newtab = null; /*新增tab*/
		
		/*滚动相关*/
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
		this.isAnimate = false;		
		
		this._init();
	}
	Tabs.prototype = {
		_init: function () {
			var self = this, opts = self.opts;

			if(opts.tabs.length > 0){
				self._view();
				if(!opts.defaultIndex){
					opts.defaultIndex = 0;
				}

			}

			//self.$tab = self.$el.find('div.tab');
			self.$tab = self.$el;
			self.tabid = self.$tab.data('tabid') || self.$tab.attr('tabid');
			self.$plusBtn = self.$el.find('div.plus');
			self.$tabsParent = self.$tab.find('ul');

			self.$tabContentsParent = $('.tabc[data-tabid='+ self.tabid +']').parent() || $('.tabc[tabid='+ self.tabid +']').parent();//TO DO

			self.newtab = self.opts.newtab;
			
			self.refreshItems();/*更新tabs 及 对应的内容容器*/
			self.addScroller();/*添加tab滚动*/
			
			self._bindEvent();

			//默认值
			if(opts.defaultIndex >= 0 && opts.defaultIndex !== null){
				self.$tabsParent.find('li').eq(opts.defaultIndex).click();
			}

			//加入全局Tabs管理
			self.$el.data('Tabs_handle',self);
		},
		_view: function(){
			var self = this;
			if(!self.opts.tabid){
				console.log('需要传入tabid');
			}else{
				self.tabid = self.opts.tabid;
			}
			var s = ['<ul>'];
			var c = [];
			$.each(self.opts.tabs, function(i,v){
				s.push('<li><span>'+ v +'</span><i class="dropArrow dropdown-toggle" data-dropmenu="'+ ((self.opts.dropdowns.length>0) ? Tabs.dropdownStr(self.opts.dropdowns[i]):'') +'" ></i></li>');
			});
			s.push('</ul><div class="plus"><i></i></div><div class="al"><i class="abtnL"></i></div><div class="ar"><i class="abtnR"></i></div>');
			$.each(self.opts.tabc, function(i,v){
				c.push('<div tabid="'+ self.opts.tabid +'" class="tabc">'+ v +'</div>');
			});
        	self.$el.append(s.join('')).addClass('tab '+ (self.opts.editMode?'editMode':'') +'').attr('data-tabid', self.tabid).after(c.join(''));
		},
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			self.$tabsParent.on(opts.openType, 'li', function(e){
				self.selectTab($(this));
			});
	
			self.$tabsParent.find('i.dropArrow').dropdown();
			
			self.$plusBtn.click(function(){
				self.addTab({
					title: self.newtab.title,
					content:self.newtab.content
				});
			});

			if(!!self.opts.callback){
				self.opts.callback.call(self);
			}
		},
		//选择某个tab
		selectTab: function($li){
			var self = this;
			var thisIndex = $li.index();
			var callback = self.opts.onActive;
			$li.addClass("cur").siblings().removeClass("cur");
			self.$tabContents.eq(thisIndex).show().addClass('cur').siblings('.tabc[tabid='+self.tabid+'], .tabc[data-tabid='+self.tabid+']').hide().removeClass('cur');

			if($.isFunction(callback)){
				callback.call(self, thisIndex);
			}
		},
		//通过index选择某个tab
		selectTabByIndex: function(i){
			this.selectTab(this.$tabs.eq(i));
		},
		addTab: function (p) {/*新增tab*/
			var self = this;
			if(self.$tabs.length >= (self.$el.data('maxtab') || self.opts.maxtab)){
				self.$plusBtn.attr('disabled','');
				return ;
			}

			var $tempTab = $('<li><span>'+ p.title +'</span><i class="dropArrow"></i></li>').appendTo(self.$tabsParent);
			var $tempTabContent = $('<div class="tabc" tabid="'+ self.tabid +'" style="display:none">'+ p.content +'</div>').appendTo(self.$tabContentsParent);
			self.refreshItems();
			$tempTab.addClass('cur').siblings().removeClass('cur');
			$tempTabContent.show().siblings('.tabc[tabid='+ self.tabid +']').hide();
			self.rerender();
			if(self.getTabsTotalWidth() > self.$tab.width()){
				self.$tab.addClass('overFlow');
			}
			self.$el.trigger({
				type: 'tab.add',
				domTrigger: self.$el,
				domTarget: self.$tbody,
				dom: self.$el,
				domCurrentTarget:$tempTab
			},$tempTab.index());
		},
		delTab: function (index) {
			var self = this; 
			if(self.$tabs.length <= (self.$el.data('mintab') || self.opts.mintab)){
				self.$tabs.find('.dropArrow').attr('disabled','');
				return ;
			}
			if(self.$tabs.length > self.opts.mintab){
				self.$tabs.eq(index).remove();
				self.$tabContents.eq(index).remove();
				self.refreshItems();
				self.reset();/*刷新滚动组件*/
				self.rerender();
				if(!self.$tabs.filter('.cur')[0]){
					self.$tabs.eq(0).addClass('cur');
					self.$tabContents.eq(0).show();
				}
				if(self.getTabsTotalWidth() + 20 <= self.$tab.width()){
					self.$tab.removeClass('overFlow');
				}
				//self.$tabsParent.css('margin-left',0);
				
				self.goEnd(true);
				self.$el.trigger({
					type: 'tab.del',
					domTrigger: self.$el,
					domTarget: self.$tbody,
					dom: self.$el,
					domCurrentTarget:self.$tabs.eq(index)
				},index);
			 }
		},
		refreshItems: function () {
			var self = this;
			self.$tabs = self.$tabsParent.find('li');
			var dataTabids = $('.tabc[data-tabid='+ self.tabid +']');
			if(dataTabids.length){
				self.$tabContents = dataTabids;
			}else{
				self.$tabContents = $('.tabc[tabid='+ self.tabid +']')
			}
		},
		getTabsTotalWidth: function () {
			var self = this;
			var w = 0;
			self.$tabs.each(function(){
				w += $(this).outerWidth(true);
			});
			return w;
		},
		addScroller: function () {
			var self = this;
			self.$leftHandler = self.$el.find('.ar');
			self.$rightHandler = self.$el.find('.al').attr(self.opts.disabledClass,'');
			self.$scrollMask = self.$el;
			self.$scrollCont = self.$el.find(self.$tabsParent);
			self.maskWidth = self.$scrollMask.outerWidth(true);
			self.scrollContPaddingLeft = parseInt(self.$scrollCont.css('padding-left'));
			
			var plusBtnWidth = (self.$tab.hasClass('editMode')) ? self.$plusBtn.width() : 0;
			
			self.saveItemsWidth();
			self.availableDistance = self.totalItemsWidth - self.maskWidth + self.scrollContPaddingLeft + 20;
			if(self.getTabsTotalWidth() > self.$tab.width()){
				self.$tab.addClass('overFlow');
			}
			self.scrollerBindEvent();
		},
		scrollerBindEvent: function (){
			var self = this;
			var isAnimate = false;
			var opts = self.opts;
			var callback = opts.callback;
			
			//单击被挡住一半的li时向左运动展现li
			self.$scrollCont.delegate('li','click',function(){
				var i = $(this).index();
				var left = Math.abs(parseInt(self.$scrollCont.css('margin-left')));
				var handlerWidth = (self.$tab.hasClass('overFlow')) ? 100:0;
				//console.log(self.getCurrentItemPosX(i),self.maskWidth - self.scrollContPaddingLeft + left - handlerWidth);
				if(self.getCurrentItemPosX(i) > self.maskWidth - self.scrollContPaddingLeft + left - handlerWidth){
					self.animateToLeft();
				}
				
			});
			
			//单击向左按钮
			self.$leftHandler.click(function(){
				self.animateToLeft();
			});
			//单击向右按钮
			self.$rightHandler.click(function(){
				self.animateToRight();
			});
		},
		animateToLeft: function (){
			var self = this;
			var leftBound = Math.abs(parseInt(self.$scrollCont.css('margin-left')));
			var step = 0;
			var opts = self.opts;
			var callback = opts.callback;
			//console.log(leftBound , self.availableDistance);
			if(leftBound > self.availableDistance || self.isAnimate || self.$leftHandler.is('['+opts.disabledClass+']')){
				return false;
			}else{
				self.$rightHandler.removeAttr(opts.disabledClass);
				self.isAnimate = true;
				
				step = self.itemsWidthAry[self.itemIndex++];
				self.$scrollCont.animate({marginLeft: ('-=' + step)}, opts.scrollSpeed, function(){
					self.isAnimate = false;
					if(leftBound > self.availableDistance || self.itemIndex >= self.itemsWidthAry.length){//添加禁用样式
						self.$leftHandler.attr(opts.disabledClass,'');
					}
					if($.isFunction(callback)){
						callback();
					}
				});
			}
		},
		animateToRight: function (){
			var self = this
			  , opts = self.opts
			  , step = 0
			  , callback = opts.callback
			  , marginLeft = parseInt(self.$scrollCont.css('margin-left'))
			if(marginLeft >= 0 || self.isAnimate || self.$rightHandler.is('['+opts.disabledClass+']')){
				return false;
			}else{
				self.isAnimate = true;
				self.$leftHandler.removeAttr(opts.disabledClass);
				
				step = self.itemsWidthAry[--self.itemIndex];
				self.$scrollCont.animate({marginLeft: ('+=' + step)}, opts.scrollSpeed,  function(){
					self.isAnimate = false;
					if(Math.abs(marginLeft) - self.itemsWidthAry[0] < 0 || self.itemIndex >= self.itemsWidthAry.length){//添加禁用样式
						self.$rightHandler.attr(opts.disabledClass,'');
					}
					if($.isFunction(callback)){
						callback();
					}
				});
			}
		},
		getCurrentItemPosX: function (i){
			var self = this;
			for(n = 0; i>=0; i--){
				n += self.itemsWidthAry[i];
			}
			return n;
		},
		saveItemsWidth: function (){
			var self = this;
			self.itemsWidthAry = [];
			self.totalItemsWidth = 0;
			if(self.opts.scrollDistance === 1){
				self.$scrollCont.find('li').each(function(){
					var w = $(this).outerWidth(true);
					self.totalItemsWidth += w;
					self.itemsWidthAry.push(w);
				});
			}else if(self.opts.scrollDistance === 2){
				var temp = 0;
				var lisAry = [];
				var i=0; 
				self.$scrollCont.find('li').each(function(){
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
		},
		rerender: function(){
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
		},
		reset: function(){
			var self = this;
			self.saveItemsWidth();
			self.availableDistance = self.totalItemsWidth - self.maskWidth + self.scrollContPaddingLeft;
		},
		goEnd: function (bool){
			var self = this;
			var opts = self.opts;
			if(bool){
				self.$scrollCont.animate({marginLeft: 0}, opts.scrollSpeed);
				self.$rightHandler.attr(self.opts.disabledClass,'');
				self.$leftHandler.removeAttr(self.opts.disabledClass);
				self.itemIndex = 0;
			}else{
				//alert(1);
				// self.$scrollCont.animate({marginLeft: -self.availableDistance}, opts.scrollSpeed, opts.easing);
				// self.$leftHandler.addClass(self.opts.disabledClass);
				// self.$rightHandler.removeClass(self.opts.disabledClass);
				// self.itemIndex = self.itemsWidthAry.length - 1;
			}
		},
		changeTabName: function(name, i){
			var self = this;
			i*=1;
			if(i >= 0){
				self.$tabs.eq(i).find('span').html(name);
				//self.$tabContents.eq(index).remove();
			}
		}
	}
	
	Tabs.dropdownStr = function(arr){
		var s = '[';
		var a = [];
		$.each(arr,function(i,v){
			a.push('{val:'+v.val+',text:\''+v.text+'\'}');
		});
		s += a.join(',');
		s += ']';
		return s;
	}

	
	$.fn.tabs = function(opt){
		var opts = $.extend({},$.fn.tabs.defaults,opt)
		var isCreated = $(this).data('Tabs_handle');
		return (!!isCreated) ? isCreated : new Tabs(this,opts);
	}
	$.fn.tabs.defaults = {
		tabs:[],
		tabc:[],
		dropdowns:[],
		tabid:null,
		defaultIndex: null,
		openType: 'click', /*打开tab的触发事件类型*/
		easing:'',
		speed: 100,
		onActive: null,
		maxtab:100,
		mintab:1,
		newtab: {title: 'new tab',content: 'new content'},
		scrollDistance:1,//滚动距离，1：滚动一项，2：滚动一屏(如果最后一个元素超出则滚动到此元素)
		scrollSpeed:100,//滚动速度，毫秒
		easing:'',
		disabledClass:'disabled',
		callback: null,
		type:'tab',//为适应不同的应用而区别程序，tab, pagination
		centerNum: 1, //适应pagination而设置的中间值
		disabledClass:'disabled',//按钮禁用样式
		leftHandler: '.leftHandler',//左按钮
		rightHandler: '.rightHandler',//右按钮
		scrollMask: '.scrollMask',//scroller内容容器遮罩
		scrollCont: '.scrollCont'//scroller内容容器
	}
})(jQuery);