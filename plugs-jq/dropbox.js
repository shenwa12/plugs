;(function ($){
	/**
	 * [dropbox 下拉层组件]
	 * eg:
	 * html:
	 * 		<button type="button" class="dropdown-toggle" data-toggle="dropdown" id="btn" data-dropmenu="[{val:1,text:'hello'},{val:2,text:'world'}]">hello</button>
	 * javascript:
	 * 		$('#btn1').dropdown();
	 * 	
	 */
	var templete = '<div class="dropBox down"></div>';
	var toggle = '[data-toggle=dropbox]';
	var $positionLayoutWrap = $('#positionLayoutWrap');///
	var $body = $(document.body);
	var zIndex = {max:10000, min:20, cur:20};

	/**
	 * [checkBoardary 下拉层垂直边界判断]
	 * @param  {[type]} stageHeight [window 高度]
	 * @param  {[type]} $drop       [要判断的层]
	 * @param  {[type]} $trigger    [触发器]
	 * @param  {[type]} offsetX     [计算时偏移X]
	 * @param  {[type]} offsetY     [计算时偏移Y]
	 * @return {[type]}
	 */
	var checkBoardary = function(stageHeight, $drop, $trigger, offsetX, offsetY){
		offsetX = offsetX || 0;
		offsetY = offsetY || 0;
		var triggerHeight = $trigger.outerHeight(true);
		var triggerTop = $trigger.offset().top;
		var dropHeight = $drop.outerHeight(true);
		var rect = {};
		var optsX = 0;
		if(!!$trigger.data('opts')) {
			optsX = $trigger.data('opts').x || 0;
		}
		rect.x = $trigger.offset().left + optsX;
		rect.y = triggerTop + triggerHeight -  $(window).scrollTop();
		if(rect.y < 0){
			rect.y = dropHeight;
		}
		rect.width = $drop.outerWidth(true);
		rect.height = dropHeight;
		if(rect.y + Math.abs(rect.height) > stageHeight && rect.y > rect.height){
			$drop.css({bottom: -(triggerTop-$(window).height()) -1, left:rect.x, top:'auto'}).removeClass('down').addClass('up');///
		}else{
			$drop.css({top:triggerTop + triggerHeight - 1,  left:rect.x, bottom:'auto'}).removeClass('up').addClass('down');///
		}
	}

	/**
	 * window resize 判断所有dropbox位置
	 */
	$(window).resize(function(){
		var stageHeight = $(this).height();
		$('.dropBox').each(function(){
			var $this = $(this);
			var $trigger = $this.data('dropbox.trigger')
			if($trigger){
				checkBoardary(stageHeight, $this, $trigger);
			}
		});
	});
	/**
	 * [滚动时关闭所有dropbox keep属性除外]
	 */
	window.addEventListener('mousewheel', function(){
		clearMenus();
	});
	$(window).keyup(function(e){
		if(e.which === 27){
			clearMenus();
		}
	});

	Dropbox = function (el, options) {
		this.$el = $(el);
	    this.options = options;
		this._init();
	};
	Dropbox.prototype = {
		constructor: Dropbox,
		_init: function(){
			this.$drop = null;
			var keep = this.$el.data('keep');
			if(this.options.keep){
				this.$el.data('keep', this.options.keep);
				this.$el.data('opts', this.options);
			}else if(keep){
				this.options.keep = keep;
			}
		},
		_createBox: function(html){
			var $s = $(templete);
			//var $container = this.options.rootContainer;
			$s.html(html).data('dropbox.trigger', this.$el);
			$s.css({top: this.$el.offset().top + this.$el.outerHeight(true) + this.options.y, left: this.$el.offset().left + this.options.x}).data('keep', this.options.keep);

			try{
				if(!yp.global.zIndex){
					throw new Error();
				}
				$s.css('z-index', ++yp.global.zIndex);

			}catch(e){
				zIndex.cur++;
				if(zIndex.cur > zIndex.max){
					zIndex.cur = zIndex.min;
				}
				$s.css({
					zIndex: zIndex.cur
				});
			}

			if($positionLayoutWrap && $positionLayoutWrap.length){
				$positionLayoutWrap.append($s)
			}else{
				$body.append($s)
			}
			

			this.$drop = $s;
			$s.attr(this.options.attr);
			if(this.options.attr['search']){
				$s.attr('search','');
			}
			this.$drop[0].addEventListener('mousewheel', function(e){
				e.stopPropagation();
			});
		},
		show: function(html){
			this.$el.addClass('cur');
			this._createBox(html);
			if(this.options.width){
				this.width(this.options.width>>0);
			}
			checkBoardary($(window).height(), this.$drop, this.$el);
			return this;
		},
		hide: function(){
			clearMenus(false, this.$el);
			this.$el.removeClass('cur');
			return this;
		},
		toggle: function(){
			var that = this;
			return ;///
			if(!$this.hasClass('cur')){
				if(!$this.data('dropbox')) return;
				this._createBox(this.options.html);
				$this.addClass('cur');
			}else{
				clearMenus(false, $this);
			}
		},
		width: function(w){
			if(this.$drop){
				if(w) return  this.$drop.css('width',w);
				return this.$drop.width();
			}
		},
		height: function(h){
			if(this.$drop){
				if(h) return  this.$drop.height(h);
				return this.$drop.height();
			}
		}
	};

	function clearMenus(flag, trigger){
		var $trigger;
		if(!flag){
			$('.dropBox').remove();
			$(toggle).removeClass('cur');
		}else{
			$trigger = $(trigger);
			$trigger.length && $trigger.removeClass('cur');
			$('.dropBox').each(function(){
				if(!$(this).data('keep')){
					$(this).remove();
				}
			});
			$(toggle).each(function(){
				if(!$(this).data('keep')){
					$(this).removeClass('cur');
				}
			})
		}
	};

	$.fn.dropbox = function (options) {
		var arr = [];
	    this.each(function () {
			var $this = $(this)
				, data = $this.data('dropbox')
			if (!data){
				$this.data('dropbox', (data = new Dropbox(this, $.extend({}, $.fn.dropbox.defaults, options))))
			}
			arr.push(data);
	    });
	    if(arr.length > 1) return arr;
	    if(arr.length === 1) return arr[0]; 
	    return arr;
	};
	$.fn.dropbox.defaults = {
		html:''
		,width:null
		,height:''
		,attr:{}
		,x:0
		,y:0
		,keep:false
		,rootContainer:null
	};
	$.fn.dropbox.Constructor = Dropbox;
	//外部设置zIndex值
	var setZindex = function(a, b){
		zIndex.max = b;
		zIndex.min = a;
		zIndex.cur = a;
	};
	$.fn.dropbox.data = function(){
		var a = arguments[0];
		var b = arguments[1];
		var c = arguments[2]
		if(a === 'rootContainer'){
			$positionLayoutWrap = $(b);
		}else if(a==='zIndex'){
			setZindex.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
	//全局事件添加
	$(function () {
	   $(document.body).on('dropbox.click', clearMenus);
	   $(document.body).on('click', clearMenus);
	});
})(window.jQuery);