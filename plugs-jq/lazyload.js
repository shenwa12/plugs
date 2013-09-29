(function($){
	/**
	 * LazyLoad 惰加载插件
	 * mailTo: willian12345@126.com
	 * eg:
	 * var ll = $('img').lazyload({placeholder:true, preloadOffset:0, effect:true});
	 * 
	 * 动态载入后需要重新调一次load来注册新加入dom的img
	 * eg:
	 * ll.load(container);
	 * container参数: 可选参数, 指示新插入的img的父容器，则可提高效率缩小查找范围
	 */
	function LazyLoad (_this,opts){
		this.$el = $(_this);
		this.elementsTop = [];/*需要进行load的dom标签offset top值*/
		this.visibleHeight = $(window).height();/*网页可视区域*/
		this.loader = opts.loader;
		this.preloadOffset = opts.preloadOffset;/*滚动到并加载的偏移量*/
		this.placeholder = opts.placeholder;
		this.effect = opts.effect;
		this.scTop = 0;
		this.init();
	}
	LazyLoad.prototype.init = function (){
		var self = this;
		self.sigupImage();
		self.intersect();
		$(window).scroll(function(){
			self.intersect();
		});
	}
	
	LazyLoad.prototype.sigupImage = function(){
		var self = this;
		self.$el.each(function(){
			var t = $(this).offset().top;
			if(t > self.visibleHeight){
				self.elementsTop.push({top:$(this).offset().top, image:this, loaded:false});
			}else{
				if($(this).attr('rel')) $(this).attr('src',$(this).attr('rel')).removeAttr('rel');
			}
		});
	}
	
	LazyLoad.prototype.intersect = function (){
		var self = this;
		self.scTop = $(window).scrollTop();
		for (var i = 0,len = self.elementsTop.length; i < len; i++) {
  			if (!self.elementsTop[i].loaded && self.scTop >= self.elementsTop[i].top -  self.visibleHeight - self.preloadOffset) {/*判断元素是否在可视区域内*/
  				nowElement = self.$el.eq(i);
  				self.elementsTop[i].loaded = true;/*已加载过的就不再重复加载*/
  				var $img = $(self.elementsTop[i].image)
  				$img.attr('src',$img.attr('rel')).removeAttr('rel');
  				
  				if(self.placeholder) {/*显示loading动画*/
  					var left = $img.offset().left  + $img.width() * .5;
  					var top = $img.offset().top  + $img.height() * .5;
  					var $str = $('<div style="position: absolute; z-index: 999; left:'+ left +'px; top:'+ top +'px; background: url(resource/image/more_loading.gif) no-repeat; width:16px; height:16px"></div>');
  					$('body').append($str);
  					$img[0].onload = function(){
  						$str.remove();
  						if(self.effect){
  							$img.css({display:'none'});
  							$img.fadeIn('slow');
  						}
  					};
  				}
  			} else {
  				continue;
  			}	
  		};
  		
  		if(self.elementsTop.length > 0){/*移除无需加载的数组项,减少循环次数*/
  			self.elementsTop = $.grep(self.elementsTop, function(i){
  				return (i.loaded) ? false : true;
  			});
  		}
	}
	
	/*为动态加入dom的img注册lazyload*/
	LazyLoad.prototype.load = function($cont){
		var self = this;
		(!!$cont) ? $cont = $($cont) : $cont = $('body');
		var imgs = $cont.find('img');
		self.$el = $.grep(imgs,function(i){
			return !!$(i).attr('rel');
		});
		self.$el = $(self.$el);
		self.sigupImage();
	}
	
	$.fn.lazyload = function(options){
		return new LazyLoad(this,$.extend({},$.fn.lazyload.defaults,options));
	}
	$.fn.lazyload.defaults = {
		loader: 'resource/image/more_loading.gif',/*loading小图标*/
		preloadOffset: 0,/*距离滚动条加载*/
		placeholder: false,/*是否显示loading*/
		effect: false/*是否动画效果显示*/
	}
})(jQuery);