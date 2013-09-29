;(function($){
	var Template = {
		slider: '<div>'
			    	+ '<div class="bar"></div>'
			        + '<div class="handle" style="left:0%;"></div>'
			        //+ '<input type="range" value="150,200" name="range1" />'
			    + '</div>',
		bar: '<div class="handle" style="left:0%;"></div>',
		class: {
			range:'range',
			bar: 'bar',
			handle: 'handle',
			cur: 'cur'
		}
	}

	/**
	 * [getAttrs 获得所有dom自定义属性]
	 * @param  {[type]} dom [dom标签]
	 * @return {[type]}     [自定义属性对象eg: {val:123,gid:342,text:'helloworld'}]
	 */
	var FILTER_ATTRS_ARRAY = ['required','width', 'disabled', 'name', 'attr', 'search', 'type' ,'id', 'min', 'max', 'step', 'value']; 
	var getAttrs = function(dom){
		var o = {};
		if(!dom){
			o = null;
		}
		if(dom.attributes){
			for(var i=0, len = dom.attributes.length; i<len; i++){
				var key = dom.attributes[i].nodeName;
				if($.inArray(key, FILTER_ATTRS_ARRAY) > -1) continue;
				o[key] = dom.attributes[i].nodeValue;
			}
		}
		return o;
	};


	function Slider (_this,_opts){
		this.$el = $(_this);
		this.opts = _opts;
		this.$bar = null; //进度条
		this.sliderWidth = 0; //slider宽度
		this.sliderX = 0; //slider x 值
		this.$lHandler = null; //range 左手柄 
		this.$lHandlerWidth = 0; //range 左手柄宽度 
		this.$rHandler = null; //range 右手柄
		this.$rHandlerWidth = 0; //range 右手柄宽度

		this.loaded = 0; //进度条当前进度值
		this.isMousedown = false;
		this.currentOffsetX = 0;//点击处与点击对象的x坐标差值
		this.$currentHandler = null; //当前拖动的手柄
		this.$currentHandlerPosX = 0; //当前拖动手柄的百分比位置
		this.isLeftHandle = true;
		this.changeEvent = null;
		this.currentStepLeftHandler = null;
		this.currentStepRightHandler = null;
		this.$input = null;
		this.$input1 = null;//range 状态会创建两个range标签表示起点值与终点值
		
		this.init();
	};
	
	Slider.prototype = {
		init: function () {
			var self = this, opts = this.opts;
			var type, _val, _min, _max, _step;
			var value;
			var $handlers;
			var $range = self.$el.parent('.range');

			
			if(self.$el[0].tagName === 'INPUT' && self.$el[0].type === Template.class.range && !$range.length){///
				type = self.$el.attr('direction');
				
				if(type === 'center'){//input[type=range]
					self.opts.range = 'range';
					_val = self.$el.data('default');
					if(_val) _val = _val.split(',');
				}else{
					_val = self.$el.val();
					if(type === 'ltr')self.opts.range = 'min';
					if(type === 'rtl')self.opts.range = 'max';
				}

				value = _val;

				opts.min = (self.$el.attr('min') || 0) >> 0;
				opts.max = (self.$el.attr('max') || 100) >> 0;
				opts.step = (self.$el.attr('step') || 1) >> 0;

				if(!self.opts.range) self.opts.range = 'min'; //默认为min

				self._view();
			}

			
			if(opts.step){
				opts.step = opts.step / (opts.max - opts.min) * 100;
			}
		
			
			self.$bar = self.$el.find('.'+Template.class.bar);
			self.sliderX = self.$el.offset().left;
			self.sliderWidth = self.$el.width();

			if(self.opts.range === 'range'){
				$handlers = self.$el.find('.'+Template.class.handle);
				self.$lHandler = $handlers.eq(0);
				self.$rHandler = $handlers.eq(1);
				self.$lHandlerWidth = self.$lHandler.width();
				self.$rHandlerWidth = self.$rHandler.width();
				self.bindEvent();
				
				if($.isArray(value) && value.length >= 2){
					value[0] = ((value[0] - self.opts.min) / (self.opts.max - self.opts.min)) * 100;
					value[1] = ((value[1] - self.opts.min) / (self.opts.max - self.opts.min)) * 100;
					self.$lHandler.css('left',value[0]);
					self.$rHandler.css('left',value[1]);
					self.setVal(value);
				}
			}else if(self.opts.range === 'min' || self.opts.range === 'max'){

				if(self.opts.range === 'max') self.$bar.css({'right':''});///
				$handlers = self.$el.find('.'+Template.class.handle);
				self.$lHandler = $handlers.eq(0);
				self.$lHandlerWidth = self.$lHandler.width();
				value = (value - self.opts.min) / (self.opts.max - self.opts.min) * 100;
				self.$lHandler.css('left',value);
				self.setVal(value);
				self.bindEvent();
			}
			
		},
		_view: function (){
			var s = [];
			var $tmpl = $(Template.slider);
			this.$input = this.$el;
			if(this.opts.range === 'range'){
				$tmpl.append(Template.bar);
				this.$input1 = this.$input.clone().removeAttr('id');
				$tmpl.append(this.$input1);
			}
			$tmpl.attr(getAttrs(this.$el[0])).addClass(this.opts.range).addClass(Template.class.range);
			this.$el.before($tmpl);
			$tmpl.append(this.$input);
			
			this.$el = $tmpl;
		},
		bindEvent: function () {
			var self = this;
			if(self.$lHandler !== null){
				self.$lHandler.bind('mousedown', function(e){
					self.isMousedown = true;
					self.$currentHandler = self.$lHandler;
					self.$currentHandlerPosX = self.$currentHandler.position().left;
					self.currentOffsetX = e.clientX;
					self.mousemove();
					self.$currentHandler.addClass(Template.class.cur);
					if(self.$rHandler !== null){
						self.$rHandler.removeClass(Template.class.cur);
					}
					self.isLeftHandle = true;
				});
			}
			
			if(self.$rHandler !== null){
				self.$rHandler.bind('mousedown', function(e){
					self.isMousedown = true;
					self.currentOffsetX = e.clientX;
					self.$currentHandler = self.$rHandler;
					self.$currentHandlerPosX = self.$currentHandler.position().left;
					self.mousemove();
					self.$currentHandler.addClass(Template.class.cur);
					if(self.$lHandler !== null){
						self.$lHandler.removeClass(Template.class.cur);
					}
					self.isLeftHandle = false;
				});
			}
		},
		mousemove: function() {
			var self = this;
			$(document.body).bind('mousemove', function(e){
				if(self.isMousedown){
					var mouseMoveDistance = e.clientX - self.currentOffsetX;
					var leftBound, rightBound, w, leftPercent, moveValuePercent;
					//self.$currentHandler.css('cursor','default');
					
					if(self.opts.range === 'range'){
						var posX = (( self.$currentHandlerPosX / self.sliderWidth) + ((mouseMoveDistance)/self.sliderWidth));
						if(self.$currentHandler === self.$lHandler){//左手柄范围
							rightBound = self.$rHandler.position().left / self.sliderWidth;
							leftBound = 0;
						}
						
						if(self.$currentHandler === self.$rHandler){//右手柄范围
							rightBound = 1;
							leftBound = self.$lHandler.position().left / self.sliderWidth;
						}
						if(posX < leftBound){
							posX = leftBound;
						}else if(posX >= rightBound){
							posX = rightBound;
						}
						//限制手柄x轴移动范围posX >= leftBound &&　posX < rightBound)
						posX *= 100;
						self.rangeMove({handler:self.$currentHandler, posX: posX});
						
					}else if(self.opts.range === 'min' || self.opts.range === 'max'){
						rightBound = 1;
						leftBound = 0;
						var posX = (( self.$currentHandlerPosX / self.sliderWidth) + ((mouseMoveDistance)/self.sliderWidth));
						if(posX < leftBound){
							posX = leftBound;
						}else if(posX >= rightBound){
							posX = rightBound;
						}
						posX *= 100;
						if(self.opts.range === 'min'){
							self.minMove({handler:self.$currentHandler, posX: posX});
						}else{
							self.maxMove({handler:self.$currentHandler, posX: posX});
						}
					}
				}
			}).bind('mouseup', function(e){
				self.isMousedown = false;
				//self.$currentHandler.css('cursor','pointer');
				$(document).unbind('mousemove');
			});
			
		},
		update: function (loadedPercent) { //update 百分比值 0-1
			var self = this;
			//var barWidth = loadedPercent * self.sliderWidth; // bar real width
			self.$bar.animate({width: (loadedPercent * 100 + '%')}, self.opts.easingSpeed, self.opts.easing);
			self.loaded = loadedPercent;
			if(self.opts.slide){
				if(!self.opts.range){
					self.opts.slide(self.loaded);
				}
			}
		},
		setVal: function (value){
			var self = this;
			var range = self.opts.range;

			if(range === 'range'){
				self.rangeMove({
					handler:self.$lHandler,
					posX: value[0]},
					{handler:self.$rHandler, 
					posX: value[1]});
			}else if(range === 'min'){
				self.minMove({handler:self.$lHandler, posX: value});
			}else if(range === 'max'){
				self.maxMove({handler:self.$lHandler, posX: value});
			}
		},
		rangeMove: function (p1, p2){//左右手柄

			var self = this;
			var _opts = self.opts;
			var step = _opts.step;
			var callback = _opts.slide;
			var x1, x2;
			var lhand = parseFloat(self.$lHandler.css('left')) / 100;
			var rland = parseFloat(self.$rHandler.css('left')) / 100;
			var realValueL = (lhand * (_opts.max - _opts.min) + _opts.min*1);
			var realValueR = (rland * (_opts.max - _opts.min) + _opts.min*1);
			//console.log((rland * (_opts.max - _opts.min) + _opts.min));
			

			if(!!step){//如果设有间隔值则 val = Math.round(val / interval) * interval;
				x1 = Math.round(p1.posX / step) * step;

				if(p2){
					x2 = Math.round(p2.posX / step) * step;
				}
			}else{
				x1 = p1.posX;
				if(p2){
					x2 = p2.posX;
				}
			}

			p1.handler.css({left: x1 + '%'});
			if(p2){
				p2.handler.css({left: x2 + '%'});
			}
			var leftPercent = (self.$lHandler.position().left / self.sliderWidth) * 100;
			self.$bar.css({left: leftPercent + '%'});
			var w = ((self.$rHandler.offset().left - self.$lHandler.offset().left) / self.sliderWidth) * 100;
			self.$bar.css({width: w + '%'});
			
			//self.writeValue((leftPercent + _opts.min).toFixed(_opts.toFixed)+ ',' +(leftPercent + w + _opts.min).toFixed(_opts.toFixed));
			if(this.currentStepLeftHandler != x1 || this.currentStepRightHandler != x2){
				self.writeValue(realValueL, realValueR);
				self._change(x1, x2, realValueL, realValueR);
			}
			self.currentStepLeftHandler = x1;
		},
		minMove: function(p1){//最小值手柄

			var self = this;
			var _opts = self.opts;
			var step = _opts.step;
			var callback = _opts.slide;
			var x1 = p1.posX;

			
			if(!!step){
				x1 = Math.round(x1 / step) * step;
				
			}

			p1.handler.css({left: x1 + '%'});
			var w = ((self.$lHandler.offset().left - self.sliderX + self.$lHandlerWidth * .5 ) / self.sliderWidth) * 100;
			self.$bar.css({width: w + '%'});
			//百分比+区间差除以100+最小值
			var realValue = (x1 * (_opts.max - _opts.min) / 100 ) + _opts.min;
			if(this.currentStepLeftHandler != x1){
				
				self.writeValue(realValue);
				self._change(x1,realValue);
			}
			self.currentStepLeftHandler = x1;
		},
		maxMove: function (p1){
			var self = this;
			var _opts = self.opts;
			var step = _opts.step;
			
			var x1 = p1.posX;
			
			if(!!step){
				x1 = Math.round(x1 / step) * step;
			}
			p1.handler.css({left: x1 + '%'});
			var w = (((self.sliderX + self.sliderWidth) - self.$lHandler.offset().left - 6) / self.sliderWidth) * 100;
			self.$bar.css({width: w + '%'});
			//百分比+区间差除以100+最小值
			var realValue = (x1 * (_opts.max - _opts.min) / 100 ) + _opts.min;

			if(this.currentStepLeftHandler != x1){
					self.writeValue(realValue);
					self._change(x1,realValue);
			}
			self.currentStepLeftHandler = x1;
		},
		_change: function(a, b){
			var callback = this.opts.slide;
			if($.isFunction(callback)){
				callback(a, b);
			}
			if($.isFunction(this.changeEvent)){
				this.changeEvent.call(this, a, b);
			}
		},
		_setBarTitle: function(v1, v2){
			v1 = Math.round(v1);
			if(this.opts.range === 'range'){
				v2 = Math.round(v2);
				this.$rHandler.attr('title', v2);
			}
			this.$lHandler.attr('title', v1);
		},
		writeValue: function(v1,v2){
			v1 = Math.round(v1);
			
			this._setBarTitle(v1, v2);
			if(this.opts.range === 'range'){
				v2 = Math.round(v2);
				this.$input1.val(v2);
			}
			this.$input.val(v1);
		},
		change: function(fun){
			if(!$.isFunction(fun)) return;
			this.changeEvent = fun;
			return this;
		},
		getVal: function(){
			var r;
			if(this.opts.range === 'range'){
				r = [this.$input.val(), this.$input1.val()];
			}else{
				r = this.$input.val();
			}
			return r;
		}
	};
	
	$.fn.slider = function(opt){
		var ret = [];
		
		this.each(function() {
			var handle = $(this).data("slider_handle");
			if(!handle){
				handle = new Slider($(this), $.extend(true, {}, $.fn.slider.defaults, opt));
				$(this).data("slider_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	};
	
	$.fn.slider.defaults = {
		range:false,	// 'min', 'max', true
		name:'',
		step:1,			//默认间隔
		start:0,			//最小值%
		end:100,		//最大值%
		value:0,		//默认进度%
		easing:'swing',	//默认动画
		easingSpeed:100,//默认动画速度
		slide: null,		//拖动回调
		//颜色类型
		colorType: 'blueIt'
	};
})(jQuery);