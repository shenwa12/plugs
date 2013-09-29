;(function($){
	var ITEM_WIDTH = 30;
	//depend on jquery 1.7.1.js、selector.js
	function Pagination(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$pageGo = null;//垂直分页
		this.$pageInfo = null;//分页信息
		this.$numbers = null; /*分页容器*/
		this.numbersWidth = 0; //遮罩宽度
		this.$numbersUL = null; /*分页所在ul*/
		this.$lHandler = null;
		this.$rHandler = null;
		this.firstBtn = null;
		this.lastBtn = null;
		this.lis = null;
		this.leftArray = [];	//各个li偏移相对0点值
		this.widthsArray = [];	//各个li的宽度
		this.totalWidth = 0;	//所有li的宽度
		this.available = 0; 	//可移动距离
		this.index = 0;			//当前li index指针,用于指定当前所在widthsArray中哪一项
		this.maxIndex = 0;		//最大li index指针值
		this.centerNum = 0;		//分页可视区域中间li
		this.lastClick = 0;		//上一次点击的li index值
		this.currentClick = 0;	//当前点击的li index值(index值有可能发生改变)
		this.currentPage = -1; 	//当前所在分页
		this.totalPage = 0; //总页数
		this.init();
	}
	Pagination.prototype = {
		init: function () {
			var self = this;
			var opts = self.opts;
			self._view();
			self.$numbers = self.$el.find('div.numbers').width((opts.num * ITEM_WIDTH));
			self.$numbersUL = self.$numbers.find('ul');
			self.$pageInfo = self.$el.find('span.pageInfo');
			//初始化分页数据
			self.createPageNum();
			//操作分页
			self.$lis = self.$numbersUL.find('li');
			self.$lHandler = self.$el.find('span.prev');
			self.$rHandler = self.$el.find('span.next');
			self.firstBtn = self.$el.find('span.first');
			self.lastBtn = self.$el.find('span.last');
			self.numbersWidth = self.$numbers.outerWidth(true);
			self.getWidths();
			
			if(opts.pageGo){
				self.createPageGo();
			}
			
			if(opts.pageInfo){
				self.createPageInfo();
			}

			//初始化移动项目
			self.available = self.totalWidth - self.numbersWidth;
			self.centerNum = opts.num;
			self.maxIndex = self.getMaxIndex() + self.centerNum + 1;
			self.lastClick = self.centerNum;
			self.currentClick = self.centerNum;
			self._bindEvent();
			self._flip(opts.curPage - 1);
		},
		_view : function (){
			var opts = this.opts;
			var s = [];
			s.push('<div class="page">');
			if(opts.pageGo){
				s.push('<div class="pageGo">');
				s.push('<select><select>');
				s.push('</div>');
			}
			if(opts.pageInfo){
				s.push('<span class="pageInfo">共<strong>1</strong>页<strong>0</strong>条</span>');
			}
			if(opts.pageNum){
				s.push('<div class="pageNum">');
				if(opts.showFirst){
					s.push('<span class="first"><a href="javascript:"><i></i></a></span>');
				}
				if(opts.showPrev){
					s.push('<span class="prev"><a href="javascript:"><i></i></a></span>');
				}
				if(opts.showNumbers){
					s.push('<div class="numbers">');
					s.push('<ul>');
					s.push('</ul>');
					s.push('</div>');
				}
				if(opts.showNext){
					s.push('<span class="next"><a href="javascript:"><i></i></a></span>');
				}
				if(opts.showLast){
					s.push('<span class="last"><a href="javascript:"><i></i></a></span>');
				}
				s.push('</div>');
				s.push('</div>');
			}
			this.$el.html(s.join(''));
		},
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			var callback = opts.onActive;
			
			self.$numbersUL.delegate('li', 'click', function(e){
				var index = $(this).index();
				$(this).addClass('cur').siblings().removeClass('cur');
				self.flip(index);
				//e.stopPropagation();///
			});
			
			
			self.$lHandler.click(function(){
				self.animateToRight();//内容向右移动
				if(self.currentPage >= 1){
					self._flip(self.currentPage - 1);
				}
			});
			
			self.$rHandler.click(function(){
				self.animateToLeft();//内容向左移动
				if(self.currentPage < self.totalPage - 1){
					self._flip(self.currentPage + 1);
				}
			});
			
			self.firstBtn.click(function(){
				self.$lis.first().addClass('cur').siblings().removeClass('cur');
				self.$numbersUL.animate({marginLeft:0},{duration:100,complete:function(){
					//console.log('ff');
				}});
				self.index = 0;
				self.lastClick = self.centerNum;
				
				self.flip(0);//翻页
			});
			self.lastBtn.click(function(){
				self.$lis.last().addClass('cur').siblings().removeClass('cur');
				self.$numbersUL.animate({marginLeft:-self.countLeftAvaliableWidth()},{duration:1,complete:function(){
					//console.log('ff');
				}});
				self.lastClick = self.maxIndex;
				self.flip(self.totalPage - 1);//翻页
			});
			
		},
		animateToLeft: function (){
			var self = this;
			var step = self.widthsArray[self.index];
			var marginLeft = parseInt(self.$numbersUL.css('margin-left'));
			if(!!step && Math.abs(marginLeft) < Math.abs(self.available)){
				self.$numbersUL.animate({marginLeft:'-='+step},{duration:100,complete:function(){
				}});
				self.index++;
			}
		},
		animateToRight: function (){
			var self = this;
			var step;
			if(self.index > 0) step = self.widthsArray[--self.index];
			var marginLeft = parseInt(self.$numbersUL.css('margin-left'));
			if(!!step && marginLeft < 0){
				self.$numbersUL.animate({marginLeft:'+='+step},{duration:100,complete:function(){
				}});
			}
		},
		getWidths: function(){
			var self = this;
			var t = 0;
			self.totalWidth = 0;
			self.leftArray = [];
			self.widthsArray = [];
			
			self.$lis.each(function(){
				w = $(this).outerWidth(true);
				t += w;
				self.leftArray.push(t);
				self.widthsArray.push(w);
			});
			self.totalWidth = t;
		},
		countWidthByIndex: function (index){
			var self = this;
			var w = 0;
			while(index >=0 ){
				w += self.widthsArray[index];
				index--;
			}
			return w;
		},
		countLeftAvaliableWidth: function(){/*找到最后符合的li位置*/
			var self = this;
			var i = 0;
			var len = self.widthsArray.length ;
			var w = 0;
			while(i < len){
				self.index = i;
				if(w > Math.abs(self.available)) return w;
				w += self.widthsArray[i];
				i++;
			}
			return w;
		},
		getAvaliableMove: function(index){
			var self = this;
			var w = 0;
			var i = 0;
			var marginLeft = Math.abs(parseInt(self.$numbersUL.css('margin-left')));
			//console.log(i,index);
			while(i < index){
				w = self.countWidthByIndex(i);
				//console.log(liWidth, Math.abs(self.available));
				if(w > Math.abs(self.available)){
					 self.index = i + 1;//重定向self.index指针
					 return w;
				}
				//console.log(w);
				i++;
			}
			return w;
		},
		getMaxIndex: function(){/*获得最大能移动的self.index值*/
			var self = this;
			var maxAvaliable = self.getAvaliableMove(self.widthsArray.length);
			
			self.index = 0;
			var i=0;
			//console.log(self.countWidthByIndex(i), maxAvaliable);
			while(self.countWidthByIndex(i) < maxAvaliable){
				i++;
			}
			return i;
			
		},
		flip: function (i,isReload){
			var self = this;
			self.currentClick = i;
			var ot = 0; 
			var indexOffset = 0;

			if(self.currentClick < self.centerNum){
				self.currentClick = self.centerNum;
			}else if(self.currentClick  > self.maxIndex){
				self.currentClick = self.maxIndex;
			}
			if(self.currentClick > self.lastClick &&  self.currentClick > self.centerNum){
				indexOffset = self.currentClick - self.lastClick;//self.index 指针偏移量
				self.index += indexOffset;
				//console.log(self.index + '向左偏移');
				ot = self.getAvaliableMove(self.index);
				self.$numbersUL.animate({marginLeft:-ot},{duration:100,complete:function(){}});
				
			}else if(self.currentClick < self.lastClick){
				indexOffset = self.currentClick - self.lastClick;//self.index 指针偏移量
				self.index += indexOffset;
				if(self.index <= 0){
					self.index = 0;
					self.lastClick = self.currentClick;
				} 
				//console.log(self.index + '向右偏移');
				 ot = self.getAvaliableMove(self.index);
				 self.$numbersUL.animate({marginLeft:-ot},{duration:100,complete:function(){}});
			}
			self.lastClick = self.currentClick;
			
			self._flip(i,isReload);//翻页
		},
		_flip: function (i, isReload) {
			var self = this;
			var opts = self.opts;
			if(self.currentPage === i && !isReload) return false;//点击同一页不发生变化
			
			//调用对象实现pageInterface的接口的方法
			if($.isFunction(opts.pageInterface.interface_changeData)){
				opts.pageInterface.interface_changeData({data: self.showPage(i + 1), page: self});
			}
			if(opts.pageGo){
				self.pageGoflip(i);
			}
			self.currentPage = i;
			self.$lis.eq(i).addClass('cur').siblings().removeClass('cur');
			
		},
		createPageNum: function (){
			var self = this;
			var opts = self.opts;
			var s = [];
			var cur = '';
			var len = Math.ceil(opts.data.length / opts.perPage);
			if(opts.showNumbers){
				for(var i=1; i <= len; i++){
					s.push('<li><a href="javascript:void(0);">'+ i +'</a></li>');
				}
			}
			self.$numbersUL.append(s.join(''));
			self.totalPage = len;
			if(opts.curPage > len){
				opts.curPage = len;
			}
		},
		createPageGo: function (){
			var self = this;
			var s, $select, _sel;
			self.$pageGo = self.$el.find('.page > .pageGo');
			//创建垂直分页
			s = [], selected = '';
			for(var i=1;i<=self.totalPage; i++){
				(i===1) ?  (selected = 'selected') : selected = '';
				s.push('<option '+ selected +' value="'+ (i) +'">'+ i +'/页</option>');
			}
			$select = self.$pageGo.find('select');
			$select.append(s.join(''));
			_sel = $select.ypSelect();

			self.$pageGo.on('selector.expan', function(){
				_sel.$dropbox.on('click', 'li', function(){
					self.flip($(this).data('val') - 1);//翻页至当前页
				});
			});
		},
		createPageInfo: function(){
			var self = this;
			var opts = self.opts;
			var $strongs = self.$pageInfo.find('strong');
			$strongs.eq(0).text(Math.ceil(opts.data.length / opts.perPage));
			$strongs.eq(1).text(opts.data.length);
		},
		showPage: function (index){
			var self = this;
			var opts = self.opts;
			opts.curPage = index;
			index--;
			var s = [];
			var len = index * opts.perPage + opts.perPage;
			var dlen = opts.data.length;
			len = (len > dlen) ? dlen : len;//防超出数据总数
			
			if(dlen){
				for(var i=index * opts.perPage; i < len; i++){
					s.push(opts.data[i]);
				}
			}
			
			return s;
		},
		pageGoflip: function(index){//垂直分页翻页
			var self = this;
			self.index = index - 2;
			var $select = self.$pageGo.find('select').ypSelect().setIndexByVal(++index);
			self.$pageGo.find('.seltTit').text(index+'/页');
		},
		reload: function(data){
			this.opts.data = data;
			this.opts.curPage = 1;
			this.init();
			this._flip(0);
		}
	};
	
	
	$.fn.pagination = function(opt){
		var opts;
		var handle = $(this).data('pagination_handle');
		if(!handle){
			opts = $.extend({},$.fn.pagination.defaults,opt)
			handle = new Pagination(this, opts);
		}
		return handle;
	};
	$.fn.pagination.defaults = {
		centerNum:5,
		speed: 100,
		pageInterface: null,//分页对象提供的对外接口,分页的对象必须实现此接口
		data:[],//需要分页的数据
		curPage: 1,//当前所在页
		perPage: 4,//每页数据条数
		pageGo: false,
		pageInfo: false,
		pageNum: true,
		onSelected: null,
		//是否显示数字排
		showNumbers:true,
		//首页
		showFirst:true,
		//尾页
		showLast:true,
		//上一页
		showPrev:true,
		//下一页
		showNext:true,
		num:3
	};
})(jQuery);