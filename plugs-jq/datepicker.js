//UUID/Guid Generator
// use: UUID.create() or UUID.createSequential()
// convenience:  UUID.empty, UUID.tryParse(string)
(function(w){
  // From http://baagoe.com/en/RandomMusings/javascript/
  // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
  function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }

  // From http://baagoe.com/en/RandomMusings/javascript/
  function Kybos() {
    return (function(args) {
    // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;
    var s = [];
    var k = 0;

    var mash = Mash();
    var s0 = mash(' ');
    var s1 = mash(' ');
    var s2 = mash(' ');
    for (var j = 0; j < 8; j++) {
      s[j] = mash(' ');
    }

    if (args.length == 0) {
      args = [+new Date];
    }
    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
      s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
      s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
      s2 += 1;
      }
      for (var j = 0; j < 8; j++) {
      s[j] -= mash(args[i]);
      if (s[j] < 0) {
        s[j] += 1;
      }
      }
    }

    var random = function() {
      var a = 2091639;
      k = s[k] * 8 | 0;
      var r = s[k];
      var t = a * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      s2 = t - (c = t | 0);
      s[k] -= s2;
      if (s[k] < 0) {
      s[k] += 1;
      }
      return r;
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() +
      (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.addNoise = function() {
      for (var i = arguments.length - 1; i >= 0; i--) {
      for (j = 0; j < 8; j++) {
        s[j] -= mash(arguments[i]);
        if (s[j] < 0) {
        s[j] += 1;
        }
      }
      }
    };
    random.version = 'Kybos 0.9';
    random.args = args;
    return random;

    } (Array.prototype.slice.call(arguments)));
  };

  var rnd = Kybos();

  // UUID/GUID implementation from http://frugalcoder.us/post/2012/01/13/javascript-guid-uuid-generator.aspx
  var UUID = {
    "empty": "00000000-0000-0000-0000-000000000000"
    ,"parse": function(input) {
      var ret = input.toString().trim().toLowerCase().replace(/^[\s\r\n]+|[\{\}]|[\s\r\n]+$/g, "");
      if ((/[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}/).test(ret))
        return ret;
      else
        throw new Error("Unable to parse UUID");
    }
    ,"createSequential": function() {
      var ret = new Date().valueOf().toString(16).replace("-","")
      for (;ret.length < 12; ret = "0" + ret);
      ret = ret.substr(ret.length-12,12); //only least significant part
      for (;ret.length < 32;ret += Math.floor(rnd() * 0xffffffff).toString(16));
      return [ret.substr(0,8), ret.substr(8,4), "4" + ret.substr(12,3), "89AB"[Math.floor(Math.random()*4)] + ret.substr(16,3),  ret.substr(20,12)].join("-");
    }
    ,"create": function() {
      var ret = "";
      for (;ret.length < 32;ret += Math.floor(rnd() * 0xffffffff).toString(16));
      return [ret.substr(0,8), ret.substr(8,4), "4" + ret.substr(12,3), "89AB"[Math.floor(Math.random()*4)] + ret.substr(16,3),  ret.substr(20,12)].join("-");
    }
    ,"random": function() {
      return rnd();
    }
    ,"tryParse": function(input) {
      try {
        return UUID.parse(input);
      } catch(ex) {
        return UUID.empty;
      }
    }
  };
  UUID["new"] = UUID.create;

  w.UUID = w.Guid = UUID;
}(window || this));
;(function($){
	var zIndex = {max:10000, min:10, cur:10};
	var $positionLayoutWrap;
	var $body = $('body');
	function DatePicker(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.dom = null;
		this.$input = null;
		this.$icon = null;
		this._id = null;//创建出的datepicker dom 中唯一id
		this.monthDates = [31,28,31,30,31,30,31,31,30,31,30,31];//每月天数数组 
		this.month_cn = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];//中文月份
		
		this.$tit = null;
		this.$prevBtn = null;
		this.$nextBtn = null;
		this.$titYear = null;
		this.$titMonth = null;
		this.$thisMonth = null;
		this.$daysViewBody = null;
		
		this.$month = null;
		this.$daysView = null;
		this.$monthLis = null;//选择月份所有li
		
		this.$monthsView = null;//月份选择view
		this.$yearsView = null;//年份选择view
		this.$tenYearsView = null;//十年年份选择view
		this.$yearLis = null;
		this.$tenYearLis = null;
		//1900-1-1
		this.curYear = 1900;
		this.curMonth = 0;
		this.curDate = 1;
		
		this.curViewType = 1;//1: 日视图，2: 月视图, 3: 年视图 , 4: 10年视图
		
		this.$ft = null;
		this.$hour = null;
		this.$minute = null;
		this.$second = null;
		
		this._inDatePicker = false;

		this.minDateObject = {};
		this.maxDateObject = {};

		this.preDisabledDay = 0;//上月补余index
		this.nextDisabledDay = 0;//下月补余index
		this.slideSelectedDate = null; //向前或向后滑动时选中的日期

		this.type = 0;//0:日历，1：月历，2：年历
		
		this.init();
	}
	DatePicker.prototype = {
		init: function () {
			var self = this;
			var opts = self.opts;
			var $dom = $('#'+ self._id);
			if(opts.format.indexOf('ss') > -1){opts.second = true; opts.ft = true;};
			if(opts.format.indexOf('mm') > -1){opts.minute = true; opts.ft = true;};
			if(opts.format.indexOf('hh') > -1){opts.hour = true; opts.ft = true;};

			if(opts.format.length === 7){
				self.type = 1;
			}else if(opts.format.length === 4){
				self.type = 2;
			}

			if(!$dom[0]){
				self._view();
			}else{
				if(opts.target){
					//将icon指向当前元素
					self.$icon = self.$el;
					//将input指向target
					self.$input = $(opts.target);
				}else{
					//将input指向当前元素
					self.$input = self.$el;

				}
				self.$el = $dom;
			}

			self.dom = self.$input;//供外部调用
			
			self.$tit = self.$el.find('div.tit');
			self.$titYear = self.$tit.find('span.year');
			self.$titMonth = self.$tit.find('span.month');
			self.$daysView = self.$el.find('table.days');
			self.$daysViewBody = self.$daysView.find('tbody');
			self.$tds = self.$daysViewBody.find('td');
			self._initDate();

			self.$prevBtn = self.$el.find('div.prev');
			self.$nextBtn = self.$el.find('div.next');
			
			self.$month = self.$el.find('div.month');
			self.$monthsView = self.$el.find('ul.months');
			self.$monthLis = self.$monthsView.find('li');
			
			self.$yearsView = self.$el.find('ul.years');
			self.$yearLis = self.$yearsView.find('li');
			self.$tenYearsView = self.$el.find('ul.tenYears');
			self.$tenYearLis = self.$tenYearsView.find('li');
			
			self.$ft = self.$el.find('div.ft');
			
			//设置时分秒
			self._setHMS();
			//设置日期范围
			self._setDateRange();

			self._bindEvent();

			if(opts.date){
				self._setDate(new Date(opts.date));
			}
			
			if(self.type > 0){
				//如果不需要日视图，则先隐藏
				self.$daysView.hide();
			}
			self.curViewType = self.type;
			self._changeCalendarView();
			
			//设置z轴值
			self._zIndex();
		},
		//生成结构
		_view: function (){
			var self = this, opts = self.opts, $c, s;
			self._id =  UUID.create() + '-datePicker';
			
			s = '<div class="hd"><div class="tit"><span class="year">2012</span>年<span class="month">8</span>月</div><div class="prev"><i class="abtnL"></i></div><div class="next"><i class="abtnR"></i></div></div><div class="bd"><div class="scrollChannel"><ul class="tenYears"style="display:none"><li>1990-1999</li><li>2000-2009</li><li class="cur">2010-2019</li><li>2020-2029</li><li>2030-2039</li><li>2040-2049</li><li>2050-2059</li><li>2060-2069</li><li>2070-2079</li><li>2080-2089</li><li>2090-2099</li><li></li></ul></div><div class="scrollChannel"><ul class="years"style="display:none"><li>2009</li><li>2010</li><li>2011</li><li>2012</li><li class="cur">2013</li><li>2014</li><li>2015</li><li>2016</li><li>2017</li><li>2018</li><li>2019</li><li>2020</li></ul></div><div class="scrollChannel"><ul class="months"style="display:none"><li>一月</li><li>二月</li><li>三月</li><li>四月</li><li>五月</li><li class="cur">六月</li><li>七月</li><li>八月</li><li>九月</li><li>十月</li><li>十一月</li><li>十二月</li></ul></div><div class="scrollChannel"><table class="days"><thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead><tbody><tr><tdid="mark">B</td><td>26</td><td>27</td><td>28</td><td>29</td><td>30</td><td>31</td><td>x</td></tr><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr><tr><td>8</td><td>9</td><td>10</td><td>11</td><td>12</td><td>13</td><td>14</td></tr><tr><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td></tr><tr><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td></tr><tr><td>29</td><td>30</td><td>31</td><td>1</td><td>2</td><td>3</td><td>4</td></tr></tbody></table></div></div>';
			if(opts.ft || opts.showtime){
				s += '<div class="ft">';
				if(opts.hour || opts.showtime){
					s += '<input type="text"name="d_hour"maxlength="2">时';
				}
				if(opts.minute || opts.showtime){
					s += '<input type="text"name="d_minute"maxlength="2">分';
				}
				if(opts.second || opts.showtime){
					s += '<input type="text"name="d_second"maxlength="2">秒';
				}
				s += '<button class="btn basic">确定</button></div>';
			}
			
			
			if(!opts.fixed){
				$c = $('<div id="'+ self._id +'"></div>');
				if($positionLayoutWrap && $positionLayoutWrap.length){
					$positionLayoutWrap.append($c.html(s));//for yp framework
				}else{
					$body.append($c.html(s));
				}
				
				if(opts.target){
					//将icon指向当前元素
					self.$icon = self.$el;
					//将input指向target
					self.$input = $(opts.target);
				}else{
					//将input指向当前元素
					self.$input = self.$el;
				}
				self.$el = $c;
				self.$el.addClass('datePicker');
				self._resetPosition();
			}else{
				self.$el.html(s).addClass('datePicker').attr('fixed',true);
			}
		},
		//初始化日历tit内容
		_initTitView: function(titType){
			var s = '';
			switch(titType){
				case 1://年月
					s = '<span class="year">1900</span>年<span class="month">1</span>月';
					break;
				case 2://年
					s = '<span class="year">1900</span>';
					break;
				case 3://十年
					s = '<span class="year">1900-1909</span>';
					break;
				case 4://百年
					s = '<span class="year">1900-1999</span>';
					break;
			}
			this.$tit.html(s);
		},
		//绑定交互事件
		_bindEvent: function () {
			var self = this;
			var opts = self.opts;
			self.$el.click(function(e){
				e.stopPropagation();
			});
			//向左箭头
			self.$prevBtn.click(function(e){
				self._goPrevView();
				e.stopPropagation();
			});
			//向右箭头
			self.$nextBtn.click(function(e){
				self._goNextView();
				e.stopPropagation();
			});
			
			self.$tit.click(function (e){
				self._changeCalendarView();
				e.stopPropagation();
			});
			//月份被点击
			self.$monthLis.click(function(e){
				if(self.type == 1){
					self._selectMonth(this, true);
				}else{
					self._selectMonth(this);
				}
				e.stopPropagation();
			});
			//日期被点击
			self.$daysViewBody.on('click','td',function(e){
				self._selectDate(this);
				e.stopPropagation();
			});
			//年份被点击
			self.$yearLis.click(function(e){
				
				if(self.type == 2){
					self._selectYear(this, true);
				}else{
					self._selectYear(this);
				}
				e.stopPropagation();
			});
			//十年份被点击
			self.$tenYearLis.click(function(e){
				self._selectTenYear(this);
				e.stopPropagation();
			});
			
			if(opts.ft || opts.showtime){
				self.$ft.find('button').click(function(e){//确定按钮
					var d = self._createDateAndTime();
					if(opts.maxDate && self.maxDateObject.date){
						d = (d.getTime() > self.maxDateObject.date.getTime()) ? self.maxDateObject.date : d;//当前日期 > 最大日期
						
					}else if(opts.minDate && self.minDateObject.date){
						//console.log(d.getTime() > self.minDateObject.date.getTime());
						d = (d.getTime() < self.minDateObject.date.getTime()) ? self.minDateObject.date : d;//当前日期 < 最大日期
					}

					//TODO
					if(!opts.fixed){
						self.$input.val(d.format(opts.format));
						self._hide(e);
					}
					
					self._doCallback({formatDate: d.format(opts.format), gmtDate:d, time:d.getTime()});
				});

				//实时校验时,分,秒
				if(opts.hour) self._validte(self.$hour, 23);
				if(opts.minute) self._validte(self.$minute, 59);
				if(opts.second) self._validte(self.$second, 59);
			}
			
			//隐藏/显示日历
			if(!opts.fixed){
				self._hide();
				
				//ESC 隐藏日历
				$(document.body).bind('keyup',function(e){
					if(e.which === 27){//ESC
						self._hide();
					}
				});
				
				self.$el.bind('mouseover', function(e){
					self._inDatePicker = true;
				}).bind('mouseout',function(){
					self._inDatePicker = false;
				});
				
				if(opts.target){//icon呼出日历
					self.$icon.click(function(e){
						self._toggle(e);
						self._initDate();//重置日历时间
					});
					self.$icon.focusout(function(e){
						if(!self._inDatePicker){
							self._hide();
						}
					});
				}else{
					self.$input.click(function(e){
						self._show();
						self._initDate(this.value && new Date(this.value) || null);//重置日历时间
					});
					self.$input.focusout(function(e){
						if(!self._inDatePicker){
							self._hide();
						}
					});
					self.$input.click(function(e){
						e.stopPropagation();
					});
				}
			}
		},
		//前一个日期视图
		_goPrevView: function (){
			var self = this;
			var d = self._getSelectedDate();
			//d.setMonth(d.getMonth()1);
			if(d && self.minDateObject.date){
				d.setDate(1);//设置当前日期为每月第一天
				if(d.getTime() < self.minDateObject.date.getTime()){
					return ;
				}
			}
			
			switch(self.curViewType){
				case 1:
					self._setDate(self._changeMonthData(true));
					self._moveCalendar(true, self.$daysView);
					break;
				case 2:
					self._setSkipTime(false,self.$monthLis.eq(0),1);
					self._moveCalendar(true, self.$monthsView);
					self.$titYear.text(self.curYear);

					break;
				case 3:
					self.curYear = self._rangeOfYear(self.curYear, 9) - 9;
					if(self.curYear - 100 <= 1900) return;
					self._setSkipTime(false,self.$yearLis.eq(0),10);
					self._moveCalendar(true, self.$yearsView);
					self._createYears(self.curYear);
					break;
				case 4:
				 	self.curYear = self._rangeOfYear(self.curYear, 99, 2);
				 	if(self.curYear - 100 <= 1900) return;
					self._setSkipTime(false,self.$yearLis.eq(0),100);
					self._moveCalendar(true, self.$tenYearsView);
					self._createTenYears(self.curYear);
					break;
			}

		},
		//后一个日期视图
		_goNextView: function(){
			var self = this;
			var d = self._getSelectedDate();
			if(d && self.maxDateObject.date){
				d.setDate(31);//设置当前日期为每月第31天
				if(d.getTime() >= self.maxDateObject.date.getTime()){
					return ;
				}
			}
			switch(self.curViewType){
				case 1:
					self._setDate(self._changeMonthData());
					self._moveCalendar(false, self.$daysView);
					break;
				case 2:
					self._setSkipTime(true,self.$monthLis.eq(0),1);
					self._moveCalendar(false, self.$monthsView);
					self.$titYear.text(self.curYear);
					break;
				case 3:
					self.curYear = self._rangeOfYear(self.curYear, 9) - 9;
					if(self.curYear >= 2099) return;
					self._setSkipTime(true,self.$yearLis.eq(0),10);
					self._moveCalendar(false, self.$yearsView);
					self._createYears(self.curYear);
					break;
				case 4:
				 	self.curYear = self._rangeOfYear(self.curYear, 99, 2);
				 	if(self.curYear >= 2099) return;
					self._setSkipTime(true,self.$yearLis.eq(0),100);
					self._moveCalendar(false, self.$tenYearsView);
					self._createTenYears(self.curYear);
					break;
			}
			
			//self._createDate(self.curYear, self.curMonth, self.curDate);
		},
		//选择日期
		_selectDate: function (_td){
			var self = this;
			var d;
			if(_td){
				var $td = $(_td);
				var clickedIndex = $.inArray($td[0],self.$tds) + 1;
				if($td.is('[disabled]')){//点击不处于本月日期
					self.slideSelectedDate = $td.text();
					if(clickedIndex <= self.preDisabledDay){
						self._goPrevView();
					}else if(clickedIndex >= self.nextDisabledDay){
						self._goNextView();
					}
					return false;
				} 

				//TODO
				self.curDate = $td.text() * 1;
				if(!self.opts.fixed) {
					if(!self.opts.ft || $td.hasClass('cur')) {// 没有时间项或同个选项被点了2次
						self.$input.val(self._createDateAndTime().format(self.opts.format));
						self._hide();
					}
				}
				self.$tds.removeClass('cur');
				$td.addClass('cur');
			}
			
			d = self._createDateAndTime();
			self._doCallback({formatDate:d.format(self.opts.format), gmtDate:d, time:d.getTime()});
			//console.log(self._createDateAndTime().format(self.opts.format));
		},
		//选择月份
		_selectMonth: function(_li, isEnd){
			var self = this;
			var m = $(_li).index();
			if(!isEnd){
				self.curViewType = 1;
				self._showDateView(m);
				self._scaleObject(true, self.$daysView, self.$monthsView, self.curMonth + 1);
			}else{
				self.curMonth = m;
				self._selectDate();
			}
		},
		//选择年份
		_selectYear: function(_li, isEnd){
			var self = this, $li = $(_li);
			if(!isEnd){
				if($li.is('[disabled]')) return false;
				self.$monthsView.show();
				self.curViewType = 2;
				self._showMonthView($li.text());
				self._scaleObject(true, self.$monthsView, self.$yearsView, self._getScalePosition(3, self.curYear));
			}else{
				self.curYear = $li.text() >> 0;
				self._selectDate();
			}
		},
		//选择十年份
		_selectTenYear:function(_li){
			var self = this, $li = $(_li);
			if($li.is('[disabled]')) return false;
			self.$yearsView.show();
			self.curViewType = 3;
			self._showYearView($li.text().substr(0,4) * 1);
			self._scaleObject(true, self.$yearsView, self.$tenYearsView, self._getScalePosition(4, self.curYear));
		},
		_initDate: function (d){
			var d = d || new Date();
			//当前年，月，日
			this.curYear = d.getFullYear();
			this.curMonth = d.getMonth();
			this.curDate = d.getDate();
			
			this._setDate(d);
		},
		//设置日期
		_setDate: function (d, $calendar){

			var self = this, d_month, d_year, d_date, d_day;
			d_month = d.getMonth(); //获取当前是第几个月 
			d_year = d.getFullYear(); //获取年份 
			d_date = d.getDate(); //获取日期
			d_day = d.getDay();

			self.$titYear.text(d_year);
			self.$titMonth.text(d_month + 1);

			self.curYear = d_year;
			self.curMonth = d_month;
			self.curDate = d_date;

			self._isLeapYear(d);
			self._createDates(d_year, d_month, d_day, d_date, $calendar);
		},
		//生成日视图中的天数
		_createDates: function (year, month, day, date, $calendar){//月,星期,日
			var self = this;
			var days = self.monthDates[month];
			
			var d = new Date();
			d.setDate(1);
			d.setYear(year); 
			d.setMonth(month);
			
			var cd = new Date();
			var cd_year = cd.getFullYear();
			var cd_month = cd.getMonth();
			var cd_date = cd.getDate();

			var getDay = d.getDay();
			var firstSpace = (getDay == 0) ? 7 : getDay;
			var index = 0;//日期列表index
			var dayIndex = 1;//当前月份日期index
			var lastSpace = days*1 + firstSpace;//当月日期index终点
			
			
			var _month = month - 1;
			if(_month < 0)  _month = 11;
			var prevMonth = self.monthDates[_month];//上一个月日子数
			var dayStr, disabled = '', curDay='', nextMonthIndex=1, _date=1, tdIndex=0;
			
			
			var d = new Date();
			
			//判断当前日期，如果不是当前日期则将1号视为当前日期
			if(self.curYear === cd_year && self.curMonth === cd_month){
				_date = d.getDate() + 1;
			}else{
				_date++;
			}
			//_date = date + 1;
			
			self.$tds.removeClass('today').removeClass('cur');
			//console.log(date);
			for(var i=0; i<6; i++){
				for(var j=0; j<7; j++){
					index++;
					var $td = $(self.$tds[tdIndex]);
					if(index > firstSpace && index <= lastSpace){
						dayStr = dayIndex++;
						$td.text(dayStr);
						$td.removeAttr('disabled');
						
						if(self.maxDateObject.date){//大于最大日期的日期都不可选
							if(self._createDate(self.curYear, self.curMonth, dayStr).getTime() > self.maxDateObject.date.getTime() + 86400000){
								$td.attr('disabled','');
							}
						}
						if(self.minDateObject.date){//小于最小日期的日期都不可选
							if(self._createDate(self.curYear, self.curMonth, dayStr).getTime() < self.minDateObject.date.getTime()){
								$td.attr('disabled','');
							}
						}

						if(_date === dayIndex && self.curYear === cd_year && self.curMonth === cd_month){//日期是当天
							//console.log(self._createDate(self.curYear, self.curMonth, dayStr).toDateString(), cd.toDateString());
							if(self._createDate(self.curYear, self.curMonth, dayStr).toDateString() ===  cd.toDateString()){
								$td.addClass('today');
							}
						}else if(date === dayStr && !self.slideSelectedDate){//日期是第一天或指定的一天
							$td.addClass('cur');
						}else if(self.slideSelectedDate == dayStr){//日期是滑动选后的那一天
							$td.addClass('cur');
							self.slideSelectedDate = null;
						}
					}else{
						if(index <= firstSpace){//上月补余
							dayStr = prevMonth - firstSpace + index;
							$td.removeAttr('disabled');
							$td.text(dayStr);
							self.preDisabledDay = index;
						}else if(index > days){//下月补余
							dayStr = nextMonthIndex++;
							$td.text(dayStr);
						}
						$td.attr('disabled','');
					}
					tdIndex++;
				}
			}
			self.nextDisabledDay = days + self.preDisabledDay;
		},
		//设置月份,年份，十年份
		_setSkipTime: function (b, li, step){
			var self = this;
			if(b){//true:年份往后调
				this.curYear+=step;
			}else{//false:年份往前调
				this.curYear-=step;
			}
			this.curMonth = 0;
			this.curDay = 1;
			li.addClass('cur').siblings('li').removeClass('cur');
		},
		//视图转换
		_changeCalendarView: function (){
			var self = this;
			if(self.curViewType < 4){
				self.curViewType++;
			}else if(self.curViewType < 4){
				return ;
			}
			switch(self.curViewType){
				case 1: 
					//self._showDateView(1);
					break;
				case 2:
					self._scaleObject(false, self.$daysView, self.$monthsView, self.curMonth + 1);
					//self._scaleObject(false, self.$daysView, );
					//self.$monthsView.removeClass("focusOut").addClass('focusIn');
					self._showMonthView(self.curYear);
					break;
				case 3:
					//self._scaleObject(false, self.$monthsView, self._getScalePosition(3, self.curYear));
					self._scaleObject(false, self.$monthsView, self.$yearsView, self._getScalePosition(3, self.curYear));
					//self.$yearsView.removeClass("focusOut").addClass('focusIn');
					self._showYearView(self.curYear);
					break;
				case 4:
					//self._scaleObject(false, self.$yearsView, self._getScalePosition(4, self.curYear));
					self._scaleObject(false, self.$yearsView, self.$tenYearsView, self._getScalePosition(4, self.curYear));
					self._showTenYearView(self.curYear);
					break;
			}
			
		},
		_createYears: function (year){
			var self = this;
			var end = self._rangeOfYear(year, 9);
			var start = end - 9;
			self.$titYear.text(start + '-' + end);
			self.$yearLis.each(function(i){
				var y;
				if(i===0){
					y = start - 1;
				}else if(i===11){
					y = end + 1;
				}else{
					y = start+i -1;
				}
				$(this).text(y);
				if(y === year){
					$(this).addClass('cur').siblings('li').removeClass('cur');
				}
			});
		},
		_createTenYears: function (year){
			var self = this;
			var end = self._rangeOfYear(year, 99, 2);
			var start = end - 99;
			self.$titYear.text(start + '-' + end);
			self.$tenYearLis.each(function(i){
				var _s, _e;
				if(i===0){
					_s = start - 10;
					_e = start - 1;
				}else if(i===11){
					_s = end + 1;
					_e = end + 10;
				}else{
					_s = start + i*10 - 10;
					_e = start + i*10 -1;
				}
				$(this).text(_s + '-' + _e);
				if(year >= _s && year <= _e){
					$(this).addClass('cur').siblings('li').removeClass('cur');
				}
			});
		},
		//判断当前传入的年份的x年区间
		_rangeOfYear: function(v, step, ss){
			var y = v, ss = ss || 1;
			v+='';
			v = step - v.substr(-ss)*1;
			return y+v;
		},
		//移动日历效果
		_moveCalendar: function(b, $moveObj){
			var self = this, className, $tempMoveObj;
			var $scrollChannel = $moveObj.parent();
			switch(self.curViewType){
				case 1:
					$tempMoveObj = self._createTempTable();
					break;
				case 2:
					$tempMoveObj = self._createTempMonth();
					break;
				case 3:
					$tempMoveObj = self._createTempYear();
					break;
				case 4:
					$tempMoveObj = self._createTempTenYear();
					break;
			}
			if(b){
				$moveObj.before($tempMoveObj);
				className = 'dateMoveToL';
				
			}else{
				$moveObj.after($tempMoveObj);
				className = 'dateMoveToR';
			}
			$scrollChannel.addClass(className);
			
			setTimeout(function(){
				$scrollChannel.removeClass(className);
				$tempMoveObj.remove();
			},300);
		},
		_showDateView: function (m){
			var self = this;
			self._initDate(self._createDate(self.curYear, m, self.curDate));
			self._initTitView(1);
			self.$titYear = self.$tit.find('span.year');
			self.$titMonth = self.$tit.find('span.month');
			self.$titYear.text(self.curYear);
			self.$titMonth.text(m + 1);
		},
		_showMonthView: function (y){
			var self = this;
			//self._initTitView(2);
			self.$monthLis.eq(self.curMonth).addClass('cur').siblings('li').removeClass('cur');
			self._initTitView(self.curViewType);
			self.$titYear = self.$tit.find('span.year');
			self.$titYear.text(y);
			self.curYear = y * 1;
		},
		_showYearView: function(y){
			var self = this;
			var y = y || self.curYear;
			self.curYear = y * 1;
			self._initTitView(3);
			self.$yearsView.show();
			self.$titYear = self.$tit.find('span.year');
			self._createYears(y);
			self.curYear = y * 1;
		},
		_showTenYearView: function(y){
			var self = this;
			var y = y || self.curYear;
			self.$tenYearsView.show();
			self._initTitView(4);
			self.$titYear = self.$tit.find('span.year');
			self._createTenYears(y);
			self.curYear = y * 1;
		},
		_getScalePosition: function(type, year){
			var self = this, end ,start;
			year = year * 1;
			//self.curYear = year;
			if(type === 3){//得到1-11区间内的位置
				end = self._rangeOfYear(year, 9);
				return 10 - (end - year) + 1;
			}else if(type === 4){
				end = self._rangeOfYear(year, 99, 2);
				start = end - 99;
				for(var i=0; i<12; i+=1){
					var _s, _e;
					if(i===0){
						_s = start - 10;
						_e = start - 1;
					}else if(i===11){
						_s = end + 1;
						_e = end + 10;
					}else{
						_s = start + i*10 - 10;
						_e = start + i*10 -1;
					}
					if(year >= _s && year <= _e){
						return i + 1;
					}
				}
			}
		},
		//缩放month
		_scaleObject: function(b, $zoomObj, $focusObj, gridNum) {
			var self = this;
			var highlight = 'mon' + gridNum;
			if(!b){
				//var days = $('.datePicker').find('.days');
				//var months = $('.datePicker').find('.months');
				$zoomObj.addClass("dateZoomIn").addClass(highlight);
				
				setTimeout(function(){
					$zoomObj.removeClass("dateZoomIn").removeClass(highlight).hide();
				},500);
				
				$focusObj.show().addClass('dateFocusIn');
				
				setTimeout(function(){
					$focusObj.removeClass("dateFocusIn");
				},200);
			}else{
				$zoomObj.show().addClass("dateZoomOut").addClass(highlight);
				
				setTimeout(function(){
					$zoomObj.removeClass("dateZoomOut").removeClass(highlight);
				},500);
				
				$focusObj.addClass('dateFocusOut');
				
				setTimeout(function(){
					$focusObj.removeClass("dateFocusOut").hide();
				},200);
			}
		},
		//创建临时ul为移动月份效果准备
		_createTempMonth: function(){
			return this.$monthsView.clone(true);
		},
		//创建临时ul为移动年份效果准备
		_createTempYear: function(){
			return this.$yearsView.clone(true);
		},
		//创建临时ul为移动年份效果准备
		_createTempTenYear: function(){
			return this.$tenYearsView.clone(true);
		},
		//创建临时table为移动效果准备
		_createTempTable: function (){
			var $tempTabel = $('<table class="days"><thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead></table>');
			var newOne = this.$daysView.find('tbody').clone();
			$tempTabel.append(newOne);
			return $tempTabel;
		},
		//改变日历数据，向前一月或者向后一月
		_changeMonthData: function (b){
			var self = this;
			if(b){//月份向后
				if(self.curMonth === 0){
					self.curMonth = 11;
					self.curYear = self.curYear - 1;
					
				}else{
					self.curMonth = self.curMonth - 1;
					self.curDate = 1;
				}
			}else{//月份向前
				if(self.curMonth === 11){
					self.curMonth = 0;
					self.curYear = self.curYear + 1;
				}else{
					self.curMonth = self.curMonth + 1;
					self.curDate = 1;
				}
			}
			
			return self._createDate(self.curYear, self.curMonth, self.curDate);
		},
		//创建日期
		_createDate: function (_y, _m, _d){
			var d = new Date();
			d.setDate(_d);
			d.setMonth(_m);
			d.setYear(_y);
			return d;
		},
		//获得当前选择的日期
		_getSelectedDate: function (b){
			var m;
			if(b){
				m= (this.curMonth<12) ? this.curMonth : 0;
			}else{
				m = this.curMonth;
			}
			return this._createDate(this.curYear, m, this.curDate);
		},
		//创建当前选择的年,月,日,时,分,钞 
		_createDateAndTime: function(_y, _M, _d,_h,_m,_s){
			var _y = _y || this.curYear;
			var _M = _M || this.curMonth;
			var _d = _d || this.curDate;
			var _h = _h || this.$hour && this.$hour.val() || 0;
			var _m = _m || this.$minute && this.$minute.val() || 0;
			var _s = _s || this.$second && this.$second.val() || 0;
			
			var _newDate = this._createDate(_y, _M, _d);
			if(this.opts.hour){
				_newDate.setHours(_h * 1);
			}
			if(this.opts.minute){
				_newDate.setMinutes(_m * 1);
			}
			if(this.opts.second)
			{
				_newDate.setSeconds(_s * 1);
			}
			return _newDate;
		},
		/**
		 * 判断当前的月份日期是否多于设置的下一个月份的天数
		 * 如果多于，则会将设置的下个月，直接转到下下个月
		 * setMonth要注意的一点bug
		 */
		_isSpecialDay: function(){
			var d = new Date();
			var m = this.monthDates[d.getMonth()];
			var targetMonthDays = this.monthDates[this.curMonth];
			return m - targetMonthDays;
		},
		//判断是否为闰年
		_isLeapYear: function (d){
			var d =  d || new Date(); 
			var d_year = d.getFullYear(); //获取年份
			//判断闰月，把二月改成29
			if (((d_year % 4 == 0) && (d_year % 100 != 0)) || (d_year % 400 == 0)){
				this.monthDates[1] = 29;
			}else{
				this.monthDates[1] = 28;
			}
		},
		//调用回调
		_doCallback: function(dateObj){
			if($.isFunction(this.opts.onselect)){
				this.opts.onselect.call(this, dateObj);
			}
		},
		//验证时,分,秒
		_validte: function ($obj, maxValue){
			var lastValue = $.trim($obj.val());
			$obj.bind('input',function(e){
				if(e.which === 8) return;
				var v = $(this).val();
				v = v.replace(/[^0123456789]/g, '');
				if(parseInt(v) > maxValue){//当前值校验如果不符合，则恢复为上一次的值
					$(this).val(lastValue);
				}else{
					$(this).val(v);
				}
				lastValue = $(this).val();
			});
		},
		//验证有效时间选择
		_validateSelection: function(){
			//TO DO
		},
		//设置日期范围
		_setDateRange: function(){
			var self = this;
			var opts = self.opts;
			var minDate, maxDate;
			var $minDate,$maxDate, _minTrueDate, _maxTrueDate;
			if(opts.minDate){
				if($.isFunction(opts.minDate)){
					minDate = opts.minDate();
				}else{
					minDate = opts.minDate;
				}
				minDate = new Date(minDate);
				if(minDate !== undefined && minDate != 'Invalid Date'){
					self.minDateObject.date = minDate;
				}else if($(opts.minDate)[0]){
					$minDate = $(opts.minDate);
					_minTrueDate = $minDate.val() && new Date($minDate.val());
					if(_minTrueDate){
						self.minDateObject.date = _minTrueDate;
					}else{
						self.minDateObject.date = null;
					}
				}
				//self.minDateObject.date && self.minDateObject.date.setMonth(self.minDateObject.date.getMonth() - 1);//修正月份差异0-11
			}
			//console.log(opts.minDate, self.minDateObject.date);
			if(opts.maxDate){
				if($.isFunction(opts.maxDate)){
					maxDate = opts.maxDate(maxDate);
				}else{
					maxDate = opts.maxDate;
				}
				maxDate = new Date(maxDate);
				if(maxDate !== undefined && maxDate != 'Invalid Date'){
					self.maxDateObject.date = maxDate;
				}else if($(opts.maxDate)[0]){
					$maxDate = $(opts.maxDate);
					_maxTrueDate = $maxDate.val() && new Date($maxDate.val());
					if(_maxTrueDate){
						self.maxDateObject.date =  _maxTrueDate;
					}else{
						self.maxDateObject.date = null;
					}
				}
				//self.maxDateObject.date && self.maxDateObject.date.setMonth(self.maxDateObject.date.getMonth() + 1);//修正月份差异0-11
			}
		},
		_setHMS: function(){
			var now = new Date();
			//是否显示ft
			if(this.opts.hour){
				this.$hour = this.$ft.find('input[name="d_hour"]').val(now.getHours());
			}
			if(this.opts.minute){
				this.$minute = this.$ft.find('input[name="d_minute"]').val(now.getMinutes());
			}
			if(this.opts.second){
				this.$second = this.$ft.find('input[name="d_second"]').val(now.getSeconds());
			}
		},
		_resetPosition: function(){
			if(!this.$input.length) return;
			var ot = this.$input.offset();
			this.$el.css({
				position:'absolute',
				left:ot.left + this.opts.left,
				top:ot.top + this.opts.top + this.$input.outerHeight(true)
			});
			this._setDateRange();
		},
		_zIndex: function(){
			zIndex.cur++;
			if(zIndex.cur > zIndex.max){
				zIndex.cur = zIndex.min;
			}
			this.$el.css({
				zIndex: zIndex.cur
			});
		},
		_hide: function (e){
			if(!this.opts.fixed) {$('#' + this._id).hide();} 
			if(e)e.stopPropagation();
		},
		_show: function (e){
			if(!this.opts.fixed) $('#' + this._id).show();
			this._resetPosition();
			if(e)e.stopPropagation();
		},
		_toggle: function (e){
			var thisDate = $('#' + this._id);
			if(thisDate.css('display') == 'none'){
				//关闭全局范围内所有datapicker
				$.fn.datePicker.closeAll();
				thisDate.show();
				//第次展开日历时重新计算日期范围与秒
				this._setDateRange();
				this._setHMS();
				this._resetPosition();
			}else{
				thisDate.hide();
			}

			if(e)e.stopPropagation();
		},
		/*============================== 开放接口 ==============================*/
		hide: function (e){
			$('#' + this._id).hide();
			if(e)e.stopPropagation();
		},
		show: function (e){
			$('#' + this._id).show();
			this._resetPosition();
			if(e)e.stopPropagation();
		},
		//设置日历时间
		setDate: function(date){
			this._setDate(new Date(date));
		},
		//设置最小日期
		setMinDate: function(date){
			self.minDateObject.date = new Date(date);
		},
		//设置最大日期
		setMaxDate: function(date){
			self.maxDateObject.date = new Date(date);
		}
	}
	
	$.fn.datePicker = function(opt){
		var opts = $.extend({},$.fn.datePicker.defaults,opt);
		return new DatePicker(this,opts);
	}
	$.fn.datePicker.defaults = {
		onselect: null,
		//目标输入框(带icon的日历)
		target: false,
		//脚部时分秒
		ft: false,
		hour: false,
		minute: false,
		second: false,
		showtime:false,
		//输出格式
		format: "YYYY-MM-dd",
		//是否直接显示日期
		fixed: false,
		//日历浮动时的偏移量
		left:0,
		top:0,
		//最小允许日期(标准日期或dom中标准日期)
		minDate: null,
		//最大允许日期(标准日期或dom中标准日期)
		maxDate: null
	}
	/**
	 * 实现云派框架全局关闭接口closeAll
	 */
	$.fn.datePicker.globalcloser = [];
	$.fn.datePicker.closeAll = function(){
		$('.datePicker:not("[fixed]")').hide();
	};
	//外部设置zIndex值
	var setZindex = function(a, b){
		zIndex.max = b;
		zIndex.min = a;
		zIndex.cur = a;
	};
	$.fn.datePicker.data = function(){
		var a = arguments[0];
		var b = arguments[1];
		var c = arguments[2]
		if(a === 'rootContainer'){
			$positionLayoutWrap = $(b);
		}else if(a==='zIndex'){
			setZindex.apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}

	$('body').click(function(){
		$('.datePicker').hide();///
	});
	/**
	 * [滚动时关闭所有dropbox keep属性除外]
	 */
	window.addEventListener('mousewheel', function(){
		$('.datePicker').hide();///
	});
	/**
	 * [format 消息日期通用时间函数 ]
	 * @param  {String} format ["YYYY-MM-dd hh:mm:ss"]
	 * @return {String}        [description]
	 */
	if(!Date.prototype.format){
		Date.prototype.format = function(format){
		 var o = {
		  "M+" :  this.getMonth()+1,  //month
		  "d+" :  this.getDate(),     //day
		  "h+" :  this.getHours(),    //hour
		      "m+" :  this.getMinutes(),  //minute
		      "s+" :  this.getSeconds(), //second
		      "q+" :  Math.floor((this.getMonth()+3)/3),
		      "S"  :  this.getMilliseconds() //millisecond
		  };
		   if(/(Y+)/.test(format)) {
		    format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
		   }
		   for(var k in o) {
		    if(new RegExp("("+ k +")").test(format)) {
		      format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
		    }
		   }
		 return format;
		};
	}
})(jQuery);