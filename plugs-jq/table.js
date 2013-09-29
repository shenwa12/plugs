;(function($){
	var SCROLL_WIDTH = 10;//滚动条宽度
	/**
	 * [getAttrs 获得所有dom自定义属性]
	 * @param  {[type]} dom [dom标签]
	 * @return {[type]}     [自定义属性对象eg: {val:123,gid:342,text:'helloworld'}]
	 */
	var FILTER_ATTRS_ARRAY = []; 
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


	function Table(_this, opts){
		/**
		 * Tabel 实现 pageInterface 接口协议 interface_changeData方法  
		 */
		this.opts = opts;
		this.$el = $(_this);
		this.$table = null;
		this.$col = null;
		this.tableX = 0;
		this.tableHeight = 0;
		this.tableWidth = 0;
		this.$ths = null;//表头th集合
		this.$tds = null;//第一行td集合
		this.$currentTH = null;// 当前th
		this.$ths_length = 0;
		this.$currentTH_posX = null;// 当前th 坐标x
		this.$currentTH_width = 0;//当前th宽度
		this.$CRC = null;//当前调整手柄容器
		this.$tbody = null;
		this.$ft = null;
		this.isMousedown = false;
		this.currentOffsetX = 0;
		this.widths = [];
		this.thsWidth = [];
		
		this.originData = [];
		this.pager = null;//水平分页对象
		
		this.idHolder = null;

		this.dynamic = false; //是否动态数据表格
		this.headTable = null;
		this.bodyTable = null;
		this.tableid = null;

		this.attrArr = [];

		this.init();
	}
	Table.prototype = {
		init: function () {
			var self = this;
			var opts = self.opts;
			var $table, theadFix;
			self.idHolder = self.$el.attr('id');

			if(!opts.data && !self.$el.is('[data-tableid]') && !self.$el.data('url')){//静态数据表格
				w = (opts.width || self.$el.parent().width()) - SCROLL_WIDTH;
				//设置table宽度
				self.width = Table.convertUnit(w);
				//没有传入model数据 则从dom中提取model
				var o = {};
				var $ths = self.$el.find('thead > tr > th');
				var $trs = self.$el.find('tbody > tr');
				o.thead = [];
				o.tbody = [];
				!$.isArray(opts.thWidth) && (opts.thWidth=[]);
				$ths.each(function(i,v){
					o.thead.push({attr: getAttrs(this),text: $(this).html()});
					opts.thWidth.push($(this).attr('width') || '');
				});


				$trs.each(function(){
					var arr = [], $_tds = $(this).find('td');
					$_tds.each(function(){
						arr.push({attr: getAttrs(this), text:$(this).html()});
					});
					o.tbody.push({attr: getAttrs(this), tr: arr});
				});
				self.opts.data = o;
				self.$el = self.$el.wrap('<div></div>').parent();
				//从dom中读取配置///
				theadFix = self.$el.data('theadFix');
				if(theadFix){
					opts.theadFix = theadFix;
				}
			}else if(self.$el.data('url')){//动态数据表格
				self.$el = self.$el.eq(0);//表头（第一个表格）
				w = (self.$el.attr('width') || self.$el.parent().width()) - SCROLL_WIDTH;
				self.width =  w + 'px';
				self.dynamic = true;
				self.tableid = self.$el.data('tableid');
				self.$CRC = $(self._createResizeHandler());
				self.$col = self.$CRC.find('.CRZ');
				self.$el.after(self.$CRC);
				self.$ths = self.$el.find('th');
				self.$ths_length = self.$ths.length;
				self.$theadCont = self.$el.parent('.theadFix');
				$table = self.$table = self.$bodyTable = $('table[data-tableid='+ self.tableid +']');
				if(self.$bodyTable.length){
					self.$tbodyCont = self.$bodyTable.parent('.tbodyScroll');
					opts.theadFix = self.$tbodyCont.height();
				}else{
					console.log('f:[table.js/init]未找到表格体!');
					return ;
				}
				self.setTableHeight();
			}else if(opts.data){//数据源创建表格
				w = (opts.width || self.$el.parent().width()) - SCROLL_WIDTH;
				self.width = Table.convertUnit(w);
			}else{
				return ;
			}

			
			self.thsWidth = opts.thWidth || [];
			if(!self.dynamic){
				//初始化表格及相关结构
				self.tableView();
				if(!opts.theadFix){
					//单表格
					$table = self.$table = self.$el.find('table');
				}else{
					//拆分成两个表格
					self.$theadCont = self.$el.find('div.theadFix');
					self.$tbodyCont = self.$el.find('div.tbodyScroll');
					
					if(opts.theadFix && self.$tbodyCont) self.$tbodyCont.height(opts.theadFix);//行数*行高
					$table = self.$table = self.$tbodyCont.find('table');
				}
			
				self.initTableView();
				//初始化一些界面
				self.initView();
				
				self.$tbody = $table.find('tbody');
				self.$ft = opts.page.container || $($(opts.page.container)[0] || ('#' + self.idHolder + 'Page'));
				
				
				//初始化拖拽条
				if(opts.resize && !self.dynamic){
					self.$CRC = self.$el.find('.CRC');
					self.$col = self.$CRC.find('.CRZ');
					self.setTableHeight();
				}
				
				//保存原始数据
				self.originData = $.extend(self.originData,opts.data.tbody);
				//self.originData = opts.data.tbody;

				//创建分页
				self.setPage(opts.data.tbody);
				//根据设置默认参数设置ui
				if(opts.zebra){
					self.$el.find('table').addClass('zebra');
				}
				if(opts.grid){
					self.$el.find('table').addClass('grid');
				}

				//派发表格创建事件
				self.$el.trigger({
					type: 'dom.create',
					domTrigger: self.$el,
					domTarget: self.$tbody,
					dom: self.$el
				});
			}
			self.tableX = $table.offset().left;
			//绑定事件
			self.bindEvent();
			
			//计算设置各ui宽度
			self.set_tds_width();
			self.resizeWin();

			self.$el.data("table_handle", self).find('table').each(function(){
				$(this).data("table_handle", self);
			});
		},
		tableView: function (){
			var  s = '';
			if(!this.opts.theadFix){
				s = '<table class="table TLF" style="width:'+ this.width +'"></table></div>';
			}else{
				s = '<div class="theadFix"><table class="table TLF" style="width:'+ this.width +'"><thead><tr></tr></thead></table></div><div class="tbodyScroll"><table class="table TLF" style="width:'+ this.width +'"></table></div>';
			}
			this.$el = this.$el.html(s);
		},
		initTableView: function(){
			var self = this;
			var data = self.opts.data;
			var $thead,$th,$td,$tr,$tbody;
			if(!this.opts.theadFix){
				$thead = $('<thead>');
				for(var i = 0; i < data.thead.length; i++){
					$th = $('<th>');
					$th.attr('width',(this.thsWidth && this.thsWidth[i] || '')).html(data.thead[i].text);
					if(data.thead[i].attr){
						$th.attr(data.thead[i].attr);
					}
					$thead.append($th);
				}
			}
			
			$tbody = $('<tbody>');
			for(i=0; i<data.tbody.length; i++){
				$tr = $('<tr>');
				for(var j =0; j< data.tbody[i].tr.length ;j++ ){
					$td = $('<td>').attr('width',(this.thsWidth && this.thsWidth[i] || '')).html(data.tbody[i].tr[j].text);
					
					if(data.tbody[i].tr[j].attr){
						$td.attr(data.tbody[i].tr[j].attr);
					}
					$tr.append($td);
				}
				if(data.tbody[i].attr){
					$tr.attr(data.tbody[i].attr);
				}
				$tbody.append($tr);
			}
			self.$table.append($thead).append($tbody);
		},
		initView: function () {
			var self = this;
			var data = self.opts.data;
			var $tr,$th
			if(this.opts.theadFix){
				//建立thead
				$tr = $('<tr>');
				for(var i = 0; i < data.thead.length; i++){
					$th = $('<th>');
					$th.attr('width',(this.thsWidth && this.thsWidth[i] || '')).html(data.thead[i].text);
					if(data.thead[i].attr){
						$th.attr(data.thead[i].attr);
					}
					$tr.append($th);
				}
				self.$theadCont.find('tr').html($tr.html());
			}
			
			self.$ths = self.$el.find('table > thead > tr > th');
			if(self.opts.sort.length){
				$.each(self.opts.sort, function(i, v){
					var _$th = self.$ths.eq(i);
					if(v){
						_$th.attr('sort','');
					}else{
						_$th.removeAttr('sort');
					}
				});
			}
			
			self._setThs();
		},
		_createResizeHandler: function(){
			var self = this;
			//建立CRZ用以resize手柄
			var str_CRZ = ['<div class="CRC">'];
			self.$el.find("thead th:not(:last)").each(function(){
					str_CRZ.push('<div class="CRZ"  style="left: 0"></div>');
			});
			str_CRZ.push('</div>');
			str_CRZ = str_CRZ.join('');
			return str_CRZ;
		},
		bindEvent: function () {
			var self = this;
			var opts = self.opts;
			//resize talbe 事件
			if(opts.resize || self.dynamic){

				self.$col.mousedown(function (e){
					var i = $(this).index();
					self.isMousedown = true;
					self.$currentTH = self.$ths.eq(i);
					self.$currentTH_width = self.$currentTH.width();
					//console.log(self.$currentTH_width);
					self.$currentTH_posX = self.$currentTH.offset().left;
					self.currentOffsetX = e.clientX;
				});
				$(document).mousemove(function (e){

					if(self.isMousedown){
						var i = self.$currentTH.index();
						var dist = e.clientX - self.currentOffsetX;
						var nextIndex = i + 1; //下一个th,只允许调节两个相邻th的宽度,否则表格会乱
						var w = self.$currentTH_width + dist ;

						//var w = dist ;
						var range = self.widths[nextIndex - 1] + self.widths[nextIndex];//允许调节的范围：相邻th宽度之和
						var $currentTd = self.$tds.eq(i);
						var $nextTd = self.$tds.eq(nextIndex);
						if(nextIndex <= self.$ths_length - 1){
							var $nextTh = self.$ths.eq(nextIndex);
							var nextTh_w = self.widths[nextIndex] + (-dist-1);
							if(w >= range || w <= 0){
								return ;
							}else{
								self.$currentTH.attr('width',w+'px');
								$nextTh.attr('width',nextTh_w+'px');
								self.resetHandlers();
							}

							self._saveTHsWidth();
							

							//第一排td
							if(self.opts.theadFix){
								self._setTdsByThWidth();
							}
						}
					}
				}).mouseup(function (){
					self.isMousedown = false;
					self.saveWidths();
					//self.setTableHeight();
				});
			}
			if(opts.sort.length){
				//排序事件
				self.$ths.click(function(){
					self.sortData($(this));
				});
			}

			//window resize
			$(window).resize(function(){self.resizeWin();});
			

			//绑定表格过滤器
			//过滤器: tableid+'Filter'
			
			var $filterDom = $($(opts.filter)[0] || ('#' + self.idHolder + 'Filter'));

			if($filterDom.length){
				$filterDom.on('input',function(){
					var v = $.trim($(this).val());
					if(v.length > 0){
						self.filterData(v);
					}else{
						if(self.pager){
							self.changeData({data:self.pager.showPage(self.pager.opts.curPage)});
							self.setPage(self.originData);
						}else{
							self.setPage(self.originData);
						}
					}
				});
			}
		},
		_getThs: function($obj){

			return ;
		},
		_setThs: function(){
			var self = this;
			self.$ths_length = self.$ths.length;
			if(self.opts.resize){
				if(self.opts.theadFix){
					self.$theadCont.append(self._createResizeHandler());
				}else{
					self.$el.append(self._createResizeHandler());
				}
			}
			self.saveWidths();//先存宽度，再初始化值
			self.$ths.each(function(i){
				var v = self.widths[i];
				// if(i===self.$ths_length-1){
				// 	v-=4;//修正4px边线
				// }
				$(this).attr('width', v + 'px');
			});
		},
		//初始化时保存表头宽度用于计算
		saveWidths: function (){
			var self = this;
			self.widths.length = 0;
			self.$ths.each(function(i){
				self.widths.push($(this).width());
			});

			//self.$ths.eq(self.$ths.length-1).attr('width',self.widths[self.widths.length-1]-2);
		},
		set_tds_width:function(){
			var self = this;
			self.$tds = self.$table.find('tbody > tr:eq(0)').find('td');
			$.each(self.widths,function(i,v){
				self.$tds.eq(i).attr('width', v + 'px');
			});
		},
		//保存ths宽度
		_saveTHsWidth: function(){
			var self = this;
			self.thsWidth.length = 0;
			self.$ths.each(function(){
				self.thsWidth.push($(this).attr('width'));
			});
		},
		//通过th宽度设置td宽度
		_setTdsByThWidth: function(){
			var self = this;
			self.$tds.each(function(i,v){
				$(this).attr('width', self.thsWidth[i])
			});
		},
		resetHandlers : function (){
			var self = this;
			if(!self.opts.resize) return false;
			self.$ths.each(function(i){
				var $handler = self.$col.eq(i);
				var th_posX = $(this).offset().left - self.tableX;
				var w = $(this).outerWidth(true);
				var l = th_posX + w;
				$handler.css({left:l});
			});
		},
		resizeWin: function () {
			var self = this;
			self.resetState();
			self.saveWidths();
			self.resetHandlers();
		},
		resetState: function(){//由于表格改变(如：分页,window resize等),需要重新初始化位置、宽度数据
			var self = this;
			var $table = self.$table;
			self.tableX = $table.offset().left;
			self.tableHeight = $table.height();
			self.tableWidth = $table.width();
			
			self.set_tds_width();
			
			self.saveWidths();//
			self.resetHandlers();
		},
		sortData: function($th){
			var self = this;
			//判断排序并重新渲染到tbody内
			self.sortByType($th);
			self.resetTbody();
		},
		resetTbody: function (){
			var self = this;
			var tbodyData = self.opts.data.tbody;
			var s = [];
			var $tbody = $('<tbody>')
			,$tr
			,$td
			;
			self.$tbody.html('');

			for(i=0; i<tbodyData.length; i++){
				$tr = $('<tr>');
				for(var j =0; j< tbodyData[i].tr.length; j++){
					$td = $('<td>').attr('width',(this.thsWidth && this.thsWidth[i] || '')).html(tbodyData[i].tr[j].text);
					if(tbodyData[i].tr[j].attr){
						$td.attr(tbodyData[i].tr[j].attr);
					}
					$tr.append($td);
				}
				if(tbodyData[i].attr){
					$tr.attr(tbodyData[i].attr);
				}
				$tbody.append($tr);
			}
			self.$tbody.html($tbody.html());
			self.$tds = self.$table.find('tbody > tr:eq(0)').find('td');
			self._saveTHsWidth();
			self._setTdsByThWidth();
			self.$el.trigger({
				type: 'dom.create',
				domTrigger: self.$el,
				domTarget: self.$tbody,
				dom: self.$el
			});
		},
		sortByType: function($th){
			var self = this;
			var order = $th.attr('sort');
			var json = self.opts.data;
			var arr = [];
			
			//排序全部数据
			if(self.pager){
				arr = self.pager.opts.data;
			}else{
				arr = json.tbody;
			}
			Table.currentCol = $th.index();
			if(self.opts.sort[Table.currentCol]){
				if(order === ''){//需要按默认排序
					switch(self.opts.sort[Table.currentCol]){
						case 'num':
						 	arr.sort(self.sortByNum);
							break;
						case 'text':
							arr.sort(self.sortByText);
							break;
						case 'date':
							arr.sort(self.sortByDate);
							break;
					}
				}else{
					arr.reverse();
				}
				$th.attr('sort', Table.changeSortOrder(order)).siblings('[sort]').attr('sort', '');
				
				if(self.pager){
					self.pager.opts.data = arr;
					self.pager.flip(self.pager.opts.curPage * 1 - 1, true);//翻页至当前页
				}
			}
		},
		sortByNum : function (a, b){//按数字大小顺序排列
			var self = this;
			var n1,n2;

			n1 = a['tr'][Table.currentCol].text * 1;
			n2 = b['tr'][Table.currentCol].text * 1;
			if(n1 > n2){
				return 1;
			}else if(n1 < n2){
				return -1;
			}else{
				return 0;
			}
		},
		sortByText : function (a, b){//按数字大小顺序排列
			var n1,n2;
			n1 = a['tr'][Table.currentCol].text.toLowerCase();
			n2 = b['tr'][Table.currentCol].text.toLowerCase();
			
			if(n1 > n2){
				return 1;
			}else if(n1 < n2){
				return -1;
			}else{
				return 0;
			}
		},
		sortByDate : function (a, b){//按数字大小顺序排列
			var n1,n2;
			n1 = a['tr'][Table.currentCol].text;
			n2 = b['tr'][Table.currentCol].text;
			
			if(n1 > n2){
				return 1;
			}else if(n1 < n2){
				return -1;
			}else{
				return 0;
			}
		},
		//供外部调用,实现pagination组件的interface_changeData接口
		interface_changeData: function (obj){
			//obj: {data:分页数据,page: 分页对象}

			this.changeData(obj);
		},
		changeData: function (obj){
			var self = this;
			self.opts.data.tbody = obj.data;
			self.resetTbody();
			self.setTableHeight();
		},
		filterData: function (value){//允许“,”号分割查询
			var self = this;
			var d = self.originData;
			var tempArr = [];
			var values = value.split(',');
			var opts = self.opts;
			if(d.length > 0){
				for(var i=0,len=values.length; i < len; i++){
					tempArr = tempArr.concat(self.getFilterData(d, values[i]));
				}
			}
			self.changeData({data:tempArr});
			self.setPage(tempArr);
		},
		getFilterData: function(d, value){
			var arr = [];
			for(var i=0, len=d.length; i<len; i++){
				trLoop: for(var j=0, trLen=d[i].tr.length; j<trLen; j++){
					for(var k=0, tdLen=d[i].tr.length; k<tdLen; k++){
						var _text = $('<div>').html(d[i].tr[k].text).text();
						if(_text.indexOf(value) > -1){
							arr.push(d[i]);
							break trLoop;
						}
					}
				}
			}
			return arr;
		},
		setPage: function(d){
			var self=this
			,opts = self.opts
			;

			if((opts.page.pageNum || opts.page.pageGo) && self.$ft && self.$ft[0]){//如果垂直分页，则必须生成水平分页以供其调用

				//初始化分页
				self.pager = self.$ft.pagination({data: d,
												  pageGo: opts.page.pageGo,
												  pageInfo: opts.page.pageInfo,
												  pageNum: opts.page.pageNum,
												  curPage: opts.page.curPage,
												  perPage: opts.page.pageSize, 
												  pageInterface: self,
												  showNumbers: opts.page.showNumbers,
												  showFirst: opts.page.showFirst,
												  showLast: opts.page.showLast,
												  showPrev: opts.page.showPrev,
												  showNext: opts.page.showNext,
												  num: opts.page.num
												});
			}else{
				self.changeData({data:d});
			}
		},
		setTableHeight: function(){
			var self=this
			,opts = self.opts
			;
			if(!opts.resize && !self.dynamic) return;

			if(opts.theadFix){
				self.tableHeight = self.$theadCont.height() + self.$tbodyCont.height();
				self.tableWidth = self.$theadCont.width();
			}else{
				self.tableHeight = self.$table.height();
				self.tableWidth = self.$table.width();
			}
			//self.$CRC.height(self.tableHeight);
			self.$col.height(self.tableHeight);
		}
	}
	
	Table.currentCol = 0;
	
	/**
	 * [changeSortOrder description]
	 * @param  {[type]} order [description]
	 * @return {[type]}       [description]
	 */
	Table.changeSortOrder = function(order){
		if(order === ''){
			order = 'asc';
		}else if(order === 'asc'){
			order = 'desc';
		}else if(order === 'desc'){
			order = '';
		}
		return order;
	}

	/**
	 * [convertUnit 转换至合适的单位]
	 * @param  {[type]} v [description]
	 * @return {String}   [返回]
	 */
	Table.convertUnit = function(v,unit){
		v +='';
		unit = unit ? unit : 'px';
		if(!!v && v.substr(-2) !== 'px' && v.substr(-1) !== '%' && v.substr(-1) !== 'em'){
			return v+=unit;
		}else{
			return v;
		}
	};

	
	$.fn.table = function(opt){
		var ret = [];
		this.each(function() {
			var handle = $(this).data("table_handle");
			if(!handle){
				handle = new Table($(this), $.extend(true, {}, $.fn.table.defaults, opt));
				$(this).data("table_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	}
	$.fn.table.defaults = {
		//tbody高度
		height: null,
		//是否可调节
		resize: true,
		//是否固定住表头
		theadFix: false,
		//是否以grid样式显示单元格
		grid: true,
		//表格json数据
		data: null,
		//表格过滤器
		filter: null,
		//是否开启表头排序,排序需填写相应列的数据类型
		//sort: ['num','text','num','date','text'], 
		sort: [], 
		//是否斑马线
		zebra:true,
		//td宽度[xx,xx,,xx]
		thWidth:null,
		//width表格宽度
		width:'',
		//分页
		page:{
			//分页容器
		    container: null,
		    //当前页
		    curPage: 1,
		    //每页显示条数
		    pageSize: 12,
		    //分页信息
		    pageInfo: true,
		    //分页(垂直)
		    pageGo: true,
		    //分页(水平) 
			pageNum: true,
			//是否显示数字排
			showNumbers: true,
			//首页
			showFirst: true,
			//尾页
			showLast: true,
			//上一页
			showPrev: true,
			//下一页
			showNext: true,
			num: 3
		},
		callback: null
	}
})(jQuery);