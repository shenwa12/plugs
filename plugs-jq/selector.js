;(function($){
	"use strict";
	/**
	 * selector 插件
	 * ver:1.0
	 * 2012/11/3
	 * mailto: xiaodong1986@me.com
	 * update: 
	 * [
	 * 	date: 2012/11/16
	 * 	desc: 在多选状态下如果未选择任何值默认情况下select不会被submit, 现创建一个input用于提交数据
	 * ]
	 */
	

	var SCROLL_WIDTH = 10;//滚动条宽度
	var DROPLIST_MAX_HEIGHT = 300;//超过300后就出现滚动条
	var DROPLIST_PADDING = 10;


	/**
	 * [Model 数据模型处理对象]
	 * @type {Object}
	 */
	var Model = {
		setSelectdByVal: function(_model, val, selected){
			var mapedModel = $.map(_model, function(n){
				if(n.val==val){
					n.selected = selected;
				}
				return n;
			});
			return mapedModel;
		},
		setVal: function(_model, vals){
			var mapedModel = $.map(_model, function(n){
				if($.inArray(n.val, vals) > -1){
					n.selected = true;
				}else{
					n.selected = false;
				}
				return n;
			});
			return mapedModel;
		},
		setSelectd: function(_model, selected){
			var mapedModel = $.map(_model, function(n){
				n.selected = selected;
				return n;
			});
			return mapedModel;
		},
		getDataByVal: function(_model, v){
			var r;
			$.each(_model, function(i, n){
				if(n.val==v){
					return r = n;
				}
			});
			return r;
		},
		setSingleIndexByVal: function(_model, val){
			var mapedModel = $.map(_model, function(n){
				if(n.val==val){
					n.selected = true;
				}else{
					n.selected = false;
				}
				return n;
			});
			return mapedModel;
		}
	}
	/**
	 * [Template 各组件html模板]
	 * @type {Object}
	 */
	var Template = {
		multiple: '<div class="selector"><div class="tagList"></div></div>',
		single: '<div class="selector"><div class="loading"></div><i class="arrow"></i><div class="seltTit"></div></div>',
		domCache: '<div class="domCache" style="position: absolute;top: 0;left: 0;width: 0;height: 0;visibility: hidden;"></div>',
		searchBar: '<div class="dropListFind"><input type="text"></div>'
	}

	/**
	 * [getAttrs 获得所有dom自定义属性]
	 * @param  {[type]} dom [dom标签]
	 * @return {[type]}     [自定义属性对象eg: {val:123,gid:342,text:'helloworld'}]
	 */
	var FILTER_ATTRS_ARRAY = ['required','width', 'disabled', 'name', 'attr', 'search', 'id']; 
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
	var FinderFilter = function(str){
	    return (str+='').replace(/(:|\.|\[|\])/g,'\\$1');
	};

	var resetSelect = function(){
		$('select').each(function(){
			var st = $(this).data('selector_handle');
			if(st && st.$dropbox){
				st.$el.removeClass('expan');
				st.$dropbox = null;
			}
		});
	};

	/**
	 * [滚动时关闭所有selector]
	 */
	window.addEventListener('mousewheel',function(){///
		resetSelect();
	});
	$(window).keyup(function(e){
		if(e.which === 27){
			resetSelect();
		}
	});

	/**
	 * [Selector Selector类]
	 * @param {DOM} _this [触发对象]
	 * @param {Object} opts  [配置参数]
	 */
	function Selector(_this, opts){
		this.opts = opts;
		this.$el = $(_this);
		this.$select = null;//原生select表单
		this.$domCache = null;  //临时存放selector，用以获得seltDrop宽度
		this.$loading = null;
		
		this.model = [];	//数据模型 {val:'xxx', text:'xxx',xxx:xxx}
		this.privateModel = [];//自定义数据模型{val:{}, val:{}}
		this.index = 0;
		this.events = {change:[]};
		this.$dropbox = null;
		this.id = null;
		this.pl = 0;
		this.pr = 0;
		this.definedWidth = 0;
		this.realWidth = 0;

		this.formDefaults = null;//默认值缓存,用于reset事件发生时恢复
		
		this.init();
	}
	Selector.prototype = {
		init: function () {
			var self = this;
			var opts = self.opts;
			var $domCache;
			var _attr;
			var $selector = self.$el.parent('.selector');
			var autoWidth;///
			//获得SELECT DOM
			if(self.$el[0].tagName === 'SELECT'){
				self.$select = self.$el;
				self.multiple = self.$el.prop('multiple');
				opts.width = self.$select.attr('width');
				autoWidth = self.$select.data('auto-width');
				if(autoWidth){
					opts.width = self.$select.parent().width();	
				}
				 
			}else if(self.opts.source){
				this.id = this.$el.attr('id');
				self.$select = self._createSelectView();
			}
			if(opts.width){
				opts.width *=1;
				this.definedWidth = opts.width;
			} 
			if(!self.$select) return;
			self.name = self.opts.name = self.$select.attr('name');
			self.opts.disabled = self.$select.prop('disabled');
			self.opts.search = self.$select.is('[search]');
			//如果有自定义属性
			_attr = self.$select.attr('attr');
			if(_attr){
				self.opts.attr = eval('('+_attr+')');///
			}
			if(self.opts.search){
				self.opts.attr['search']= true;
			}
			
			//生成数据模型
			self.model = self._createModel();

			//创建临时存放DIV
			$domCache = $('.domCache');
			if(!$domCache.length){
				$('body').append($domCache = $(Template.domCache));
			}
			self.$domCache = $domCache;

			//渲染dom
			if(!$selector.length){
				self._renderView();
				self._setTriggerContainer();
				//初始化设置selector宽度
				self._setTriggerViewWidth();
			}else{//已经有selector dom结构了
				self.$el = $selector;
				self._setTriggerContainer();

				self._setTriggerViewWidth();///
			}
			if(!self.multiple){
				self.$loading = self.$el.find('.loading');
			}
			self.dom = self.$el;//开放的DOM接口

			if(!$.fn.autoComplete){
				console.log('plug[select/init: 找不到autocomplete插件');
				self.opts.search = false;
			}
			
			if(!$.fn.dropbox){
				console.log('plug[select/init: 找不到dropbox插件');
				return ;
			}else{
				//注册dropbox插件
				self.dropbox = self.$el.dropbox({attr:self.opts.attr});
			}

			//设置默认值
			self._setDefault();

			self.bindEvent();

			//存储插件引用
			self.$select.data('selector_handle', self)//为select加上插件引用防止被再次初始化;
			self.$el.data('selector_handle', self)//为selector加上插件引用;
			self.$el.attr('data-toggle','dropbox');///
		},
		_renderView: function (){
			var self = this
			,opts = self.opts
			,$tmpl
			;

			if(self.multiple){
				$tmpl = $(Template.multiple);
			}else{
				$tmpl = $(Template.single);
			}
			self._createSelectorView($tmpl);
		},
		_createSelectView: function(){
			var self = this
			,opts = self.opts
			,$select
			,$option
			;
			if(opts.source.length){
				$select = $('<select>');
				$.each(opts.source, function(i, v){
					$option = $('<option>');
					$option.html(v.text)
					$option.data('userdefined', v[v.val])
					$option.attr('value', v.val);
					$select.append($option);
				});
				
				if(opts.name) $select.attr('name', opts.name);
				if(opts.multiple) $select.prop('multiple', true);
				if(opts.required) $select.prop('required', true);
				if(opts.search) $select.attr('search', '');
			}

			self.$el.before($select);
			self.$el.append($select);
			return $select;
		},
		_createSelectorView: function($tmpl){
			var _attrs = getAttrs(this.$select[0]);
			this.$select.before($tmpl);
			this.$select.appendTo($tmpl);
			this.$select = this.$select.removeAttr('class');
			this.$el = $tmpl;
			this.$el.attr(_attrs).addClass('selector');//将select标签上一些属性复制到selector标签上

			if(this.$select.prop('required')){
				$tmpl.addClass('need');
			}

			if(this.id) $tmpl.attr('id', this.id);
		},
		/**
		 * [_getListView 创建下拉菜单列表html字符串]
		 * @param  {Boolean} init [是否首次创建，首次创建时需要传true拿到最大宽度值]
		 * @return {String}
		 */
		_getListView: function(init){
			var self = this
			,s = ''
			
			if(self.model.length){
				s += '<ul class="dropList">';
				$.each(self.model, function(i, v){
					if(!v.selected || init){
						s += '<li data-val="'+ v.val +'">'+ v.text +'</li>';
					}
				});
				s += '</ul>';
				if(self.opts.search) s += Template.searchBar;
			}

			return s;
		},
		_setTriggerViewWidth: function(){
			var $dropMenu, w;
			if(this.multiple) return ;
			$dropMenu = $(this._getListView(true));
			this.$domCache.append($dropMenu);
			if(this.opts.width){
				w = this.opts.width;
			}else{
				w = $dropMenu.width() + this.pl + this.pr - DROPLIST_PADDING;
			}
			if($dropMenu.height() >= DROPLIST_MAX_HEIGHT){///高度超过最大高度时+滚动条宽度10
				w += SCROLL_WIDTH;
			}
			this.realWidth = w;
			this.$triggerContainer.css("width",w);
			
			$dropMenu.remove();
		},
		bindEvent: function () {
			var self = this;
			if(self.opts.disabled) return;
			self.$el.click(function(e){
				//console.log(self.opts.disabled);
				

				if(self.$el.hasClass('expan')){
					self._hide();
				}else{
					///clear
					$('.selector').not(self.$el).each(function(){
						var _selector = $(this).ypSelect();
						if(_selector){
							_selector.hide();
						}
					});
					
					if(self.model.length <= 1 && !self.multiple) {
						e.stopPropagation();
						return ;
					}

					self.$dropbox = self._show().parent();
					self.$select.trigger('selector.expan');
					self.$dropbox.on('click', 'li', function(e){
						var v = $(this).data('val');
						if(v || v === '' || v==0) self.setIndexByVal(v);
						self._hide();
						$(this).remove();
						e.stopPropagation();
					})
					.on('click','.dropListFind', function(e){
						e.stopPropagation();
					})
					;
				}

				e.stopPropagation();
			});

			if(self.multiple){
				self.$triggerContainer.on('click', 'i', function(e){
					self.removeSelectedByVal($(this).parent().data('val'));
					self._hide();
					e.stopPropagation();
				});
			}

			//绑定表单reset事件
			// var $form = self.$el.closest('form');
			// if($form.length){
			// 	$form.on('reset.form','[type=reset]', function(){
			// 		self.reset();
			// 	});
			// }


			$('body').click(function(){///
				self.$el.removeClass('expan');
			});
		},
		_createModel: function(){
			var self = this;
			var arr = [];

			if(self.$select){
				self.$select.find('option').each(function(){
					arr.push({val:this.value, text: this.text || $(this).attr('text') || '', selected: $(this).prop('selected')});
					self.privateModel[this.value] = $(this).data('userdefined');
				});
			}
			return arr;
		},
		_setTriggerContainer: function(){
			if(this.multiple){
				this.$triggerContainer = this.$el.find('.tagList');
			}else{
				this.$triggerContainer = this.$el.find('.seltTit');
			}
			this.pl = parseInt(this.$triggerContainer.css('padding-left'));
			this.pr = parseInt(this.$triggerContainer.css('padding-right'));
		},
		//li被点击
		_itemClicked: function(i, noTrigger){
			var self = this;
			var callback = self.opts.callback;
			if(!self.multiple && self.model[i]){
				self.$triggerContainer.html(self.model[i].text);
				self.$select.val(self.model[i].val);
				//更新数据模型
				self.model = Model.setSingleIndexByVal(self.model, self.model[i].val);
				if(!noTrigger){
					//派发事件
					self._dispatchEvents(self.model[i].val, noTrigger);
				}
			}
		},
		_show: function(){
			var $content = $(this._getListView());
			var self = this;
			var arr = [];
			var w;
			this.$el.addClass('expan');
			if(this.opts.search){
				
				arr = $.map(this.model, function(n){
					if(!n.selected) return n;
				});
				//绑定autoComplete
				this.$el.autoComplete({
					source: arr, 
					searcher: $content.filter('.dropListFind').find('input[type=text]'),
					menu: $content.filter('.dropList'),
					callback: function(a,b,c){
						self.setIndexByVal(a);
						self._hide();
					}
				});
			}

			if(this.definedWidth){
				w = this.definedWidth;
			}else{
				w = this.realWidth || this.$el.width()+2;
			}
			this.dropbox.show($content).width(w+(this.multiple ? DROPLIST_PADDING : 0));
			return $content;
		},
		_hide : function(){
			if(!gCtrlKey || !this.multiple){
				this.$el.removeClass('expan');
				this.dropbox && this.dropbox.hide();
				this.$dropbox = null;
			}
		},
		_toggle: function(){
			var self = this;
			///
		},
		_setDefault: function(noTrigger){
			var self = this;
			var arr = [];
			var selected;
			var _def;
			if(self.multiple){
				self.$triggerContainer.empty();
				$.each(self.model, function(i, v){
					if(v.selected){
						self.$triggerContainer.append('<span data-val="'+ v.val +'">'+ v.text +'<i></i></span>');
						arr.push(v.val);
					} 
				});
				self.$select.val(arr);
				_def = arr;
			}else{
				selected = this.$select.val()
				self.setIndexByVal(selected, noTrigger);
				_def = selected;
			}

			self.formDefaults = _def;
		},
		//更新自定义属性模型
		_updatePrivateModel: function(){
			var self = this;
			if(self.model){
				$.each(this.model, function(i, v){
					self.privateModel[v.val] = v[v.val];
				});
			}
		},
		hide: function(){
			this._hide();
			return this;
		},
		show: function(){
			this._show();
			return this;
		},
		setVal: function(vals, noTrigger){
			var self = this;
			var arr = [];
			if(!$.isArray(vals)){
				vals = [vals];
			}

			//var selected = self.$select.val() || [];
			//更新数据模型
			self.model = Model.setVal(self.model, vals);
			self.$triggerContainer.empty();
			$.each(vals, function(i,v){
				var n;
				v+='';
				n = Model.getDataByVal(self.model, v);
				if(n && n.val){
					self.$triggerContainer.append('<span data-val="'+ n.val +'">'+ n.text +'<i></i></span>');
					arr.push(v);
				}
			});
			self.$select.val(vals);
			//派发事件
			if(!noTrigger) self._dispatchEvents(vals);
		},
		setIndexByVals: function(vals, noTrigger){
			var self = this;
			var arr = [];
			///if(!vals) return;

			if(!$.isArray(vals)){
				vals = [vals];
			}

			var selected = self.$select.val() || [];
			
			$.each(vals, function(i,v){
				var n;
				v+='';
				if($.inArray(v, selected) === -1){
					//更新数据模型
					self.model = Model.setSelectdByVal(self.model, v, true);
					//得到相应数据项
					n = Model.getDataByVal(self.model, v);
					if(n && n.val){
						self.$triggerContainer.append('<span data-val="'+ n.val +'">'+ n.text +'<i></i></span>');
						arr.push(v);
					}
				}
			});
		
			self.$select.val(selected.concat(arr));
			//派发事件
			if(!noTrigger) self._dispatchEvents(arr);
		},
		
		//生成新的select标签
		_changeSelectView: function(data, noTrigger){
			var s = [];
			$.each(data,function(i,v){
				s.push('<option value="'+ v.val +'">'+ v.text +'</option>');
			});
			this.$select.html(s.join(''));
			this.opts.width = null;
			this._setTriggerViewWidth();
			this._setDefault(noTrigger);
		},
		//根据值设置选中项
		setIndexByVal: function(val, noTrigger){
			var self = this;
			if(!val && val !== '' && val!=0){
				self.selectAll();
				return self;
			}
			if(self.multiple){
				self.setIndexByVals(val, noTrigger);
			}else{
				
				self.setIndex(self._getIndexByKey(val, self.model, 'val'), noTrigger);
			}
			return self;
		},
		//根据选项文本设置选中项
		setIndexByText: function (text, noTrigger){
			this.setIndex(this._getIndexByText(text, this.model),  noTrigger);
			return this;
		},
		//set selector Index 
		setIndex: function (i, noTrigger){
			var self = this;
			if(i < 0) return;

			self._itemClicked(i, noTrigger);

			this.index = i;
			return this;
		},
		setNext: function (){
			this.setIndex( ( this.getIndex() + 1 ) % this.getSize() );
			return this;
		},
		_getIndexByText: function (text, data){
			data = data || this.model;
			if(!text || !$.isArray(data) || data.length <= 0 ) return;
			var _i = -1;
			$.each(data, function (i, v){
				var txt = v.text || $(v).text();
				if(txt == text){
					_i = i;
					return i;
				} 
			});
			return _i;
		},
		//通过传入的key与val来查找到相应index
		_getIndexByKey: function(val, data, key){
			data = data || this.model;
			if(!$.isArray(data) || data.length <= 0 ) return;
			var _i = -1;
			$.each(data, function (i, v){
				if(v[key] == val){
					_i = i;
					return i;
				}
			});
			return _i;
		},
		getTextByVal: function(val){
			var ret = null;
			if(!val || this.model.length <= 0 ) return;
			val+='';
			$.each(this.model, function (i, v){
				if(v.val == val){
					ret =  v.text;
					return ;
				} 
			});
			return ret;
		},
		getIndex: function (){
			return this.$select[0].selectedIndex || 0;
		},
		getIndexByVal: function(v){
			return this._getIndexByKey(v,null,'val');
		},
		getIndexByText: function (text){
			return this._getIndexByText(text);
		},
		getVal: function(){
			var self = this;
			return self.$select.val() || [];
		},
		getSize: function (){
			return this.model.length || 0;
		},
		_dispatchEvents: function(val, noTrigger, isRemove){
			var self = this;
			var userdefined = self.privateModel[val];
			if(userdefined && userdefined.constructor === String) {
				userdefined = eval('('+ userdefined +')');
			}
			if(self.events.change.length > 0){1
				$.each(self.events.change, function(i,v){
					v.call(self, val, self.$el, userdefined, isRemove);
				});
			}
			if($.isFunction(self.onchange)){
				self.onchange.call(self, val, self.$el, userdefined); //deprecated
			}
			if ($.isFunction(self.opts.callback)){
				self.opts.callback.call(self, val, self.$el, userdefined);
			}
			self.$select.trigger('change',val);
		},
		addEvent: function(eventName, func){
			if(this.events[eventName] && $.isFunction(func)){
				this.events[eventName].push(func);
			}
			return this;
		},
		removeEvent: function(eventName, func){
			if(eventName && func){
				var i = $.inArray(func,this.events[eventName]);
				if(i > -1){
					this.events[eventName].splice(i,1);
				}
			}else if(eventName){
				this.events[eventName].length = 0;
			}
			return this;
		},
		change: function(func){//快捷事件接口
			return this.onchange(func);
		},
		//清空多选项的值
		clearVals: function(vals, noTrigger){
			var self = this;
			if(vals){
				this.removeSelectedByVal(vals);
			}else{
				if(!this.multiple){
					this.setIndex(0);
				}else{
					this.$triggerContainer.html('');
					this.$select.val('');
					this.model = Model.setSelectd(this.model, false);
				}
				if(!noTrigger) this._dispatchEvents(vals);
			}

			return this;
		},
		selectAll: function(){
			var arr = [], vals = this.getVal();
			$.each(this.model, function(i,v){
				arr.push(v.val+'');
			});

			arr = $.grep(arr, function(n,i){
				return ($.inArray(n, vals) === -1) ? true : false;
			});

			this.setIndexByVal(arr);

			return this;
		},
		//获得所有选项数据
		getData: function(){
			return this.model;
		},
		//添加新数据模型
		appendData: function (data, noTrigger){
			var self = this;
			if(!$.isArray(data) && !data.length < 0) return this;
			this.model = this.model.concat(data);
			this._updatePrivateModel();
			this._changeSelectView(this.model, noTrigger);
			return this;
		},
		//更改数据模型
		changeData: function (data, noTrigger){
			var self = this;
			if(!data || data.length <=0 && this.multiple){//多选传空值时清空selector
				this.model.length = 0;	
			}else{
				this.model = data;
			}
			this.privateModel = [];
			this._updatePrivateModel();
			this._changeSelectView(this.model, noTrigger);
			//if(!noTrigger) this._dispatchEvents(data);
			return this;
		},
		removeDataByVal: function(vals){
			if(!$.isArray(vals)){
				vals = [vals];
			}
			if(vals.length){
				vals = vals.join(',').split(',');//将数组选项转成字符串
				this.model = $.map(this.model, function(n){
					if($.inArray(n.val+'', vals) === -1){
						return n;
					}
				});
			}
			
			this.changeData(this.model);///
			return this;
		},
		//通过值删除已选项
		removeSelectedByVal: function(val, noTrigger){
			var self = this;
			
			if(!val && val != '' && val !=0 ) return ;
			if(!$.isArray(val)) val = [val];
			if(val.length){
				$.each(val, function(i,v){
					self.$triggerContainer.find('span[data-val='+ FinderFilter(v) +']').remove();
					self.$select.find('[value='+ FinderFilter(v) +']').prop('selected', false);
					//更新数据模型
					self.model = Model.setSelectdByVal(self.model, v, false);
				});
			}
			if(!noTrigger) self._dispatchEvents(val, false, true);
			return this;
		},
		onchange: function (func){//快捷事件接口
			if($.isFunction(func)){
				this.addEvent('change', func);
			}
			return this;
		},
		getName: function(){
			return this.opts.name;
		},
		//重置表单元素名称
		changeName: function(s){
			s = $.trim(s);
			if(!s) return this;
			this.name = this.opts.name = s;
			this.$select.prop('name', this.opts.name);
			return this;
		},
		//设置表单reset后默认选项
		_setFormDefault: function(){
			var self = this;
			//为非多选项设置默认值
			if(self.formDefaults){
				if(self.multiple){
					self.setIndexByVals(self.formDefaults);
				}else{
					self.setIndexByVal(self.formDefaults);
				}
			}
		},
		//重置表单元素
		reset: function(){
			var self = this;
			//先清空多选项
			if(this.multiple){
				this.clearVals();
			}

			//有默认值就恢复默认值否则就清空
			if(!self.formDefaults || ($.isArray(self.formDefaults) && self.formDefaults.length)){
				//防止自身reset被默认的reset覆盖，加1毫秒延时
				setTimeout(function(){
					self._setFormDefault();	
				},1);
				
			}else{
				!this.multiple && this.setIndex(0);
			}
		},
		setDisabled: function(b){
			if(b){
				this.opts.disabled = true;
				this.$select.prop('disabled', true);
			}else{
				this.opts.disabled = false;
				this.$select.prop('disabled', false);
			}
			return this;
		},
		_loading: function(bool){
			if(this.$loading) this.$loading.toggle(bool);
		},
		loading: function(bool){
			bool = (bool === false) ? false : true;
			this._loading(bool);
		},
		wordCount: function(value) {
		  var txt = value;
		  txt = txt.replace(/(<.*?>)/ig,'');  
		  txt = txt.replace(/([^\x00-\xff])/ig,'11');
		  return txt.length;
		}
	};
	
	$.fn.ypSelect = function(opt){
		var ret = [];
		this.each(function() {
			if($(this).attr('type') === 'taglist') return ;
			var handle = $(this).data("selector_handle");
			if(!handle){
				handle = new Selector($(this), $.extend(true, {}, $.fn.ypSelect.defaults, opt));
				$(this).data("selector_handle", handle);
			}
			ret.push(handle);
		});

		return ret.length===1 ? ret[0] : ret;
	};
	//实现云派框架全局关闭接口closeAll
	$.fn.ypSelect.globalcloser = [];//TO DO 清理垃圾selector
	$.fn.ypSelect.closeAll = function(){
		///
	};
	$.fn.ypSelect.defaults = {
		callback: null,
		source:[], //本地数据
		url:'', //远程匹配地址(返回json)
		//多选时bindValue的name
		name:'',
		//是否有搜索框
		search: false,
		//默认值
		val: null,
		//是否多选
		multi:false,
		//大小写敏感
		sensitive: false,
		//是否禁用
		disabled: false,
		//是否为必选
		required: false,
		//自定义属性
		attr:{},
		width:null
	};

	///
	//侦听ctrl键盘事件
	var gCtrlKey = false;
	$(document).on('keydown', function(e){
		gCtrlKey = e.ctrlKey;
	}).on('keyup', function(e){
		gCtrlKey = e.ctrlKey;
	});
})(jQuery);